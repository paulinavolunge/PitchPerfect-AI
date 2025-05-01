
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load and navigate to demo section', async ({ page }) => {
    // Visit the home page
    await page.goto('/');
    
    // Wait for the hero video or image to appear
    await page.waitForSelector('video, img[alt*="hero"]', { state: 'visible', timeout: 5000 });
    
    // Find and click the "Try Free" button
    const tryFreeButton = page.getByRole('button', { name: /try free/i });
    await expect(tryFreeButton).toBeVisible();
    await tryFreeButton.click();
    
    // Expect timer element to appear
    const timerElement = page.locator('.flex').filter({ hasText: /^[0-9]+:[0-9]+$/ });
    await expect(timerElement).toBeVisible({ timeout: 10000 });
  });
});
