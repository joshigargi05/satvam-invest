import nodemailer from 'nodemailer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const OAUTH_CONFIG_PATH = path.join(DATA_DIR, 'oauth_config.json');

let cachedTransporter = null;
let cachedTransporterKey = '';

function loadRuntimeOAuthConfig() {
  try {
    if (fs.existsSync(OAUTH_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(OAUTH_CONFIG_PATH, 'utf8')) || {};
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

export function saveRuntimeOAuthConfig(updates = {}) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = loadRuntimeOAuthConfig();
    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };
    fs.writeFileSync(OAUTH_CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
  } catch (err) {
    console.error('Failed to save runtime OAuth config:', err.message);
    return {};
  }
}

export function getGoogleClientId() {
  const runtimeCfg = loadRuntimeOAuthConfig();
  return (
    runtimeCfg.googleClientId ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    ''
  ).trim();
}

function getSmtpConfig() {
  const runtimeCfg = loadRuntimeOAuthConfig();
  const smtpUser = (runtimeCfg.smtpUser || process.env.SMTP_USER || '').trim();
  const smtpPass = (runtimeCfg.smtpPass || process.env.SMTP_PASS || '').trim();
  const smtpHost = (runtimeCfg.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(runtimeCfg.smtpPort || process.env.SMTP_PORT || 465);
  const smtpSecure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true'
    : smtpPort === 465;
  const smtpFrom = (process.env.SMTP_FROM || (smtpUser ? `"Galora AI Security" <${smtpUser}>` : '')).trim();
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();

  const isSmtpConfigured = Boolean(
    smtpUser &&
    smtpPass &&
    !smtpUser.includes('your_') &&
    !smtpPass.includes('your_')
  );

  const isResendConfigured = Boolean(
    resendApiKey && !resendApiKey.includes('your_')
  );

  return {
    smtpUser,
    smtpPass,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpFrom,
    resendApiKey,
    isSmtpConfigured,
    isResendConfigured
  };
}

export function getEmailAndOAuthStatus() {
  const cfg = getSmtpConfig();
  const googleClientId = getGoogleClientId();
  const hasGoogleClientId = Boolean(googleClientId && !googleClientId.includes('your_'));

  return {
    emailOtp: {
      configured: cfg.isSmtpConfigured || cfg.isResendConfigured,
      provider: cfg.isSmtpConfigured
        ? `SMTP (${cfg.smtpHost})`
        : cfg.isResendConfigured
        ? 'Resend HTTP API'
        : 'Sandbox Preview (Configure SMTP_USER & SMTP_PASS in .env for live inbox delivery)',
      senderEmail: cfg.isSmtpConfigured ? cfg.smtpUser : null
    },
    googleOAuth: {
      configured: hasGoogleClientId,
      clientId: hasGoogleClientId ? googleClientId : '',
      clientIdPrefix: hasGoogleClientId ? `${googleClientId.slice(0, 14)}...` : null,
      supportsGmail: true,
      supportsGoogleWorkspace: true,
      supportsCustomEmailOtp: true
    }
  };
}

function buildOtpEmailHtml({ userName, otp, purpose, platform }) {
  const title = purpose === 'PASSWORDLESS_LOGIN'
    ? 'Sign-In Verification Code'
    : purpose === 'GOOGLE_WORKSPACE_VERIFY'
    ? 'Email Identity Verification'
    : 'Two-Factor Authentication (2FA) Code';

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px 28px;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #e0e7ff;">Galora AI Institutional Security</div>
      <h1 style="margin: 6px 0 0; font-size: 20px; color: #ffffff;">${title}</h1>
    </div>
    <div style="padding: 28px;">
      <p style="margin: 0 0 16px; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
        Hello <strong>${userName || 'Investor'}</strong>,
      </p>
      <p style="margin: 0 0 20px; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
        Use the 6-digit verification code below to complete your sign-in on <strong>Galora AI (${String(platform || 'Web').toUpperCase()})</strong>:
      </p>
      <div style="background: #111827; border: 1px solid #3b82f6; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
        <div style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #60a5fa;">
          ${otp}
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
          Valid for 5 minutes • Single-use cryptographic token
        </div>
      </div>
      <p style="margin: 20px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
        If you did not request this verification code, you can safely ignore this email. Never share your OTP or 4-digit Trading PIN with anyone.
      </p>
    </div>
  </div>`;
}

/**
 * Sends a 6-digit OTP email via Gmail/Custom SMTP or Resend API.
 * Gracefully falls back to Sandbox Preview if SMTP credentials are not yet set in .env.
 */
export async function sendOtpEmail({ toEmail, userName = 'Investor', otp, purpose = '2FA', platform = 'web' }) {
  const cfg = getSmtpConfig();
  const subject = `${otp} is your Galora AI verification code`;
  const html = buildOtpEmailHtml({ userName, otp, purpose, platform });
  const text = `Your Galora AI verification code is: ${otp} (Valid for 5 minutes).`;

  // 1. Try SMTP (Gmail App Password or Custom Corporate SMTP)
  if (cfg.isSmtpConfigured) {
    try {
      const key = `${cfg.smtpHost}:${cfg.smtpPort}:${cfg.smtpUser}`;
      if (!cachedTransporter || cachedTransporterKey !== key) {
        cachedTransporter = nodemailer.createTransport({
          host: cfg.smtpHost,
          port: cfg.smtpPort,
          secure: cfg.smtpSecure,
          auth: {
            user: cfg.smtpUser,
            pass: cfg.smtpPass
          }
        });
        cachedTransporterKey = key;
      }

      const info = await cachedTransporter.sendMail({
        from: cfg.smtpFrom,
        to: toEmail,
        subject,
        text,
        html
      });

      console.log(`[Email OTP] Sent real email to ${toEmail} via ${cfg.smtpHost} (messageId: ${info.messageId})`);
      return {
        delivered: true,
        provider: `SMTP (${cfg.smtpHost})`,
        sender: cfg.smtpUser,
        messageId: info.messageId
      };
    } catch (err) {
      console.error(`[Email OTP] SMTP send error (${err.message}). Falling back to preview mode.`);
      return {
        delivered: false,
        provider: 'smtp_error_fallback',
        error: err.message
      };
    }
  }

  // 2. Try Resend HTTP API if configured
  if (cfg.isResendConfigured) {
    try {
      const fromAddress = process.env.RESEND_FROM || 'Galora AI Security <onboarding@resend.dev>';
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: fromAddress,
          to: [toEmail],
          subject,
          html
        },
        {
          headers: {
            Authorization: `Bearer ${cfg.resendApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 6000
        }
      );
      return {
        delivered: true,
        provider: 'Resend API',
        messageId: response.data?.id
      };
    } catch (err) {
      console.error(`[Email OTP] Resend API error:`, err.response?.data || err.message);
    }
  }

  // 3. Sandbox fallback when SMTP_USER / SMTP_PASS are not yet configured
  console.log(`[Email OTP Sandbox] To: ${toEmail} | Code: ${otp} | Purpose: ${purpose}`);
  return {
    delivered: false,
    provider: 'sandbox',
    reason: 'SMTP_USER / SMTP_PASS not set in .env yet — displaying instant OTP preview'
  };
}

/**
 * Verifies a Google OAuth 2.0 ID Token or Access Token with Google's official endpoints
 */
export async function verifyGoogleOAuthToken({ idToken, accessToken }) {
  const configuredClientId = getGoogleClientId();

  if (idToken) {
    const res = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { timeout: 6000 }
    );
    const data = res.data;
    if (!data || !data.email) {
      throw new Error('Invalid Google ID Token payload.');
    }
    if (configuredClientId && !configuredClientId.includes('your_') && data.aud !== configuredClientId) {
      throw new Error('Google ID Token audience mismatch.');
    }
    return {
      email: String(data.email).toLowerCase(),
      name: data.name || data.email.split('@')[0],
      picture: data.picture || null,
      emailVerified: data.email_verified === 'true' || data.email_verified === true,
      googleSub: data.sub,
      hostedDomain: data.hd || (data.email.endsWith('@gmail.com') ? 'gmail.com' : data.email.split('@')[1])
    };
  }

  if (accessToken) {
    const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 6000
    });
    const data = res.data;
    if (!data || !data.email) {
      throw new Error('Invalid Google OAuth Access Token.');
    }
    return {
      email: String(data.email).toLowerCase(),
      name: data.name || data.email.split('@')[0],
      picture: data.picture || null,
      emailVerified: Boolean(data.email_verified),
      googleSub: data.sub,
      hostedDomain: data.hd || (data.email.endsWith('@gmail.com') ? 'gmail.com' : data.email.split('@')[1])
    };
  }

  throw new Error('Google idToken or accessToken is required.');
}
