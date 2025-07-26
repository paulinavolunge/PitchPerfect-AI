// Note: Sentry packages need to be installed:
// npm install @sentry/react

export const initSentry = async () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
  const release = import.meta.env.VITE_SENTRY_RELEASE;
  const enableTracking = import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true';

  if (!dsn || !enableTracking) {
    console.log('[Sentry] Error tracking disabled or DSN not provided');
    return;
  }

  try {
    // Dynamically import Sentry to avoid errors if not installed
    const Sentry = await import('@sentry/react');
    
    Sentry.init({
      dsn,
      environment,
      release,
      integrations: [
        new Sentry.BrowserTracing({
          // Set sampling rate for performance monitoring
          tracingOrigins: ['localhost', /^\//],
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Release Health
      autoSessionTracking: true,
      // Filtering
      beforeSend(event, hint) {
        // Filter out non-error events in production
        if (environment === 'production' && event.level !== 'error') {
          return null;
        }
        
        // Don't send events from localhost in production
        if (environment === 'production' && window.location.hostname === 'localhost') {
          return null;
        }
        
        return event;
      },
    });

    console.log('[Sentry] Error tracking initialized');
  } catch (error) {
    console.warn('[Sentry] Failed to initialize - package may not be installed:', error);
  }
};