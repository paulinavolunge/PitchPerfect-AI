// Initialize all third-party services
import { initSentry } from './sentry';
import { initPostHog } from './posthog';

export const initializeApp = async () => {
  // Initialize error tracking
  // Note: Uncomment after installing @sentry/react
  // try {
  //   await initSentry();
  // } catch (error) {
  //   console.error('[Init] Failed to initialize Sentry:', error);
  // }

  // Initialize analytics
  // Note: Uncomment after installing posthog-js
  // try {
  //   await initPostHog();
  // } catch (error) {
  //   console.error('[Init] Failed to initialize PostHog:', error);
  // }

  // Log environment info in development
  if (import.meta.env.MODE === 'development') {
    console.log('[Init] Environment:', {
      mode: import.meta.env.MODE,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasStripeKey: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      hasSentryDSN: !!import.meta.env.VITE_SENTRY_DSN,
      hasPostHogKey: !!import.meta.env.VITE_POSTHOG_API_KEY,
    });
  }
};