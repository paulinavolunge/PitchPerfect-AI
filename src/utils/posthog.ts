import posthog from 'posthog-js';
import { PostHogConfig } from 'posthog-js';

// Type definitions for PostHog events
export interface PostHogEvents {
  // Page view events
  page_viewed: {
    path: string;
    title: string;
    referrer?: string;
  };
  
  // Demo events
  demo_started: {
    mode: 'voice' | 'text';
    scenario?: string;
  };
  demo_completed: {
    mode: 'voice' | 'text';
    duration_seconds: number;
    score?: number;
    feedback_received: boolean;
  };
  
  // Feedback events
  feedback_submitted: {
    type: 'demo' | 'practice' | 'roleplay';
    rating?: number;
    has_comment: boolean;
  };
  
  // Mode toggle events
  voice_mode_enabled: {
    page: string;
    previous_mode: 'text';
  };
  text_mode_enabled: {
    page: string;
    previous_mode: 'voice';
  };
  
  // Auth events
  user_signed_up: {
    method: 'email' | 'google';
    referrer?: string;
  };
  user_logged_in: {
    method: 'email' | 'google';
  };
  user_logged_out: {
    session_duration_seconds: number;
  };
  
  // Feature usage events
  practice_session_started: {
    type: string;
    difficulty?: string;
  };
  roleplay_session_started: {
    scenario: string;
    ai_persona?: string;
  };
  voice_recording_started: {
    page: string;
  };
  voice_recording_completed: {
    duration_seconds: number;
    page: string;
  };
}

// Configuration
const getPostHogConfig = (): { apiKey: string; host: string; enabled: boolean } => {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY || '';
  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  // Only enable in production with valid API key
  const enabled = isProduction && !!apiKey;
  
  return { apiKey, host, enabled };
};

// Initialize PostHog
export const initPostHog = (): void => {
  const { apiKey, host, enabled } = getPostHogConfig();
  
  if (!enabled) {
    console.log('[PostHog] Analytics disabled -', import.meta.env.DEV ? 'development mode' : 'no API key');
    
    // Create a mock posthog object in development
    if (import.meta.env.DEV) {
      (window as any).posthog = {
        capture: (event: string, properties?: any) => {
          console.log('[PostHog Mock] Event:', event, properties);
        },
        identify: (userId: string, properties?: any) => {
          console.log('[PostHog Mock] Identify:', userId, properties);
        },
        reset: () => {
          console.log('[PostHog Mock] Reset');
        },
        people: {
          set: (properties: any) => {
            console.log('[PostHog Mock] People set:', properties);
          }
        }
      };
    }
    return;
  }
  
  try {
    const config: Partial<PostHogConfig> = {
      api_host: host,
      
      // Privacy settings
      autocapture: false, // Disable automatic event capture for privacy
      capture_pageview: false, // We'll manually track pageviews
      capture_pageleave: true,
      disable_session_recording: true, // Disable session recording for privacy
      
      // Performance settings
      persistence: 'localStorage',
      bootstrap: {
        distinctID: undefined, // Let PostHog generate
      },
      
      // Feature flags
      loaded: (posthog) => {
        console.log('[PostHog] Successfully loaded');
        // Make posthog available globally
        (window as any).posthog = posthog;
      },
      
      // Sanitization
      sanitize_properties: (properties) => {
        // Remove any sensitive data
        const sanitized = { ...properties };
        delete sanitized.password;
        delete sanitized.email;
        delete sanitized.creditCard;
        delete sanitized.ssn;
        return sanitized;
      },
    };
    
    posthog.init(apiKey, config);
    
    // Set super properties that will be sent with every event
    posthog.register({
      app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
      environment: import.meta.env.MODE,
    });
    
    console.log('[PostHog] Analytics initialized');
  } catch (error) {
    console.error('[PostHog] Failed to initialize:', error);
  }
};

// Track page view
export const trackPageView = (path: string, title?: string): void => {
  if (!isPostHogEnabled()) return;
  
  const properties: PostHogEvents['page_viewed'] = {
    path,
    title: title || document.title,
    referrer: document.referrer,
  };
  
  posthog.capture('page_viewed', properties);
};

// Track events with proper typing
export const trackEvent = <K extends keyof PostHogEvents>(
  eventName: K,
  properties: PostHogEvents[K]
): void => {
  if (!isPostHogEnabled()) return;
  
  // Add timestamp to all events
  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
  };
  
  posthog.capture(eventName, enrichedProperties);
};

// Identify user
export const identifyUser = (userId: string, traits?: Record<string, any>): void => {
  if (!isPostHogEnabled()) return;
  
  posthog.identify(userId, {
    ...traits,
    identified_at: new Date().toISOString(),
  });
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>): void => {
  if (!isPostHogEnabled()) return;
  
  posthog.people.set(properties);
};

// Reset user (for logout)
export const resetUser = (): void => {
  if (!isPostHogEnabled()) return;
  
  posthog.reset();
};

// Check if PostHog is enabled and loaded
export const isPostHogEnabled = (): boolean => {
  return !!(window as any).posthog && typeof (window as any).posthog.capture === 'function';
};

// Convenience tracking functions
export const trackDemoStart = (mode: 'voice' | 'text', scenario?: string): void => {
  trackEvent('demo_started', { mode, scenario });
};

export const trackDemoComplete = (
  mode: 'voice' | 'text',
  durationSeconds: number,
  score?: number,
  feedbackReceived: boolean = false
): void => {
  trackEvent('demo_completed', {
    mode,
    duration_seconds: durationSeconds,
    score,
    feedback_received: feedbackReceived,
  });
};

export const trackFeedbackSubmitted = (
  type: 'demo' | 'practice' | 'roleplay',
  rating?: number,
  hasComment: boolean = false
): void => {
  trackEvent('feedback_submitted', {
    type,
    rating,
    has_comment: hasComment,
  });
};

export const trackModeToggle = (newMode: 'voice' | 'text', page: string): void => {
  if (newMode === 'voice') {
    trackEvent('voice_mode_enabled', { page, previous_mode: 'text' });
  } else {
    trackEvent('text_mode_enabled', { page, previous_mode: 'voice' });
  }
};

export const trackAuth = (
  action: 'signup' | 'login' | 'logout',
  method?: 'email' | 'google',
  sessionDurationSeconds?: number
): void => {
  switch (action) {
    case 'signup':
      trackEvent('user_signed_up', {
        method: method!,
        referrer: document.referrer,
      });
      break;
    case 'login':
      trackEvent('user_logged_in', { method: method! });
      break;
    case 'logout':
      trackEvent('user_logged_out', {
        session_duration_seconds: sessionDurationSeconds || 0,
      });
      break;
  }
};

// Export PostHog instance for advanced usage
export { posthog };