
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
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    profile: any;
    tokens: AuthTokens;
    isNewUser: boolean;
  };
  message?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
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

// Logout - clear all auth data and redirect
export function logout() {
  clearAuthTokens();
  localStorage.removeItem('dialysis_profile');
  window.location.href = '/#/login';
}

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.log('No refresh token available');
    return null;
  }

  console.log('Attempting token refresh...');

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    const result = await response.json();
    console.log('Refresh response:', result.success, result.message);

    // Check for success in response body (API might return 200 with success: false)
    if (result.success === false) {
      console.log('Refresh failed:', result.message);
      return null;
    }

    if (!response.ok) {
      console.log('Refresh HTTP error:', response.status);
      return null;
    }

    // Handle different response structures
    const tokens = result.data?.tokens || result.tokens || result.data;
    if (tokens?.accessToken && tokens?.refreshToken) {
      console.log('Token refresh successful');
      setAuthTokens(tokens);
      return tokens;
    }

    console.log('No tokens in refresh response');
    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
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
  // Clear any stored profile data
  localStorage.removeItem('dialysis_profile');
  window.location.href = '/#/login';
  throw new Error('Session expired. Please login again.');
}

// Authenticated fetch with auto token refresh
export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  let token = getAuthToken();

  // If no token, redirect to login immediately
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

  // Check for token errors in response body (some APIs return 200 with success: false)
  if (result.success === false && isTokenError(result.message)) {
    // Try to refresh token
    const newTokens = await refreshAccessToken();
    if (newTokens) {
      // Retry the request with new token
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

  // Handle other errors
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed: ${response.status}`);
  }

  return result;
}

// Firebase Auth - handles both Google and Email/Password sign-in
// Client authenticates with Firebase, then sends the ID token to this endpoint
export async function firebaseAuth(idToken: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/firebase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    const result = await response.json();

    // Store tokens if received
    if (result.data?.tokens) {
      setAuthTokens(result.data.tokens);
    }

    return result;
  } catch (error) {
    console.error('Firebase auth error:', error);
    throw error;
  }
}

// Firebase Register with Email/Password
// Creates user in Firebase first, then links to our database
export async function firebaseRegister(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/firebase/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const result = await response.json();

    // Store tokens if received
    if (result.data?.tokens) {
      setAuthTokens(result.data.tokens);
    }

    return result;
  } catch (error) {
    console.error('Firebase register error:', error);
    throw error;
  }
}
