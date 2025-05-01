
# Smoke Tests

This directory contains smoke tests that verify critical user flows in the application.

## Tests

- `home.spec.ts` - Tests the home page loads and the "Try Free" button navigates to the demo section
- `sandbox.spec.ts` - Tests the demo sandbox with microphone permissions and verifies scorecard generation
- `signup.spec.ts` - Tests the OAuth signup flow and streak initialization

## Running Tests

```bash
# Run all smoke tests
npm run test:smoke

# Run specific test
npx playwright test tests/smoke/home.spec.ts

# Run with UI
npx playwright test tests/smoke/ --ui

# Run with specific browser
npx playwright test tests/smoke/ --project=webkit-mobile
```

## Screen Sizes

Tests run on the following screen sizes:
- Desktop: 1440 × 900 (Chrome & Safari)
- Mobile: 375 × 812 (iPhone X - Chrome & Safari)
