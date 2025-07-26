import { test, expect } from '@playwright/test';

test.describe('PostHog Simple Test', () => {
  test('should have window.posthog available', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check window.posthog
    const posthogInfo = await page.evaluate(() => {
      const ph = (window as any).posthog;
      return {
        exists: !!ph,
        hasCapture: ph && typeof ph.capture === 'function',
        hasIdentify: ph && typeof ph.identify === 'function',
        hasReset: ph && typeof ph.reset === 'function',
      };
    });
    
    expect(posthogInfo.exists).toBe(true);
    expect(posthogInfo.hasCapture).toBe(true);
    expect(posthogInfo.hasIdentify).toBe(true);
    expect(posthogInfo.hasReset).toBe(true);
  });
  
  test('should call PostHog page tracking', async ({ page }) => {
    const pageViewEvents: any[] = [];
    
    // Override console.log to capture PostHog mock events
    await page.addInitScript(() => {
      const originalLog = console.log;
      (window as any).capturedLogs = [];
      console.log = (...args) => {
        (window as any).capturedLogs.push(args.join(' '));
        originalLog(...args);
      };
    });
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Get captured logs
    const logs = await page.evaluate(() => (window as any).capturedLogs || []);
    const posthogLogs = logs.filter((log: string) => log.includes('[PostHog Mock]'));
    
    console.log('PostHog logs:', posthogLogs);
    
    // Check for page view event
    const hasPageView = posthogLogs.some((log: string) => log.includes('page_viewed'));
    expect(hasPageView).toBe(true);
  });
});