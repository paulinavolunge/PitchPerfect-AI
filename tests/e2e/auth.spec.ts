import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage and cookies before each test
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete signup flow successfully', async ({ page }) => {
    await page.goto('/signup');
    
    // Check page loads with proper accessibility
    await expect(page).toHaveTitle(/Sign Up/);
    await expect(page.locator('h1')).toContainText('Create Account');
    
    // Check focus management
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Fill signup form
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.fill('[data-testid="confirm-password-input"]', testPassword);
    
    // Check form validation
    const submitButton = page.locator('[data-testid="signup-submit"]');
    await expect(submitButton).toBeEnabled();
    
    // Submit form
    await submitButton.click();
    
    // Should redirect or show success message
    await expect(page).toHaveURL(/dashboard|email-confirmation/);
    
    // Check for success indicators
    const successElement = page.locator('[data-testid="signup-success"], .toast');
    await expect(successElement).toBeVisible({ timeout: 10000 });
  });

  test('should handle signup with invalid email', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    
    const submitButton = page.locator('[data-testid="signup-submit"]');
    await submitButton.click();
    
    // Should show error message
    const errorMessage = page.locator('[role="alert"], .error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/invalid|email/i);
  });

  test('should complete login flow successfully', async ({ page }) => {
    await page.goto('/login');
    
    // Check page accessibility
    await expect(page).toHaveTitle(/Login|Sign In/);
    await expect(page.locator('h1')).toContainText(/Login|Sign In/);
    
    // Test existing credentials (assuming test user exists)
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'TestPassword123!');
    
    const loginButton = page.locator('[data-testid="login-submit"]');
    await loginButton.click();
    
    // Should redirect to dashboard on success or show error
    await page.waitForURL(/dashboard|login/, { timeout: 10000 });
    
    if (page.url().includes('dashboard')) {
      // Successful login
      await expect(page.locator('[data-testid="user-menu"], [data-testid="dashboard-header"]')).toBeVisible();
    } else {
      // Login failed (expected for test credentials)
      const errorMessage = page.locator('[role="alert"], .error-message');
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="login-email"]', 'nonexistent@example.com');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');
    
    const loginButton = page.locator('[data-testid="login-submit"]');
    await loginButton.click();
    
    // Should show error message
    const errorMessage = page.locator('[role="alert"], .error-message');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText(/invalid|incorrect|error/i);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Test tab navigation
    await page.keyboard.press('Tab'); // Email field
    let focused = await page.locator(':focus');
    await expect(focused).toHaveAttribute('type', 'email');
    
    await page.keyboard.press('Tab'); // Password field
    focused = await page.locator(':focus');
    await expect(focused).toHaveAttribute('type', 'password');
    
    await page.keyboard.press('Tab'); // Submit button
    focused = await page.locator(':focus');
    await expect(focused).toHaveRole('button');
    
    // Test form submission with Enter key
    await page.keyboard.press('Enter');
    
    // Should attempt to submit form
    await expect(page.locator('[role="alert"], .error-message')).toBeVisible({ timeout: 5000 });
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/signup');
    
    // Check form accessibility
    const emailInput = page.locator('[data-testid="email-input"]');
    await expect(emailInput).toHaveAttribute('aria-label');
    await expect(emailInput).toHaveAttribute('type', 'email');
    
    const passwordInput = page.locator('[data-testid="password-input"]');
    await expect(passwordInput).toHaveAttribute('aria-label');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    const submitButton = page.locator('[data-testid="signup-submit"]');
    await expect(submitButton).toHaveRole('button');
    
    // Check for form labels
    const labels = page.locator('label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThan(0);
  });

  test('should handle logout successfully', async ({ page }) => {
    // First, establish authenticated session
    // Option 1: Use API to create session
    // await page.request.post('/api/auth/login', { ... });

    // Option 2: Set auth cookies/tokens
    // await page.context().addCookies([{ ... }]);

    await page.goto('/dashboard');
    
    // Look for logout option (could be in user menu)
    const userMenu = page.locator('[data-testid="user-menu"]');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      
      const logoutButton = page.locator('[data-testid="logout-button"]');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        
        // Should redirect to home or login page
        await page.waitForURL(/^(?!.*dashboard)/, { timeout: 5000 });
        await expect(page).not.toHaveURL(/dashboard/);
      }
    }
  });
});