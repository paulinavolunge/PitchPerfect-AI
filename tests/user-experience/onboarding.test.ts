import { test, expect } from '@playwright/test';

test.describe('New User Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete signup flow from landing page to first use', async ({ page }) => {
    // Test landing page elements
    await expect(page.locator('h1')).toContainText(/Master Sales Objections/i);
    
    // Click on signup button
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Verify signup page loaded
    await expect(page).toHaveURL('/signup');
    
    // Fill signup form
    const testEmail = `test_${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Verify redirect to email confirmation
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('email verification process', async ({ page }) => {
    // Navigate to email confirmation page
    await page.goto('/email-confirmed');
    
    // Verify confirmation message
    await expect(page.locator('h1')).toContainText(/Email Confirmed/i);
    
    // Check for dashboard redirect button
    await expect(page.getByRole('button', { name: /Go to Dashboard/i })).toBeVisible();
  });

  test('free trial activation', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([{
      name: 'auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/'
    }]);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Verify free trial status
    await expect(page.locator('text=Free Trial')).toBeVisible();
    
    // Check for credit balance
    await expect(page.locator('text=/1 free AI analysis/i')).toBeVisible();
  });

  test('initial user experience and tutorial', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([{
      name: 'auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/'
    }]);
    
    await page.goto('/dashboard');
    
    // Check for onboarding elements
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    
    // Verify tutorial elements
    await expect(page.locator('[data-testid="getting-started"]')).toBeVisible();
    
    // Check for demo option
    await expect(page.getByRole('link', { name: /Try Demo/i })).toBeVisible();
  });

  test('verify 1 free AI analysis works', async ({ page, context }) => {
    // Mock authentication with new user
    await context.addCookies([{
      name: 'auth-token',
      value: 'mock-new-user-token',
      domain: 'localhost',
      path: '/'
    }]);
    
    await page.goto('/practice');
    
    // Check for free analysis indicator
    await expect(page.locator('text=/1 free analysis remaining/i')).toBeVisible();
    
    // Start a practice session
    await page.getByRole('button', { name: /Start Practice/i }).click();
    
    // Complete a practice (text mode for simplicity)
    await page.fill('textarea', 'This is a test response to handle an objection.');
    await page.getByRole('button', { name: /Submit/i }).click();
    
    // Verify AI feedback is generated
    await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 10000 });
    
    // Check that free analysis is consumed
    await expect(page.locator('text=/0 free analyses remaining/i')).toBeVisible();
  });
});
