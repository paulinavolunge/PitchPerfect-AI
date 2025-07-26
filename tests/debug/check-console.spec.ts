import { test, expect } from '@playwright/test';

test('Check console errors', async ({ page }) => {
  // Collect console messages
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });
  
  page.on('pageerror', (error) => {
    consoleErrors.push(`Page error: ${error.message}`);
  });
  
  // Navigate to the page
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Wait a bit to collect any delayed errors
  await page.waitForTimeout(3000);
  
  // Print all console messages
  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));
  
  // Print errors specifically
  if (consoleErrors.length > 0) {
    console.log('\n=== Console Errors ===');
    consoleErrors.forEach(err => console.log(err));
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  
  // Check page content
  const bodyText = await page.textContent('body');
  console.log('\n=== Page Content ===');
  console.log(bodyText);
  
  // This test will always pass - it's just for debugging
  expect(true).toBe(true);
});