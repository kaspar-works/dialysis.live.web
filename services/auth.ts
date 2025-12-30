
// Use relative URL in development (for Vite proxy), full URL in production
const API_BASE_URL = import.meta.env.DEV ? '/api/v1' : 'https://api.dialysis.live/api/v1';

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

export function setCsrfToken(token: string | null) {
  _csrfToken = token;
}

export function getCsrfToken(): string | null {
  return _csrfToken;
}

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

    return result;
  } catch (error: any) {
    console.error('Google auth error:', error);
    throw error;
  }
}

// Logout - call backend and clear local data (session-based)
export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/session/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
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

// Check if HTTP status indicates auth failure
function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}

// Handle auth failure - dispatch event and throw
function handleAuthFailure(): never {
  // Dispatch event for AuthContext to handle
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
  throw new Error('Session expired. Please login again.');
}

// Authenticated fetch with cookie credentials
export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  // Handle auth errors
  if (isAuthError(response.status)) {
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

  // Check for auth errors in response body
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
    throw new Error(result.error?.message || result.message || `Request failed: ${response.status}`);
  }

  return result;
}
