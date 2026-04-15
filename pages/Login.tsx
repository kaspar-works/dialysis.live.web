import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';
import SEO from '../components/SEO';
import { THEME, ensureWellnessFont, WELLNESS_FONT_FAMILY } from '../theme';

// Google Client ID from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initCodeClient: (config: any) => any;
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [googleError, setGoogleError] = useState(false);

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Validation functions
  const validateEmail = (value: string): string => {
    if (!value || value.trim() === '') return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!value || value.trim() === '') return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  // Handle field change with validation
  const handleFieldChange = (field: string, value: string) => {
    if (field === 'email') setEmail(value);
    else if (field === 'password') setPassword(value);

    if (touchedFields[field]) {
      let error = '';
      switch (field) {
        case 'email': error = validateEmail(value); break;
        case 'password': error = validatePassword(value); break;
      }
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Handle field blur
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    let error = '';
    switch (field) {
      case 'email': error = validateEmail(email); break;
      case 'password': error = validatePassword(password); break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  // Check if form has errors
  const hasFormErrors = Object.values(fieldErrors).some(error => error !== '');

  const { login: authLogin, loginWithGoogle } = useAuth();
  const { setProfile, profile } = useStore();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Load Google Sign-In script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured');
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      setGoogleLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Initialize Google Sign-In when script is loaded
  useEffect(() => {
    if (!googleLoaded || !window.google || !GOOGLE_CLIENT_ID) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        ux_mode: 'popup',
        use_fedcm_for_prompt: false,
      });
    } catch (err) {
      console.error('Google Sign-In initialization failed:', err);
      setGoogleError(true);
    }
  }, [googleLoaded]);

  const handleGoogleCallback = async (response: any) => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const idToken = response.credential;
      if (!idToken) {
        throw new Error('No credential received from Google');
      }

      await loginWithGoogle(idToken);

      // Update local profile in store using functional update to avoid stale closure
      const storageData = localStorage.getItem('renalcare_data');
      if (storageData) {
        const data = JSON.parse(storageData);
        if (data.profile) {
          setProfile(prev => ({
            ...prev,
            name: data.profile.name || prev.name,
            email: data.profile.email || prev.email || '',
            isOnboarded: data.profile.isOnboarded || prev.isOnboarded,
          }));
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched
    setTouchedFields({ email: true, password: true });

    // Validate all fields
    const newErrors: Record<string, string> = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(newErrors);

    // Check for validation errors
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    setIsLoading(true);

    try {
      await authLogin(email, password);

      // Update local profile in store
      const storageData = localStorage.getItem('renalcare_data');
      if (storageData) {
        const data = JSON.parse(storageData);
        if (data.profile) {
          setProfile({
            ...profile,
            name: data.profile.name || profile.name,
            email: data.profile.email || email,
            isOnboarded: data.profile.isOnboarded || profile.isOnboarded,
          });
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message?.includes('Invalid credentials') || err.message?.includes('not found')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    ensureWellnessFont();
  }, []);

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    backgroundColor: hasError ? THEME.peach : THEME.card,
    border: `1.5px solid ${hasError ? THEME.peachInk : THEME.border}`,
    color: THEME.ink,
    fontFamily: WELLNESS_FONT_FAMILY,
  });

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row"
      style={{
        backgroundColor: THEME.bg,
        color: THEME.ink,
        fontFamily: WELLNESS_FONT_FAMILY,
      }}
    >
      <SEO
        title="Sign in — dialysis.live"
        description="Sign in to your dialysis.live account to track sessions, monitor vitals, and manage your renal health."
      />

      {/* Branding Side — wellness gradient */}
      <div
        className="hidden lg:flex lg:w-1/2 p-12 lg:p-20 flex-col justify-between relative overflow-hidden"
        style={{ background: THEME.calmGradient }}
      >
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
          style={{ background: THEME.teal }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-24 w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
          style={{ background: THEME.green }}
        />

        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <span
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: THEME.heroGradient }}
            aria-hidden
          >
            d
          </span>
          <span className="text-xl font-bold tracking-tight" style={{ color: THEME.ink }}>
            dialysis.live
          </span>
        </Link>

        <div className="relative z-10 space-y-6">
          <h2
            className="font-bold tracking-tight"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: THEME.ink,
            }}
          >
            Welcome back to your{' '}
            <span
              style={{
                background: THEME.heroGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              care space.
            </span>
          </h2>
          <p className="text-lg leading-relaxed max-w-md" style={{ color: THEME.muted }}>
            Securely access your history and sync today's treatment events.
          </p>

          {/* Small trust tile */}
          <div
            className="inline-flex items-center gap-3 p-4 rounded-2xl"
            style={{
              backgroundColor: THEME.card,
              border: `1px solid ${THEME.border}`,
              boxShadow: `0 4px 16px -8px ${THEME.tealDark}1a`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${THEME.mintInk}e6, ${THEME.mintInk})` }}
            >
              🔒
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: THEME.ink }}>
                HIPAA-aware · 256-bit encryption
              </div>
              <div className="text-xs" style={{ color: THEME.muted }}>
                Your data is never sold or shared.
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative z-10 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: THEME.muted }}
        >
          {new Date().getFullYear()} · dialysis.live
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 p-6 sm:p-8 md:p-12 lg:p-20 flex flex-col items-center justify-center relative">
        <div className="absolute top-6 sm:top-10 left-4 sm:left-10 lg:left-20">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold group transition-colors"
            style={{ color: THEME.muted }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="group-hover:-translate-x-1 transition-transform"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 mt-16 lg:mt-0">
          <div className="space-y-3">
            <h1
              className="font-bold tracking-tight"
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                letterSpacing: '-0.015em',
                color: THEME.ink,
              }}
            >
              Sign in
            </h1>
            <p style={{ color: THEME.muted }}>
              Please enter your dialysis.live credentials.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="p-4 rounded-2xl flex items-start gap-3"
              style={{
                backgroundColor: THEME.peach,
                border: `1px solid ${THEME.peachInk}44`,
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ backgroundColor: THEME.peachInk }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: THEME.peachInk }}>
                {error}
              </p>
            </div>
          )}

          <div className="space-y-5">
            {/* Google Sign-In */}
            {GOOGLE_CLIENT_ID && !googleError && (
              <div className="relative">
                {isGoogleLoading && (
                  <div
                    className="absolute inset-0 rounded-2xl flex items-center justify-center z-10"
                    style={{ backgroundColor: THEME.card }}
                  >
                    <div
                      className="w-5 h-5 rounded-full animate-spin mr-2"
                      style={{ border: `2px solid ${THEME.border}`, borderTopColor: THEME.teal }}
                    />
                    <span className="font-bold text-sm" style={{ color: THEME.muted }}>
                      Signing in…
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (window.google?.accounts?.id) {
                      try {
                        window.google.accounts.id.prompt();
                      } catch (err) {
                        console.error('Google prompt error:', err);
                        setGoogleError(true);
                      }
                    }
                  }}
                  disabled={!googleLoaded || isGoogleLoading}
                  className="w-full py-3.5 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  style={{
                    backgroundColor: THEME.card,
                    border: `1.5px solid ${THEME.border}`,
                    color: THEME.ink,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {!googleLoaded ? 'Loading…' : 'Continue with Google'}
                </button>
              </div>
            )}

            {GOOGLE_CLIENT_ID && !googleError && (
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: `1px solid ${THEME.border}` }} />
                </div>
                <div className="relative flex justify-center text-xs font-medium">
                  <span
                    className="px-4"
                    style={{ backgroundColor: THEME.bg, color: THEME.muted }}
                  >
                    or sign in with email
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold ml-1" style={{ color: THEME.muted }}>
                  Email address <span style={{ color: THEME.peachInk }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  className="w-full rounded-xl px-4 py-3.5 font-medium transition-all outline-none focus:ring-2"
                  style={{
                    ...inputStyle(!!(fieldErrors.email && touchedFields.email)),
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = THEME.teal;
                    (e.target as HTMLInputElement).style.boxShadow = `0 0 0 3px ${THEME.teal}33`;
                  }}
                  onBlurCapture={(e) => {
                    (e.target as HTMLInputElement).style.boxShadow = '';
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading || isGoogleLoading}
                />
                {fieldErrors.email && touchedFields.email && (
                  <p className="text-xs ml-1" style={{ color: THEME.peachInk }}>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold ml-1" style={{ color: THEME.muted }}>
                    Password <span style={{ color: THEME.peachInk }}>*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold transition-opacity hover:opacity-70"
                    style={{ color: THEME.tealDark }}
                  >
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={() => handleFieldBlur('password')}
                  className="w-full rounded-xl px-4 py-3.5 font-medium transition-all outline-none"
                  style={{
                    ...inputStyle(!!(fieldErrors.password && touchedFields.password)),
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = THEME.teal;
                    (e.target as HTMLInputElement).style.boxShadow = `0 0 0 3px ${THEME.teal}33`;
                  }}
                  onBlurCapture={(e) => {
                    (e.target as HTMLInputElement).style.boxShadow = '';
                  }}
                  placeholder="Min. 8 characters"
                  autoComplete="current-password"
                  disabled={isLoading || isGoogleLoading}
                />
                {fieldErrors.password && touchedFields.password && (
                  <p className="text-xs ml-1" style={{ color: THEME.peachInk }}>
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading || hasFormErrors}
                className="w-full py-4 rounded-full font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: THEME.heroGradient,
                  boxShadow: `0 8px 24px -8px ${THEME.teal}80`,
                }}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in →'
                )}
              </button>
            </form>
          </div>

          <div className="text-center">
            <p className="text-sm" style={{ color: THEME.muted }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold transition-opacity hover:opacity-70"
                style={{ color: THEME.tealDark }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
