import { test, expect } from '@playwright/test';

test.describe('Demo & Interactive Features', () => {
  test.describe('Interactive Demo', () => {
    test('objection handling practice scenario', async ({ page }) => {
      await page.goto('/demo');
      
      // Verify demo page loaded
      await expect(page.locator('h1')).toContainText(/Try PitchPerfectAI/i);
      
      // Check for scenario selection
      await expect(page.locator('[data-testid="scenario-selector"]')).toBeVisible();
      
      // Select a scenario
      await page.selectOption('[data-testid="scenario-selector"]', 'price-objection');
      
      // Verify scenario details
      await expect(page.locator('[data-testid="scenario-description"]')).toContainText(/price is too high/i);
      
      // Check for practice prompt
      await expect(page.locator('[data-testid="practice-prompt"]')).toBeVisible();
    });

    test('voice input in demo mode', async ({ page }) => {
      await page.goto('/demo');
      
      // Select voice mode
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Verify microphone access prompt
      await expect(page.locator('[data-testid="demo-mic-prompt"]')).toBeVisible();
      
      // Grant permission and record
      await page.context().grantPermissions(['microphone']);
      await page.getByRole('button', { name: /Start Recording/i }).click();
      
      // Verify recording state
      await expect(page.locator('[data-testid="demo-recording"]')).toBeVisible();
      
      // Stop and verify processing
      await page.waitForTimeout(2000);
      await page.getByRole('button', { name: /Stop Recording/i }).click();
      await expect(page.locator('text=/Processing your response/i')).toBeVisible();
    });

    test('text input in demo mode', async ({ page }) => {
      await page.goto('/demo');
      
      // Select text mode
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Verify text input area
      await expect(page.locator('textarea[placeholder*="Type your response"]')).toBeVisible();
      
      // Enter demo response
      await page.fill('textarea', 'I understand the price concern. Let me demonstrate the value...');
      
      // Submit response
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify processing
      await expect(page.locator('text=/Analyzing your response/i')).toBeVisible();
    });

    test('AI feedback generation in demo', async ({ page }) => {
      await page.goto('/demo');
      
      // Complete a demo practice
      await page.getByRole('button', { name: /Text Mode/i }).click();
      await page.fill('textarea', 'Demo response for testing AI feedback');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Wait for AI feedback
      await expect(page.locator('[data-testid="demo-ai-feedback"]')).toBeVisible({ timeout: 15000 });
      
      // Verify feedback is limited (demo version)
      await expect(page.locator('text=/This is a demo version/i')).toBeVisible();
      
      // Check for signup prompt
      await expect(page.locator('text=/Sign up for full analysis/i')).toBeVisible();
      await expect(page.getByRole('link', { name: /Sign Up Now/i })).toBeVisible();
    });

    test('demo progression and user guidance', async ({ page }) => {
      await page.goto('/demo');
      
      // Check for step indicators
      await expect(page.locator('[data-testid="demo-steps"]')).toBeVisible();
      
      // Verify step 1
      await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/active/);
      
      // Progress through demo
      await page.selectOption('[data-testid="scenario-selector"]', 'price-objection');
      await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/active/);
      
      // Complete response
      await page.getByRole('button', { name: /Text Mode/i }).click();
      await page.fill('textarea', 'Test response');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify final step
      await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/active/);
    });

    test('demo works without account creation', async ({ page }) => {
      // Ensure we're not logged in
      await page.context().clearCookies();
      
      await page.goto('/demo');
      
      // Verify demo is accessible
      await expect(page.locator('h1')).toContainText(/Try PitchPerfectAI/i);
      
      // Complete a full demo flow
      await page.selectOption('[data-testid="scenario-selector"]', 'price-objection');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      await page.fill('textarea', 'Test without login');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify feedback is shown
      await expect(page.locator('[data-testid="demo-ai-feedback"]')).toBeVisible({ timeout: 15000 });
      
      // Verify no login required message
      await expect(page.locator('text=/No account required/i')).toBeVisible();
    });
  });
});

test.describe('Credit System & Billing', () => {
  test.describe('Credit Management', () => {
    test.beforeEach(async ({ page, context }) => {
      // Mock authentication
      await context.addCookies([{
        name: 'auth-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/'
      }]);
    });

    test('credit consumption tracking - roleplay (1 credit)', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check initial credits
      const initialCredits = await page.locator('[data-testid="credit-balance"]').textContent();
      
      // Navigate to roleplay
      await page.goto('/roleplay');
      
      // Complete a roleplay session
      await page.getByRole('button', { name: /Start Roleplay/i }).click();
      await page.fill('textarea', 'Roleplay response');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Wait for completion
      await expect(page.locator('[data-testid="roleplay-complete"]')).toBeVisible({ timeout: 10000 });
      
      // Return to dashboard and verify 1 credit consumed
      await page.goto('/dashboard');
      const newCredits = await page.locator('[data-testid="credit-balance"]').textContent();
      
      // Verify credit deduction
      const parseCredits = (text: string | null) => {
        const match = text?.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };
      expect(parseCredits(newCredits)).toBe(parseCredits(initialCredits) - 1);
    });

    test('credit consumption tracking - AI voice (2-3 credits)', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check initial credits
      const initialCredits = await page.locator('[data-testid="credit-balance"]').textContent();
      
      // Navigate to voice training
      await page.goto('/voice-training');
      
      // Complete AI voice analysis
      await page.getByRole('button', { name: /Start AI Voice Analysis/i }).click();
      await page.getByRole('button', { name: /Use Sample/i }).click();
      
      // Wait for analysis
      await expect(page.locator('[data-testid="voice-analysis-complete"]')).toBeVisible({ timeout: 15000 });
      
      // Return to dashboard
      await page.goto('/dashboard');
      const newCredits = await page.locator('[data-testid="credit-balance"]').textContent();
      
      // Verify 2-3 credits consumed
      const creditsUsed = parseInt(initialCredits || '0') - parseInt(newCredits || '0');
      expect(creditsUsed).toBeGreaterThanOrEqual(2);
      expect(creditsUsed).toBeLessThanOrEqual(3);
    });

    test('credit balance display and updates', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Verify credit balance is visible
      await expect(page.locator('[data-testid="credit-balance"]')).toBeVisible();
      
      // Check for credit indicator styling
      await expect(page.locator('[data-testid="credit-balance"]')).toHaveClass(/credit-display/);
      
      // Verify real-time update after usage
      const initialCredits = await page.locator('[data-testid="credit-balance"]').textContent();
      
      // Use a credit
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      await page.fill('textarea', 'Test');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Check balance updated without refresh
      await page.waitForTimeout(2000);
      const updatedCredits = await page.locator('[data-testid="header-credit-balance"]').textContent();
      expect(updatedCredits).not.toBe(initialCredits);
    });

    test('credit purchase flow - all tiers', async ({ page }) => {
      await page.goto('/pricing');
      
      // Test Starter Pack
      await page.getByRole('button', { name: /Buy Starter Pack.*50 credits/i }).click();
      await expect(page.locator('[data-testid="checkout-modal"]')).toBeVisible();
      await expect(page.locator('text=/$29/i')).toBeVisible();
      await page.getByRole('button', { name: /Cancel/i }).click();
      
      // Test Growth Pack
      await page.getByRole('button', { name: /Buy Growth Pack.*150 credits/i }).click();
      await expect(page.locator('[data-testid="checkout-modal"]')).toBeVisible();
      await expect(page.locator('text=/$79/i')).toBeVisible();
      await page.getByRole('button', { name: /Cancel/i }).click();
      
      // Test Pro Pack
      await page.getByRole('button', { name: /Buy Pro Pack.*500 credits/i }).click();
      await expect(page.locator('[data-testid="checkout-modal"]')).toBeVisible();
      await expect(page.locator('text=/$199/i')).toBeVisible();
    });

    test('credits never expire verification', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click on credit balance for details
      await page.locator('[data-testid="credit-balance"]').click();
      
      // Verify no expiration message
      await expect(page.locator('text=/Credits never expire/i')).toBeVisible();
      
      // Check credit history
      await page.getByRole('button', { name: /View Credit History/i }).click();
      await expect(page.locator('[data-testid="credit-history-table"]')).toBeVisible();
      
      // Verify no expiration dates shown
      const expirationCells = await page.locator('td:has-text("Expires")').count();
      expect(expirationCells).toBe(0);
    });

    test('low credit warnings and notifications', async ({ page }) => {
      // Mock low credit scenario
      await page.goto('/dashboard');
      
      // Force low credit state (would normally be done via API)
      await page.evaluate(() => {
        window.localStorage.setItem('mock_credits', '3');
      });
      
      await page.reload();
      
      // Check for low credit warning
      await expect(page.locator('[data-testid="low-credit-warning"]')).toBeVisible();
      await expect(page.locator('text=/Only 3 credits remaining/i')).toBeVisible();
      
      // Verify purchase prompt
      await expect(page.getByRole('button', { name: /Buy More Credits/i })).toBeVisible();
    });
  });

  test.describe('Subscription Management', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.addCookies([{
        name: 'auth-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/'
      }]);
    });

    test('subscription plan upgrades', async ({ page }) => {
      await page.goto('/subscription');
      
      // Current plan: Starter
      await expect(page.locator('[data-testid="current-plan"]')).toContainText(/Starter/i);
      
      // Click upgrade to Professional
      await page.getByRole('button', { name: /Upgrade to Professional/i }).click();
      
      // Verify upgrade modal
      await expect(page.locator('[data-testid="upgrade-modal"]')).toBeVisible();
      await expect(page.locator('text=/Upgrade to Professional Plan/i')).toBeVisible();
      await expect(page.locator('text=/$49.*month/i')).toBeVisible();
      
      // Confirm upgrade
      await page.getByRole('button', { name: /Confirm Upgrade/i }).click();
      
      // Verify success message
      await expect(page.locator('text=/Plan upgraded successfully/i')).toBeVisible();
    });

    test('subscription plan downgrades', async ({ page }) => {
      await page.goto('/subscription');
      
      // Mock current plan as Professional
      await page.evaluate(() => {
        window.localStorage.setItem('mock_plan', 'professional');
      });
      await page.reload();
      
      // Click downgrade
      await page.getByRole('button', { name: /Change Plan/i }).click();
      await page.getByRole('button', { name: /Switch to Starter/i }).click();
      
      // Verify downgrade warning
      await expect(page.locator('text=/Downgrade Notice/i')).toBeVisible();
      await expect(page.locator('text=/changes will take effect at the end/i')).toBeVisible();
      
      // Confirm downgrade
      await page.getByRole('button', { name: /Confirm Downgrade/i }).click();
      
      // Verify success
      await expect(page.locator('text=/Plan change scheduled/i')).toBeVisible();
    });

    test('billing cycle management', async ({ page }) => {
      await page.goto('/subscription');
      
      // Check current billing cycle
      await expect(page.locator('[data-testid="billing-cycle"]')).toBeVisible();
      await expect(page.locator('[data-testid="next-billing-date"]')).toBeVisible();
      
      // Switch billing cycle
      await page.getByRole('button', { name: /Switch to Annual/i }).click();
      
      // Verify savings message
      await expect(page.locator('text=/Save 20% with annual billing/i')).toBeVisible();
      
      // Confirm switch
      await page.getByRole('button', { name: /Switch to Annual Billing/i }).click();
      
      // Verify update
      await expect(page.locator('text=/Billing cycle updated/i')).toBeVisible();
    });

    test('cancellation process', async ({ page }) => {
      await page.goto('/subscription');
      
      // Click cancel subscription
      await page.getByRole('button', { name: /Cancel Subscription/i }).click();
      
      // Verify cancellation flow
      await expect(page.locator('text=/We\'re sorry to see you go/i')).toBeVisible();
      
      // Select reason
      await page.selectOption('[data-testid="cancellation-reason"]', 'too-expensive');
      
      // Add feedback
      await page.fill('textarea[name="feedback"]', 'Testing cancellation flow');
      
      // Confirm cancellation
      await page.getByRole('button', { name: /Confirm Cancellation/i }).click();
      
      // Verify confirmation
      await expect(page.locator('text=/Subscription cancelled/i')).toBeVisible();
      await expect(page.locator('text=/Access until/i')).toBeVisible();
    });

    test('7-day money-back guarantee', async ({ page }) => {
      await page.goto('/subscription');
      
      // Check for guarantee message
      await expect(page.locator('text=/7-day money-back guarantee/i')).toBeVisible();
      
      // Mock recent subscription (within 7 days)
      await page.evaluate(() => {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 3);
        window.localStorage.setItem('subscription_start', recentDate.toISOString());
      });
      await page.reload();
      
      // Click refund option
      await page.getByRole('button', { name: /Request Refund/i }).click();
      
      // Verify refund eligibility
      await expect(page.locator('text=/Eligible for full refund/i')).toBeVisible();
      await expect(page.locator('text=/4 days remaining/i')).toBeVisible();
      
      // Process refund
      await page.getByRole('button', { name: /Process Refund/i }).click();
      
      // Verify refund confirmation
      await expect(page.locator('text=/Refund processed/i')).toBeVisible();
    });

    test('Stripe payment integration', async ({ page }) => {
      await page.goto('/subscription');
      
      // Update payment method
      await page.getByRole('button', { name: /Update Payment Method/i }).click();
      
      // Verify Stripe elements
      await expect(page.frameLocator('iframe[title="Secure payment input frame"]')).toBeVisible();
      
      // Check for Stripe branding
      await expect(page.locator('text=/Powered by Stripe/i')).toBeVisible();
      
      // Verify secure indicators
      await expect(page.locator('[data-testid="secure-badge"]')).toBeVisible();
      await expect(page.locator('text=/SSL Encrypted/i')).toBeVisible();
    });
  });
});
