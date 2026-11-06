import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/platform';

const ShieldCheck = Lucide.ShieldCheck || (() => '🛡️');
const Lock = Lucide.Lock || (() => '🔒');
const Mail = Lucide.Mail || (() => '✉️');
const User = Lucide.User || (() => '👤');
const KeyRound = Lucide.KeyRound || (() => '🔑');
const Fingerprint = Lucide.Fingerprint || (() => '🫆');
const Smartphone = Lucide.Smartphone || (() => '📱');
const Globe = Lucide.Globe || (() => '🌐');
const Sparkles = Lucide.Sparkles || (() => '✨');
const Eye = Lucide.Eye || (() => '👁️');
const EyeOff = Lucide.EyeOff || (() => '🙈');
const ArrowRight = Lucide.ArrowRight || (() => '→');
const AlertCircle = Lucide.AlertCircle || (() => '⚠️');
const LogOut = Lucide.LogOut || (() => '🚪');
const X = Lucide.X || (() => '✕');
const CheckCircle2 = Lucide.CheckCircle2 || (() => '✓');

function GoogleLogoSvg({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.92-1.77 3.04-4.38 3.04-7.51 0-.72-.06-1.42-.19-2H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.3-2.56c-.91.61-2.08.98-3.32.98-2.55 0-4.71-1.72-5.48-4.04H3.11v2.64C4.76 19.86 8.12 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.52 13.95A5.98 5.98 0 0 1 6.2 12c0-.68.12-1.34.32-1.95V7.41H3.11A9.98 9.98 0 0 0 2 12c0 1.61.39 3.14 1.11 4.59l3.41-2.64z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 3.02 14.7 2 12 2 8.12 2 4.76 4.14 3.11 7.41l3.41 2.64c.77-2.32 2.93-4.04 5.48-4.04z"
      />
    </svg>
  );
}

export function PinLockScreen() {
  const { user, unlockWithPin, unlockWithBiometrics, logout, platformInfo } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleDigit = async (digit) => {
    if (pin.length >= 4 || verifying) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError('');

    if (nextPin.length === 4) {
      setVerifying(true);
      try {
        await unlockWithPin(nextPin);
      } catch (err) {
        setError(err.message || 'Incorrect 4-digit PIN');
        setPin('');
      } finally {
        setVerifying(false);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleBiometric = async () => {
    setError('');
    setVerifying(true);
    try {
      await unlockWithBiometrics();
    } catch (err) {
      setError(err.message || 'Biometric verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="auth-portal-bg">
      <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-md w-full border border-blue-500/30 shadow-2xl text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto mb-3 shadow-lg">
          <Lock size={24} />
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          {platformInfo.label} • Trading Enclave Locked
        </span>

        <h2 className="text-xl font-bold text-white mt-2">Welcome back, {user?.name?.split(' ')[0] || 'Investor'}</h2>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Enter your 4-digit Trading PIN or use Biometric Passkey to unlock your portfolio.
          <span className="block text-[11px] text-blue-300 font-mono mt-0.5">(Demo Default PIN: 1234)</span>
        </p>

        {/* 4-Dot PIN Indicator */}
        <div className="flex items-center justify-center gap-4 my-5">
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className="w-4 h-4 rounded-full transition-all"
                style={{
                  backgroundColor: filled ? '#3b82f6' : 'rgba(255,255,255,0.12)',
                  boxShadow: filled ? '0 0 12px rgba(59, 130, 246, 0.8)' : 'none',
                  transform: filled ? 'scale(1.15)' : 'scale(1)'
                }}
              />
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Mobile Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              disabled={verifying}
              className="py-3.5 rounded-xl bg-slate-900/90 hover:bg-blue-600/30 border border-white/10 text-white font-mono text-lg font-bold transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBiometric}
            disabled={verifying}
            className="py-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 flex items-center justify-center transition-all"
            title="Unlock with Biometric Passkey (FaceID / Fingerprint)"
          >
            <Fingerprint size={20} />
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            disabled={verifying}
            className="py-3.5 rounded-xl bg-slate-900/90 hover:bg-blue-600/30 border border-white/10 text-white font-mono text-lg font-bold transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            disabled={verifying}
            className="py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 font-bold text-xs uppercase transition-all"
          >
            ⌫ Del
          </button>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
          <button
            type="button"
            onClick={handleBiometric}
            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
          >
            <Fingerprint size={14} /> Biometric Passkey
          </button>
          <button
            type="button"
            onClick={logout}
            className="logout-header-btn"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const {
    loginWithCredentials,
    loginWithGoogle,
    requestEmailOtp,
    registerAccount,
    loginWithDemo,
    verify2FA,
    pending2FA,
    setPending2FA,
    platformInfo
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'email_otp' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [defaultMarket] = useState('US');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Google / Workspace Sign-In Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleModalTab, setGoogleModalTab] = useState('instant'); // 'instant' | 'official_redirect'
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleVerifyWithOtp, setGoogleVerifyWithOtp] = useState(false);
  const [googleOfficialRendered, setGoogleOfficialRendered] = useState(false);
  const [activeGoogleClientId, setActiveGoogleClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || '364673139154-7109gaj02ilkn7vansekvcnbisk4ugip.apps.googleusercontent.com'
  );
  const [clientIdInput, setClientIdInput] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || '364673139154-7109gaj02ilkn7vansekvcnbisk4ugip.apps.googleusercontent.com'
  );

  // 1. Initialize Google Identity Services (One Tap & Single "Continue with Google" button)
  useEffect(() => {
    let mounted = true;

    const renderGoogleButton = () => {
      if (activeGoogleClientId && typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: activeGoogleClientId,
            callback: async (response) => {
              if (response.credential) {
                setSubmitting(true);
                setError('');
                try {
                  await loginWithGoogle({ idToken: response.credential, defaultMarket });
                } catch (err) {
                  setError(err.message || 'Google Sign-In failed');
                } finally {
                  setSubmitting(false);
                }
              }
            }
          });

          const googleBtnContainer = document.getElementById('google-official-btn');
          if (googleBtnContainer) {
            googleBtnContainer.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainer, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: 'continue_with',
              shape: 'pill',
              width: 380,
              logo_alignment: 'left'
            });
            if (googleBtnContainer.children.length > 0 && mounted) {
              setGoogleOfficialRendered(true);
            }
          }
        } catch (e) {
          // Fallback gracefully
        }
      }
    };

    renderGoogleButton();

    const interval = setInterval(() => {
      const container = document.getElementById('google-official-btn');
      if (container && container.children.length > 0) {
        if (mounted) setGoogleOfficialRendered(true);
        clearInterval(interval);
      } else if (window.google?.accounts?.id) {
        renderGoogleButton();
      }
    }, 250);

    const timeout = setTimeout(() => clearInterval(interval), 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [activeGoogleClientId, defaultMarket, loginWithGoogle]);

  // 2. Handle return from Official Google Login Page (https://accounts.google.com/o/oauth2/v2/auth#access_token=...)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token=') || hash.includes('id_token='))) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      if (accessToken || idToken) {
        setSubmitting(true);
        setError('');
        loginWithGoogle({ accessToken, idToken, defaultMarket })
          .catch((err) => {
            setError(err.message || 'Google OAuth callback verification failed');
          })
          .finally(() => {
            setSubmitting(false);
          });
      }
    }
  }, [defaultMarket, loginWithGoogle]);

  // 2. Fetch saved Google OAuth Client ID from backend runtime config
  useEffect(() => {
    apiFetch('/api/auth/providers')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const cid = data?.googleOAuth?.clientId;
        if (cid && !cid.includes('your_')) {
          setActiveGoogleClientId(cid);
          setClientIdInput(cid);
        }
      })
      .catch(() => {});
  }, []);

  // Redirects browser directly to Google's default Gmail Login & Account Chooser page (accounts.google.com)
  const redirectToDefaultGoogleLoginPage = (clientIdToUse) => {
    const cleanClientId = String(clientIdToUse || activeGoogleClientId || '').trim();
    if (!cleanClientId || cleanClientId.includes('your_')) {
      setGoogleModalTab('official_redirect');
      setShowGoogleModal(true);
      return;
    }
    const redirectUri = `${window.location.origin}/login`;
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', cleanClientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'token');
    oauthUrl.searchParams.set('scope', 'openid email profile');
    oauthUrl.searchParams.set('prompt', 'select_account');
    window.location.href = oauthUrl.toString();
  };

  // Password strength calculation for registration
  const passwordStrength = (() => {
    if (!password) return { score: 0, label: 'Enter password', color: '#64748b' };
    let s = 0;
    if (password.length >= 8) s += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s += 1;
    if (/\d/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;
    if (s <= 1) return { score: 25, label: 'Weak', color: '#ef4444' };
    if (s === 2) return { score: 50, label: 'Fair', color: '#f59e0b' };
    if (s === 3) return { score: 75, label: 'Strong', color: '#3b82f6' };
    return { score: 100, label: 'Institutional Grade', color: '#10b981' };
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (pending2FA) {
        await verify2FA(otp);
      } else if (mode === 'login') {
        const res = await loginWithCredentials(email, password);
        if (res?.requires2FA && res?.demoOtpHint) {
          setOtp(res.demoOtpHint);
        }
      } else if (mode === 'email_otp') {
        const res = await requestEmailOtp({ email, name, defaultMarket });
        if (res?.demoOtpHint) {
          setOtp(res.demoOtpHint);
        } else {
          setOtp('');
        }
      } else {
        await registerAccount({
          name,
          email,
          password,
          defaultMarket,
          pin
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithDemo();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueWithGoogleClick = () => {
    setError('');
    if (activeGoogleClientId && !activeGoogleClientId.includes('your_')) {
      redirectToDefaultGoogleLoginPage(activeGoogleClientId);
      return;
    }
    setShowGoogleModal(true);
  };

  const handleSaveClientIdAndRedirect = async (e) => {
    e.preventDefault();
    const cleanCid = String(clientIdInput || '').trim();
    if (!cleanCid || !cleanCid.includes('.apps.googleusercontent.com')) {
      setError('Please enter a valid Google OAuth Client ID ending in .apps.googleusercontent.com');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/auth/google/config', {
        method: 'POST',
        body: JSON.stringify({ googleClientId: cleanCid })
      });
      setActiveGoogleClientId(cleanCid);
      redirectToDefaultGoogleLoginPage(cleanCid);
    } catch (err) {
      setError(err.message || 'Failed to save Google Client ID');
      setSubmitting(false);
    }
  };

  const handleInstantGmailAccountSelect = async (selectedEmail, selectedName) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle({
        email: selectedEmail,
        name: selectedName,
        defaultMarket,
        requireOtp: false
      });
      setShowGoogleModal(false);
      if (res?.requires2FA && res?.demoOtpHint) {
        setOtp(res.demoOtpHint);
      }
    } catch (err) {
      setError(err.message || 'Gmail sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleModalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle({
        email: googleEmail,
        name: googleName,
        defaultMarket,
        requireOtp: googleVerifyWithOtp
      });
      setShowGoogleModal(false);
      if (res?.requires2FA && res?.demoOtpHint) {
        setOtp(res.demoOtpHint);
      } else {
        setOtp('');
      }
    } catch (err) {
      setError(err.message || 'Google / Workspace Sign-In failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-portal-bg">
      <div className="auth-portal-container animate-fade-in">
        
        {/* Left Pane: Modern Institutional Brand & Ecosystem Overview */}
        <div className="auth-hero-pane">
          <div>
            {/* Brand Emblem */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    width: '44px',
                    height: '44px',
                    borderRadius: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    color: '#ffffff',
                    fontSize: '1.35rem',
                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.35)'
                  }}
                >
                  S
                </div>
                <div>
                  <h1 className="text-gradient text-2xl font-black m-0">Satvam Invest</h1>
                  <span className="text-xs text-slate-400">AI-Powered Wealth Generation</span>
                </div>
              </div>

              <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ● {platformInfo.label}
              </span>
            </div>

            {/* Hero Headline */}
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                lineHeight: 1.25,
                color: '#f8fafc',
                marginBottom: '1.25rem'
              }}
            >
              <span className="text-gradient">AI-powered Investment Engine</span> and Wealth Creation Platform
            </h2>

            {/* Feature Highlights Grid */}
            <div className="space-y-3 mb-6">
              {[
                {
                  icon: <Sparkles size={17} className="text-blue-400" />,
                  title: 'Top-Ranked AI Stock Picks',
                  desc: 'Curated daily stock picks across US ($) and Indian (₹) markets.'
                },
                {
                  icon: <ShieldCheck size={17} className="text-emerald-400" />,
                  title: 'Effortless 1-Click Sign-In',
                  desc: 'Sign in instantly with your Google account or email code.'
                },
                {
                  icon: <Smartphone size={17} className="text-purple-400" />,
                  title: 'Automated Multi-Device Portfolio Sync',
                  desc: 'Your holdings, balance, and smart rules stay updated everywhere.'
                }
              ].map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    {feat.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{feat.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Trust Bar */}
          <div
            style={{
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: '11px',
              color: '#94a3b8'
            }}
          >
            <span>🔒 Bank-Grade Security &amp; Encryption</span>
            <span className="text-emerald-400 font-semibold">☁️ Secure Cloud Protected</span>
          </div>
        </div>

        {/* Right Pane: Sleek Modern Authentication Card */}
        <div className="auth-form-pane">
          <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
            {/* Form Header */}
            <div className="mb-5">
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
                {pending2FA
                  ? 'Verify Your Identity'
                  : mode === 'register'
                  ? 'Create Investor Account'
                  : mode === 'email_otp'
                  ? 'Passwordless Email OTP'
                  : 'Sign In to Satvam Invest'}
              </h3>
              <p className="text-xs text-slate-400">
                {pending2FA
                  ? 'Enter the 6-digit verification code to unlock your portfolio.'
                  : 'Sign in with Google, email verification code, or your password below.'}
              </p>
            </div>

            {/* Primary CTA: Single "Continue with Google" Button */}
            {!pending2FA && (
              <div className="mb-4">
                <div 
                  id="google-official-btn" 
                  className={`w-full flex justify-center ${googleOfficialRendered ? '' : 'hidden'}`}
                  style={{ minHeight: '44px' }}
                ></div>

                {!googleOfficialRendered && (
                  <button
                    type="button"
                    onClick={handleContinueWithGoogleClick}
                    disabled={submitting}
                    className="auth-google-btn"
                  >
                    <GoogleLogoSvg size={20} />
                    <span>Continue with Google</span>
                  </button>
                )}
              </div>
            )}

            {/* Segmented Mode Switcher */}
            {!pending2FA && (
              <div className="auth-segmented-tabs">
                <button
                  type="button"
                  onClick={() => {
                    setMode('email_otp');
                    setError('');
                  }}
                  className={`auth-segmented-tab ${mode === 'email_otp' ? 'active' : ''}`}
                >
                  ✉️ Email OTP (Gmail)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`auth-segmented-tab ${mode === 'login' ? 'active' : ''}`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className={`auth-segmented-tab ${mode === 'register' ? 'active' : ''}`}
                >
                  Create Account
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {pending2FA ? (
                /* 6-Digit OTP Verification View */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
                    <div className="font-bold text-white mb-1 flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5">
                        <Mail size={15} className="text-blue-400" />
                        6-Digit Verification Code
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                          pending2FA.emailDelivery?.delivered
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {pending2FA.emailDelivery?.delivered
                          ? `✓ Sent via ${pending2FA.emailDelivery.provider}`
                          : 'Sandbox Preview'}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1">{pending2FA.message}</p>

                    {pending2FA.demoOtpHint && (
                      <div className="mt-3 p-2.5 rounded-lg bg-black/50 border border-emerald-500/30 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400">
                            Instant OTP Preview Code
                          </div>
                          <div className="font-mono text-base text-emerald-300 font-extrabold tracking-widest">
                            {pending2FA.demoOtpHint}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtp(pending2FA.demoOtpHint)}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="chat-input w-full font-mono text-center text-xl tracking-widest py-3"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPending2FA(null)}
                      className="btn btn-outline flex-1 py-2.5 text-xs"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || otp.length < 6}
                      className="auth-submit-btn flex-1"
                    >
                      <span>{submitting ? 'Verifying...' : 'Verify & Continue'}</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ) : mode === 'email_otp' ? (
                /* Passwordless Email OTP Flow */
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Email Address (Gmail, Corporate, or Custom)
                    </label>
                    <div className="auth-field-wrap">
                      <span className="auth-field-icon">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@gmail.com or name@company.com"
                        className="auth-input-modern"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Your Name (Optional)
                    </label>
                    <div className="auth-field-wrap">
                      <span className="auth-field-icon">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Gargi Sharma"
                        className="auth-input-modern"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="auth-submit-btn mt-2"
                  >
                    <Mail size={16} />
                    <span>{submitting ? 'Sending 6-Digit Code...' : 'Send 6-Digit OTP to Email'}</span>
                  </button>
                </div>
              ) : (
                /* Standard Email + Password Login or Registration */
                <div className="space-y-3.5">
                  {mode === 'register' && (
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Full Name
                      </label>
                      <div className="auth-field-wrap">
                        <span className="auth-field-icon">
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Aarav Mehta"
                          className="auth-input-modern"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Email Address
                    </label>
                    <div className="auth-field-wrap">
                      <span className="auth-field-icon">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@gmail.com or name@company.com"
                        className="auth-input-modern"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span>{showPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <div className="auth-field-wrap">
                      <span className="auth-field-icon">
                        <KeyRound size={16} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="auth-input-modern font-mono"
                        required
                      />
                    </div>
                    {mode === 'register' && (
                      <div className="mt-2">
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{ width: `${passwordStrength.score}%`, backgroundColor: passwordStrength.color }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Password Strength: <strong style={{ color: passwordStrength.color }}>{passwordStrength.label}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        4-Digit App PIN (Optional)
                      </label>
                      <div className="auth-field-wrap">
                        <span className="auth-field-icon">
                          <Lock size={15} />
                        </span>
                        <input
                          type="password"
                          maxLength={4}
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="1234"
                          className="auth-input-modern font-mono tracking-widest"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="auth-submit-btn mt-2"
                  >
                    <span>{submitting ? 'Signing In...' : mode === 'login' ? 'Sign In to Dashboard' : 'Create Verified Account'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Google / Official Gmail Account Chooser & Redirect Modal */}
      {showGoogleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(10px)' }}
        >
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-white/15 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow">
                  <GoogleLogoSvg size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white m-0">Sign in with Google</h3>
                  <span className="text-[11px] text-slate-400">Choose a Gmail account (No Password Needed)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modern Google / Gmail Passwordless Sign-In Modal */}
            <form onSubmit={handleGoogleModalSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 leading-relaxed">
                <span className="font-bold text-white block mb-1">
                  ⚡ 100% Passwordless Google Login
                </span>
                Enter your Gmail or Google Workspace email address. An authenticated session and cloud portfolio wallet will be provisioned instantly.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Your Gmail / Google Workspace Address
                </label>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="name@gmail.com or name@company.com"
                    className="auth-input-modern"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Your Name (Optional)
                </label>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="e.g. Gargi Sharma"
                    className="auth-input-modern"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleVerifyWithOtp}
                  onChange={(e) => setGoogleVerifyWithOtp(e.target.checked)}
                />
                <span>Also send a 6-digit confirmation code to my email</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="btn btn-outline flex-1 py-2.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !googleEmail}
                  className="auth-submit-btn flex-1"
                >
                  <GoogleLogoSvg size={18} />
                  <span>{submitting ? 'Authenticating...' : 'Sign In with Gmail'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
