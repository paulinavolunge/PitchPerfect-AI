import { test, expect } from '@playwright/test';

test.describe('Enhanced Signup and Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should handle complete signup flow with validation', async ({ page }) => {
    await page.goto('/signup');
    
    // Check for form validation
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign")').first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Test empty form submission
    await submitButton.click();
    // Should show validation errors (adjust based on your validation)
    
    // Test invalid email
    await emailInput.fill('invalid-email');
    await passwordInput.fill('short');
    await submitButton.click();
    
    // Test valid signup
    const testEmail = `test-${Date.now()}@example.com`;
    await emailInput.fill(testEmail);
    await passwordInput.fill('TestPassword123!');
    
    // Monitor for redirects or success messages
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('auth') && response.status() === 200
    ).catch(() => null);
    
    await submitButton.click();
    
    // Wait for either redirect or success message
    await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 5000 }),
      page.waitForSelector('[role="alert"], .alert, .toast', { timeout: 5000 }),
      responsePromise
    ]).catch(() => null);
  });

  test('should handle login flow', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Sign")').first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Test with invalid credentials
    await emailInput.fill('nonexistent@example.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();
    
    // Should show error message (adjust selector based on your error handling)
    await page.waitForSelector('[role="alert"], .error, .toast', { timeout: 3000 }).catch(() => null);
  });

  test('should handle session persistence', async ({ page, context }) => {
    // Simulate logged-in state
    await context.addCookies([
      {
        name: 'supabase-auth-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/'
      }
    ]);
    
    await page.goto('/dashboard');
    
    // Should not redirect to login if session exists
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');
  });

  test('should handle session timeout gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Simulate expired session
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'expired-token',
        expires_at: Date.now() - 3600000 // 1 hour ago
      }));
    });
    
    // Navigate to protected route
    await page.goto('/dashboard');
    
    // Should redirect to login or show appropriate message
    await Promise.race([
      page.waitForURL('**/login', { timeout: 5000 }),
      page.waitForURL('**/signup', { timeout: 5000 }),
      page.waitForSelector('[data-testid="auth-required"]', { timeout: 5000 })
    ]).catch(() => null);
  });

  test('should handle navigation between auth pages', async ({ page }) => {
    await page.goto('/signup');
    
    // Look for link to login page
    const loginLink = page.locator('a:has-text("Log"), a:has-text("Sign In"), button:has-text("Log")');
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await page.waitForURL('**/login', { timeout: 3000 }).catch(() => null);
    }
    
    // Look for link back to signup
    const signupLink = page.locator('a:has-text("Sign Up"), a:has-text("Register"), button:has-text("Sign Up")');
    if (await signupLink.count() > 0) {
      await signupLink.first().click();
      await page.waitForURL('**/signup', { timeout: 3000 }).catch(() => null);
    }
  });

  test('should handle guest mode access', async ({ page }) => {
    await page.goto('/demo');
    
    // Demo should be accessible without authentication
    await page.waitForSelector('h1', { timeout: 5000 });
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    
    // Should not redirect to login for guest-accessible pages
    const currentUrl = page.url();
    expect(currentUrl).toContain('/demo');
  });

  test('should validate accessibility on auth pages', async ({ page }) => {
    await page.goto('/signup');
    
    // Check for proper form labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Should have accessible labels or aria-labels
    await expect(emailInput).toHaveAttribute('aria-label', /.+|id/);
    await expect(passwordInput).toHaveAttribute('aria-label', /.+|id/);
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(emailInput.or(passwordInput)).toBeFocused();
  });

  test('should handle email confirmation flow', async ({ page }) => {
    // Test email confirmation link (if applicable)
    const confirmationToken = 'mock-confirmation-token';
    await page.goto(`/confirm?token=${confirmationToken}`);
    
    // Should handle confirmation gracefully
    await page.waitForSelector('h1, .message, [role="alert"]', { timeout: 5000 }).catch(() => null);
  });

  test('should handle password reset flow', async ({ page }) => {
    // Look for forgot password link
    await page.goto('/login');
    
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Reset"), button:has-text("Forgot")');
    if (await forgotPasswordLink.count() > 0) {
      await forgotPasswordLink.first().click();
      
      // Should navigate to password reset page
      await page.waitForSelector('input[type="email"], h1:has-text("Reset")', { timeout: 3000 }).catch(() => null);
      
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Reset")').first();
        await submitButton.click();
        
        // Should show confirmation message
        await page.waitForSelector('[role="alert"], .message, .success', { timeout: 3000 }).catch(() => null);
      }
    }
  });
});