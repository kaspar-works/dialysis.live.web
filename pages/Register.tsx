import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import Logo from '../components/Logo';
import { register as apiRegister, googleAuth } from '../services/auth';

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

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const { login, setProfile, profile } = useStore();
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

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
      ux_mode: 'popup',
      use_fedcm_for_prompt: false, // Disable FedCM to avoid issues
    });

    // Render the hidden Google button
    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 400,
      });
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

      const authResult = await googleAuth(idToken);

      if (authResult.data) {
        const updatedProfile = {
          ...profile,
          name: authResult.data.profile?.fullName || profile.name,
          email: authResult.data.user?.email || '',
          isOnboarded: authResult.data.user?.onboardingCompleted || profile.isOnboarded,
        };

        const storageData = localStorage.getItem('renalcare_data');
        const data = storageData ? JSON.parse(storageData) : {};
        data.profile = { ...data.profile, ...updatedProfile };
        localStorage.setItem('renalcare_data', JSON.stringify(data));

        setProfile(updatedProfile);
        login();
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Google registration error:', err);
      setError(err.message || 'Google sign-up failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsLoading(false);
      return;
    }

    try {
      const authResult = await apiRegister({
        email,
        password,
        fullName: name,
      });

      if (authResult.data) {
        const updatedProfile = {
          ...profile,
          name: authResult.data.profile?.fullName || name || profile.name,
          email: authResult.data.user?.email || email,
          isOnboarded: authResult.data.user?.onboardingCompleted || false,
        };

        const storageData = localStorage.getItem('renalcare_data');
        const data = storageData ? JSON.parse(storageData) : {};
        data.profile = { ...data.profile, ...updatedProfile };
        localStorage.setItem('renalcare_data', JSON.stringify(data));

        setProfile(updatedProfile);
        login();
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('already') || err.message?.includes('exists')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.message?.includes('password')) {
        setError('Password must be at least 8 characters.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col lg:flex-row animate-in fade-in duration-700 transition-colors">
      {/* Form Side */}
      <div className="flex-1 p-12 lg:p-24 flex items-center justify-center order-2 lg:order-1 relative">
        {/* Back Home Link */}
        <div className="absolute top-10 left-10 lg:left-24">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-xs uppercase tracking-widest group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8">
           <div className="space-y-3">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Create Account</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Start tracking your dialysis journey today.</p>
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
              {/* Google Sign-In Button Container */}
              {GOOGLE_CLIENT_ID && (
                <div className="relative">
                  {isGoogleLoading && (
                    <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center z-10">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2"></div>
                      <span className="font-bold text-sm text-slate-600 dark:text-slate-300">Creating account...</span>
                    </div>
                  )}
                  <div
                    ref={googleButtonRef}
                    className="flex justify-center [&>div]:w-full [&_iframe]:!w-full"
                  />
                  {!googleLoaded && (
                    <div className="w-full py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                      <span className="text-sm text-slate-400">Loading Google Sign-In...</span>
                    </div>
                  )}
                </div>
              )}

              {GOOGLE_CLIENT_ID && (
                <div className="relative py-2">
                   <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                   </div>
                   <div className="relative flex justify-center text-xs font-medium">
                      <span className="bg-white dark:bg-slate-950 px-4 text-slate-400">or register with email</span>
                   </div>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Full Name</label>
                   <input
                     type="text"
                     value={name}
                     onChange={e => setName(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all outline-none"
                     placeholder="Alex Johnson"
                     required
                     disabled={isLoading || isGoogleLoading}
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                   <input
                     type="email"
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all outline-none"
                     placeholder="you@example.com"
                     required
                     disabled={isLoading || isGoogleLoading}
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Password</label>
                   <input
                     type="password"
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all outline-none"
                     placeholder="Min. 8 characters"
                     required
                     disabled={isLoading || isGoogleLoading}
                   />
                </div>

                <div className="p-4 bg-sky-50 dark:bg-sky-500/10 rounded-xl border border-sky-100 dark:border-sky-500/20">
                   <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                     By registering, you acknowledge that dialysis.live is a tracking tool and does not provide medical advice.
                   </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin"></div>
                      Creating account...
                    </>
                  ) : 'Create Account'}
                </button>
              </form>
           </div>

           <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Already have an account? <Link to="/login" className="text-sky-500 font-bold hover:text-sky-600 transition-colors">Sign In</Link>
              </p>
           </div>
        </div>
      </div>

      {/* Visual Side */}
      <div className="lg:w-1/2 bg-slate-900 p-12 lg:p-24 flex flex-col justify-between relative overflow-hidden order-1 lg:order-2">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2"></div>

        <Link to="/" className="relative z-10">
          <Logo className="w-14 h-14" />
          <span className="font-bold text-xl text-white tracking-tight mt-4 block">dialysis.live</span>
        </Link>

        <div className="relative z-10 space-y-6">
           <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.9]">
             Take control of <br/>
             <span className="text-sky-400">your health.</span>
           </h2>
           <p className="text-white/50 text-xl font-medium max-w-md leading-relaxed">
             Track treatments, monitor vitals, and stay connected with your care team.
           </p>
        </div>

        <div className="relative z-10 text-white/30 text-xs font-black uppercase tracking-[0.2em]">
           2025 dialysis.live
        </div>
      </div>
    </div>
  );
};

export default Register;
