import React from 'react';
import { Link } from 'react-router';
import SEO from '../components/SEO';
import Logo from '../components/Logo';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden" role="main" aria-labelledby="not-found-title">
      <SEO
        title="Page Not Found - 404"
        description="The page you're looking for doesn't exist or has been moved."
        noIndex
      />

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-3 mb-4">
          <Logo className="w-10 h-10" />
          <span className="font-black text-xl text-white tracking-tight">dialysis.live</span>
        </Link>

        {/* 404 Number */}
        <div className="relative" aria-hidden="true">
          <span className="text-[150px] sm:text-[200px] font-black text-white/5 leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-pink-400">
              404
            </span>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 id="not-found-title" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Page not found
          </h1>
          <p className="text-white/50 font-medium text-lg max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        {/* Actions */}
        <nav className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4" aria-label="Page recovery options">
          <Link
            to="/"
            aria-label="Return to homepage"
            className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 rounded-2xl font-bold hover:bg-slate-100 transition-all hover:scale-105"
          >
            Go Home
          </Link>
          <Link
            to="/dashboard"
            aria-label="Go to dashboard"
            className="w-full sm:w-auto px-10 py-5 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors"
          >
            Dashboard
          </Link>
        </nav>

        {/* Help Links */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-sm text-white/30 mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/features" className="text-sky-400 hover:text-sky-300 font-medium">
              Features
            </Link>
            <Link to="/pricing" className="text-sky-400 hover:text-sky-300 font-medium">
              Pricing
            </Link>
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium">
              Login
            </Link>
            <Link to="/register" className="text-sky-400 hover:text-sky-300 font-medium">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
