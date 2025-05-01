
import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test('should complete signup with OAuth and start scenario', async ({ page, context }) => {
    // Mock Google OAuth
    await page.route('**/oauth/google**', async route => {
      // Simulate successful authentication
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User'
          },
          session: {
            access_token: 'fake-access-token',
            refresh_token: 'fake-refresh-token'
          }
        })
      });
    });
    
    // Intercept Supabase auth API calls
    await page.route('**/supabase.co/auth/v1/**', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString()
          },
          session: {
            access_token: 'fake-access-token',
            refresh_token: 'fake-refresh-token'
          }
        })
      });
    });
    
    // Visit signup page
    await page.goto('/signup');
    
    // Click Google OAuth button
    const googleButton = page.getByRole('button').filter({ hasText: /google/i });
    await googleButton.click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    // Find and start any guided tour/joyride
    const startTourButton = page.getByRole('button').filter({ hasText: /take tour|start tour|guided tour/i });
    if (await startTourButton.isVisible({ timeout: 5000 })) {
      await startTourButton.click();
      
      // Complete all steps of the joyride
      for (let i = 0; i < 5; i++) {
        const nextButton = page.locator('button').filter({ hasText: /next|continue|got it|skip/i }).first();
        if (await nextButton.isVisible({ timeout: 3000 })) {
          await nextButton.click();
          await page.waitForTimeout(500);
        } else {
          break;
        }
      }
    }
    
    // Navigate to roleplay/practice
    await page.goto('/roleplay');
    
    // Start a scenario
    const startButton = page.getByRole('button').filter({ hasText: /start scenario|begin practice/i });
    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();
    }
    
    // Assert localStorage has streak=1
    const streak = await page.evaluate(() => localStorage.getItem('user_streak'));
    expect(streak).toBe('1');
  });
});
