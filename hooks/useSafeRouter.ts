/**
 * Safe router hooks that handle cases where router context isn't available
 * This is needed for React 19 concurrent rendering with React Router v7
 */

import { useContext } from 'react';
import { UNSAFE_NavigationContext, UNSAFE_LocationContext } from 'react-router';

/**
 * Check if we're inside a Router context
 */
export function useRouterReady(): boolean {
  const navContext = useContext(UNSAFE_NavigationContext);
  return navContext !== null;
}

/**
 * Get current pathname safely, returns '/' if router not ready
 */
export function useSafePathname(): string {
  const locationContext = useContext(UNSAFE_LocationContext);
  if (!locationContext) {
    // Fallback to window.location.hash for HashRouter
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      return hash.replace(/^#/, '') || '/';
    }
    return '/';
  }
  return locationContext.location.pathname;
}

/**
 * Safe navigation function that works even outside Router context
 */
export function useSafeNavigate(): (to: string) => void {
  const navContext = useContext(UNSAFE_NavigationContext);

  return (to: string) => {
    if (navContext?.navigator) {
      navContext.navigator.push(to);
    } else {
      // Fallback for HashRouter
      window.location.hash = to;
    }
  };
}
