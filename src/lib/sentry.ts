import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  // Only initialize Sentry in production or if DSN is provided
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const isDevelopment = import.meta.env.DEV;
  
  if (!dsn || isDevelopment) {
    console.log('[Sentry] Skipping initialization:', { dsn: !!dsn, isDevelopment });
    return;
  }

  try {
    Sentry.init({
      dsn,
      integrations: [
        new BrowserTracing({
          // Set sampling to 100% for development, lower for production
          tracingOrigins: ['localhost', /^\//],
          // Track route changes automatically
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
      environment: import.meta.env.MODE,
      // Filter out known non-errors
      beforeSend(event, hint) {
        // Filter out non-actionable errors
        if (event.exception) {
          const error = hint.originalException;
          // Filter out network errors that are expected
          if (error?.message?.includes('NetworkError') || 
              error?.message?.includes('Failed to fetch')) {
            return null;
          }
          // Filter out browser extension errors
          if (error?.message?.includes('extension://')) {
            return null;
          }
        }
        return event;
      },
    });

    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

// Helper to set user context
export function setSentryUser(user: { id: string; email?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

// Helper to capture custom errors with context
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

// Export Sentry for use in error boundaries
export { Sentry };