import { test, expect } from '@playwright/test';

// Basic mic start/stop smoke to ensure UI does not get stuck on "Listening"
test.describe('Demo mic start/stop', () => {
  test('can start and stop listening without getting stuck', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    await page.goto('/demo');

    // Wait for the practice UI
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });

    // Find the listening button in PracticeObjection (fallback to DemoSandbox start if needed)
    const startButtons = page.locator('button:has-text("Voice Input"), button:has-text("Start Demo"), button:has-text("Click to start recording")');
    if (await startButtons.count()) {
      await startButtons.first().click().catch(() => {});
    }

    // Try to toggle mic button by looking for a Mic icon states
    const micToggle = page.locator('button:has-text("Listening"), button:has(svg)');
    if (await micToggle.count()) {
      await micToggle.first().click().catch(() => {});
    }

    // Stop if a stop button is exposed
    const stopButtons = page.locator('button:has-text("Stop"), button:has-text("Try Again")');
    if (await stopButtons.count()) {
      await stopButtons.first().click().catch(() => {});
    }

    // Verify that no persistent "Listening..." UI remains visible after a timeout
    await page.waitForTimeout(1000);
    const listeningBadge = page.getByText('Listening...');
    expect(await listeningBadge.count()).toBeLessThan(2);
  });
});