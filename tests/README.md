# PitchPerfectAI Test Suite

Comprehensive test suite covering user experience, realistic scenarios, and edge cases for PitchPerfectAI.

## Test Structure

```
tests/
├── user-experience/           # Part 2: User Experience Tests
│   ├── onboarding.test.ts    # New user journey
│   ├── core-flows.test.ts    # Core functionality
│   ├── voice-text-features.test.ts  # Voice/text features
│   ├── demo-credit-billing.test.ts  # Demo & billing
│   ├── ui-ux-content.test.ts # UI/UX and content
│   └── run-ux-tests.sh       # UX test runner
│
├── scenarios/                 # Part 3: Scenarios & Stress Tests
│   ├── sales-professional-scenarios.test.ts  # User scenarios
│   ├── edge-cases-stress.test.ts            # Edge cases
│   └── run-scenario-tests.sh                # Scenario runner
│
└── run-all-tests.sh          # Master test runner
```

## Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Make scripts executable
chmod +x tests/**/*.sh
```

### Run All Tests
```bash
# Run complete test suite (Parts 2 & 3)
./tests/run-all-tests.sh
```

### Run Specific Test Suites

#### User Experience Tests (Part 2)
```bash
./tests/user-experience/run-ux-tests.sh
```

#### Scenario & Stress Tests (Part 3)
```bash
./tests/scenarios/run-scenario-tests.sh
```

## Test Coverage

### Part 2: User Experience Testing

#### 2.1 User Journey Testing
- New user onboarding flow
- Email verification process
- Free trial activation
- First AI analysis usage

#### 2.2 Feature-Specific Testing
- **Voice Features**: Recording, permissions, quality, AI analysis
- **Text Features**: Input validation, formatting, AI feedback
- **Demo Mode**: No-account access, limited features
- **Credit System**: Consumption, purchases, billing

#### 2.3 UI/UX Testing
- Design consistency
- Responsive layouts
- Mobile compatibility
- Touch interactions

#### 2.4 Content Testing
- Copy accuracy
- Help documentation
- Error messages
- Support channels

### Part 3: Scenario & Stress Testing

#### 3.1 Sales Professional Scenarios
- **New Sales Rep**: Complete journey from signup to paid plan
- **Experienced User**: Advanced features and analytics
- **Team Lead**: Team management and collaboration

#### 3.2 Edge Cases & Stress Testing
- **High Usage**: Max limits, concurrent users
- **Error Handling**: Network, permissions, payments
- **Compatibility**: Browsers, devices, resolutions

## Test Reports

After running tests, find reports in:
- `test-results-*/` - User experience results
- `scenario-test-results-*/` - Scenario test results
- `test-results-master-*/` - Combined results

### Report Types
- **HTML Reports**: Interactive test results
- **JSON Reports**: Machine-readable results
- **Summary Markdown**: Human-readable summaries
- **Coverage Matrix**: Visual test coverage
- **Test Dashboard**: Overall status dashboard

## Configuration

### Environment Variables
```bash
# Set test environment
export TEST_ENV=staging

# Enable debug mode
export DEBUG=pw:api

# Set custom timeouts
export TEST_TIMEOUT=60000
```

### Playwright Configuration
```javascript
// playwright.config.ts
{
  timeout: 30000,
  retries: 2,
  workers: 4,
  reporter: [['html'], ['json']],
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' }
  ]
}
```

## Best Practices

1. **Isolation**: Each test is independent
2. **Cleanup**: Tests clean up after themselves
3. **Assertions**: Multiple verification points
4. **Realistic**: Tests mirror actual user behavior
5. **Comprehensive**: Cover happy paths and edge cases

## Debugging

### Run in Debug Mode
```bash
# Visual debugging
npx playwright test --debug

# With inspector
PWDEBUG=1 npx playwright test

# Specific test
npx playwright test -g "test name"
```

### Common Issues

1. **Timeouts**
   - Increase timeout in config
   - Check network conditions
   - Verify selectors

2. **Flaky Tests**
   - Add proper waits
   - Use stable selectors
   - Check race conditions

3. **Permission Errors**
   - Run in headed mode
   - Grant permissions manually
   - Check browser settings

## Maintenance

### Regular Tasks
- [ ] Update test data monthly
- [ ] Review flaky tests weekly
- [ ] Update selectors as needed
- [ ] Add new scenarios quarterly
- [ ] Performance baseline updates

### Adding New Tests
1. Follow existing patterns
2. Include positive and negative cases
3. Add to appropriate category
4. Update documentation
5. Test in CI/CD pipeline

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: ./tests/run-all-tests.sh
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results-*/
```

## Performance Benchmarks

Expected execution times:
- User Experience Tests: ~10 minutes
- Scenario Tests: ~15 minutes
- Full Suite: ~25 minutes

## Support

For questions or issues:
- Check test logs in results directory
- Review HTML reports for screenshots
- Contact QA team for assistance
- Create GitHub issue for bugs

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintained By**: QA Team
