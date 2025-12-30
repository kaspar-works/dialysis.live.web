import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';
import Logo from '../components/Logo';

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

      // Update local profile in store
      const storageData = localStorage.getItem('renalcare_data');
      if (storageData) {
        const data = JSON.parse(storageData);
        if (data.profile) {
          setProfile({
            ...profile,
            name: data.profile.name || profile.name,
            email: data.profile.email || '',
            isOnboarded: data.profile.isOnboarded || profile.isOnboarded,
          });
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col lg:flex-row animate-in fade-in duration-700 transition-colors">
      {/* Visual Branding Side */}
      <div className="lg:w-1/2 bg-slate-900 p-12 lg:p-24 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>

        <Link to="/" className="relative z-10">
          <Logo className="w-14 h-14" />
          <span className="font-bold text-xl text-white tracking-tight mt-4 block">dialysis.live</span>
        </Link>

        <div className="relative z-10 space-y-6">
           <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.9]">
             Back to your <br/>
             <span className="text-sky-400">Treatment Hub.</span>
           </h2>
           <p className="text-white/50 text-xl font-medium max-w-md leading-relaxed">
             Securely access your clinical history and synchronize today's treatment events.
           </p>
        </div>

        <div className="relative z-10 text-white/30 text-xs font-black uppercase tracking-[0.2em]">
           2025 dialysis.live
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 p-12 lg:p-24 flex flex-col items-center justify-center relative">
        {/* Back Home Link */}
        <div className="absolute top-10 left-10 lg:left-24">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-xs uppercase tracking-widest group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md space-y-10">
           <div className="space-y-4 text-center lg:text-left">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Login</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Please enter your dialysis.live credentials.</p>
           </div>

           {/* Error Message */}
           {error && (
             <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="flex items-start gap-3">
                 <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                     <path d="M18 6L6 18M6 6l12 12" />
                   </svg>
                 </div>
                 <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
               </div>
             </div>
           )}

           <div className="space-y-6">
              {/* Google Sign-In Button - only show if no error */}
              {GOOGLE_CLIENT_ID && !googleError && (
                <div className="relative">
                  {isGoogleLoading && (
                    <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center z-10">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2"></div>
                      <span className="font-bold text-sm text-slate-600 dark:text-slate-300">Signing in...</span>
                    </div>
                  )}
                  {/* Custom styled Google button */}
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
                    className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {!googleLoaded ? 'Loading...' : 'Continue with Google'}
                  </button>
                </div>
              )}

              {GOOGLE_CLIENT_ID && !googleError && (
                <div className="relative py-2">
                   <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                   </div>
                   <div className="relative flex justify-center text-xs font-medium">
                      <span className="bg-white dark:bg-slate-950 px-4 text-slate-400">or sign in with email</span>
                   </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all outline-none"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Password</label>
                      <Link to="/forgot-password" className="text-xs font-bold text-sky-500 hover:text-sky-600 transition-colors">Forgot?</Link>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all outline-none"
                    placeholder="Min. 8 characters"
                    autoComplete="current-password"
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin"></div>
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </button>
              </form>
           </div>

           <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Don't have an account? <Link to="/register" className="text-sky-500 font-bold hover:text-sky-600 transition-colors">Sign Up</Link>
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
