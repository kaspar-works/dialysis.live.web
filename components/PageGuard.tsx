import React from 'react';
import { useLocation, Link } from 'react-router';
import { usePageSettings } from '../contexts/PageSettingsContext';

interface PageGuardProps {
  children: React.ReactNode;
}

const PageGuard: React.FC<PageGuardProps> = ({ children }) => {
  const location = useLocation();
  const { isPageEnabled, isLoading } = usePageSettings();

  // Show loading while fetching settings
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto" />
          <p className="text-white/50 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if current page is enabled
  const currentPath = location.pathname;
  if (!isPageEnabled(currentPath)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Page Unavailable</h1>
          <p className="text-slate-400">
            This page is currently unavailable. Please check back later or contact support if you believe this is an error.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PageGuard;
