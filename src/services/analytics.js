// Google Analytics 4 (gtag.js) + First-Party Visitor Telemetry Service for Galora AI (galora.ai)
import { detectPlatformInfo, getDeviceId, getApiBaseUrl } from './platform';

const GA_STORAGE_KEY = 'galora_ga_measurement_id';
const DEFAULT_GA_ID = import.meta.env?.VITE_GA_MEASUREMENT_ID || '';

let initializedGaId = null;

export function getGaMeasurementId() {
  try {
    const stored = localStorage.getItem(GA_STORAGE_KEY);
    if (stored && stored.trim().startsWith('G-')) {
      return stored.trim();
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
  if (clean && clean.startsWith('G-')) {
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

  if (!gaId || !gaId.startsWith('G-')) return;
  if (initializedGaId === gaId) return;

  // Inject Google Tag Manager / gtag.js script if not already present for this ID
  const existingScript = document.querySelector(`script[data-ga-id="${gaId}"]`);
  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    script.setAttribute('data-ga-id', gaId);
    document.head.appendChild(script);
  }

  window.gtag('config', gaId, {
    send_page_view: false, // Handled explicitly by RouteSeoManager on SPA navigation
    cookie_flags: 'SameSite=None;Secure'
  });

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

  // 1. Send to Google Analytics 4 (gtag.js)
  if (typeof window.gtag === 'function' && gaId && gaId.startsWith('G-')) {
    window.gtag('event', 'page_view', {
      page_title: pageTitle,
      page_location: pageLocation,
      page_path: pagePath,
      send_to: gaId
    });
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
      if (data?.gaMeasurementId && data.gaMeasurementId.startsWith('G-') && !getGaMeasurementId()) {
        setGaMeasurementId(data.gaMeasurementId);
      }
    })
    .catch(() => {});
}

export function trackAnalyticsEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;

  const gaId = getGaMeasurementId();
  if (typeof window.gtag === 'function' && gaId && gaId.startsWith('G-')) {
    window.gtag('event', eventName, {
      ...params,
      send_to: gaId
    });
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
