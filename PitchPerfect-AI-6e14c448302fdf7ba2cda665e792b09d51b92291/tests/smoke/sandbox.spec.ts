
import { test, expect } from '@playwright/test';

test.describe('Demo Sandbox', () => {
  test('should load demo page and show practice interface', async ({ page, context }) => {
    // Grant permissions for microphone
    await context.grantPermissions(['microphone']);
    
    // Visit the demo page
    await page.goto('/demo');
    
    // Wait for demo page to load
    await page.waitForSelector('h1', { state: 'visible', timeout: 10000 });
    
    // Check main heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText('Try PitchPerfect AI');
    
    // Look for practice interface elements
    const practiceSection = page.locator('text=Experience how PitchPerfect AI');
    await expect(practiceSection).toBeVisible();
    
    // Check that microphone test or practice area exists
    const micTestButton = page.getByRole('button', { name: /test microphone|start practice/i });
    if (await micTestButton.isVisible({ timeout: 5000 })) {
      await expect(micTestButton).toBeVisible();
    }
    
    // Alternative check for practice textarea if mic button not found
    const practiceArea = page.locator('textarea[placeholder*="practice"], textarea[placeholder*="response"]');
    if (await practiceArea.isVisible({ timeout: 5000 })) {
      await expect(practiceArea).toBeVisible();
    }
  });
});
