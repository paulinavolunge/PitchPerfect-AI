import { test, expect, Page } from '@playwright/test';

test.describe('Sales Professional User Scenarios', () => {
  test.describe('New Sales Rep Scenario', () => {
    test('complete new sales rep journey from signup to paid plan', async ({ page, context }) => {
      // Step 1: Sign up for free trial
      await page.goto('/');
      await page.getByRole('link', { name: /Start Free Trial/i }).click();
      
      // Fill signup form
      const testEmail = `newsalesrep_${Date.now()}@example.com`;
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'SecurePass123!');
      await page.fill('input[name="fullName"]', 'John NewRep');
      await page.fill('input[name="company"]', 'TechStartup Inc');
      
      // Select role
      await page.selectOption('select[name="role"]', 'sales-rep');
      
      // Submit signup
      await page.getByRole('button', { name: /Start Free Trial/i }).click();
      
      // Verify email confirmation page
      await expect(page.locator('text=Check your email')).toBeVisible();
      
      // Simulate email confirmation (in real test, would click email link)
      await page.goto('/email-confirmed');
      await page.getByRole('button', { name: /Go to Dashboard/i }).click();
      
      // Step 2: Complete first objection handling practice (voice)
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=/Welcome, John/i')).toBeVisible();
      
      // Check onboarding prompt
      await expect(page.locator('[data-testid="onboarding-prompt"]')).toBeVisible();
      await page.getByRole('button', { name: /Start First Practice/i }).click();
      
      // Select voice mode for first practice
      await expect(page).toHaveURL('/practice');
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Grant microphone permission
      await context.grantPermissions(['microphone']);
      
      // Select common objection scenario
      await page.selectOption('[data-testid="objection-scenario"]', 'price-too-high');
      await expect(page.locator('text=/Your product is too expensive/i')).toBeVisible();
      
      // Record response
      await page.getByRole('button', { name: /Start Recording/i }).click();
      
      // Simulate speaking (wait for realistic duration)
      // Simulate speaking (wait for realistic duration)
      // Wait for recording indicator or use a more reliable signal
      await expect(page.locator('[data-testid="recording-active"]')).toBeVisible();
      await page.waitForTimeout(2000); // Minimum recording time
      await expect(page.locator('[data-testid="recording-active"]')).toBeVisible();
      await page.getByRole('button', { name: /Stop Recording/i }).click();
      
      // Wait for AI processing
      await expect(page.locator('text=/Analyzing your response/i')).toBeVisible();
      await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 15000 });
      
      // Step 3: Review AI feedback and suggestions
      // Verify comprehensive feedback sections
      await expect(page.locator('[data-testid="vocal-analysis"]')).toBeVisible();
      await expect(page.locator('[data-testid="content-analysis"]')).toBeVisible();
      await expect(page.locator('[data-testid="improvement-suggestions"]')).toBeVisible();
      
      // Check specific feedback elements
      await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="pace-analysis"]')).toBeVisible();
      await expect(page.locator('[data-testid="objection-handling-score"]')).toBeVisible();
      
      // Review suggestions
      const suggestions = await page.locator('[data-testid="suggestion-item"]').all();
      expect(suggestions.length).toBeGreaterThan(2);
      
      // Save feedback for later review
      await page.getByRole('button', { name: /Save Feedback/i }).click();
      await expect(page.locator('text=/Feedback saved/i')).toBeVisible();
      
      // Step 4: Track progress over multiple sessions
      // Complete additional practice sessions
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Practice Again/i }).click();

        // Wait for practice mode selection to be available
        await expect(page.locator('[data-testid="mode-selection"]')).toBeVisible();

        // Alternate between voice and text
        if (i % 2 === 0) {
          await page.getByRole('button', { name: /Text Mode/i }).click();
          await expect(page.locator('textarea')).toBeVisible();
          await page.fill('textarea', `Practice response ${i + 2}: I understand your concern about the price. Let me show you the ROI...`);
        } else {
          await page.getByRole('button', { name: /Voice Mode/i }).click();
          await expect(page.getByRole('button', { name: /Use Sample Recording/i })).toBeVisible();
          await page.getByRole('button', { name: /Use Sample Recording/i }).click();
        }

        await page.getByRole('button', { name: /Submit/i }).click();
        await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 15000 });
      }
      
      // Navigate to progress tracking
      await page.getByRole('link', { name: /View Progress/i }).click();
      await expect(page).toHaveURL('/progress');
      
      // Verify progress metrics
      await expect(page.locator('[data-testid="total-sessions"]')).toContainText('4');
      await expect(page.locator('[data-testid="improvement-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="streak-counter"]')).toBeVisible();
      
      // Check session history
      const sessions = await page.locator('[data-testid="session-item"]').all();
      expect(sessions.length).toBe(4);
      
      // Step 5: Upgrade to paid plan
      await page.getByRole('link', { name: /Upgrade Plan/i }).click();
      await expect(page).toHaveURL('/pricing');
      
      // Select Professional plan
      await page.getByRole('button', { name: /Choose Professional/i }).click();
      
      // Fill payment details
      await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
      
      // Use Stripe test card
      const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
      // Wait for Stripe iframe to be fully loaded
      await expect(stripeFrame.locator('[placeholder="Card number"]')).toBeVisible({ timeout: 10000 });
      await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
      await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/25');
      await stripeFrame.locator('[placeholder="CVC"]').fill('123');
      // Complete purchase
      await page.getByRole('button', { name: /Start Subscription/i }).click();
      
      // Verify upgrade success
      await expect(page.locator('text=/Welcome to Professional/i')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="plan-badge"]')).toContainText('Professional');
    });
  });

  test.describe('Experienced Sales Professional', () => {
    test.beforeEach(async ({ page, context }) => {
      // Mock experienced user with existing data
      await context.addCookies([{
        name: 'auth-token',
        value: 'experienced-user-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      // Set up localStorage for experienced user
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('user_level', 'experienced');
        localStorage.setItem('total_sessions', '50');
        localStorage.setItem('subscription_plan', 'professional');
      });

      // Verify localStorage was set correctly
      const userLevel = await page.evaluate(() => localStorage.getItem('user_level'));
      expect(userLevel).toBe('experienced');
    });

    test('practice advanced objection handling scenarios', async ({ page }) => {
      await page.goto('/practice');
      
      // Access advanced scenarios
      await page.getByRole('button', { name: /Advanced Scenarios/i }).click();
      
      // Verify advanced options available
      await expect(page.locator('[data-testid="scenario-difficulty"]')).toBeVisible();
      await page.selectOption('[data-testid="scenario-difficulty"]', 'expert');
      
      // Select complex multi-objection scenario
      await page.selectOption('[data-testid="objection-scenario"]', 'multi-stakeholder-resistance');
      
      // Verify complex scenario details
      await expect(page.locator('[data-testid="scenario-description"]')).toContainText(/multiple stakeholders/i);
      await expect(page.locator('[data-testid="scenario-context"]')).toContainText(/enterprise deal/i);
      
      // Practice with advanced techniques
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      const advancedResponse = `I appreciate you bringing up the concerns from multiple stakeholders. 
      Let's address each one systematically. 
      
      For the CFO's ROI concerns, our enterprise clients typically see a 312% ROI within 18 months...
      
      Regarding the IT team's integration worries, we offer a phased implementation with dedicated support...
      
      For the end-user adoption concerns, we provide comprehensive training and have a 94% user satisfaction rate...`;
      
      await page.fill('textarea', advancedResponse);
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify advanced AI analysis
      await expect(page.locator('[data-testid="advanced-analysis"]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('[data-testid="stakeholder-mapping"]')).toBeVisible();
      await expect(page.locator('[data-testid="persuasion-techniques"]')).toBeVisible();
      await expect(page.locator('[data-testid="deal-probability-score"]')).toBeVisible();
    });

    test('use custom scenarios', async ({ page }) => {
      await page.goto('/practice');
      
      // Access custom scenario builder
      await page.getByRole('button', { name: /Create Custom Scenario/i }).click();
      
      // Fill custom scenario details
      await page.fill('input[name="scenarioTitle"]', 'SaaS Platform Security Concerns');
      await page.fill('textarea[name="customerObjection"]', 'We\'re concerned about data security and compliance with GDPR/HIPAA requirements.');
      
      // Add context
      await page.fill('input[name="industry"]', 'Healthcare Technology');
      await page.fill('input[name="dealSize"]', '500000');
      await page.selectOption('select[name="salesStage"]', 'negotiation');
      
      // Add specific challenges
      await page.getByRole('button', { name: /Add Challenge/i }).click();
      await page.fill('input[name="challenge1"]', 'Recent data breach at competitor');
      
      // Save custom scenario
      await page.getByRole('button', { name: /Save Scenario/i }).click();
      await expect(page.locator('text=/Scenario saved/i')).toBeVisible();
      
      // Use the custom scenario
      await page.selectOption('[data-testid="scenario-type"]', 'custom');
      await page.selectOption('[data-testid="custom-scenarios"]', 'SaaS Platform Security Concerns');
      
      // Practice with custom scenario
      await page.getByRole('button', { name: /Start Practice/i }).click();
      await expect(page.locator('text=/GDPR\/HIPAA requirements/i')).toBeVisible();
    });

    test('analyze progress reports and analytics', async ({ page }) => {
      await page.goto('/analytics');
      
      // Verify experienced user analytics
      await expect(page.locator('[data-testid="total-practice-hours"]')).toBeVisible();
      await expect(page.locator('[data-testid="skill-progression-chart"]')).toBeVisible();
      
      // Check advanced metrics
      await expect(page.locator('[data-testid="objection-category-breakdown"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-rate-by-type"]')).toBeVisible();
      await expect(page.locator('[data-testid="vocal-improvement-trends"]')).toBeVisible();
      
      // Generate detailed report
      await page.getByRole('button', { name: /Generate Report/i }).click();
      
      // Select report parameters
      await page.selectOption('select[name="reportPeriod"]', 'last-quarter');
      await page.check('input[name="includeVoiceAnalysis"]');
      await page.check('input[name="includeImprovementPlan"]');
      
      // Generate and download report
      await page.getByRole('button', { name: /Download Report/i }).click();
      
      // Verify report generation
      // Generate and download report with error handling
      await page.getByRole('button', { name: /Download Report/i }).click();

      // Verify report generation with timeout
      try {
        const download = await page.waitForEvent('download', { timeout: 15000 });
        expect(download.suggestedFilename()).toContain('progress-report');
        expect(download.suggestedFilename()).toContain('.pdf');
      } catch (error) {
        throw new Error(`Download failed: ${error.message}`);
      }
    });

    test('share results with team', async ({ page }) => {
      await page.goto('/analytics');
      
      // Access sharing features
      await page.getByRole('button', { name: /Share Progress/i }).click();
      
      // Select sharing options
      await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
      
      // Share via email
      await page.fill('input[name="shareEmail"]', 'manager@company.com');
      await page.selectOption('select[name="shareTimeframe"]', 'last-month');
      await page.check('input[name="includeHighlights"]');
      
      // Add personal note
      await page.fill('textarea[name="personalNote"]', 'Here\'s my progress update for our 1:1 meeting.');
      
      // Send share
      await page.getByRole('button', { name: /Send Report/i }).click();
      await expect(page.locator('text=/Report sent successfully/i')).toBeVisible();
      
      // Create shareable link
      await page.getByRole('button', { name: /Create Shareable Link/i }).click();
      await expect(page.locator('[data-testid="share-link"]')).toBeVisible();
      
      // Copy link
      await page.getByRole('button', { name: /Copy Link/i }).click();
      await expect(page.locator('text=/Link copied/i')).toBeVisible();
    });
  });

  test.describe('Sales Manager/Team Lead', () => {
    test.beforeEach(async ({ page, context }) => {
      // Mock team lead user
      await context.addCookies([{
        name: 'auth-token',
        value: 'team-lead-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'team_lead');
        localStorage.setItem('team_size', '10');
        localStorage.setItem('subscription_plan', 'enterprise');
      });

      // Verify localStorage was set correctly
      const userRole = await page.evaluate(() => localStorage.getItem('user_role'));
      expect(userRole).toBe('team_lead');
    });

    test('set up team accounts', async ({ page }) => {
      await page.goto('/team-dashboard');
      
      // Verify team lead dashboard
      await expect(page.locator('h1')).toContainText(/Team Dashboard/i);
      await expect(page.locator('[data-testid="team-overview"]')).toBeVisible();
      
      // Add new team member
      await page.getByRole('button', { name: /Add Team Member/i }).click();
      
      // Fill team member details
      await page.fill('input[name="memberName"]', 'Sarah Johnson');
      await page.fill('input[name="memberEmail"]', 'sarah.johnson@company.com');
      await page.selectOption('select[name="memberRole"]', 'senior-sales-rep');
      
      // Set permissions
      await page.check('input[name="canViewTeamAnalytics"]');
      await page.check('input[name="canCreateCustomScenarios"]');
      
      // Send invitation
      await page.getByRole('button', { name: /Send Invitation/i }).click();
      await expect(page.locator('text=/Invitation sent/i')).toBeVisible();
      
      // Bulk import team members
      await page.getByRole('button', { name: /Bulk Import/i }).click();
      
      // Upload CSV
      const csvContent = `name,email,role
John Smith,john.smith@company.com,sales-rep
Emily Davis,emily.davis@company.com,senior-sales-rep
Michael Brown,michael.brown@company.com,sales-rep`;
      
      await page.setInputFiles('input[type="file"]', {
        name: 'team-members.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      });
      
      // Confirm import
      await page.getByRole('button', { name: /Import Team/i }).click();
      await expect(page.locator('text=/3 team members imported/i')).toBeVisible();
      
      // Verify team list updated
      await expect(page.locator('[data-testid="team-member"]')).toHaveCount(4);
    });

    test('monitor team progress and analytics', async ({ page }) => {
      await page.goto('/team-dashboard');
      
      // View team analytics
      await page.getByRole('tab', { name: /Team Analytics/i }).click();
      
      // Verify team metrics
      await expect(page.locator('[data-testid="team-activity-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="team-improvement-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
      
      // Filter by time period
      await page.selectOption('select[name="analyticsPeriod"]', 'this-month');
      
      // View individual member progress
      await page.locator('[data-testid="team-member-row"]').first().click();
      
      // Verify member details
      await expect(page.locator('[data-testid="member-progress-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="member-session-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="member-improvement-areas"]')).toBeVisible();
      await expect(page.locator('[data-testid="member-strengths"]')).toBeVisible();
      
      // Compare team members
      await page.getByRole('button', { name: /Close/i }).click();
      await page.getByRole('button', { name: /Compare Members/i }).click();
      
      // Select members to compare
      await page.check('input[value="member1"]');
      await page.check('input[value="member2"]');
      await page.getByRole('button', { name: /Generate Comparison/i }).click();
      
      // Verify comparison view
      await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="skill-comparison"]')).toBeVisible();
    });

    test('manage team subscriptions and billing', async ({ page }) => {
      await page.goto('/team-dashboard');
      
      // Navigate to billing section
      await page.getByRole('tab', { name: /Billing & Subscriptions/i }).click();
      
      // Verify current plan details
      await expect(page.locator('[data-testid="current-plan"]')).toContainText('Enterprise');
      await expect(page.locator('[data-testid="active-seats"]')).toContainText('10');
      await expect(page.locator('[data-testid="monthly-cost"]')).toBeVisible();
      
      // Add more seats
      await page.getByRole('button', { name: /Add Seats/i }).click();
      
      // Specify additional seats
      await page.fill('input[name="additionalSeats"]', '5');
      await expect(page.locator('[data-testid="price-preview"]')).toContainText('$745'); // Example calculation
      
      // Confirm addition
      await page.getByRole('button', { name: /Confirm Addition/i }).click();
      await expect(page.locator('text=/5 seats added/i')).toBeVisible();
      
      // Manage individual licenses
      await page.getByRole('button', { name: /Manage Licenses/i }).click();
      
      // Deactivate inactive user
      const inactiveUser = page.locator('[data-testid="user-row"][data-status="inactive"]').first();
      await inactiveUser.locator('button:text("Deactivate")').click();
      
      // Confirm deactivation
      await page.getByRole('button', { name: /Confirm Deactivation/i }).click();
      await expect(page.locator('text=/License deactivated/i')).toBeVisible();
      
      // View billing history
      await page.getByRole('button', { name: /Billing History/i }).click();
      await expect(page.locator('[data-testid="invoice-list"]')).toBeVisible();
      
      // Download invoice
      await page.locator('[data-testid="invoice-row"]').first().locator('button:text("Download")').click();
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toContain('invoice');
    });

    test('access team collaboration features', async ({ page }) => {
      await page.goto('/team-dashboard');
      
      // Create team challenge
      await page.getByRole('tab', { name: /Team Activities/i }).click();
      await page.getByRole('button', { name: /Create Challenge/i }).click();
      
      // Set up challenge details
      await page.fill('input[name="challengeName"]', 'Q4 Objection Mastery Challenge');
      await page.fill('textarea[name="challengeDescription"]', 'Master the top 5 objections from Q3 lost deals');
      
      // Set challenge parameters
      await page.selectOption('select[name="challengeDuration"]', '2-weeks');
      await page.selectOption('select[name="challengeType"]', 'most-improved');
      
      // Select specific scenarios
      await page.check('input[value="price-objection"]');
      await page.check('input[value="competitor-comparison"]');
      await page.check('input[value="timing-objection"]');
      
      // Set rewards
      await page.fill('input[name="reward"]', '$100 Amazon Gift Card');
      
      // Launch challenge
      await page.getByRole('button', { name: /Launch Challenge/i }).click();
      await expect(page.locator('text=/Challenge created/i')).toBeVisible();
      
      // Share best practices
      await page.getByRole('tab', { name: /Best Practices/i }).click();
      await page.getByRole('button', { name: /Share Best Practice/i }).click();
      
      // Add best practice
      await page.fill('input[name="practiceTitle"]', 'Handling "Need to Think About It" Objection');
      await page.fill('textarea[name="practiceDescription"]', 'Use the "Consequence of Inaction" framework...');
      
      // Attach example recording
      await page.getByRole('button', { name: /Attach Recording/i }).click();
      await page.selectOption('select[name="recordingId"]', 'recording-123');
      
      // Share with team
      await page.getByRole('button', { name: /Share with Team/i }).click();
      await expect(page.locator('text=/Best practice shared/i')).toBeVisible();
      
      // Set up team meeting
      await page.getByRole('button', { name: /Schedule Team Session/i }).click();
      
      // Configure virtual practice session
      await page.fill('input[name="sessionTitle"]', 'Weekly Objection Handling Practice');
      await page.fill('input[name="sessionDate"]', '2024-01-15');
      await page.fill('input[name="sessionTime"]', '14:00');
      
      // Add agenda items
      await page.fill('textarea[name="agenda"]', '1. Review last week\'s challenges\n2. Practice new objection scenarios\n3. Share wins and learnings');
      
      // Send invites
      await page.getByRole('button', { name: /Send Invitations/i }).click();
      await expect(page.locator('text=/Session scheduled/i')).toBeVisible();
    });
  });
});
