
import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test('should load signup page and show auth options', async ({ page }) => {
    // Visit signup page
    await page.goto('/signup');
    
    // Wait for signup page to load
    await page.waitForSelector('h1, h2', { state: 'visible', timeout: 10000 });
    
    // Check that we're on signup/login page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    
    // Look for auth buttons or form
    const authElement = page.locator('button:has-text("Google"), input[type="email"], form');
    await expect(authElement.first()).toBeVisible({ timeout: 5000 });
    
    // Try to navigate to demo page as guest
    await page.goto('/demo');
    
    // Verify demo page loads for guest users
    await page.waitForSelector('h1', { state: 'visible', timeout: 10000 });
    const demoHeading = page.getByRole('heading', { level: 1 });
    await expect(demoHeading).toContainText(/demo|practice/i);
  });
});
