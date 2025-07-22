# PitchPerfectAI User Experience Test Suite

This comprehensive test suite covers all aspects of the user experience for PitchPerfectAI, ensuring excellence from the user's perspective.

## Test Coverage

### 2.1 User Journey Testing

#### New User Onboarding (`onboarding.test.ts`)
- Complete signup flow from landing page to first use
- Email verification process
- Free trial activation
- Initial user experience and tutorial
- "1 free AI analysis" functionality

#### Core User Flows (`core-flows.test.ts`)
- Practice session initiation (voice and text modes)
- AI feedback generation and display
- Progress tracking and analytics
- Account management and settings
- Subscription management
- Credit usage and purchasing

### 2.2 Feature-Specific Testing

#### Voice & Text Features (`voice-text-features.test.ts`)
- **Voice Input & Analysis**
  - Microphone permissions across browsers
  - Recording quality and device compatibility
  - Background noise handling
  - Voice-to-text accuracy
  - AI analysis of tone, pacing, and delivery
  
- **Text Input & Feedback**
  - Input validation and character limits
  - Text formatting and special characters
  - AI analysis quality
  - Objection handling technique evaluation

#### Demo & Billing (`demo-credit-billing.test.ts`)
- **Interactive Demo**
  - Practice scenarios without account
  - Voice and text input support
  - Limited AI feedback in demo mode
  
- **Credit System**
  - Consumption tracking (1 credit for roleplay, 2-3 for AI voice)
  - Balance display and updates
  - Purchase flow for all tiers
  - Non-expiring credits
  
- **Billing & Subscriptions**
  - Plan upgrades/downgrades
  - Billing cycle management
  - 7-day money-back guarantee
  - Stripe integration

### 2.3 & 2.4 UI/UX and Content (`ui-ux-content.test.ts`)

#### User Interface & Experience
- **Design & Usability**
  - Navigation and user flows
  - Visual hierarchy
  - Design consistency
  - Loading states
  - Error handling
  
- **Responsive Design**
  - Mobile compatibility (iOS/Android)
  - Touch interactions
  - Text readability
  - Orientation handling

#### Content & Communication
- **Copy & Messaging**
  - Text clarity and accuracy
  - Pricing transparency
  - Feature descriptions
  - Call-to-action effectiveness
  
- **Help & Support**
  - Documentation and FAQs
  - Contact forms
  - Knowledge base search
  - Error guidance

## Running the Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run All UX Tests
```bash
# Run the complete test suite
./tests/user-experience/run-ux-tests.sh
```

### Run Individual Test Categories
```bash
# Onboarding tests
npx playwright test tests/user-experience/onboarding.test.ts

# Core flows
npx playwright test tests/user-experience/core-flows.test.ts

# Voice and text features
npx playwright test tests/user-experience/voice-text-features.test.ts

# Demo and billing
npx playwright test tests/user-experience/demo-credit-billing.test.ts

# UI/UX and content
npx playwright test tests/user-experience/ui-ux-content.test.ts
```

### Test Configuration Options
```bash
# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test -g "email verification"

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Generate HTML report
npx playwright test --reporter=html
```

## Test Reports

After running tests, you'll find:
- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results-*/[category].json`
- **Summary Report**: `test-results-*/summary-report.md`
- **Detailed Logs**: `test-results-*/[category].log`

## Best Practices

1. **Regular Execution**: Run these tests before each release
2. **Cross-Browser Testing**: Test on Chrome, Firefox, and Safari
3. **Mobile Testing**: Always include mobile device testing
4. **Real User Scenarios**: Tests mirror actual user behavior
5. **Performance Monitoring**: Track test execution times

## Troubleshooting

### Common Issues

1. **Microphone Permission Tests**
   - May require manual permission grants in CI
   - Use mock audio for automated testing

2. **Payment Integration Tests**
   - Use Stripe test mode
   - Never use real payment methods

3. **Mobile Emulation**
   - Some features may behave differently in emulation
   - Consider real device testing for critical flows

### Debug Mode
```bash
# Run with debug output
DEBUG=pw:api npx playwright test

# Run with video recording
npx playwright test --video=on
```

## Maintenance

- Update tests when features change
- Review and update test data regularly
- Monitor test flakiness and fix unstable tests
- Keep Playwright and dependencies updated

## Contact

For questions about these tests, contact the QA team or create an issue in the repository.
