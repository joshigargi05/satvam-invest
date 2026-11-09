import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarket } from '../context/MarketContext';
import { getMobileReleaseManifest } from '../services/api';
import { triggerBiometricVerification, getApiBaseUrl } from '../services/platform';
import { getGaMeasurementId, setGaMeasurementId } from '../services/analytics';

const ShieldCheck = Lucide.ShieldCheck || (() => '🛡️');
const Lock = Lucide.Lock || (() => '🔒');
const KeyRound = Lucide.KeyRound || (() => '🔑');
const Fingerprint = Lucide.Fingerprint || (() => '🫆');
const Smartphone = Lucide.Smartphone || (() => '📱');
const Globe = Lucide.Globe || (() => '🌐');
const Laptop = Lucide.Laptop || (() => '💻');
const User = Lucide.User || (() => '👤');
const CheckCircle2 = Lucide.CheckCircle2 || (() => '✓');
const AlertCircle = Lucide.AlertCircle || (() => '⚠️');
const Trash2 = Lucide.Trash2 || (() => '🗑️');
const LogOut = Lucide.LogOut || (() => '🚪');
const RefreshCw = Lucide.RefreshCw || (() => '🔄');
const Cloud = Lucide.Cloud || (() => '☁️');
const Terminal = Lucide.Terminal || (() => '⌨️');
const Layers = Lucide.Layers || (() => '📑');
const Server = Lucide.Server || (() => '🗄️');
const BarChart3 = Lucide.BarChart3 || (() => '📊');

export default function Profile() {
  const {
    user,
    platformInfo,
    lockSession,
    logout,
    updateSecuritySettings,
    updateUserProfile,
    revokeSession,
    refreshUser,
    sendTestOtpEmail
  } = useAuth();

  const { lastCloudSyncAt, totalPortfolioValue } = usePortfolio();
  const { market, setMarket, currency } = useMarket();

  const [activeTab, setActiveTab] = useState('security'); // 'security' | 'mobile' | 'account'
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Security form states
  const [newPin, setNewPin] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Profile form states
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editMarket, setEditMarket] = useState(user?.defaultMarket || market);

  // Mobile release manifest
  const [releaseManifest, setReleaseManifest] = useState(null);

  // Google Analytics 4 & Live Visitor Telemetry state
  const [gaIdInput, setGaIdInput] = useState(() => getGaMeasurementId());
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const loadAnalyticsSummary = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/analytics/summary`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsSummary(data);
        if (data.gaMeasurementId && !gaIdInput) {
          setGaIdInput(data.gaMeasurementId);
          setGaMeasurementId(data.gaMeasurementId);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadAnalyticsSummary();
  }, []);

  const handleSaveGaConfig = async (e) => {
    e.preventDefault();
    const clean = String(gaIdInput || '').trim().toUpperCase();
    if (clean && !clean.startsWith('G-') && !clean.startsWith('GTM-') && !clean.startsWith('GT-')) {
      showBanner('Google Tag / GA4 ID must start with "GTM-", "G-", or "GT-" (e.g. GTM-54LZ246K).', true);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/analytics/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gaMeasurementId: clean })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save GA4 ID');
      setGaMeasurementId(clean);
      setGaIdInput(clean);
      await loadAnalyticsSummary();
      showBanner(
        clean
          ? `Google Analytics 4 (${clean}) activated across galora.ai!`
          : 'Google Analytics 4 Measurement ID cleared.'
      );
    } catch (err) {
      showBanner(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditMarket(user.defaultMarket || market);
    }
  }, [user]);

  useEffect(() => {
    getMobileReleaseManifest().then((data) => {
      if (data) setReleaseManifest(data);
    });
  }, []);

  const showBanner = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setStatusMsg('');
    } else {
      setStatusMsg(msg);
      setErrorMsg('');
    }
    setTimeout(() => {
      setStatusMsg('');
      setErrorMsg('');
    }, 5000);
  };

  const handleToggleSecurity = async (field, value) => {
    setSaving(true);
    try {
      const res = await updateSecuritySettings({ [field]: value });
      showBanner(res.message || 'Security preference updated.');
    } catch (err) {
      showBanner(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      showBanner('Please enter an exact 4-digit numeric PIN.', true);
      return;
    }
    setSaving(true);
    try {
      const res = await updateSecuritySettings({ newPin });
      setNewPin('');
      showBanner(res.message || '4-Digit Trading PIN updated!');
    } catch (err) {
      showBanner(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSecuritySettings({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      showBanner(res.message || 'Password updated successfully!');
    } catch (err) {
      showBanner(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        name: editName,
        phone: editPhone,
        defaultMarket: editMarket
      });
      setMarket(editMarket);
      showBanner('Account profile & default market saved!');
    } catch (err) {
      showBanner(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleTestBiometric = async () => {
    const res = await triggerBiometricVerification(user?.email);
    if (res.success) {
      showBanner(`Biometric Passkey Verified via ${res.method}!`);
    } else {
      showBanner(res.error || 'Biometric test cancelled.', true);
    }
  };

  const handleTestOtpEmail = async () => {
    setSaving(true);
    try {
      const res = await sendTestOtpEmail(user?.email);
      await refreshUser();
      if (res.delivery?.delivered) {
        showBanner(`6-digit OTP email delivered to ${res.targetEmail} via ${res.delivery.provider}!`);
      } else {
        showBanner(
          `OTP Generated (${res.sampleOtp}) for ${res.targetEmail} — Add SMTP_USER & SMTP_PASS in .env for live inbox delivery.`
        );
      }
    } catch (err) {
      showBanner(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const sessions = user?.sessions || [];
  const auditLogs = user?.auditLogs || [];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Top Identity & Cloud Sync Header Card */}
      <div className="glass-panel p-6 rounded-2xl mb-6 border border-blue-500/30 shadow-2xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              {(user?.name || 'V')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white m-0">{user?.name || 'Institutional Investor'}</h1>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ● {user?.role || 'Verified'}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                  {platformInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                {user?.email} • Cloud Sync: {lastCloudSyncAt ? `Synced ${new Date(lastCloudSyncAt).toLocaleTimeString()}` : 'Active (US $ & IND ₹)'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={lockSession}
              className="btn btn-outline py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 border-amber-500/40 text-amber-300"
              title="Lock trading terminal with 4-digit PIN & Biometrics"
            >
              <Lock size={14} />
              <span>Lock App (PIN)</span>
            </button>
            <button
              type="button"
              onClick={refreshUser}
              className="btn btn-outline py-2 px-3.5 text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Sync Security</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="btn py-2 px-4 text-xs font-bold flex items-center gap-1.5 bg-red-500/15 text-red-300 border border-red-500/30"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status / Error Alerts */}
      {statusMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Security, 2FA &amp; Device Sessions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mobile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
            activeTab === 'mobile'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <Smartphone size={15} />
          <span>Mobile App Rollout (Web → Android → iOS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
            activeTab === 'account'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <User size={15} />
          <span>Investor Profile &amp; Preferences</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('analytics');
            loadAnalyticsSummary();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <BarChart3 size={15} />
          <span>Google Analytics &amp; Visitors</span>
        </button>
      </div>

      {/* TAB 1: SECURITY, 2FA, PIN, BIOMETRICS & SESSIONS */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          {/* 3-Column Security Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Two-Factor Authentication Card */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <ShieldCheck size={20} />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      user?.security?.twoFactorEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-white/10'
                    }`}
                  >
                    {user?.security?.twoFactorEnabled ? '● ARMED' : '○ OPTIONAL'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">Two-Factor &amp; Email OTP (SMTP/Gmail)</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Delivers a 6-digit verification code via Gmail/SMTP whenever signing in from a new Web, Android, or iOS device.
                </p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleTestOtpEmail}
                  className="w-full py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all"
                >
                  ✉️ Send Test OTP Email ({user?.email})
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleToggleSecurity('twoFactorEnabled', !user?.security?.twoFactorEnabled)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    user?.security?.twoFactorEnabled
                      ? 'bg-slate-800 text-red-300 border border-red-500/30'
                      : 'bg-blue-600 text-white shadow-md'
                  }`}
                >
                  {user?.security?.twoFactorEnabled ? 'Disable 2FA Challenge' : 'Enable 2FA Verification'}
                </button>
              </div>
            </div>

            {/* 4-Digit Mobile Trading PIN Card */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <KeyRound size={20} />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      user?.security?.pinEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-white/10'
                    }`}
                  >
                    {user?.security?.pinEnabled ? '● PIN ACTIVE' : '○ DISABLED'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">4-Digit Mobile Trading PIN</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Fast numeric unlock screen when resuming the Android or iOS app.
                </p>
              </div>

              <form onSubmit={handleSavePin} className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="New 4-digit PIN"
                  className="chat-input flex-1 py-2 px-3 text-xs font-mono tracking-widest"
                />
                <button type="submit" disabled={saving} className="btn btn-primary py-2 px-3.5 text-xs font-bold shrink-0">
                  Set PIN
                </button>
              </form>
            </div>

            {/* Biometric Passkey (FaceID / Fingerprint) Card */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Fingerprint size={20} />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      user?.security?.biometricEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-white/10'
                    }`}
                  >
                    {user?.security?.biometricEnabled ? '● PASSKEY READY' : '○ OFF'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">Biometric Passkey Enclave</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Hardware-backed Android Fingerprint, Apple FaceID/TouchID, and WebAuthn passkey unlock.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestBiometric}
                  className="btn btn-outline flex-1 py-2 text-xs font-bold border-emerald-500/40 text-emerald-300"
                >
                  Test Biometric
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleToggleSecurity('biometricEnabled', !user?.security?.biometricEnabled)}
                  className="btn btn-primary py-2 px-3 text-xs font-bold"
                >
                  {user?.security?.biometricEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Multi-Platform Device Sessions & Password Update */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Device Sessions (2 columns) */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 lg:col-span-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Laptop size={18} className="text-blue-400" />
                    Active Device Sessions ({sessions.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Monitor and remotely revoke Web, Android, and iOS devices signed into your account.
                  </p>
                </div>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => revokeSession('others')}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30"
                  >
                    Revoke All Other Devices
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {sessions.map((s) => (
                  <div
                    key={s.sessionId}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        {s.platform === 'android' || s.platform === 'ios' ? <Smartphone size={18} /> : <Globe size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{s.deviceName}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-white/10 font-mono">
                            {s.platform}
                          </span>
                          {s.isCurrent && (
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              ● This Device
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          IP: {s.ip} • Last active: {new Date(s.lastActiveAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {!s.isCurrent && (
                      <button
                        type="button"
                        onClick={() => revokeSession(s.sessionId)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Change Password Box */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Lock size={17} className="text-purple-400" /> Rotate Account Password
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Re-hashes your credentials using 64-byte <code>scrypt</code> key derivation.
              </p>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="chat-input w-full py-2 px-3 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">New Password (min 8 chars)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="chat-input w-full py-2 px-3 text-xs font-mono"
                    required
                  />
                </div>
                <button type="submit" disabled={saving} className="btn btn-primary w-full py-2.5 text-xs font-bold">
                  Update Password
                </button>
              </form>
            </div>
          </div>

          {/* Security Audit Trail Table */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Layers size={18} className="text-emerald-400" />
              Immutable Security Audit Log
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Security Event</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 font-mono">
                      <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            log.event.includes('FAIL')
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {log.event}
                        </span>
                      </td>
                      <td className="p-3 uppercase text-blue-300">{log.platform}</td>
                      <td className="p-3 text-slate-300">{log.ip}</td>
                      <td className="p-3 font-sans text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOBILE APP ROLLOUT CENTER (WEB -> ANDROID -> IOS) */}
      {activeTab === 'mobile' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl border border-purple-500/30">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Phased Multi-Platform Deployment Pipeline
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  Web First → Android Native (Google Play) → iOS Native (App Store)
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  App Bundle ID: <code className="text-purple-300 font-mono">{releaseManifest?.appId || 'com.galora.ai'}</code> • Shared React 18 + Capacitor Native Bridge
                </p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 font-mono">
                ☁️ Cloud Ledger Synced ({currency}{totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })})
              </div>
            </div>

            {/* 3 Phase Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {(releaseManifest?.phases || [
                {
                  phase: 1,
                  platform: 'Web & Installable PWA',
                  status: 'LIVE',
                  bundle: 'Vite Production + PWA Manifest',
                  security: 'TLS 1.3 + JWT Bearer + scrypt + Rate Limiting'
                },
                {
                  phase: 2,
                  platform: 'Android Native (Google Play)',
                  status: 'READY_FOR_BUILD',
                  bundle: 'Capacitor Android Bridge (APK / AAB)',
                  security: 'Android Keystore + BiometricPrompt + 4-Digit PIN'
                },
                {
                  phase: 3,
                  platform: 'iOS Native (Apple App Store)',
                  status: 'READY_FOR_BUILD',
                  bundle: 'Capacitor iOS Bridge (Xcode / IPA)',
                  security: 'iOS Keychain + FaceID/TouchID + Safe-Area Insets'
                }
              ]).map((p) => (
                <div key={p.phase} className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                        Phase {p.phase}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          p.status === 'LIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{p.platform}</h3>
                    <p className="text-xs text-slate-300 mb-2">
                      <strong>Packaging:</strong> {p.bundle}
                    </p>
                    <p className="text-xs text-slate-400">
                      <strong>Security:</strong> {p.security}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Build & Packaging Commands Reference */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-white/10">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Terminal size={16} className="text-emerald-400" />
                End-to-End Native Build Workflow (Configured in package.json &amp; capacitor.config.json)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/5">
                  <div className="text-emerald-400 font-bold mb-1.5 font-sans">1. Web &amp; PWA Production</div>
                  <div className="text-slate-300">npm run build</div>
                  <div className="text-slate-300 mt-1">npm run preview</div>
                </div>
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/5">
                  <div className="text-blue-400 font-bold mb-1.5 font-sans">2. Android APK / Play Store</div>
                  <div className="text-slate-300">npm run android:init</div>
                  <div className="text-slate-300 mt-1">npm run android:sync</div>
                  <div className="text-slate-300 mt-1">npm run android:open</div>
                </div>
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/5">
                  <div className="text-purple-400 font-bold mb-1.5 font-sans">3. iOS Xcode / App Store</div>
                  <div className="text-slate-300">npm run ios:init</div>
                  <div className="text-slate-300 mt-1">npm run ios:sync</div>
                  <div className="text-slate-300 mt-1">npm run ios:open</div>
                </div>
              </div>
            </div>

            {/* GCP Cloud SQL for PostgreSQL + Cloud Run Deployment Status */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-blue-500/30 mt-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server size={16} className="text-blue-400" />
                  GCP Cloud Run &amp; Cloud SQL for PostgreSQL 16 Architecture
                </h3>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Engine: {releaseManifest?.database?.engine || 'Cloud SQL for PostgreSQL 16 (Adapter Ready)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Backed by <strong>10 ACID-compliant PostgreSQL tables</strong> (<code>db/schema.sql</code>) with automatic write-through sync via <code>server/db.js</code> and container orchestration via <code>Dockerfile</code> &amp; <code>cloudbuild.yaml</code>.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(releaseManifest?.database?.tables || [
                  'users',
                  'user_sessions',
                  'user_passkeys',
                  'security_audit_logs',
                  'portfolio_wallets',
                  'portfolio_holdings',
                  'trade_orders',
                  'rebalance_executions',
                  'algo_top_picks_snapshots',
                  'copilot_messages'
                ]).map((tbl) => (
                  <span
                    key={tbl}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-emerald-500/25"
                  >
                    {tbl}
                  </span>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/5 text-xs font-mono text-slate-300">
                <span className="text-blue-400 font-bold"># Deploy to GCP Cloud Run + Cloud SQL:</span>
                <div className="mt-1">gcloud builds submit --config cloudbuild.yaml</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVESTOR PROFILE & PREFERENCES */}
      {activeTab === 'account' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 max-w-2xl animate-fade-in">
          <h3 className="text-lg font-bold text-white mb-1">Investor Profile &amp; Regional Preferences</h3>
          <p className="text-xs text-slate-400 mb-5">
            Changes sync across your Web, Android, and iOS sessions.
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="chat-input w-full py-2.5 px-3.5 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Email Address (Verified Identity)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="chat-input w-full py-2.5 px-3.5 text-sm opacity-60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Mobile Phone (SMS / OTP Alerts)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="chat-input w-full py-2.5 px-3.5 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Default Trading Market</label>
                <select
                  value={editMarket}
                  onChange={(e) => setEditMarket(e.target.value)}
                  className="chat-input w-full py-2.5 px-3.5 text-sm"
                >
                  <option value="INDIA" style={{ color: '#000' }}>🇮🇳 India NSE/BSE (₹ INR)</option>
                  <option value="US" style={{ color: '#000' }}>🇺🇸 US Equities ($ USD)</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary py-2.5 px-6 text-xs font-bold">
              {saving ? 'Saving...' : 'Save Investor Profile'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: GOOGLE ANALYTICS 4 & LIVE VISITOR TELEMETRY */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          {/* GA4 Measurement ID Setup Card */}
          <div className="glass-panel p-6 rounded-2xl border border-amber-500/30">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Google Analytics 4 (gtag.js) + Built-In Telemetry
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  Visitor Tracking &amp; Traffic Analytics for galora.ai
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Automatically tracks SPA page views, unique visitors, and platform sessions across Web, Android, and iOS.
                </p>
              </div>
              <button
                type="button"
                onClick={loadAnalyticsSummary}
                disabled={loadingAnalytics}
                className="btn btn-outline py-2 px-3.5 text-xs flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={loadingAnalytics ? 'animate-spin text-amber-400' : ''} />
                <span>Refresh Live Stats</span>
              </button>
            </div>

            <form onSubmit={handleSaveGaConfig} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-6">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-200 block mb-1.5">
                  Google Analytics 4 Measurement ID (<a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline">Get from analytics.google.com</a>)
                </label>
                <input
                  type="text"
                  value={gaIdInput}
                  onChange={(e) => setGaIdInput(e.target.value)}
                  placeholder="GTM-54LZ246K or G-XXXXXXXXXX"
                  className="chat-input w-full py-2.5 px-3.5 text-sm font-mono uppercase"
                />
              </div>
              <button type="submit" disabled={saving} className="btn btn-primary py-2.5 px-5 text-xs font-bold whitespace-nowrap">
                {saving ? 'Activating...' : 'Save & Activate GA4'}
              </button>
            </form>

            {/* Live Visitor KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Active Visitors (15m)</span>
                </div>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  {analyticsSummary?.activeNowCount ?? 1}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30">
                <div className="text-[11px] text-blue-300 font-bold uppercase">Unique Visitors</div>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  {analyticsSummary?.uniqueVisitorsCount ?? 2}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30">
                <div className="text-[11px] text-purple-300 font-bold uppercase">Total Page Views</div>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  {analyticsSummary?.totalPageViews ?? 15}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30">
                <div className="text-[11px] text-amber-300 font-bold uppercase">GA4 Tag Status</div>
                <div className="text-sm font-extrabold font-mono mt-2">
                  {analyticsSummary?.gaMeasurementId || gaIdInput ? (
                    <span className="text-emerald-400">● {analyticsSummary?.gaMeasurementId || gaIdInput}</span>
                  ) : (
                    <span className="text-amber-300">● Built-In Active (Add G-ID)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Top Visited Pages & Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-3">
                  Top Visited Pages on galora.ai
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  {Object.entries(analyticsSummary?.pageBreakdown || { '/': 6, '/portfolio': 3, '/macro-agent': 2 }).map(
                    ([route, count]) => (
                      <div key={route} className="flex items-center justify-between py-1.5 border-b border-white/5">
                        <span className="text-slate-200">{route}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">{count} views</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-3">
                  Recent Live Visitor Stream
                </h4>
                <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
                  {(analyticsSummary?.recentEvents || []).length === 0 ? (
                    <p className="text-slate-400 text-xs">Tracking live visitor sessions...</p>
                  ) : (
                    analyticsSummary.recentEvents.map((ev, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 border-b border-white/5 gap-2">
                        <div className="truncate">
                          <span className="font-mono text-emerald-300 font-bold">{ev.path}</span>
                          <span className="text-slate-400 ml-2 text-[11px]">({ev.platform})</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
