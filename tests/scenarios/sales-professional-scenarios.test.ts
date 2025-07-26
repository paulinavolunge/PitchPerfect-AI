import { test, expect } from '@playwright/test';

test.describe('Sales Professional Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Mock microphone permissions
    await page.context().grantPermissions(['microphone']);
    
    // Navigate to roleplay page
    await page.goto('/ai-roleplay');
  });

  test('should handle sales objection scenario with recording controls', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Select sales objection scenario
    const scenarioSelector = page.locator('[data-testid="scenario-selector"]');
    await expect(scenarioSelector).toBeVisible({ timeout: 10000 });
    await scenarioSelector.selectOption('sales-objection');
    
    // Start roleplay session
    const startButton = page.locator('[data-testid="start-roleplay"], [data-testid="begin-session"]');
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await startButton.click();
    
    // Check session starts
    const sessionIndicator = page.locator('[data-testid="session-active"], [data-testid="recording-indicator"]');
    await expect(sessionIndicator).toBeVisible({ timeout: 15000 });
    
    // Check for record button
    const recordButton = page.locator('[data-testid="record-button"], [aria-label*="record"]');
    await expect(recordButton).toBeVisible({ timeout: 10000 });
    
    // Start recording
    await recordButton.click();
    
    // Check recording state visibility only once before waiting
    const recordingIndicator = page.locator('[data-testid="recording-active"], .recording-indicator');
    await expect(recordingIndicator).toBeVisible({ timeout: 5000 });
    
    // Simulate recording for a few seconds
    await page.waitForTimeout(3000);
    
    // Stop recording
    const stopButton = page.locator('[data-testid="stop-recording"], [aria-label*="stop"]');
    await expect(stopButton).toBeVisible();
    await stopButton.click();
    
    // Wait for recording indicator to disappear with maximum timeout
    await expect(recordingIndicator).toBeHidden({ timeout: 10000 });
    
    // Check for processing indicator
    const processingIndicator = page.locator('[data-testid="processing"], .processing-indicator');
    await expect(processingIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should handle sales pitch scenario with feedback generation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Select sales pitch scenario
    const scenarioSelector = page.locator('[data-testid="scenario-selector"]');
    await expect(scenarioSelector).toBeVisible({ timeout: 10000 });
    await scenarioSelector.selectOption('sales-pitch');
    
    // Start roleplay session
    const startButton = page.locator('[data-testid="start-roleplay"]');
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await startButton.click();
    
    // Wait for AI response
    const aiResponse = page.locator('[data-testid="ai-response"], [data-testid="scenario-prompt"]');
    await expect(aiResponse).toBeVisible({ timeout: 20000 });
    
    // Complete a recording cycle
    const recordButton = page.locator('[data-testid="record-button"]');
    if (await recordButton.isVisible({ timeout: 5000 })) {
      await recordButton.click();
      
      const recordingIndicator = page.locator('[data-testid="recording-active"], .recording-indicator');
      await expect(recordingIndicator).toBeVisible({ timeout: 5000 });
      
      await page.waitForTimeout(2000);
      
      const stopButton = page.locator('[data-testid="stop-recording"]');
      await stopButton.click();
      
      // Wait for recording to finish processing with timeout
      await expect(recordingIndicator).toBeHidden({ timeout: 15000 });
    }
    
    // Check for feedback generation
    const feedbackSection = page.locator('[data-testid="feedback-section"], .feedback-container');
    await expect(feedbackSection).toBeVisible({ timeout: 20000 });
  });

  test('should handle sales negotiation scenario with multiple exchanges', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Select negotiation scenario
    const scenarioSelector = page.locator('[data-testid="scenario-selector"]');
    await expect(scenarioSelector).toBeVisible({ timeout: 10000 });
    await scenarioSelector.selectOption('sales-negotiation');
    
    // Start session
    const startButton = page.locator('[data-testid="start-roleplay"]');
    await startButton.click();
    
    // Multiple recording exchanges
    for (let i = 0; i < 2; i++) {
      const recordButton = page.locator('[data-testid="record-button"]');
      await expect(recordButton).toBeVisible({ timeout: 10000 });
      await recordButton.click();
      
      const recordingIndicator = page.locator('[data-testid="recording-active"], .recording-indicator');
      await expect(recordingIndicator).toBeVisible({ timeout: 5000 });
      
      await page.waitForTimeout(2000);
      
      const stopButton = page.locator('[data-testid="stop-recording"]');
      await stopButton.click();
      
      // Wait reliably for recording to finish
      await expect(recordingIndicator).toBeHidden({ timeout: 10000 });
      
      // Wait for AI response if not last iteration
      if (i < 1) {
        const aiResponse = page.locator('[data-testid="ai-response"]');
        await expect(aiResponse).toBeVisible({ timeout: 15000 });
      }
    }
    
    // End session
    const endButton = page.locator('[data-testid="end-session"], [data-testid="complete-session"]');
    if (await endButton.isVisible({ timeout: 5000 })) {
      await endButton.click();
    }
    
    // Check final feedback
    const feedbackSection = page.locator('[data-testid="feedback-section"]');
    await expect(feedbackSection).toBeVisible({ timeout: 15000 });
  });
});