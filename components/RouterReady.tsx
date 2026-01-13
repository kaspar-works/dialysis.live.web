/**
 * RouterReady - Ensures router context is available before rendering children
 * This fixes React 19 concurrent rendering issues with React Router v7
 */

import React, { useContext, useState, useEffect } from 'react';
import { UNSAFE_NavigationContext } from 'react-router';

interface RouterReadyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto" />
      <p className="text-white/50 text-sm font-medium">Loading...</p>
    </div>
  </div>
);

/**
 * Wrapper component that delays rendering until router context is established
 */
const RouterReady: React.FC<RouterReadyProps> = ({ children, fallback }) => {
  const navContext = useContext(UNSAFE_NavigationContext);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure router context is fully established
    // This handles React 19 concurrent rendering edge cases
    if (navContext) {
      // Use microtask to ensure context is fully propagated
      queueMicrotask(() => {
        setIsReady(true);
      });
    }
  }, [navContext]);

  if (!isReady) {
    return <>{fallback || <DefaultFallback />}</>;
  }

  return <>{children}</>;
};

export default RouterReady;
