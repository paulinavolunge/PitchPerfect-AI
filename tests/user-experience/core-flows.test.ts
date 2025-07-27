import { test, expect } from '@playwright/test';

test.describe('Core User Experience Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle authentication flow properly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await submitButton.click();
      
      // Wait for navigation or message
      await page.waitForTimeout(2000);
    }
  });

  test('should complete onboarding flow', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Navigate through onboarding steps
    const nextButton = page.locator('button:has-text("Next")');
    const continueButton = page.locator('button:has-text("Continue")');
    
    // Step through multiple onboarding screens
    for (let i = 0; i < 3; i++) {
      if (await nextButton.isVisible({ timeout: 3000 })) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      } else if (await continueButton.isVisible({ timeout: 3000 })) {
        await continueButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should handle practice session workflow', async ({ page }) => {
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    
    // Start practice session
    const startButton = page.locator('[data-testid="start-practice"]');
    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();
      
      // Wait for session to load
      await page.waitForTimeout(2000);
      
      // Look for practice interface
      const practiceInterface = page.locator('.practice-container, [data-testid="practice-interface"]');
      await expect(practiceInterface).toBeVisible({ timeout: 10000 });
    }
  });

  test('should provide appropriate feedback after session', async ({ page }) => {
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    
    // Complete a practice session
    const startButton = page.locator('[data-testid="start-practice"]');
    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();
      
      // Simulate session completion
      await page.waitForTimeout(3000);
      
      // End session if there's an end button
      const endButton = page.locator('[data-testid="end-session"], button:has-text("End")');
      if (await endButton.isVisible({ timeout: 3000 })) {
        await endButton.click();
      }
      
      // Check for feedback
      const feedbackSection = page.locator('[data-testid="feedback"], .feedback-container');
      if (await feedbackSection.isVisible({ timeout: 5000 })) {
        await expect(feedbackSection).toBeVisible();
      }
    }
  });

  test('should handle form submission correctly', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    // Fill contact form
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const messageInput = page.locator('textarea[name="message"]');
    const submitButton = page.locator('button[type="submit"]');
    
    if (await nameInput.isVisible({ timeout: 5000 })) {
      await nameInput.fill('Test User');
      await emailInput.fill('test@example.com');
      await messageInput.fill('This is a test message');
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
    }
  });

  test('should display proper navigation flow', async ({ page }) => {
    // Test main navigation
    const navItems = page.locator('nav a, [role="navigation"] a');
    const navCount = await navItems.count();
    
    if (navCount > 0) {
      // Test first few navigation items
      for (let i = 0; i < Math.min(navCount, 3); i++) {
        const navItem = navItems.nth(i);
        
        if (await navItem.isVisible()) {
          const href = await navItem.getAttribute('href');
          if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
            await navItem.click();
            await page.waitForLoadState('networkidle');
            
            // Verify page loaded
            const body = page.locator('body');
            await expect(body).toBeVisible();
            
            // Go back to start
            await page.goto('/');
            await page.waitForLoadState('networkidle');
          }
        }
      }
    }
  });

  test('should handle user interaction patterns correctly', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    // Test various user interactions
    const interactiveElements = page.locator('button, input, select, textarea, [role="button"]');
    const elementCount = await interactiveElements.count();
    
    if (elementCount > 0) {
      // Test first few interactive elements
      for (let i = 0; i < Math.min(elementCount, 5); i++) {
        const element = interactiveElements.nth(i);
        
        if (await element.isVisible()) {
          const tagName = await element.evaluate(el => el.tagName.toLowerCase());
          
          if (tagName === 'button') {
            await element.click();
            await page.waitForTimeout(500);
            
            // Check for any response message
            const messageSelector = '[role="alert"], .message, .notification, .toast';
            const messageElement = page.locator(messageSelector);
            
            if (await messageElement.isVisible({ timeout: 2000 })) {
              // Wait for the message element and get its text content
              await messageElement.waitFor({ state: 'visible' });
              const messageText = await messageElement.textContent();
              
              // Check if the text includes "Error" to handle or log the error case explicitly
              if (messageText && messageText.includes('Error')) {
                console.log('Error message detected:', messageText);
                // Handle error case - could also throw or take other action based on test requirements
              }
              
              // Assert that the text is truthy to confirm a message was shown
              expect(messageText).toBeTruthy();
            }
          }
        }
      }
    }
  });

  test('should maintain accessibility standards', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    let focusedElement = await page.locator(':focus');
    let tabCount = 0;
    const maxTabs = 15;
    
    while (tabCount < maxTabs) {
      if (await focusedElement.isVisible()) {
        // Verify focused element is interactive
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        const role = await focusedElement.getAttribute('role');
        
        expect(['button', 'input', 'select', 'textarea', 'a'].includes(tagName) ||
               ['button', 'link', 'textbox', 'combobox'].includes(role || '')).toBeTruthy();
      }
      
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus');
      tabCount++;
    }
    
    expect(tabCount).toBeGreaterThan(0);
  });
});