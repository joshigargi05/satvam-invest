import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiFetch,
  detectPlatformInfo,
  getDeviceId,
  getStoredTokens,
  storeTokens,
  clearStoredTokens,
  triggerBiometricVerification
} from '../services/platform';

const AuthContext = createContext();

const USER_CACHE_KEY = 'vestra_auth_user_v1';
const LOCK_STATE_KEY = 'vestra_session_locked_v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(() => {
    try {
      return localStorage.getItem(LOCK_STATE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [pending2FA, setPending2FA] = useState(null); // { challengeToken, demoOtpHint, message, email }
  const [platformInfo] = useState(() => detectPlatformInfo());

  const persistUser = (u) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_CACHE_KEY);
    } catch {
      // Ignore storage quota errors
    }
  };

  const refreshUser = useCallback(async () => {
    const { accessToken, refreshToken } = getStoredTokens();
    if (!accessToken && !refreshToken) {
      setLoading(false);
      return null;
    }
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          persistUser(data.user);
          setLoading(false);
          return data.user;
        }
      } else if (res.status === 401) {
        clearStoredTokens();
        persistUser(null);
      }
    } catch {
      // Keep cached user if offline
    }
    setLoading(false);
    return null;
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginWithCredentials = async (email, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        platform: platformInfo.platform,
        deviceId: getDeviceId(),
        deviceName: platformInfo.label
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    if (data.requires2FA) {
      setPending2FA({
        challengeToken: data.challengeToken,
        demoOtpHint: data.demoOtpHint,
        emailDelivery: data.emailDelivery || null,
        message: data.message,
        email: data.email || email
      });
      return { requires2FA: true, demoOtpHint: data.demoOtpHint, emailDelivery: data.emailDelivery };
    }

    storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    persistUser(data.user);
    setPending2FA(null);
    setIsLocked(false);
    localStorage.removeItem(LOCK_STATE_KEY);
    return { requires2FA: false, user: data.user };
  };

  const loginWithGoogle = async ({ idToken, accessToken, email, name, defaultMarket = 'US', requireOtp = false }) => {
    const res = await apiFetch('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        idToken,
        accessToken,
        email,
        name,
        defaultMarket,
        requireOtp,
        platform: platformInfo.platform,
        deviceId: getDeviceId(),
        deviceName: platformInfo.label
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google authentication failed');
    }

    if (data.requires2FA) {
      setPending2FA({
        challengeToken: data.challengeToken,
        demoOtpHint: data.demoOtpHint,
        emailDelivery: data.emailDelivery || null,
        message: data.message,
        email: data.email || email
      });
      return { requires2FA: true, demoOtpHint: data.demoOtpHint, emailDelivery: data.emailDelivery };
    }

    storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    persistUser(data.user);
    setPending2FA(null);
    setIsLocked(false);
    localStorage.removeItem(LOCK_STATE_KEY);
    return { requires2FA: false, user: data.user };
  };

  const requestEmailOtp = async ({ email, name, defaultMarket = 'US' }) => {
    const res = await apiFetch('/api/auth/email-otp/request', {
      method: 'POST',
      body: JSON.stringify({
        email,
        name,
        defaultMarket,
        platform: platformInfo.platform,
        deviceId: getDeviceId(),
        deviceName: platformInfo.label
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send verification code');
    }

    setPending2FA({
      challengeToken: data.challengeToken,
      demoOtpHint: data.demoOtpHint,
      emailDelivery: data.emailDelivery || null,
      message: data.message,
      email: data.email || email
    });
    return data;
  };

  const sendTestOtpEmail = async (email) => {
    const res = await apiFetch('/api/auth/email-otp/test', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to test OTP email delivery');
    }
    return data;
  };

  const verify2FA = async (otp) => {
    if (!pending2FA?.challengeToken) {
      throw new Error('No active 2FA challenge found.');
    }

    const res = await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        challengeToken: pending2FA.challengeToken,
        otp,
        platform: platformInfo.platform,
        deviceId: getDeviceId(),
        deviceName: platformInfo.label
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid 2FA verification code');
    }

    storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    persistUser(data.user);
    setPending2FA(null);
    setIsLocked(false);
    localStorage.removeItem(LOCK_STATE_KEY);
    return data.user;
  };

  const registerAccount = async ({ name, email, password, defaultMarket = 'US', pin = '' }) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        defaultMarket,
        pin,
        platform: platformInfo.platform,
        deviceId: getDeviceId(),
        deviceName: platformInfo.label
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Account registration failed');
    }

    storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    persistUser(data.user);
    setPending2FA(null);
    setIsLocked(false);
    localStorage.removeItem(LOCK_STATE_KEY);
    return data.user;
  };

  const loginWithDemo = async () => {
    const res = await apiFetch('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({
        platform: platformInfo.platform,
        deviceId: getDeviceId(),
        deviceName: platformInfo.label
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Demo login failed');
    }

    storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    persistUser(data.user);
    setPending2FA(null);
    setIsLocked(false);
    localStorage.removeItem(LOCK_STATE_KEY);
    return data.user;
  };

  const lockSession = () => {
    setIsLocked(true);
    try {
      localStorage.setItem(LOCK_STATE_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const unlockWithPin = async (pin) => {
    const res = await apiFetch('/api/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid PIN');
    }
    setIsLocked(false);
    localStorage.removeItem(LOCK_STATE_KEY);
    await refreshUser();
    return true;
  };

  const unlockWithBiometrics = async () => {
    const bioRes = await triggerBiometricVerification(user?.email || 'investor@vestra.ai');
    if (!bioRes.success) {
      throw new Error(bioRes.error || 'Biometric authentication failed');
    }
    setIsLocked(false);
    localStorage.removeItem(LOCK_STATE_KEY);
    return bioRes;
  };

  const updateSecuritySettings = async (payload) => {
    const res = await apiFetch('/api/auth/security', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update security settings');
    }
    if (data.user) persistUser(data.user);
    return data;
  };

  const updateUserProfile = async (payload) => {
    const res = await apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }
    if (data.user) persistUser(data.user);
    return data.user;
  };

  const revokeSession = async (sessionId) => {
    const res = await apiFetch(`/api/auth/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (res.ok && data.user) {
      persistUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network error on logout
    }
    clearStoredTokens();
    persistUser(null);
    setPending2FA(null);
    setIsLocked(false);
    localStorage.removeItem(LOCK_STATE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        isLocked,
        pending2FA,
        setPending2FA,
        platformInfo,
        loginWithCredentials,
        loginWithGoogle,
        requestEmailOtp,
        sendTestOtpEmail,
        verify2FA,
        registerAccount,
        loginWithDemo,
        lockSession,
        unlockWithPin,
        unlockWithBiometrics,
        updateSecuritySettings,
        updateUserProfile,
        revokeSession,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
