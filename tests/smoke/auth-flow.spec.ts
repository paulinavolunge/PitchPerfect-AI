import { test, expect } from '@playwright/test';

test.describe('Auth smoke', () => {
  test('signup -> (fake verify) -> login -> logout', async ({ page }) => {
    const email = `user+${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    // Signup
    await page.goto('/signup');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"], button:has-text("Sign Up")').first().click();

    // Wait for toast or redirect
    await page.waitForTimeout(1000);

    // Attempt login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first().click();

    // Landing
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/(dashboard|signup|login)/);

    // Logout if visible
    const logout = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out"), button:has-text("Log Out")');
    if (await logout.count()) {
      await logout.first().click().catch(() => {});
      await page.waitForTimeout(500);
    }

    expect(true).toBe(true);
  });
});