# Sentry Error Tracking Integration

This document describes the Sentry error tracking integration for PitchPerfect AI.

## Features Implemented

1. **Error Tracking**
   - Uncaught JavaScript errors
   - Unhandled promise rejections
   - Manual error capture via `captureError` helper

2. **Performance Monitoring**
   - Route transitions tracking
   - Browser tracing with 10% sample rate
   - Custom transaction names

3. **User Context**
   - Automatically tracks logged-in user ID and email
   - Clears user context on logout

4. **Error Boundaries**
   - Sentry-aware error boundary wraps entire app
   - Custom error UI with user-friendly messaging
   - Detailed error info in development mode

5. **Smart Filtering**
   - Filters out non-actionable network errors
   - Excludes browser extension errors
   - Custom beforeSend hook for error filtering

6. **Session Replay**
   - 10% of normal sessions
   - 100% of sessions with errors

## Setup Instructions

1. **Get your Sentry DSN**
   - Sign up at https://sentry.io/
   - Create a new project (select React)
   - Copy your DSN from Settings → Projects → [Your Project] → Client Keys

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Add your Sentry DSN:
     ```
     VITE_SENTRY_DSN=https://[your-key]@[your-org].ingest.sentry.io/[project-id]
     ```

3. **Test the Integration**
   - Run the app in production mode: `npm run build && npm run preview`
   - Navigate to `/test-error`
   - Click any of the test buttons to trigger errors
   - Check your Sentry dashboard for the errors

## Configuration

The Sentry configuration is in `src/lib/sentry.ts`:

- **Development Mode**: Sentry is disabled by default
- **Production Mode**: Sentry is enabled when DSN is provided
- **Sample Rates**: 10% for performance, 100% for errors
- **User Privacy**: Only user ID and email are tracked

## Usage

### Automatic Error Tracking

All uncaught errors and unhandled rejections are automatically tracked.

### Manual Error Capture

```typescript
import { captureError } from '@/lib/sentry';

try {
  // Your code
} catch (error) {
  captureError(error as Error, {
    context: 'additional context',
    userId: 'user123'
  });
}
```

### Error Boundaries

The app is wrapped in `SentryErrorBoundary` which:
- Catches React component errors
- Shows user-friendly error UI
- Reports errors to Sentry
- Allows users to retry or navigate home

## Testing Checklist

- [ ] Add your Sentry DSN to `.env`
- [ ] Build the app in production mode
- [ ] Navigate to `/test-error`
- [ ] Test each error type:
  - [ ] Synchronous error
  - [ ] Async error
  - [ ] Manual capture
  - [ ] Network error
  - [ ] Error boundary
- [ ] Verify errors appear in Sentry dashboard
- [ ] Check that user context is attached
- [ ] Confirm route transitions are tracked

## Production Considerations

1. **Remove Test Route**: Remove the `/test-error` route before deploying
2. **Adjust Sample Rates**: Consider lowering sample rates for high-traffic apps
3. **Source Maps**: Upload source maps for better error debugging
4. **Release Tracking**: Set `VITE_APP_VERSION` for release tracking
5. **Alerts**: Configure Sentry alerts for critical errors

## Troubleshooting

- **Errors not appearing**: Check that DSN is correctly set and app is in production mode
- **User context missing**: Ensure user is logged in when errors occur
- **Too many events**: Adjust sample rates or add more filters in `beforeSend`