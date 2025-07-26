import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { CaptureConsole } from '@sentry/integrations';
import React from 'react';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

// Type definitions for Sentry configuration
interface SentryConfig {
  dsn: string | undefined;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  debug: boolean;
}

// Get Sentry configuration from environment
const getSentryConfig = (): SentryConfig => {
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;
  
  return {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: isProduction ? 'production' : 'development',
    enabled: isProduction && !!import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev
    debug: isDevelopment,
  };
};

// Initialize Sentry
export const initSentry = () => {
  const config = getSentryConfig();
  
  if (!config.enabled) {
    console.log('[Sentry] Skipping initialization - not in production or no DSN provided');
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      debug: config.debug,
      
      // Performance monitoring
      integrations: [
        new BrowserTracing({
          // Set tracingOrigins to control what URLs are traced
          tracingOrigins: ['localhost', /^\//],
          // Capture interactions like clicks and navigation
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          ),
        }),
        // Capture console errors
        new CaptureConsole({
          levels: ['error', 'warn'],
        }),
      ],
      
      // Performance monitoring sample rate
      tracesSampleRate: config.tracesSampleRate,
      
      // Session tracking
      autoSessionTracking: true,
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
      
      // Filter out known non-errors
      ignoreErrors: [
        // Browser extensions
        'Non-Error promise rejection captured',
        // Network errors
        'Network request failed',
        'NetworkError',
        'Failed to fetch',
        // Common browser errors
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        // React errors that are handled
        'Hydration failed',
        'There was an error while hydrating',
      ],
      
      // Data scrubbing
      beforeSend(event, hint) {
        // Filter out events from browser extensions
        if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
          frame => frame.filename?.includes('extension://')
        )) {
          return null;
        }
        
        // Add custom context
        event.contexts = {
          ...event.contexts,
          app: {
            build_time: import.meta.env.VITE_BUILD_TIME || 'unknown',
            version: import.meta.env.VITE_APP_VERSION || 'unknown',
          },
        };
        
        // Log in development
        if (config.debug) {
          console.log('[Sentry] Sending event:', event);
        }
        
        return event;
      },
      
      // Breadcrumb filtering
      beforeBreadcrumb(breadcrumb) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null;
        }
        
        // Add more context to navigation breadcrumbs
        if (breadcrumb.category === 'navigation') {
          breadcrumb.data = {
            ...breadcrumb.data,
            timestamp: new Date().toISOString(),
          };
        }
        
        return breadcrumb;
      },
    });
    
    console.log('[Sentry] Successfully initialized');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
};

// Set user context for Sentry
export const setSentryUser = (user: { id: string; email?: string; role?: string } | null) => {
  if (!getSentryConfig().enabled) return;
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    console.log('[Sentry] User context set:', user.id);
  } else {
    Sentry.setUser(null);
    console.log('[Sentry] User context cleared');
  }
};

// Add custom breadcrumb
export const addSentryBreadcrumb = (
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) => {
  if (!getSentryConfig().enabled) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

// Capture custom error
export const captureError = (error: Error | string, context?: Record<string, any>) => {
  if (!getSentryConfig().enabled) return;
  
  if (typeof error === 'string') {
    error = new Error(error);
  }
  
  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
};

// Capture message
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) => {
  if (!getSentryConfig().enabled) return;
  
  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context || {},
    },
  });
};

// Create error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Export Sentry instance for advanced usage
export { Sentry };