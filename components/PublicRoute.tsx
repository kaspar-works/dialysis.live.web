import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function PublicRoute({ children, redirectTo = '/dashboard' }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state during session validation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-sky-500/10 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-600 dark:text-slate-300 font-semibold">Loading...</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // If user came from a protected route, redirect back there
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    return <Navigate to={from || redirectTo} replace />;
  }

  return <>{children}</>;
}

export default PublicRoute;
