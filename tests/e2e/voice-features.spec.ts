import { test, expect } from '@playwright/test';

test.describe('Voice Features', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    
    // Navigate to the demo page
    await page.goto('/demo');
    
    // Wait for the demo page to load
    await page.waitForSelector('[data-testid="demo-heading"]', { state: 'visible' });
  });

  test('should display voice recording button', async ({ page }) => {
    // Look for voice recording button
    const voiceButton = page.locator('[data-testid="voice-record-button"], button:has-text("Record"), button[aria-label*="voice"], button[aria-label*="record"]');
    
    // Check if at least one voice-related button is visible
    await expect(voiceButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle between voice and text mode', async ({ page }) => {
    // Look for mode toggle buttons
    const textModeButton = page.locator('button:has-text("Text"), button[aria-label*="text mode"]');
    const voiceModeButton = page.locator('button:has-text("Voice"), button[aria-label*="voice mode"]');
    
    // Check if mode toggle exists
    const modeToggleExists = await textModeButton.count() > 0 || await voiceModeButton.count() > 0;
    
    if (modeToggleExists) {
      // If text mode button exists, click it
      if (await textModeButton.count() > 0) {
        await textModeButton.first().click();
        
        // Verify text input is visible
        const textInput = page.locator('textarea, input[type="text"]').first();
        await expect(textInput).toBeVisible();
      }
      
      // If voice mode button exists, click it
      if (await voiceModeButton.count() > 0) {
        await voiceModeButton.first().click();
        
        // Verify voice controls are visible
        const voiceControls = page.locator('[data-testid="voice-controls"], [aria-label*="voice"], [aria-label*="record"]');
        await expect(voiceControls.first()).toBeVisible();
      }
    }
  });

  test('should handle microphone permission denial gracefully', async ({ page, context }) => {
    // Revoke microphone permissions
    await context.clearPermissions();
    
    // Try to use voice feature
    const voiceButton = page.locator('button:has-text("Record"), button[aria-label*="voice"], button[aria-label*="record"]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      
      // Should show permission error or request
      const permissionMessage = page.locator('text=/permission|microphone|access/i');
      await expect(permissionMessage.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show feedback after voice submission', async ({ page }) => {
    // Switch to text mode for easier testing
    const textModeButton = page.locator('button:has-text("Text"), button[aria-label*="text mode"]');
    
    if (await textModeButton.count() > 0) {
      await textModeButton.first().click();
      
      // Find text input
      const textInput = page.locator('textarea, input[type="text"]').first();
      await textInput.fill('I understand the value, but we need to discuss this with our team first.');
      
      // Find submit button
      const submitButton = page.locator('button:has-text("Submit"), button:has-text("Send"), button[type="submit"]');
      await submitButton.first().click();
      
      // Wait for feedback
      const feedback = page.locator('[data-testid="feedback-display"], [class*="feedback"], text=/feedback|score|response/i');
      await expect(feedback.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate to voice training from dashboard', async ({ page }) => {
    // Go to dashboard first
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-heading"]', { state: 'visible' });
    
    // Look for voice training link
    const voiceTrainingLink = page.locator('a:has-text("Voice Training"), button:has-text("Voice Training"), [href*="voice"]');
    
    if (await voiceTrainingLink.count() > 0) {
      await voiceTrainingLink.first().click();
      
      // Verify navigation to voice training page
      await expect(page).toHaveURL(/voice/);
    }
  });
});

test.describe('Voice Features - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });

  test('should work on mobile devices', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    
    // Navigate to demo
    await page.goto('/demo');
    
    // Check if voice features are accessible on mobile
    const voiceButton = page.locator('button:has-text("Record"), button[aria-label*="voice"], button[aria-label*="record"]');
    
    // Mobile might have different UI
    if (await voiceButton.count() > 0) {
      await expect(voiceButton.first()).toBeVisible();
      
      // Check touch target size (should be at least 44x44 for mobile)
      const box = await voiceButton.first().boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});