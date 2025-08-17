import { test, expect } from '@playwright/test';

// Loads dashboard and renders empty state for new users
test('dashboard loads for new user without crashing', async ({ page }) => {
  await page.goto('/dashboard');

  // Allow some redirect logic/time
  await page.waitForTimeout(1500);

  // Should render a heading or skeleton without throwing
  const possibleSelectors = [
    'h1:has-text("Dashboard")',
    '[role="tablist"]',
    'text=Initializing application',
  ];

  const anyVisible = await Promise.any(
    possibleSelectors.map(sel => page.locator(sel).first().waitFor({ state: 'visible', timeout: 4000 }))
  ).catch(() => null);

  expect(anyVisible).not.toBeNull();
});