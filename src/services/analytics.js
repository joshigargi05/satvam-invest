// Google Analytics 4 (gtag.js) + First-Party Visitor Telemetry Service for Galora AI (galora.ai)
import { detectPlatformInfo, getDeviceId, getApiBaseUrl } from './platform';

const GA_STORAGE_KEY = 'galora_ga_measurement_id';
const DEFAULT_GA_ID = import.meta.env?.VITE_GA_MEASUREMENT_ID || 'GTM-54LZ246K';

let initializedGaId = null;

function isValidGoogleTagId(id) {
  if (!id) return false;
  const clean = String(id).trim().toUpperCase();
  return clean.startsWith('G-') || clean.startsWith('GTM-') || clean.startsWith('GT-');
}

export function getGaMeasurementId() {
  try {
    const stored = localStorage.getItem(GA_STORAGE_KEY);
    if (isValidGoogleTagId(stored)) {
      return stored.trim().toUpperCase();
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_GA_ID;
}

export function setGaMeasurementId(measurementId) {
  const clean = String(measurementId || '').trim().toUpperCase();
  try {
    if (clean) {
      localStorage.setItem(GA_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(GA_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  if (isValidGoogleTagId(clean)) {
    initGoogleAnalytics(clean);
  }
  return clean;
}

export function initGoogleAnalytics(customId = null) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const gaId = customId || getGaMeasurementId();
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
  }

  if (!isValidGoogleTagId(gaId)) return;
  if (initializedGaId === gaId) return;

  // Inject additional gtag.js script only if a custom G- or GT- ID is configured beyond the head GTM-54LZ246K tag
  if ((gaId.startsWith('G-') || gaId.startsWith('GT-')) && !document.querySelector(`script[data-ga-id="${gaId}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    script.setAttribute('data-ga-id', gaId);
    document.head.appendChild(script);
  }

  if (gaId.startsWith('G-') || gaId.startsWith('GT-')) {
    window.gtag('config', gaId, {
      send_page_view: false, // Handled explicitly by RouteSeoManager on SPA navigation
      cookie_flags: 'SameSite=None;Secure'
    });
  }

  initializedGaId = gaId;
}

export function trackPageView(path, title) {
  if (typeof window === 'undefined') return;

  const gaId = getGaMeasurementId();
  if (gaId && !initializedGaId) {
    initGoogleAnalytics(gaId);
  }

  const pagePath = path || window.location.pathname;
  const pageTitle = title || document.title || 'Galora AI';
  const pageLocation = window.location.href;

  // 1. Send to Google Tag / GA4 (gtag.js & dataLayer)
  if (typeof window.gtag === 'function' && isValidGoogleTagId(gaId)) {
    const payload = {
      page_title: pageTitle,
      page_location: pageLocation,
      page_path: pagePath
    };
    if (gaId.startsWith('G-') || gaId.startsWith('GT-')) {
      payload.send_to = gaId;
    }
    window.gtag('event', 'page_view', payload);
  }

  // 2. Send to First-Party Backend Visitor Telemetry
  const platformInfo = detectPlatformInfo();
  const visitorId = getDeviceId();
  const baseUrl = getApiBaseUrl();

  fetch(`${baseUrl}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'page_view',
      path: pagePath,
      title: pageTitle,
      referrer: document.referrer || 'direct',
      visitorId,
      platform: platformInfo.platform || 'web'
    })
  })
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (isValidGoogleTagId(data?.gaMeasurementId) && !localStorage.getItem(GA_STORAGE_KEY)) {
        setGaMeasurementId(data.gaMeasurementId);
      }
    })
    .catch(() => {});
}

export function trackAnalyticsEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;

  const gaId = getGaMeasurementId();
  if (typeof window.gtag === 'function' && isValidGoogleTagId(gaId)) {
    const payload = { ...params };
    if (gaId.startsWith('G-') || gaId.startsWith('GT-')) {
      payload.send_to = gaId;
    }
    window.gtag('event', eventName, payload);
  }

  const platformInfo = detectPlatformInfo();
  const visitorId = getDeviceId();
  const baseUrl = getApiBaseUrl();

  fetch(`${baseUrl}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'event',
      eventName,
      params,
      path: window.location.pathname,
      visitorId,
      platform: platformInfo.platform || 'web'
    })
  }).catch(() => {});
}
