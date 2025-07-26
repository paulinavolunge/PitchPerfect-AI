import { test, expect } from '@playwright/test';

test.describe('PostHog Mock Integration', () => {
  test('should initialize PostHog mock in development', async ({ page }) => {
    // Collect console messages
    const consoleMessages: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.text().includes('PostHog')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Navigate to the page
    await page.goto('/');
    
    // Wait for PostHog initialization
    await page.waitForTimeout(1000);
    
    // Check that PostHog mock was initialized
    const hasPostHogInit = consoleMessages.some(msg => 
      msg.includes('[PostHog] Analytics disabled - development mode')
    );
    expect(hasPostHogInit).toBe(true);
    
    // Check that window.posthog exists
    const posthogExists = await page.evaluate(() => {
      return !!(window as any).posthog;
    });
    expect(posthogExists).toBe(true);
    
    // Test mock capture function
    const captureResult = await page.evaluate(() => {
      const posthog = (window as any).posthog;
      if (posthog && posthog.capture) {
        posthog.capture('test_event', { test: true });
        return true;
      }
      return false;
    });
    expect(captureResult).toBe(true);
    
    // Check for mock event log
    await page.waitForTimeout(100);
    const hasMockEvent = consoleMessages.some(msg => 
      msg.includes('[PostHog Mock] Event: test_event')
    );
    expect(hasMockEvent).toBe(true);
  });
  
  test('should track page views', async ({ page }) => {
    const consoleMessages: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.text().includes('PostHog Mock')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Navigate to different pages
    await page.goto('/');
    await page.waitForTimeout(500);
    
    await page.goto('/demo');
    await page.waitForTimeout(500);
    
    await page.goto('/signup');
    await page.waitForTimeout(500);
    
    // Check for page view events
    const pageViewEvents = consoleMessages.filter(msg => 
      msg.includes('page_viewed')
    );
    
    // Should have at least 3 page view events
    expect(pageViewEvents.length).toBeGreaterThanOrEqual(3);
  });
  
  test('should track mode toggle on demo page', async ({ page }) => {
    const consoleMessages: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.text().includes('PostHog Mock')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Navigate to demo page
    await page.goto('/demo');
    await page.waitForSelector('[data-testid="demo-heading"]');
    
    // Click text mode button
    const textModeButton = page.locator('[data-testid="text-mode-button"]');
    if (await textModeButton.isVisible()) {
      await textModeButton.click();
      await page.waitForTimeout(500);
      
      // Check for mode toggle event
      const hasTextModeEvent = consoleMessages.some(msg => 
        msg.includes('text_mode_enabled')
      );
      expect(hasTextModeEvent).toBe(true);
    }
    
    // Click voice mode button
    const voiceModeButton = page.locator('[data-testid="voice-mode-button"]');
    if (await voiceModeButton.isVisible()) {
      await voiceModeButton.click();
      await page.waitForTimeout(500);
      
      // Check for mode toggle event
      const hasVoiceModeEvent = consoleMessages.some(msg => 
        msg.includes('voice_mode_enabled')
      );
      expect(hasVoiceModeEvent).toBe(true);
    }
  });
});