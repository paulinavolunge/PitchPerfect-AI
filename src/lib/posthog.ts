// Note: PostHog package needs to be installed:
// npm install posthog-js

export const initPostHog = async () => {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
  const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

  if (!apiKey || !enableAnalytics) {
    console.log('[PostHog] Analytics disabled or API key not provided');
    return;
  }

  try {
    // Dynamically import PostHog to avoid errors if not installed
    const posthogModule = await import('posthog-js');
    const posthog = posthogModule.default;
    
    posthog.init(apiKey, {
      api_host: host,
      // Capture pageviews automatically
      capture_pageview: true,
      // Capture console errors
      capture_console_errors: true,
      // Session recording
      session_recording: {
        enabled: true,
        // Only record 10% of sessions in production
        sample_rate: import.meta.env.VITE_SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
      },
      // Privacy settings
      mask_all_text: false,
      mask_all_element_attributes: false,
      // Performance
      disable_session_recording: import.meta.env.VITE_SENTRY_ENVIRONMENT !== 'production',
      // Feature flags
      bootstrap: {
        featureFlags: {},
      },
    });

    // Identify user if logged in
    const identifyUser = (userId: string, properties?: Record<string, any>) => {
      posthog.identify(userId, properties);
    };

    // Track custom events
    const trackEvent = (eventName: string, properties?: Record<string, any>) => {
      posthog.capture(eventName, properties);
    };

    console.log('[PostHog] Analytics initialized');

    return {
      identifyUser,
      trackEvent,
    };
  } catch (error) {
    console.warn('[PostHog] Failed to initialize - package may not be installed:', error);
  }
};

export const analytics = {
  track: (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(eventName, properties);
    }
  },
  identify: (userId: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.identify(userId, properties);
    }
  },
  reset: () => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.reset();
    }
  },
};