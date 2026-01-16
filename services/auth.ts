// Use relative URL in development (for Vite proxy), full URL in production
const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : `${import.meta.env.VITE_API_URL || 'https://api.dialysis.live'}/api/v1`;

// Public API fetch (no authentication required)
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response.json();
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

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

export interface AcceptTermsResponse {
  success: boolean;
  data: {
    hasAcceptedTerms: boolean;
    termsAcceptedAt: string;
    termsVersion: string;
  };
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

export interface AuthSettings {
  dailyFluidLimitMl?: number;
  dryWeightKg?: number;
  dialysisType?: string;
  timezone?: string;
  language?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    profile: AuthProfile | null;
    settings?: AuthSettings | null;
    tokens?: AuthTokens;
    isNewUser?: boolean;
    expiresAt?: number;
  };
  message?: string;
  csrfToken?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// CSRF Token Management
let _csrfToken: string | null = null;
let _csrfTokenPromise: Promise<string | null> | null = null;

export function setCsrfToken(token: string | null) {
  _csrfToken = token;
}

export function getCsrfToken(): string | null {
  return _csrfToken;
}

// Fetch CSRF token from backend
export async function fetchCsrfToken(): Promise<string | null> {
  // If we're already fetching, return the existing promise
  if (_csrfTokenPromise) {
    return _csrfTokenPromise;
  }

  _csrfTokenPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.csrfToken) {
          _csrfToken = result.data.csrfToken;
          return _csrfToken;
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
      return null;
    } finally {
      _csrfTokenPromise = null;
    }
  })();

  return _csrfTokenPromise;
}

// Ensure we have a CSRF token before making state-changing requests
export async function ensureCsrfToken(): Promise<string | null> {
  if (_csrfToken) {
    return _csrfToken;
  }
  return fetchCsrfToken();
}

// Methods that require CSRF token
const CSRF_REQUIRED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Check if user is authenticated (based on localStorage flag for quick check)
export function isAuthenticated(): boolean {
  return localStorage.getItem('lifeondialysis_auth') === 'true';
}

// Register with email/password (uses JWT-based registration, then creates session)
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    // Note: Backend doesn't have session-based register, use JWT register
    // The session will be created via session/login after registration
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.error?.message || result.message || 'Registration failed');
    }

    return result;
  } catch (error: any) {
    console.error('Register error:', error);
    throw error;
  }
}

// Login with email/password (session-based)
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/session/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.error?.message || result.message || 'Login failed');
    }

    // Fetch CSRF token after successful login for subsequent requests
    fetchCsrfToken().catch(err => console.warn('Failed to fetch CSRF token after login:', err));

    return result;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
}

// Google OAuth - send Google ID token to backend (session-based)
export async function googleAuth(idToken: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/session/google`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idToken })
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.error?.message || result.message || 'Google authentication failed');
    }

    // Fetch CSRF token after successful login for subsequent requests
    fetchCsrfToken().catch(err => console.warn('Failed to fetch CSRF token after Google auth:', err));

    return result;
  } catch (error: any) {
    console.error('Google auth error:', error);
    throw error;
  }
}

// Logout - call backend and clear local data (session-based)
export async function logoutApi(): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Include CSRF token for logout request
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    await fetch(`${API_BASE_URL}/auth/session/logout`, {
      method: 'POST',
      credentials: 'include',
      headers
    });
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Always clear local auth state
    localStorage.removeItem('renalcare_data');
    localStorage.removeItem('lifeondialysis_auth');
    setCsrfToken(null);
  }
}

// Legacy logout function for compatibility
export function logout() {
  localStorage.removeItem('renalcare_data');
  localStorage.removeItem('lifeondialysis_auth');
  setCsrfToken(null);
  window.location.href = '/#/logout';
}

// Get current user from /auth/me (works with both JWT and session auth)
export async function getMe(): Promise<AuthResponse> {
  return authFetch('/auth/me');
}

// Validate session and get user info (use /auth/me which supports session auth)
export async function validateSession(): Promise<AuthResponse> {
  return authFetch('/auth/me');
}

// Extend/refresh session on activity
export async function extendSession(): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/session/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to refresh session');
  }

  return result;
}

// Check if error is a subscription limit error
function isSubscriptionError(result: any): boolean {
  const code = result?.error?.code || '';
  return code.startsWith('SUB_');
}

// Check if error is a feature restriction error (requires plan upgrade)
function isFeatureRestrictedError(result: any): boolean {
  const code = result?.error?.code || '';
  return code.startsWith('RES_');
}

// Handle auth failure - dispatch event and throw
function handleAuthFailure(): never {
  // Dispatch event for AuthContext to handle
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
  throw new Error('Session expired. Please login again.');
}

// Custom error class for subscription limit errors
export class SubscriptionLimitError extends Error {
  code: string;
  resource?: string;
  current?: number;
  limit?: number;
  upgradeRequired?: boolean;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'SubscriptionLimitError';
    this.code = details?.code || 'SUB_002';
    this.resource = details?.resource;
    this.current = details?.current;
    this.limit = details?.limit;
    this.upgradeRequired = details?.upgradeRequired;
  }
}

// Custom error class for feature restriction errors (requires plan upgrade)
export class FeatureRestrictedError extends Error {
  code: string;
  feature?: string;
  requiredPlan?: string;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'FeatureRestrictedError';
    this.code = details?.code || 'RES_003';
    this.feature = details?.feature;
    this.requiredPlan = details?.requiredPlan;
  }
}

// Accept terms and consent
export async function acceptTerms(version: string = '1.0'): Promise<AcceptTermsResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/accept-terms`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ version })
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to accept terms');
  }

  return result;
}

// Delete account permanently
export async function deleteAccount(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/account`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.error?.message || result.message || 'Failed to delete account');
    }

    // Clear all local auth state
    localStorage.removeItem('renalcare_data');
    localStorage.removeItem('lifeondialysis_auth');
    setCsrfToken(null);
  } catch (error: any) {
    console.error('Delete account error:', error);
    throw error;
  }
}

// =====================
// Change Password
// =====================

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(data: ChangePasswordData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to change password');
  }
}

// =====================
// Email Verification
// =====================

export interface EmailVerificationStatus {
  emailVerified: boolean;
  emailVerifiedAt?: string;
}

export async function sendVerificationEmail(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/send-verification-email`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to send verification email');
  }
}

export async function verifyEmail(token: string): Promise<{ emailVerified: boolean }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to verify email');
  }

  return result.data;
}

export async function getEmailVerificationStatus(): Promise<EmailVerificationStatus> {
  const response = await fetch(`${API_BASE_URL}/auth/email-verification-status`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to get verification status');
  }

  return result.data;
}

// =====================
// Two-Factor Authentication
// =====================

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  isEnabled: boolean;
  backupCodesRemaining: number;
}

export async function setupTwoFactor(): Promise<TwoFactorSetupResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/setup`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to setup 2FA');
  }

  return result.data;
}

export async function verifyAndEnableTwoFactor(token: string): Promise<{ enabled: boolean }> {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to verify 2FA code');
  }

  return result.data;
}

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/status`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to get 2FA status');
  }

  return result.data;
}

export async function disableTwoFactor(token: string): Promise<{ enabled: boolean }> {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/disable`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to disable 2FA');
  }

  return result.data;
}

export async function regenerateBackupCodes(token: string): Promise<{ backupCodes: string[] }> {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/backup-codes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to regenerate backup codes');
  }

  return result.data;
}

// =====================
// Forgot Password
// =====================

export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to send reset email');
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token, password })
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Failed to reset password');
  }
}

// =====================
// Utility Functions
// =====================

// Authenticated fetch with cookie credentials and CSRF protection
export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const method = (options.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add CSRF token for state-changing requests
  if (CSRF_REQUIRED_METHODS.includes(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  // Only 401 is an immediate auth error (not 403, which could be subscription limit)
  if (response.status === 401) {
    handleAuthFailure();
  }

  // Parse response
  let result: any;
  try {
    result = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return {};
  }

  // Handle subscription limit errors (403 with SUB_ code)
  if (response.status === 403 && isSubscriptionError(result)) {
    throw new SubscriptionLimitError(
      result.error?.message || 'You have reached your plan limit',
      result.error?.details || { code: result.error?.code }
    );
  }

  // Handle feature restriction errors (403 with RES_ code - requires plan upgrade)
  if (response.status === 403 && isFeatureRestrictedError(result)) {
    throw new FeatureRestrictedError(
      result.error?.message || 'This feature requires a plan upgrade',
      result.error?.details || { code: result.error?.code }
    );
  }

  // Check for auth errors in response body (403 without subscription code)
  if (result.success === false) {
    const msg = (result.error?.message || result.message || '').toLowerCase();
    if (
      msg.includes('session') && (msg.includes('expired') || msg.includes('invalid')) ||
      msg.includes('unauthorized') ||
      msg.includes('not authenticated') ||
      msg.includes('authentication required') ||
      msg.includes('no authentication')
    ) {
      handleAuthFailure();
    }
  }

  if (!response.ok || result.success === false) {
    const error: any = new Error(result.error?.message || result.message || `Request failed: ${response.status}`);
    // Include validation errors if present
    if (result.error?.errors || result.errors) {
      error.errors = result.error?.errors || result.errors;
    }
    throw error;
  }

  return result;
}
