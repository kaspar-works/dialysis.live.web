import React, { useState, useEffect } from 'react';

const Alerts: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 font-medium">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.hash = '/dashboard'}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Alerts</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              View all your health alerts
            </p>
          </div>
        </div>
      </div>

      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No alerts found</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
          All caught up! Check back later.
        </p>
      </div>
    </div>
  );
};

export default Alerts;
