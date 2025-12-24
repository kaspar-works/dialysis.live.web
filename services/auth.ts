
const API_BASE_URL = 'https://dialysis-live-api-gwm9j.ondigitalocean.app/api/v1';

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

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      clearAuthTokens();
      return null;
    }

    const result = await response.json();
    if (result.data?.tokens) {
      setAuthTokens(result.data.tokens);
      return result.data.tokens;
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuthTokens();
    return null;
  }
}

// Authenticated fetch with auto token refresh
export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  let token = getAuthToken();

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

  // If 401, try refreshing the token
  if (response.status === 401) {
    const newTokens = await refreshAccessToken();
    if (newTokens) {
      response = await makeRequest(newTokens.accessToken);
    } else {
      // Refresh failed, clear auth and redirect to login
      clearAuthTokens();
      window.location.href = '/#/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  return response.json();
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
