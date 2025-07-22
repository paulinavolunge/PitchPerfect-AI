import { test, expect } from '@playwright/test';

test.describe('Core User Flows', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([{
      name: 'auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/'
    }]);
  });

  test.describe('Practice Session Initiation', () => {
    test('voice practice session', async ({ page }) => {
      await page.goto('/practice');
      
      // Select voice mode
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Check microphone permission prompt
      await expect(page.locator('[data-testid="mic-permission"]')).toBeVisible();
      
      // Start recording
      await page.getByRole('button', { name: /Start Recording/i }).click();
      
      // Verify recording state
      await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
      
      // Stop recording
      await page.getByRole('button', { name: /Stop Recording/i }).click();
      
      // Verify processing state
      await expect(page.locator('text=/Processing/i')).toBeVisible();
    });

    test('text practice session', async ({ page }) => {
      await page.goto('/practice');
      
      // Select text mode
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Verify text input area
      await expect(page.locator('textarea[placeholder*="Type your response"]')).toBeVisible();
      
      // Enter response
      await page.fill('textarea', 'I understand your concern about the price. Let me show you the value...');
      
      // Submit response
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify processing
      await expect(page.locator('text=/Analyzing/i')).toBeVisible();
    });
  });

  test.describe('AI Feedback Generation', () => {
    test('feedback display and interaction', async ({ page }) => {
      await page.goto('/practice');
      
      // Complete a practice session
      await page.getByRole('button', { name: /Text Mode/i }).click();
      await page.fill('textarea', 'Test response for AI feedback');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Wait for feedback
      await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 10000 });
      
      // Verify feedback sections
      await expect(page.locator('text=/Strengths/i')).toBeVisible();
      await expect(page.locator('text=/Areas for Improvement/i')).toBeVisible();
      await expect(page.locator('text=/Suggestions/i')).toBeVisible();
      
      // Check feedback actions
      await expect(page.getByRole('button', { name: /Save Feedback/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible();
    });
  });

  test.describe('Progress Tracking', () => {
    test('analytics viewing', async ({ page }) => {
      await page.goto('/analytics');
      
      // Verify analytics components
      await expect(page.locator('h1')).toContainText(/Analytics/i);
      
      // Check for key metrics
      await expect(page.locator('[data-testid="total-sessions"]')).toBeVisible();
      await expect(page.locator('[data-testid="improvement-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="streak-counter"]')).toBeVisible();
      
      // Verify chart presence
      await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
      
      // Check date filter
      await expect(page.locator('select[name="dateRange"]')).toBeVisible();
    });

    test('progress page functionality', async ({ page }) => {
      await page.goto('/progress');
      
      // Verify progress elements
      await expect(page.locator('h1')).toContainText(/Progress/i);
      
      // Check for session history
      await expect(page.locator('[data-testid="session-history"]')).toBeVisible();
      
      // Verify filters
      await expect(page.locator('button:text("All Sessions")')).toBeVisible();
      await expect(page.locator('button:text("Voice Only")')).toBeVisible();
      await expect(page.locator('button:text("Text Only")')).toBeVisible();
    });
  });

  test.describe('Account Management', () => {
    test('account settings', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Navigate to settings
      await page.getByRole('button', { name: /Account Settings/i }).click();
      
      // Verify settings sections
      await expect(page.locator('text=/Profile Information/i')).toBeVisible();
      await expect(page.locator('text=/Email Preferences/i')).toBeVisible();
      await expect(page.locator('text=/Security/i')).toBeVisible();
      
      // Test profile update
      await page.fill('input[name="displayName"]', 'Test User');
      await page.getByRole('button', { name: /Save Changes/i }).click();
      
      // Verify success message
      await expect(page.locator('text=/Profile updated successfully/i')).toBeVisible();
    });

    test('password change', async ({ page }) => {
      await page.goto('/update-password');
      
      // Fill password change form
      await page.fill('input[name="currentPassword"]', 'CurrentPassword123!');
      await page.fill('input[name="newPassword"]', 'NewPassword123!');
      await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
      
      // Submit form
      await page.getByRole('button', { name: /Update Password/i }).click();
      
      // Verify success or error handling
      await expect(page.locator('text=/(Password updated|Error)/i')).toBeVisible();
    });
  });

  test.describe('Subscription Management', () => {
    test('view subscription details', async ({ page }) => {
      await page.goto('/subscription');
      
      // Verify subscription info
      await expect(page.locator('h1')).toContainText(/Subscription/i);
      await expect(page.locator('[data-testid="current-plan"]')).toBeVisible();
      await expect(page.locator('[data-testid="billing-cycle"]')).toBeVisible();
      
      // Check for upgrade/downgrade options
      await expect(page.locator('button:text("Change Plan")')).toBeVisible();
    });

    test('billing information', async ({ page }) => {
      await page.goto('/subscription');
      
      // Check billing section
      await expect(page.locator('text=/Payment Method/i')).toBeVisible();
      await expect(page.locator('text=/Next Billing Date/i')).toBeVisible();
      
      // Verify update payment method button
      await expect(page.getByRole('button', { name: /Update Payment Method/i })).toBeVisible();
    });
  });

  test.describe('Credit Usage', () => {
    test('credit balance display', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Verify credit balance is visible
      await expect(page.locator('[data-testid="credit-balance"]')).toBeVisible();
      
      // Check credit usage breakdown
      await page.getByRole('button', { name: /View Credit History/i }).click();
      await expect(page.locator('[data-testid="credit-history"]')).toBeVisible();
    });

    test('credit purchasing flow', async ({ page }) => {
      await page.goto('/pricing');
      
      // Click on credit package
      await page.getByRole('button', { name: /Buy 50 Credits/i }).click();
      
      // Verify checkout modal/page
      await expect(page.locator('text=/Checkout/i')).toBeVisible();
      
      // Check payment form
      await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
    });
  });
});
