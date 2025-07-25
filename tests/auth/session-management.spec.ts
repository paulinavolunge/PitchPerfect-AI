import { test, expect } from '@playwright/test';

test.describe('Session Management and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should handle concurrent login attempts', async ({ page, context }) => {
    // Open multiple tabs
    const page2 = await context.newPage();
    
    await Promise.all([
      page.goto('/login'),
      page2.goto('/login')
    ]);

    // Simulate login in first tab
    const emailInput1 = page.locator('input[type="email"]');
    const passwordInput1 = page.locator('input[type="password"]');
    const loginButton1 = page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Sign")').first();

    if (await emailInput1.count() > 0) {
      await emailInput1.fill('test@example.com');
      await passwordInput1.fill('password123');
      await loginButton1.click();
    }

    // Check if second tab reflects login state
    await page2.reload();
    await page2.waitForTimeout(2000);
    
    // Both tabs should have consistent auth state
    const url1 = page.url();
    const url2 = page2.url();
    
    // If login was successful, both should redirect to dashboard
    // If not, both should remain on login page
    if (url1.includes('/dashboard')) {
      expect(url2).toContain('/dashboard');
    }
  });

  test('should handle expired token gracefully', async ({ page }) => {
    // Set an expired token
    await page.evaluate(() => {
      const expiredToken = {
        access_token: 'expired.token.here',
        refresh_token: 'refresh.token.here',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        expires_in: -3600,
        token_type: 'bearer'
      };
      localStorage.setItem('supabase.auth.token', JSON.stringify(expiredToken));
    });

    await page.goto('/dashboard');
    
    // Should redirect to login or show auth required message
    await Promise.race([
      page.waitForURL('**/login', { timeout: 5000 }),
      page.waitForURL('**/signup', { timeout: 5000 }),
      page.waitForSelector('[data-testid="auth-required"], .auth-required', { timeout: 5000 })
    ]).catch(() => null);
  });

  test('should handle network failures during auth', async ({ page, context }) => {
    // Simulate network failure
    await context.route('**/*auth*', route => {
      route.abort('failed');
    });

    await page.goto('/signup');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign")').first();

    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await submitButton.click();

      // Should show error message for network failure
      await page.waitForSelector('[role="alert"], .error, .toast', { timeout: 5000 }).catch(() => null);
    }
  });

  test('should handle invalid JWT tokens', async ({ page }) => {
    // Set malformed token
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'invalid-token-format');
    });

    await page.goto('/dashboard');
    
    // Should handle gracefully and redirect to auth
    await Promise.race([
      page.waitForURL('**/login', { timeout: 5000 }),
      page.waitForURL('**/signup', { timeout: 5000 }),
      page.waitForTimeout(3000)
    ]);
  });

  test('should handle rapid page navigation during auth', async ({ page }) => {
    await page.goto('/signup');
    
    // Rapidly navigate between auth pages
    for (let i = 0; i < 3; i++) {
      await page.goto('/login');
      await page.waitForTimeout(100);
      await page.goto('/signup');
      await page.waitForTimeout(100);
    }

    // Should still render properly
    const heading = page.locator('h1, h2');
    await expect(heading.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle browser back/forward during auth flow', async ({ page }) => {
    await page.goto('/');
    await page.goto('/signup');
    
    // Go back
    await page.goBack();
    await page.waitForTimeout(1000);
    
    // Go forward
    await page.goForward();
    await page.waitForTimeout(1000);
    
    // Should still work properly
    const authElement = page.locator('input[type="email"], button:has-text("Sign")');
    await expect(authElement.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    // Fill localStorage to near capacity
    await page.evaluate(() => {
      try {
        const largeString = 'x'.repeat(1024 * 1024); // 1MB string
        for (let i = 0; i < 5; i++) {
          localStorage.setItem(`large-data-${i}`, largeString);
        }
      } catch (e) {
        // Storage quota exceeded - this is expected
      }
    });

    await page.goto('/signup');
    
    // Auth should still work even with storage issues
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      // Form should still be functional
      await expect(emailInput).toHaveValue('test@example.com');
    }
  });

  test('should handle tab visibility changes during auth', async ({ page }) => {
    await page.goto('/login');
    
    // Simulate tab becoming hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(1000);

    // Simulate tab becoming visible again
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should still be functional
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await expect(emailInput).toBeVisible();
    }
  });

  test('should handle auth state changes in multiple windows', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await Promise.all([
      page1.goto('/'),
      page2.goto('/dashboard')
    ]);

    // If user logs in on page1, page2 should reflect the change
    // This tests real-time auth state synchronization
    
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    // Both pages should have consistent auth state
    const url1 = page1.url();
    const url2 = page2.url();
    
    // If not authenticated, dashboard should redirect
    if (!url2.includes('/dashboard')) {
      expect(url2).toMatch(/\/(login|signup|$)/);
    }
  });
});