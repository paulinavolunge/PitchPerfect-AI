# Environment Variables Setup Guide

## Overview

This application uses environment variables to configure various services and features. Environment variables are loaded at build time by Vite.

## Required Environment Variables

### Supabase (Database & Authentication)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

These are required for the application to function properly.

## Optional Environment Variables

### Stripe (Payment Processing)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
  - Required for payment functionality
  - Get from Stripe Dashboard → API keys

### Sentry (Error Tracking)
- `VITE_SENTRY_DSN`: Your Sentry DSN
- `VITE_SENTRY_ENVIRONMENT`: Environment name (development/production)
- `VITE_SENTRY_RELEASE`: Release version
- `VITE_ENABLE_ERROR_TRACKING`: Enable/disable error tracking (true/false)

### PostHog (Analytics)
- `VITE_POSTHOG_API_KEY`: Your PostHog API key
- `VITE_POSTHOG_HOST`: PostHog host (default: https://app.posthog.com)
- `VITE_ENABLE_ANALYTICS`: Enable/disable analytics (true/false)

### Application Configuration
- `VITE_APP_NAME`: Application name (default: PitchPerfect AI)
- `VITE_APP_URL`: Application URL

## Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your values:**
   - Open `.env` in your editor
   - Replace placeholder values with your actual credentials

3. **For production deployment:**
   - Create `.env.production` with production values
   - Or set environment variables in your hosting platform

## Environment Files

- `.env`: Default environment file for local development
- `.env.production`: Production-specific values (loaded when `NODE_ENV=production`)
- `.env.example`: Template file with all available variables

## Verification

Run the verification script to check your environment setup:

```bash
npm run verify:env
```

This will:
- Check for required variables
- Warn about missing optional variables
- Validate variable formats

## Build Commands

- `npm run build`: Build with development environment
- `npm run build:prod`: Build with production environment
- `npm run preview`: Preview production build locally

## Security Notes

- **Never commit `.env` files** to version control
- `.env` files are included in `.gitignore`
- Use secure methods to share credentials with team members
- In production, use your hosting platform's environment variable management

## Troubleshooting

### Missing Environment Variables
If you see errors about missing environment variables:
1. Check that `.env` file exists
2. Verify variable names match exactly (case-sensitive)
3. Restart your development server after changes

### Build Failures
The build process will fail if required variables are missing:
- Run `npm run verify:env` to diagnose
- Check console output for specific missing variables

### Runtime Errors
If features aren't working:
- Check browser console for initialization errors
- Verify API keys are valid and have correct permissions
- Ensure URLs are properly formatted