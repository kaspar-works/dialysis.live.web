import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';
import Logo from '../components/Logo';

const Logout: React.FC = () => {
  const { logout: authLogout } = useAuth();
  const { profile } = useStore();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Capture the user's name before logout clears everything
    setUserName(profile.name || '');

    const performLogout = async () => {
      try {
        // Call AuthContext logout which handles API call and state cleanup
        await authLogout();
      } catch (err) {
        console.error('Logout error:', err);
      }

      // Short delay for animation
      setTimeout(() => {
        setIsLoggingOut(false);
        setIsComplete(true);
      }, 1500);
    };

    performLogout();
  }, [authLogout, profile.name]);

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6 transition-colors">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-50 dark:bg-sky-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-50 dark:bg-pink-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center animate-in fade-in duration-700">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo className="w-16 h-16" />
        </div>

        {isLoggingOut ? (
          /* Logging out state */
          <div className="space-y-6">
            <div className="w-16 h-16 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto" />
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Signing Out...</h1>
              <p className="text-slate-400">Securely ending your session</p>
            </div>
          </div>
        ) : isComplete ? (
          /* Complete state */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Success icon */}
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Message */}
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
                You're Signed Out
              </h1>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {userName ? (
                  <>Thanks for using dialysis.live, <span className="font-bold text-slate-700 dark:text-slate-300">{userName}</span>.</>
                ) : (
                  <>Thanks for using dialysis.live.</>
                )}
                <br />Your session has been securely ended.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSignIn}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-sky-600 dark:hover:bg-sky-400 transition-all active:scale-[0.98]"
              >
                Sign In Again
              </button>
              <button
                onClick={handleGoHome}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                Go to Homepage
              </button>
            </div>

            {/* Info */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400">
                For your security, please close this browser tab if you're on a shared device.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Logout;
