#!/bin/bash

# PitchPerfectAI User Experience Test Suite Runner
# This script runs all user experience tests and generates a comprehensive report

echo "🚀 Starting PitchPerfectAI User Experience Review..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create results directory
RESULTS_DIR="test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p $RESULTS_DIR

# Function to run test category
run_test_category() {
    local category=$1
    local test_file=$2
    local description=$3
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "----------------------------------------"
    
    npx playwright test $test_file \
        --reporter=html \
        --reporter=json \
        --output=$RESULTS_DIR/$category \
        > $RESULTS_DIR/$category.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $description tests passed${NC}"
    else
        echo -e "${RED}✗ $description tests failed${NC}"
        echo "  See $RESULTS_DIR/$category.log for details"
    fi
}

# Run all test categories
echo -e "\n${YELLOW}Running User Experience Tests...${NC}\n"

# 2.1 User Journey Testing
run_test_category "onboarding" \
    "tests/user-experience/onboarding.test.ts" \
    "New User Onboarding & Free Trial"

# Core User Flows
run_test_category "core-flows" \
    "tests/user-experience/core-flows.test.ts" \
    "Core User Flows (Practice, Analytics, Account)"

# 2.2 Feature-Specific Testing
run_test_category "voice-text" \
    "tests/user-experience/voice-text-features.test.ts" \
    "Voice Input & Text Analysis Features"

# Demo & Credit System
run_test_category "demo-billing" \
    "tests/user-experience/demo-credit-billing.test.ts" \
    "Demo, Credits & Billing System"

# 2.3 & 2.4 UI/UX and Content
run_test_category "ui-content" \
    "tests/user-experience/ui-ux-content.test.ts" \
    "UI/UX Design & Content Quality"

# Generate summary report
echo -e "\n${YELLOW}Generating Summary Report...${NC}"

cat > $RESULTS_DIR/summary-report.md << 'REPORT'
# PitchPerfectAI User Experience Review Summary

## Test Execution Date: $(date)

### 2.1 User Journey Testing

#### New User Onboarding
- [ ] Complete signup flow from landing page to first use
- [ ] Email verification process works flawlessly
- [ ] Free trial activation is seamless
- [ ] Initial user experience and tutorial/guidance
- [ ] "1 free AI analysis" works correctly

#### Core User Flows
- [ ] Practice session initiation (voice and text)
- [ ] AI feedback generation and display
- [ ] Progress tracking and analytics viewing
- [ ] Account management and settings
- [ ] Subscription management and billing
- [ ] Credit usage and purchasing

### 2.2 Feature-Specific Testing

#### Voice Input & Analysis
- [ ] Microphone permission requests across browsers
- [ ] Voice recording quality and clarity
- [ ] Voice input on different devices
- [ ] Background noise handling
- [ ] Voice recording length limits
- [ ] Voice-to-text accuracy
- [ ] AI feedback quality and relevance
- [ ] Analysis of vocal tone, pacing, and delivery
- [ ] Actionable and specific feedback
- [ ] Various speech patterns and accents
- [ ] Real-time processing speed

#### Text Input & Feedback
- [ ] Character limits and validation
- [ ] Text formatting and display
- [ ] Copy/paste functionality
- [ ] Special characters handling
- [ ] Various keyboard layouts
- [ ] AI feedback quality for text
- [ ] Analysis of objection handling
- [ ] Feedback on structure and persuasiveness

#### Demo & Interactive Features
- [ ] Objection handling practice scenario
- [ ] Voice and text input in demo
- [ ] AI feedback generation in demo
- [ ] Demo progression and guidance
- [ ] Demo works without account

#### Credit System & Billing
- [ ] Credit consumption tracking
- [ ] Credit balance display and updates
- [ ] Credit purchase flow
- [ ] Credits never expire
- [ ] Low credit warnings
- [ ] Subscription plan management
- [ ] Billing cycle management
- [ ] Cancellation and refund processes
- [ ] 7-day money-back guarantee
- [ ] Stripe payment integration

### 2.3 User Interface & Experience

#### Design & Usability
- [ ] Intuitive navigation
- [ ] Visual hierarchy
- [ ] Consistent design language
- [ ] Loading states and indicators
- [ ] Helpful error messages

#### Responsive Design
- [ ] Mobile devices (iOS and Android)
- [ ] Touch interactions
- [ ] Text readability on small screens
- [ ] Landscape and portrait orientations
- [ ] Touch-sized interactive elements

### 2.4 Content & Communication

#### Copy & Messaging
- [ ] Clear and accurate text
- [ ] Pricing matches billing
- [ ] Feature descriptions accurate
- [ ] Effective CTAs
- [ ] Authentic testimonials

#### Help & Support
- [ ] Help documentation and FAQs
- [ ] Contact forms work
- [ ] Knowledge base search
- [ ] Helpful error guidance

## Test Results Location
All detailed test results can be found in: $RESULTS_DIR/

REPORT

echo -e "\n${GREEN}✅ User Experience Review Complete!${NC}"
echo -e "\nResults saved to: ${YELLOW}$RESULTS_DIR/${NC}"
echo -e "View HTML report: ${YELLOW}$RESULTS_DIR/playwright-report/index.html${NC}"
echo -e "View summary: ${YELLOW}$RESULTS_DIR/summary-report.md${NC}"

# Open HTML report if possible
if command -v xdg-open &> /dev/null; then
    xdg-open $RESULTS_DIR/playwright-report/index.html
elif command -v open &> /dev/null; then
    open $RESULTS_DIR/playwright-report/index.html
fi
