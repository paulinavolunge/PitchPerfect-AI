# PitchPerfectAI Testing Guide for Cursor

## Part 6: Specific Cursor Instructions

### 6.1 How to Execute This Review

#### Step 1: Automated Analysis
Start by using Cursor's built-in code analysis features:

```bash
# Run static analysis
npm run lint
npm run type-check

# Check for security vulnerabilities
npm audit
npm run security-check

# Analyze bundle size
npm run analyze

# Check accessibility
npm run a11y-check
```

#### Step 2: Manual Testing Protocol

1. **Environment Setup**
   ```bash
   # Install all dependencies
   npm install
   
   # Set up test environment
   cp .env.example .env.test
   
   # Start development server
   npm run dev
   
   # In another terminal, start test runner
   npm run test:watch
   ```

2. **Systematic Feature Testing**
   - Open each page in the application
   - Test every interactive element
   - Try edge cases and invalid inputs
   - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
   - Test on real mobile devices

3. **Cross-Reference Requirements**
   - Review original feature specifications
   - Verify all promised features work
   - Check marketing claims against actual functionality
   - Ensure pricing matches implementation

4. **Performance Testing**

5. **Accessibility Testing**
   - Use keyboard navigation only (no mouse)
   - Test with screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
   - Check color contrast ratios
   - Verify ARIA labels and roles

6. **Mobile Testing**
   - Test on real devices, not just emulators
   - Check touch targets (minimum 44x44px)
   - Test in different orientations
   - Verify no horizontal scrolling
   - Test on slow 3G connection

### 6.2 Priority Focus Areas

Given 3 users signed up, focus testing on:

#### 1. User Onboarding Flow (CRITICAL)
```typescript
// Test checklist for onboarding
const onboardingTests = {
  landingPage: {
    firstImpression: 'Clear value proposition?',
    ctaVisibility: 'Obvious how to start?',
    loadTime: 'Under 3 seconds?',
    mobileResponsive: 'Works on all devices?'
  },
  
  signupProcess: {
    formValidation: 'Clear error messages?',
    emailVerification: 'Email arrives quickly?',
    passwordRequirements: 'Requirements clear?',
    progressIndicators: 'User knows where they are?'
  },
  
  firstExperience: {
    tutorial: 'Clear how to use the app?',
    firstPractice: 'Can complete without confusion?',
    freeTrialClear: 'Understand what\'s included?',
    valueDelivered: 'Get value immediately?'
  }
};
```

#### 2. Core AI Functionality (CRITICAL)
Test thoroughly:
- Voice recording in all browsers
- Microphone permission handling
- AI response time (should be < 5 seconds)
- Quality of AI feedback
- Error handling when AI fails

#### 3. Payment Processing (CRITICAL)
```typescript
// Payment test scenarios
const paymentTests = [
  { card: '4242424242424242', should: 'succeed' },
  { card: '4000000000000002', should: 'decline' },
  { card: '4000000000009995', should: 'insufficient_funds' },
  { card: '4000000000000069', should: 'expired_card' },
  { card: '4000000000000127', should: 'incorrect_cvc' }
];

// Test each scenario and verify:
// 1. Correct error messages shown
// 2. User can retry with different card
// 3. No sensitive data in console/network
// 4. Successful payment shows confirmation
```

#### 4. Mobile Experience (HIGH)
Mobile-specific tests:
- Touch targets at least 44x44px
- No desktop-only hover states
- Forms usable with mobile keyboard
- Voice recording works on mobile browsers
- Performance acceptable on 4G/3G

#### 5. Performance (HIGH)
Key metrics to measure:
- First Contentful Paint < 1.8s
- Time to Interactive < 3.8s
- Largest Contentful Paint < 2.5s
- Total Blocking Time < 200ms
- Cumulative Layout Shift < 0.1

### 6.3 Success Criteria

The application is ready when:

#### ✅ Critical User Flows
- [ ] New user can sign up without confusion
- [ ] Email verification works reliably
- [ ] First practice session completes successfully
- [ ] Payment processing works for all major cards
- [ ] Users can access all paid features after subscribing

#### ✅ Performance Standards
- [ ] Homepage loads in < 3 seconds on 4G
- [ ] All pages load in < 5 seconds on 3G
- [ ] No memory leaks during extended use
- [ ] Smooth scrolling and animations (60 fps)
- [ ] API responses < 500ms average

#### ✅ Mobile Optimization
- [ ] All features work on mobile Safari/Chrome
- [ ] Touch targets meet minimum size
- [ ] No horizontal scrolling
- [ ] Forms usable with mobile keyboard
- [ ] Voice recording works on mobile

#### ✅ Payment Reliability
- [ ] Stripe integration secure (HTTPS only)
- [ ] All card types process correctly
- [ ] Clear error messages for failures
- [ ] Subscription management works
- [ ] Refund process documented

#### ✅ AI Feature Quality
- [ ] Voice recording works cross-browser
- [ ] AI feedback is relevant and helpful
- [ ] Response time < 5 seconds
- [ ] Graceful handling of AI failures
- [ ] Credit consumption tracked accurately

#### ✅ UI/UX Standards
- [ ] Intuitive navigation
- [ ] Consistent design language
- [ ] Clear error messages
- [ ] Loading states for all async operations
- [ ] Accessible via keyboard navigation

#### ✅ Security Implementation
- [ ] All pages served over HTTPS
- [ ] Authentication tokens secure
- [ ] No sensitive data in localStorage
- [ ] CORS properly configured
- [ ] Input validation on all forms

## Testing Mindset

### Think Like a Developer
- Check console for errors
- Monitor network requests
- Verify data persistence
- Test error boundaries
- Check for memory leaks

### Think Like a User
- Is it obvious what to do next?
- Do errors make sense?
- Is the app fast enough?
- Does it work on my device?
- Would I pay for this?

### Think Like a Business Owner
- Will this retain users?
- Is the value clear?
- Are we losing users at any step?
- Is the pricing justified?
- Will users recommend this?

## Zero Defect Approach

1. **Document Everything**
   - Screenshot every issue
   - Record steps to reproduce
   - Note browser/device info
   - Measure performance metrics

2. **Test Multiple Times**
   - Different browsers
   - Different devices
   - Different network speeds
   - Different user paths

3. **Edge Cases**
   - Very long inputs
   - Special characters
   - Rapid clicking
   - Back button usage
   - Session timeouts

4. **Real User Scenarios**
   - Interrupted sessions
   - Poor connectivity
   - Accidental navigation
   - Multiple tabs open
   - Browser extensions

## Final Checklist Before Launch

### Must Have (Launch Blockers)
- [ ] All critical flows work without errors
- [ ] Payment processing 100% reliable
- [ ] Mobile experience fully functional
- [ ] Page load times < 3 seconds
- [ ] No security vulnerabilities
- [ ] GDPR compliance implemented

### Should Have (Launch Warnings)
- [ ] Accessibility WCAG AA compliant
- [ ] SEO optimization complete
- [ ] Analytics tracking working
- [ ] Error monitoring active
- [ ] Performance monitoring setup

### Nice to Have (Post-Launch)
- [ ] Advanced animations
- [ ] Dark mode support
- [ ] Offline functionality
- [ ] PWA capabilities
- [ ] Advanced analytics

## Remember

**You're not just testing code** - you're ensuring sales professionals can rely on this tool for their career growth. Every bug you miss could cost someone a deal. Every performance issue could lose a customer. Every confusing flow could prevent someone from improving their skills.

**Be thorough. Be critical. Be uncompromising.**

The quality bar is not "good enough" - it's "exceptional."
