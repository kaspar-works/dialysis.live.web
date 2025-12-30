import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

const SessionExpiredModal: React.FC = () => {
  const { showSessionExpiredModal, dismissSessionModal } = useAuth();
  const navigate = useNavigate();

  if (!showSessionExpiredModal) return null;

  const handleSignIn = () => {
    dismissSessionModal();
    navigate('/login');
  };

  const handleGoHome = () => {
    dismissSessionModal();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" />

      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-4xl overflow-hidden relative z-10 border border-white/5 transition-all animate-in zoom-in-95 duration-500">
        <div className="p-8 sm:p-12 flex flex-col items-center text-center relative overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

          {/* Logo */}
          <div className="mb-6 relative z-10">
            <Logo className="w-10 h-10 opacity-50" />
          </div>

          {/* Warning Icon */}
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center shadow-inner border border-amber-100 dark:border-amber-500/20 mb-8 relative z-10">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          {/* Title and Message */}
          <div className="space-y-4 mb-10 relative z-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Session Expired
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed max-w-xs mx-auto">
              Your session has ended for your security. Please sign in again to continue using dialysis.live.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 w-full relative z-10">
            <button
              onClick={handleSignIn}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-[0.98] shadow-lg"
            >
              Sign In Again
            </button>
            <button
              onClick={handleGoHome}
              className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
            >
              Go to Homepage
            </button>
          </div>

          {/* Security note */}
          <p className="mt-8 text-xs text-slate-400 dark:text-slate-600 font-medium relative z-10">
            Sessions expire after 30 minutes of inactivity
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
