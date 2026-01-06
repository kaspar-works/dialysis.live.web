import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,

    // Performance monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Session replay for debugging (only in production, sample 10%)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Ignore network errors that are expected (user offline, etc.)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return null;
      }

      // Ignore aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }

      return event;
    },

    // Don't send PII
    beforeBreadcrumb(breadcrumb) {
      // Sanitize URLs that might contain tokens
      if (breadcrumb.category === 'navigation' && breadcrumb.data?.to) {
        const url = breadcrumb.data.to;
        if (url.includes('token=') || url.includes('code=')) {
          breadcrumb.data.to = url.split('?')[0] + '?[REDACTED]';
        }
      }
      return breadcrumb;
    },
  });
}

// Export Sentry for use in components
export { Sentry };

// Helper to capture exceptions with context
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) {
    console.error('Error:', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

// Helper to set user context (call after login)
export function setUser(user: { id: string; email?: string }) {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
}

// Helper to clear user (call after logout)
export function clearUser() {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
}
