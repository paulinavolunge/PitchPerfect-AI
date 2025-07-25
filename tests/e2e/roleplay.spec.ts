import { test, expect } from '@playwright/test';

test.describe('Roleplay Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock microphone permissions
    await page.context().grantPermissions(['microphone']);
    
    // Navigate to roleplay page
    await page.goto('/ai-roleplay');
  });

  test('should load roleplay page with proper structure', async ({ page }) => {
    // Check page loads correctly
    await expect(page).toHaveTitle(/Roleplay|AI Roleplay/);
    
    // Check for essential elements
    await expect(page.locator('h1')).toContainText(/Roleplay|Practice/i);
    
    // Check for microphone test/setup
    const micButton = page.locator('[data-testid="mic-test"], [aria-label*="microphone"]');
    await expect(micButton).toBeVisible({ timeout: 10000 });
    
    // Check for scenario selection
    const scenarioSelector = page.locator('[data-testid="scenario-selector"], select');
    await expect(scenarioSelector).toBeVisible();
  });

  test('should handle microphone permission flow', async ({ page }) => {
    // Check microphone guard component
    const micGuard = page.locator('[data-testid="microphone-guard"]');
    
    if (await micGuard.isVisible()) {
      const permissionButton = page.locator('[data-testid="request-mic-permission"]');
      await permissionButton.click();
      
      // Wait for permission to be granted
      await expect(micGuard).toBeHidden({ timeout: 5000 });
    }
    
    // Should show microphone test after permission
    const micTest = page.locator('[data-testid="microphone-test"]');
    await expect(micTest).toBeVisible({ timeout: 5000 });
  });

  test('should start roleplay session successfully', async ({ page }) => {
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Select a scenario if available
    const scenarioOptions = page.locator('[data-testid="scenario-option"]');
    if (await scenarioOptions.first().isVisible()) {
      await scenarioOptions.first().click();
    }
    
    // Start roleplay session
    const startButton = page.locator('[data-testid="start-roleplay"], [data-testid="begin-session"]');
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await startButton.click();
    
    // Check session starts
    const sessionIndicator = page.locator('[data-testid="session-active"], [data-testid="recording-indicator"]');
    await expect(sessionIndicator).toBeVisible({ timeout: 15000 });
    
    // Check for AI response or prompt
    const aiResponse = page.locator('[data-testid="ai-response"], [data-testid="scenario-prompt"]');
    await expect(aiResponse).toBeVisible({ timeout: 20000 });
  });

  test('should handle voice recording controls', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Start a session first
    const startButton = page.locator('[data-testid="start-roleplay"], [data-testid="begin-session"]');
    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();
      
      // Wait for session to be active instead of fixed timeout
      const sessionIndicator = page.locator('[data-testid="session-active"], [data-testid="recording-indicator"]');
      await expect(sessionIndicator).toBeVisible({ timeout: 10000 });
    }
    
    // Check for record button
    const recordButton = page.locator('[data-testid="record-button"], [aria-label*="record"]');
    await expect(recordButton).toBeVisible({ timeout: 10000 });
    
    // Start recording
    await recordButton.click();
    
    // Check recording state
    const recordingIndicator = page.locator('[data-testid="recording-active"], .recording-indicator');
    await expect(recordingIndicator).toBeVisible({ timeout: 5000 });
    
    // Stop recording
    const stopButton = page.locator('[data-testid="stop-recording"], [aria-label*="stop"]');
    await expect(stopButton).toBeVisible();
    await stopButton.click();
    
    // Check for processing indicator
    const processingIndicator = page.locator('[data-testid="processing"], .processing-indicator');
    await expect(processingIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should display feedback after interaction', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Mock a completed interaction by navigating to feedback state
    // This might require simulating a full roleplay session
    const feedbackSection = page.locator('[data-testid="feedback-section"], .feedback-container');
    
    // If feedback isn't immediately visible, simulate completing a session
    if (!(await feedbackSection.isVisible({ timeout: 2000 }))) {
      // Try to complete a quick session
      const startButton = page.locator('[data-testid="start-roleplay"]');
      if (await startButton.isVisible({ timeout: 3000 })) {
        await startButton.click();
        await page.waitForTimeout(1000);
        
        // Look for end session button
        const endButton = page.locator('[data-testid="end-session"], [data-testid="complete-session"]');
        if (await endButton.isVisible({ timeout: 5000 })) {
          await endButton.click();
        }
      }
    }
    
    // Check for feedback elements
    await expect(feedbackSection).toBeVisible({ timeout: 15000 });
    
    // Check for score or rating
    const scoreDisplay = page.locator('[data-testid="session-score"], .score-display');
    await expect(scoreDisplay).toBeVisible({ timeout: 5000 });
    
    // Check for feedback text
    const feedbackText = page.locator('[data-testid="feedback-text"], .feedback-content');
    await expect(feedbackText).toBeVisible({ timeout: 5000 });
  });

  test('should support keyboard navigation in roleplay interface', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation through controls
    await page.keyboard.press('Tab');
    let focused = await page.locator(':focus');
    await expect(focused).toBeVisible();
    
    // Continue tabbing through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    focused = await page.locator(':focus');
    await expect(focused).toBeVisible();
    
    // Test space/enter activation
    if (await focused.getAttribute('role') === 'button') {
      await page.keyboard.press('Enter');
      // Should activate the focused button
    }
  });

  test('should handle session state management', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check initial state
    const initialState = page.locator('[data-testid="session-status"]');
    
    // Start session
    const startButton = page.locator('[data-testid="start-roleplay"]');
    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();
      
      // Check state changed
      const activeState = page.locator('[data-testid="session-active"]');
      await expect(activeState).toBeVisible({ timeout: 10000 });
      
      // Check for pause/resume functionality
      const pauseButton = page.locator('[data-testid="pause-session"]');
      if (await pauseButton.isVisible({ timeout: 3000 })) {
        await pauseButton.click();
        
        const pausedState = page.locator('[data-testid="session-paused"]');
        await expect(pausedState).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should validate accessibility of roleplay controls', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check ARIA labels on controls
    const controls = page.locator('button, [role="button"]');
    const controlCount = await controls.count();
    
    for (let i = 0; i < Math.min(controlCount, 5); i++) {
      const control = controls.nth(i);
      if (await control.isVisible()) {
        // Should have accessible name
        const ariaLabel = await control.getAttribute('aria-label');
        const textContent = await control.textContent();
        
        expect(ariaLabel || textContent).toBeTruthy();
      }
    }
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toBeVisible();
    
    // Check for live regions for dynamic content
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const liveRegionCount = await liveRegions.count();
    expect(liveRegionCount).toBeGreaterThan(0);
  });
});