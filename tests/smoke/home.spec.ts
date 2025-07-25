
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load homepage and basic navigation', async ({ page }) => {
    // Visit the home page
    await page.goto('/');
    
    // Wait for main content to load
    await page.waitForSelector('[data-onboarding="hero"]', { state: 'visible', timeout: 10000 });
    
    // Check that the main heading is visible
    const mainHeading = page.getByRole('heading', { level: 1 });
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Master Your Sales Pitch');
    
    // Find and click the "Watch Demo" button  
    const watchDemoButton = page.getByRole('button', { name: /watch demo/i });
    await expect(watchDemoButton).toBeVisible();
    await watchDemoButton.click();
    
    // Expect to be on demo page
    await expect(page).toHaveURL(/.*\/demo$/);
  });
});
