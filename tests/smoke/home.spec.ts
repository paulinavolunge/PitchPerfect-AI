
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load homepage and basic navigation', async ({ page }) => {
    // Visit the home page
    await page.goto('/');
    
    // Wait for main content to load - using data-testid
    await page.waitForSelector('[data-testid="hero-heading"]', { state: 'visible', timeout: 10000 });
    
    // Check that the main heading is visible
    const mainHeading = page.locator('[data-testid="hero-heading"]');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Master Your Sales Pitch');
    
    // Find and click the "Watch Demo" button using data-testid
    const watchDemoButton = page.locator('[data-testid="hero-watch-demo-button"]');
    await expect(watchDemoButton).toBeVisible();
    await watchDemoButton.click();
    
    // Expect to be on demo page
    await expect(page).toHaveURL(/.*\/demo$/);
  });
});
