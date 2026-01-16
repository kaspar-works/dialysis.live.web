import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types';
import { acceptTerms as acceptTermsApi, fetchCsrfToken, getCsrfToken } from '../services/auth';
import ConsentModal from '../components/ConsentModal';

// Types matching the auth service
export interface AuthUser {
  id: string;
  email: string;
  authProvider: string;
  status: string;
  onboardingCompleted: boolean;
  hasAcceptedTerms?: boolean;
  termsAcceptedAt?: string;
  createdAt?: string;
}

export interface AuthProfile {
  fullName?: string;
  photoUrl?: string;
  timezone?: string;
  units?: string;
  dryWeightKg?: number;
  heightCm?: number;
  dialysisStartDate?: string;
  clinicName?: string;
  nephrologistName?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  authProfile: AuthProfile | null;
  sessionExpiresAt: number | null;
  showSessionExpiredModal: boolean;
  showConsentModal: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  extendSession: () => void;
  dismissSessionModal: () => void;
  updateAuthProfile: (profile: Partial<AuthProfile>) => void;
  setUser: (user: AuthUser | null) => void;
  setAuthProfile: (profile: AuthProfile | null) => void;
  acceptTerms: () => Promise<void>;
  hasAcceptedTerms: boolean;
}

const API_BASE_URL = import.meta.env.DEV ? '/api/v1' : 'https://api.dialysis.live/api/v1';

// Session configuration
const SESSION_CONFIG = {
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes between session refresh calls
  CHECK_INTERVAL: 30 * 1000, // Check expiry every 30 seconds
  WARNING_THRESHOLD: 5 * 60 * 1000, // Warn 5 minutes before expiry
  ACTIVITY_DEBOUNCE: 1000, // 1 second debounce for activity detection
};

// Module-level CSRF token storage
let _csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  _csrfToken = token;
}

export function getCsrfToken(): string | null {
  return _csrfToken;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    authProfile: null,
    sessionExpiresAt: null,
    showSessionExpiredModal: false,
    showConsentModal: false,
  });

  const lastRefreshRef = useRef<number>(0);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expiryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasValidatedRef = useRef(false);

  // Validate session on mount (using /auth/me which supports session auth)
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          authProfile: null,
          sessionExpiresAt: null,
        }));
        return false;
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Session is valid, set 30-day expiry (backend uses 30-day sessions)
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

        // Check if user needs to accept terms
        const needsConsent = !result.data.user?.hasAcceptedTerms;

        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          user: result.data.user,
          authProfile: result.data.profile,
          sessionExpiresAt: expiresAt,
          showSessionExpiredModal: false,
          showConsentModal: needsConsent,
        }));

        // Update localStorage for backward compatibility
        localStorage.setItem('lifeondialysis_auth', 'true');

        // Fetch CSRF token for subsequent requests
        fetchCsrfToken().catch(err => console.warn('Failed to fetch CSRF token:', err));

        return true;
      }

      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
      }));
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
      }));
      return false;
    }
  }, []);

  // Extend session on server (using /auth/session/refresh)
  const extendSessionOnServer = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include CSRF token for session refresh
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/auth/session/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.session) {
          // Backend returns session.expiresAt as ISO string
          const expiresAt = new Date(result.data.session.expiresAt).getTime();

          setState(prev => ({
            ...prev,
            sessionExpiresAt: expiresAt,
          }));
        }
      } else if (response.status === 401 || response.status === 403) {
        // Session expired
        handleSessionExpired();
      }
    } catch (error) {
      console.warn('Failed to refresh session:', error);
    }
  }, [state.isAuthenticated]);

  // Throttled session extension on activity
  const extendSession = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current > SESSION_CONFIG.REFRESH_INTERVAL) {
      lastRefreshRef.current = now;
      extendSessionOnServer();
    }
  }, [extendSessionOnServer]);

  // Handle activity detection with debounce
  const handleActivity = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setTimeout(() => {
      extendSession();
    }, SESSION_CONFIG.ACTIVITY_DEBOUNCE);
  }, [extendSession]);

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSessionExpiredModal: true,
    }));
  }, []);

  // Dismiss session expired modal and redirect
  const dismissSessionModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      authProfile: null,
      sessionExpiresAt: null,
      showSessionExpiredModal: false,
    }));
    localStorage.removeItem('lifeondialysis_auth');
    setCsrfToken(null);
  }, []);

  // Login with email/password (session-based)
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/session/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.error?.message || result.message || 'Login failed');
    }

    // Backend returns session.expiresAt as ISO string
    const expiresAt = result.data?.session?.expiresAt
      ? new Date(result.data.session.expiresAt).getTime()
      : (Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Check if user needs to accept terms
    const needsConsent = !result.data?.user?.hasAcceptedTerms;

    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user: result.data?.user || null,
      authProfile: result.data?.profile || null,
      sessionExpiresAt: expiresAt,
      showSessionExpiredModal: false,
      showConsentModal: needsConsent,
    }));

    // Update localStorage for backward compatibility
    localStorage.setItem('lifeondialysis_auth', 'true');

    // Update profile in localStorage
    if (result.data?.user || result.data?.profile) {
      const storageData = localStorage.getItem('renalcare_data');
      const data = storageData ? JSON.parse(storageData) : {};
      data.profile = {
        ...data.profile,
        name: result.data.profile?.fullName || data.profile?.name || '',
        email: result.data.user?.email || email,
        isOnboarded: result.data.user?.onboardingCompleted || data.profile?.isOnboarded || false,
      };
      localStorage.setItem('renalcare_data', JSON.stringify(data));
    }

    // Fetch CSRF token for subsequent requests
    fetchCsrfToken().catch(err => console.warn('Failed to fetch CSRF token after login:', err));

    lastRefreshRef.current = Date.now();
  }, []);

  // Login with Google (session-based)
  const loginWithGoogle = useCallback(async (idToken: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/session/google`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.error?.message || result.message || 'Google authentication failed');
    }

    // Backend returns session.expiresAt as ISO string
    const expiresAt = result.data?.session?.expiresAt
      ? new Date(result.data.session.expiresAt).getTime()
      : (Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Check if user needs to accept terms
    const needsConsent = !result.data?.user?.hasAcceptedTerms;

    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user: result.data?.user || null,
      authProfile: result.data?.profile || null,
      sessionExpiresAt: expiresAt,
      showSessionExpiredModal: false,
      showConsentModal: needsConsent,
    }));

    // Update localStorage for backward compatibility
    localStorage.setItem('lifeondialysis_auth', 'true');

    // Update profile in localStorage
    if (result.data?.user || result.data?.profile) {
      const storageData = localStorage.getItem('renalcare_data');
      const data = storageData ? JSON.parse(storageData) : {};
      data.profile = {
        ...data.profile,
        name: result.data.profile?.fullName || data.profile?.name || '',
        email: result.data.user?.email || '',
        isOnboarded: result.data.user?.onboardingCompleted || data.profile?.isOnboarded || false,
      };
      localStorage.setItem('renalcare_data', JSON.stringify(data));
    }

    // Fetch CSRF token for subsequent requests
    fetchCsrfToken().catch(err => console.warn('Failed to fetch CSRF token after Google login:', err));

    lastRefreshRef.current = Date.now();
  }, []);

  // Register (JWT-based registration, then session login)
  const register = useCallback(async (email: string, password: string, fullName: string): Promise<void> => {
    // Step 1: Register with JWT endpoint
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName }),
    });

    const registerResult = await registerResponse.json();

    if (!registerResponse.ok || registerResult.success === false) {
      throw new Error(registerResult.error?.message || registerResult.message || 'Registration failed');
    }

    // Step 2: Login with session endpoint to get session cookie
    const loginResponse = await fetch(`${API_BASE_URL}/auth/session/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const loginResult = await loginResponse.json();

    if (!loginResponse.ok || loginResult.success === false) {
      // Registration succeeded but session login failed - try to proceed anyway
      console.warn('Session login after registration failed:', loginResult);
    }

    // Use session expiry from login result, or default to 30 days
    const expiresAt = loginResult.data?.session?.expiresAt
      ? new Date(loginResult.data.session.expiresAt).getTime()
      : (Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Use user data from registration result
    // New users always need to accept terms
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user: registerResult.data?.user || loginResult.data?.user || null,
      authProfile: registerResult.data?.profile || loginResult.data?.profile || null,
      sessionExpiresAt: expiresAt,
      showSessionExpiredModal: false,
      showConsentModal: true,
    }));

    // Update localStorage for backward compatibility
    localStorage.setItem('lifeondialysis_auth', 'true');

    // Update profile in localStorage
    const storageData = localStorage.getItem('renalcare_data');
    const data = storageData ? JSON.parse(storageData) : {};
    data.profile = {
      ...data.profile,
      name: fullName,
      email: email,
      isOnboarded: registerResult.data?.user?.onboardingCompleted || false,
    };
    localStorage.setItem('renalcare_data', JSON.stringify(data));

    // Fetch CSRF token for subsequent requests
    fetchCsrfToken().catch(err => console.warn('Failed to fetch CSRF token after registration:', err));

    lastRefreshRef.current = Date.now();
  }, []);

  // Logout (session-based)
  const logout = useCallback(async (): Promise<void> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include CSRF token for logout request
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      await fetch(`${API_BASE_URL}/auth/session/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        authProfile: null,
        sessionExpiresAt: null,
        showSessionExpiredModal: false,
      }));

      // Clear localStorage
      localStorage.removeItem('lifeondialysis_auth');
      localStorage.removeItem('renalcare_data');
      setCsrfToken(null);
    }
  }, []);

  // Update auth profile
  const updateAuthProfile = useCallback((profile: Partial<AuthProfile>) => {
    setState(prev => ({
      ...prev,
      authProfile: prev.authProfile ? { ...prev.authProfile, ...profile } : profile as AuthProfile,
    }));
  }, []);

  // Set user
  const setUser = useCallback((user: AuthUser | null) => {
    setState(prev => ({ ...prev, user }));
  }, []);

  // Set auth profile
  const setAuthProfile = useCallback((profile: AuthProfile | null) => {
    setState(prev => ({ ...prev, authProfile: profile }));
  }, []);

  // Accept terms and consent
  const acceptTerms = useCallback(async () => {
    await acceptTermsApi();
    // Update user state with accepted terms
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, hasAcceptedTerms: true } : null,
      showConsentModal: false,
    }));
  }, []);

  // Handle consent cancel - log user out
  const handleConsentCancel = useCallback(async () => {
    await logout();
  }, [logout]);

  // Initial session validation - only validate if user might be logged in
  useEffect(() => {
    if (hasValidatedRef.current) return;
    hasValidatedRef.current = true;

    // Only call validateSession if there's an indication the user might be logged in
    // This prevents unnecessary /auth/me calls on public pages like home/landing
    const hasAuthIndicator = localStorage.getItem('lifeondialysis_auth');
    if (hasAuthIndicator) {
      validateSession();
    } else {
      // No auth indicator, set loading to false immediately
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [validateSession]);

  // Activity detection
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [state.isAuthenticated, handleActivity]);

  // Session expiry check
  useEffect(() => {
    if (!state.isAuthenticated || !state.sessionExpiresAt) return;

    const checkExpiry = () => {
      const now = Date.now();
      const remaining = state.sessionExpiresAt! - now;

      if (remaining <= 0) {
        handleSessionExpired();
      }
    };

    expiryCheckIntervalRef.current = setInterval(checkExpiry, SESSION_CONFIG.CHECK_INTERVAL);

    return () => {
      if (expiryCheckIntervalRef.current) {
        clearInterval(expiryCheckIntervalRef.current);
      }
    };
  }, [state.isAuthenticated, state.sessionExpiresAt, handleSessionExpired]);

  // Listen for session-expired events from authFetch
  useEffect(() => {
    const handleSessionExpiredEvent = () => {
      handleSessionExpired();
    };

    window.addEventListener('auth:session-expired', handleSessionExpiredEvent);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpiredEvent);
    };
  }, [handleSessionExpired]);

  const value: AuthContextValue = {
    ...state,
    login,
    loginWithGoogle,
    register,
    logout,
    validateSession,
    extendSession,
    dismissSessionModal,
    updateAuthProfile,
    setUser,
    setAuthProfile,
    acceptTerms,
    hasAcceptedTerms: state.user?.hasAcceptedTerms ?? false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ConsentModal
        visible={state.showConsentModal}
        onAccept={acceptTerms}
        onCancel={handleConsentCancel}
      />
    </AuthContext.Provider>
  );
}

export default AuthContext;
