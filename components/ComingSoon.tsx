import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { isUnderConstruction, getPageConfig, PageConfig } from '../config/underConstruction';

interface ComingSoonProps {
  page: string;
  children: React.ReactNode;
  // Override config props (optional)
  title?: string;
  message?: string;
  progress?: number;
  expectedDate?: string;
  mode?: 'coming-soon' | 'maintenance';
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  page,
  children,
  title: propTitle,
  message: propMessage,
  progress: propProgress,
  expectedDate: propExpectedDate,
  mode: propMode,
}) => {
  if (!isUnderConstruction(page)) {
    return <>{children}</>;
  }

  // Get config and merge with prop overrides
  const config = getPageConfig(page);
  const title = propTitle || config.title;
  const message = propMessage || config.message;
  const progress = propProgress ?? config.progress ?? 35;
  const expectedDate = propExpectedDate || config.expectedDate;
  const mode = propMode || config.mode || 'coming-soon';
  const isMaintenanceMode = mode === 'maintenance';

  return (
    <div
      className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-6 relative overflow-hidden"
      role="main"
      aria-labelledby="construction-title"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className={`absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] ${
          isMaintenanceMode ? 'bg-amber-900/20' : 'bg-sky-900/20'
        } rounded-full blur-[120px]`} />
        <div className={`absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] ${
          isMaintenanceMode ? 'bg-orange-900/15' : 'bg-pink-900/15'
        } rounded-full blur-[100px]`} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 max-w-lg">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-3 group" aria-label="Go to homepage">
          <Logo className="w-12 h-12" />
          <span className="font-black text-2xl tracking-tighter text-white">dialysis.live</span>
        </Link>

        {/* Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 ${
          isMaintenanceMode
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-sky-500/10 border-sky-500/20'
        } border rounded-full`}>
          <div className={`w-2 h-2 rounded-full ${
            isMaintenanceMode ? 'bg-amber-400' : 'bg-sky-400'
          } animate-pulse`} />
          <span className={`text-xs font-bold ${
            isMaintenanceMode ? 'text-amber-400' : 'text-sky-400'
          } uppercase tracking-wider`}>
            {isMaintenanceMode ? 'Maintenance Mode' : 'Under Construction'}
          </span>
        </div>

        {/* Main heading */}
        <div className="space-y-4">
          <h1
            id="construction-title"
            className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none"
          >
            {isMaintenanceMode ? (
              <>
                Be Right<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  Back.
                </span>
              </>
            ) : (
              <>
                Coming<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                  Soon.
                </span>
              </>
            )}
          </h1>
          {title && (
            <p className="text-xl md:text-2xl font-bold text-white/60">{title}</p>
          )}
        </div>

        {/* Description */}
        <p className="text-white/40 text-lg leading-relaxed">
          {message || (
            isMaintenanceMode
              ? "We're performing scheduled maintenance to improve your experience. Please check back shortly."
              : "We're working hard to bring you this feature. Check back soon for updates."
          )}
        </p>

        {/* Expected date */}
        {expectedDate && !isMaintenanceMode && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
            <svg
              className="w-4 h-4 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-sm font-medium text-white/60">
              Expected: <span className="text-white/80">{expectedDate}</span>
            </span>
          </div>
        )}

        {/* Progress indicator (only for coming-soon mode) */}
        {!isMaintenanceMode && (
          <div className="space-y-3 pt-4" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="flex justify-between text-xs font-bold text-white/40 uppercase tracking-wider">
              <span>Progress</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Maintenance countdown or status */}
        {isMaintenanceMode && (
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-2">
                <svg
                  className="w-8 h-8 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                System Update
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <nav
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          aria-label="Navigation options"
        >
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 rounded-2xl font-bold text-sm uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
          >
            Back to Home
          </Link>
          {!isMaintenanceMode && (
            <Link
              to="/features"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all"
            >
              View Features
            </Link>
          )}
          {isMaintenanceMode && (
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all"
            >
              Refresh Page
            </button>
          )}
        </nav>

        {/* Contact for maintenance */}
        {isMaintenanceMode && (
          <p className="text-sm text-white/30">
            Need urgent assistance?{' '}
            <a
              href="mailto:support@dialysis.live"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              Contact Support
            </a>
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-white/20 font-medium">dialysis.live 2025</p>
      </div>
    </div>
  );
};

export default ComingSoon;
