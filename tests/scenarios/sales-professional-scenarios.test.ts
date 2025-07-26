import { test, expect } from '@playwright/test';

test.describe('Sales Professional Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Mock microphone permissions
    await page.context().grantPermissions(['microphone']);
    
    // Navigate to roleplay page
    await page.goto('/ai-roleplay');
    await page.waitForLoadState('networkidle');
  });

  test('should handle mode switching between voice and text modes robustly', async ({ page }) => {
    // Start a roleplay session first
    const startButton = page.locator('[data-testid="start-roleplay"], [data-testid="begin-session"]');
    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();
      
      // Wait for session to be active
      const sessionIndicator = page.locator('[data-testid="session-active"], [data-testid="recording-indicator"]');
      await expect(sessionIndicator).toBeVisible({ timeout: 10000 });
    }

    // Define mode selectors
    const voiceModeButton = page.locator('[data-testid="voice-mode-button"], [aria-label*="voice mode"]');
    const textModeButton = page.locator('[data-testid="text-mode-button"], [aria-label*="text mode"]');
    const voiceModeIndicator = page.locator('[data-testid="voice-mode-active"], .voice-mode-active');
    const textModeIndicator = page.locator('[data-testid="text-mode-active"], .text-mode-active');

    // Test scenarios for multiple mode switches
    const scenarios = [
      { targetMode: 'voice', description: 'Switch to voice mode' },
      { targetMode: 'text', description: 'Switch to text mode' },
      { targetMode: 'voice', description: 'Switch back to voice mode' },
      { targetMode: 'text', description: 'Switch back to text mode' },
      { targetMode: 'voice', description: 'Final switch to voice mode' }
    ];

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      
      // Check current UI state before attempting to switch modes
      const isCurrentlyVoiceMode = await voiceModeIndicator.isVisible({ timeout: 1000 }).catch(() => false);
      const isCurrentlyTextMode = await textModeIndicator.isVisible({ timeout: 1000 }).catch(() => false);
      
      // Determine if we need to switch modes
      const needsSwitch = scenario.targetMode === 'voice' ? !isCurrentlyVoiceMode : !isCurrentlyTextMode;
      
      if (needsSwitch) {
        // Only perform the click if a mode change is needed
        if (scenario.targetMode === 'voice') {
          // Verify voice mode button is available before clicking
          await expect(voiceModeButton).toBeVisible({ timeout: 5000 });
          await voiceModeButton.click();
          
          // Verify the mode switched successfully
          await expect(voiceModeIndicator).toBeVisible({ timeout: 5000 });
          await expect(textModeIndicator).toBeHidden({ timeout: 2000 });
        } else {
          // Verify text mode button is available before clicking
          await expect(textModeButton).toBeVisible({ timeout: 5000 });
          await textModeButton.click();
          
          // Verify the mode switched successfully
          await expect(textModeIndicator).toBeVisible({ timeout: 5000 });
          await expect(voiceModeIndicator).toBeHidden({ timeout: 2000 });
        }
      }
      
      // Verify the UI is in the expected state after the switch (or non-switch)
      if (scenario.targetMode === 'voice') {
        await expect(voiceModeIndicator).toBeVisible({ timeout: 2000 });
        
        // Test voice mode functionality
        const recordButton = page.locator('[data-testid="record-button"], [aria-label*="record"]');
        await expect(recordButton).toBeVisible({ timeout: 5000 });
      } else {
        await expect(textModeIndicator).toBeVisible({ timeout: 2000 });
        
        // Test text mode functionality
        const textInput = page.locator('[data-testid="text-input"], textarea, input[type="text"]');
        await expect(textInput).toBeVisible({ timeout: 5000 });
      }
      
      // Add a small delay between iterations to allow UI state to stabilize
      await page.waitForTimeout(500);
    }
  });

  test('should maintain session state during mode switches', async ({ page }) => {
    // Start a roleplay session
    const startButton = page.locator('[data-testid="start-roleplay"]');
    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();
      
      const sessionIndicator = page.locator('[data-testid="session-active"]');
      await expect(sessionIndicator).toBeVisible({ timeout: 10000 });
    }

    // Test that session remains active during mode switches
    const voiceModeButton = page.locator('[data-testid="voice-mode-button"]');
    const textModeButton = page.locator('[data-testid="text-mode-button"]');
    const sessionActiveIndicator = page.locator('[data-testid="session-active"]');

    // Switch to voice mode (if not already there)
    const voiceModeIndicator = page.locator('[data-testid="voice-mode-active"]');
    if (!(await voiceModeIndicator.isVisible({ timeout: 1000 }).catch(() => false))) {
      await voiceModeButton.click();
      await expect(voiceModeIndicator).toBeVisible({ timeout: 5000 });
    }
    
    // Verify session is still active
    await expect(sessionActiveIndicator).toBeVisible();

    // Switch to text mode
    const textModeIndicator = page.locator('[data-testid="text-mode-active"]');
    if (!(await textModeIndicator.isVisible({ timeout: 1000 }).catch(() => false))) {
      await textModeButton.click();
      await expect(textModeIndicator).toBeVisible({ timeout: 5000 });
    }
    
    // Verify session is still active after mode switch
    await expect(sessionActiveIndicator).toBeVisible();
  });

  test('should handle edge cases in mode switching', async ({ page }) => {
    // Test rapid mode switching
    const voiceModeButton = page.locator('[data-testid="voice-mode-button"]');
    const textModeButton = page.locator('[data-testid="text-mode-button"]');
    
    // Wait for initial page load
    await page.waitForTimeout(1000);
    
    // Attempt rapid switches only if buttons are available and mode change is needed
    for (let i = 0; i < 3; i++) {
      const voiceModeActive = await page.locator('[data-testid="voice-mode-active"]').isVisible({ timeout: 500 }).catch(() => false);
      
      if (!voiceModeActive && await voiceModeButton.isVisible({ timeout: 1000 })) {
        await voiceModeButton.click();
        await page.waitForTimeout(200);
      }
      
      const textModeActive = await page.locator('[data-testid="text-mode-active"]').isVisible({ timeout: 500 }).catch(() => false);
      
      if (!textModeActive && await textModeButton.isVisible({ timeout: 1000 })) {
        await textModeButton.click();
        await page.waitForTimeout(200);
      }
    }
    
    // Verify the UI is in a stable state after rapid switching
    const finalModeIndicator = page.locator('[data-testid="voice-mode-active"], [data-testid="text-mode-active"]');
    await expect(finalModeIndicator).toBeVisible({ timeout: 5000 });
  });
});