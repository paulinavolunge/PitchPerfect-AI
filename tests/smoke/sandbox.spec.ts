
import { test, expect } from '@playwright/test';

test.describe('Demo Sandbox', () => {
  test('should record audio and generate scorecard', async ({ page, context }) => {
    // Grant permissions for microphone
    await context.grantPermissions(['microphone']);
    
    // Mock microphone data
    await page.addInitScript(() => {
      // Mock MediaDevices API
      const originalMediaDevices = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          ...originalMediaDevices,
          getUserMedia: async () => {
            // Create a fake audio track
            const audioTrackGenerator = new AudioContext();
            const oscillator = audioTrackGenerator.createOscillator();
            oscillator.frequency.setValueAtTime(440, audioTrackGenerator.currentTime);
            const destination = audioTrackGenerator.createMediaStreamDestination();
            oscillator.connect(destination);
            oscillator.start();
            return destination.stream;
          }
        },
        configurable: true
      });
    });
    
    // Visit the demo page
    await page.goto('/demo');
    
    // Start the demo
    const startDemoButton = page.getByRole('button', { name: /start demo/i });
    await expect(startDemoButton).toBeVisible({ timeout: 10000 });
    await startDemoButton.click();
    
    // Wait for recording to complete or end demo early after 5 seconds
    // (to speed up the test, since the real demo is 60 seconds)
    await page.waitForTimeout(5000);
    
    const endDemoButton = page.getByRole('button', { name: /end demo early/i });
    if (await endDemoButton.isVisible())
      await endDemoButton.click();
    
    // Wait for scoreboard to appear
    const scorecard = page.locator('.pricing-cards').first();
    await expect(scorecard).toBeVisible({ timeout: 10000 });
    
    // Expect JSON data in the scorecard
    const viewFullAnalysisButton = page.getByRole('button', { name: /view full analysis/i });
    await expect(viewFullAnalysisButton).toBeVisible();
    await viewFullAnalysisButton.click();
    
    // Verify the scorecard data was generated
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 10000 });
  });
});
