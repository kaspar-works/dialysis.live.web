
const API_BASE_URL = 'https://api.dialysis.live/api/v1';

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
  };
  message?: string;
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

// Token storage
export function setAuthTokens(tokens: AuthTokens) {
  localStorage.setItem('auth_token', tokens.accessToken);
  localStorage.setItem('refresh_token', tokens.refreshToken);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function clearAuthTokens() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Register with email/password
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'Registration failed');
    }

    // Store tokens if received
    if (result.data?.tokens) {
      setAuthTokens(result.data.tokens);
    }

    return result;
  } catch (error: any) {
    console.error('Register error:', error);
    throw error;
  }
}

// Login with email/password
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'Login failed');
    }

    // Store tokens if received
    if (result.data?.tokens) {
      setAuthTokens(result.data.tokens);
    }

    return result;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
}

// Google OAuth - send Google ID token to backend
export async function googleAuth(idToken: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idToken })
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'Google authentication failed');
    }

    // Store tokens if received
    if (result.data?.tokens) {
      setAuthTokens(result.data.tokens);
    }

    return result;
  } catch (error: any) {
    console.error('Google auth error:', error);
    throw error;
  }
}

// Logout - call backend and clear local data
export async function logoutApi(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
    }
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Always clear local tokens and auth state
    clearAuthTokens();
    localStorage.removeItem('renalcare_data');
    localStorage.removeItem('lifeondialysis_auth');
  }
}

// Legacy logout function for compatibility
export function logout() {
  clearAuthTokens();
  localStorage.removeItem('renalcare_data');
  localStorage.removeItem('lifeondialysis_auth');
  window.location.href = '/#/logout';
}

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.log('No refresh token available');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    const result = await response.json();

    if (result.success === false || !response.ok) {
      console.log('Refresh failed:', result.message);
      return null;
    }

    const tokens = result.data?.tokens || result.tokens || result.data;
    if (tokens?.accessToken && tokens?.refreshToken) {
      setAuthTokens(tokens);
      return tokens;
    }

    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Get current user from /auth/me
export async function getMe(): Promise<AuthResponse> {
  return authFetch('/auth/me');
}

// Check if error indicates invalid/expired token
function isTokenError(message?: string): boolean {
  if (!message) return false;
  const lowerMsg = message.toLowerCase();
  return lowerMsg.includes('invalid') && lowerMsg.includes('token') ||
         lowerMsg.includes('expired') && lowerMsg.includes('token') ||
         lowerMsg.includes('unauthorized') ||
         lowerMsg.includes('jwt');
}

// Handle auth failure - clear tokens and redirect
function handleAuthFailure(): never {
  clearAuthTokens();
  localStorage.removeItem('renalcare_data');
  localStorage.removeItem('lifeondialysis_auth');
  window.location.href = '/#/logout';
  throw new Error('Session expired. Please login again.');
}

// Authenticated fetch with auto token refresh
export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  let token = getAuthToken();

  if (!token) {
    handleAuthFailure();
  }

  const makeRequest = async (authToken: string | null) => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
  };

  let response = await makeRequest(token);

  // If 401 or 403, try refreshing the token
  if (response.status === 401 || response.status === 403) {
    const newTokens = await refreshAccessToken();
    if (newTokens) {
      response = await makeRequest(newTokens.accessToken);
    } else {
      handleAuthFailure();
    }
  }

  let result: any;
  try {
    result = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return {};
  }

  // Check for token errors in response body
  if (result.success === false && isTokenError(result.message)) {
    const newTokens = await refreshAccessToken();
    if (newTokens) {
      const retryResponse = await makeRequest(newTokens.accessToken);
      try {
        const retryResult = await retryResponse.json();
        if (retryResult.success === false && isTokenError(retryResult.message)) {
          handleAuthFailure();
        }
        if (!retryResponse.ok && retryResult.success === false) {
          throw new Error(retryResult.message || `Request failed: ${retryResponse.status}`);
        }
        return retryResult;
      } catch (e) {
        if (!retryResponse.ok) {
          throw new Error(`Request failed: ${retryResponse.status}`);
        }
        throw e;
      }
    } else {
      handleAuthFailure();
    }
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed: ${response.status}`);
  }

  return result;
}
