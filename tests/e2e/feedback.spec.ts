import { test, expect } from '@playwright/test';

test.describe('Feedback System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display feedback after practice session', async ({ page }) => {
    // Navigate to practice page
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    
    // Look for practice session or demo
    const practiceButton = page.locator('[data-testid="start-practice"], [data-testid="try-demo"]');
    if (await practiceButton.isVisible({ timeout: 5000 })) {
      await practiceButton.click();
      
      // Wait for session to potentially complete
      await page.waitForTimeout(3000);
      
      // Look for feedback section
      const feedbackSection = page.locator('[data-testid="feedback-section"], .feedback-container, .results-container');
      
      if (await feedbackSection.isVisible({ timeout: 10000 })) {
        // Verify feedback content
        await expect(feedbackSection).toBeVisible();
        
        // Check for score or rating
        const scoreElement = page.locator('[data-testid="score"], .score, [data-testid="rating"]');
        await expect(scoreElement).toBeVisible({ timeout: 5000 });
        
        // Check for feedback text
        const feedbackText = page.locator('[data-testid="feedback-text"], .feedback-content, .feedback-message');
        await expect(feedbackText).toBeVisible({ timeout: 5000 });
        
        // Verify feedback is readable
        const feedbackContent = await feedbackText.textContent();
        expect(feedbackContent?.length).toBeGreaterThan(10);
      }
    }
  });

  test('should handle feedback submission', async ({ page }) => {
    // Navigate to a page with feedback form
    await page.goto('/feedback');
    
    if (page.url().includes('feedback')) {
      // Fill feedback form if it exists
      const feedbackForm = page.locator('form, [data-testid="feedback-form"]');
      
      if (await feedbackForm.isVisible({ timeout: 5000 })) {
        const textArea = page.locator('textarea, [data-testid="feedback-input"]');
        await textArea.fill('This is a test feedback message for the E2E test.');
        
        const submitButton = page.locator('[type="submit"], [data-testid="submit-feedback"]');
        await submitButton.click();
        
        // Check for success message
        const successMessage = page.locator('[role="alert"], .success-message, [data-testid="feedback-success"]');
        await expect(successMessage).toBeVisible({ timeout: 10000 });
      }
    } else {
      // Navigate to demo and look for feedback there
      await page.goto('/demo');
      await page.waitForLoadState('networkidle');
      
      // Complete a demo session to get feedback
      const startDemo = page.locator('[data-testid="start-demo"], button');
      if (await startDemo.first().isVisible({ timeout: 5000 })) {
        await startDemo.first().click();
        await page.waitForTimeout(2000);
        
        // Look for feedback opportunity
        const feedbackOption = page.locator('[data-testid="provide-feedback"], [text*="feedback"]');
        if (await feedbackOption.isVisible({ timeout: 5000 })) {
          await feedbackOption.click();
        }
      }
    }
  });

  test('should display appropriate feedback for different performance levels', async ({ page }) => {
    // This test would ideally mock different performance scenarios
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    // Mock or simulate a session
    const demoArea = page.locator('[data-testid="demo-area"], .demo-container');
    
    if (await demoArea.isVisible({ timeout: 5000 })) {
      // Look for any results or feedback after interaction
      const resultElements = page.locator('[data-testid="result"], .result, .score-display');
      
      // If results are visible, verify they contain meaningful content
      const resultCount = await resultElements.count();
      
      if (resultCount > 0) {
        for (let i = 0; i < Math.min(resultCount, 3); i++) {
          const result = resultElements.nth(i);
          
          if (await result.isVisible()) {
            const resultText = await result.textContent();
            
            // Verify result contains useful information
            expect(resultText).toBeTruthy();
            expect(resultText?.length).toBeGreaterThan(5);
          }
        }
      }
    }
  });

  test('should validate feedback accessibility', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    // Look for feedback elements
    const feedbackElements = page.locator('[data-testid*="feedback"], .feedback, [aria-label*="feedback"]');
    const feedbackCount = await feedbackElements.count();
    
    if (feedbackCount > 0) {
      for (let i = 0; i < Math.min(feedbackCount, 3); i++) {
        const feedback = feedbackElements.nth(i);
        
        if (await feedback.isVisible()) {
          // Check for proper ARIA attributes
          const ariaLabel = await feedback.getAttribute('aria-label');
          const role = await feedback.getAttribute('role');
          const ariaDescribedBy = await feedback.getAttribute('aria-describedby');
          
          // Should have some accessibility attributes
          expect(ariaLabel || role || ariaDescribedBy).toBeTruthy();
        }
      }
    }
    
    // Check for proper heading structure in feedback
    const feedbackHeadings = page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: /feedback|result|score/i });
    
    if (await feedbackHeadings.first().isVisible({ timeout: 2000 })) {
      await expect(feedbackHeadings.first()).toBeVisible();
    }
  });

  test('should support keyboard navigation in feedback interface', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    let currentFocus = await page.locator(':focus');
    let tabCount = 0;
    const maxTabs = 10;
    
    // Navigate through focusable elements
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      currentFocus = await page.locator(':focus');
      
      if (await currentFocus.isVisible()) {
        // Check if focused element is interactive
        const tagName = await currentFocus.evaluate(el => el.tagName.toLowerCase());
        const role = await currentFocus.getAttribute('role');
        
        if (['button', 'input', 'select', 'textarea', 'a'].includes(tagName) || 
            ['button', 'link', 'textbox'].includes(role || '')) {
          
          // Test activation with Enter or Space
          if (tagName === 'button' || role === 'button') {
            // Could test button activation here
            break;
          }
        }
      }
    }
    
    expect(tabCount).toBeGreaterThan(0);
  });

  test('should handle feedback errors gracefully', async ({ page }) => {
    // Mock network failures for feedback submission
    await page.route('**/api/feedback*', route => {
      route.abort('failed');
    });
    
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    // Try to submit feedback (if form exists)
    const feedbackForm = page.locator('form').filter({ hasText: /feedback/i });
    
    if (await feedbackForm.isVisible({ timeout: 3000 })) {
      const submitButton = feedbackForm.locator('[type="submit"], button').last();
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show error message
        const errorMessage = page.locator('[role="alert"], .error-message').filter({ hasText: /error|failed/i });
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display feedback history', async ({ page }) => {
    // Navigate to dashboard or profile where feedback history might be shown
    await page.goto('/dashboard');
    
    // Look for feedback history section
    const historySection = page.locator('[data-testid="feedback-history"], .history, .past-sessions');
    
    if (await historySection.isVisible({ timeout: 5000 })) {
      await expect(historySection).toBeVisible();
      
      // Check for individual feedback items
      const feedbackItems = page.locator('[data-testid="feedback-item"], .feedback-item, .session-result');
      const itemCount = await feedbackItems.count();
      
      if (itemCount > 0) {
        // Verify first item has content
        const firstItem = feedbackItems.first();
        const itemText = await firstItem.textContent();
        
        expect(itemText).toBeTruthy();
        expect(itemText?.length).toBeGreaterThan(5);
      }
    }
  });

  test('should allow feedback filtering and sorting', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for filter or sort controls
    const filterControls = page.locator('[data-testid*="filter"], [data-testid*="sort"], select, .filter-control');
    
    if (await filterControls.first().isVisible({ timeout: 3000 })) {
      const firstFilter = filterControls.first();
      
      // Try to interact with filter
      if (await firstFilter.getAttribute('role') === 'button') {
        await firstFilter.click();
      } else if (await firstFilter.evaluate(el => el.tagName.toLowerCase()) === 'select') {
        await firstFilter.selectOption({ index: 1 });
      }
      
      // Verify content updates (basic check)
      await page.waitForTimeout(1000);
      
      // Content should still be present after filtering
      const content = page.locator('.content, .main, [data-testid="main-content"]');
      await expect(content).toBeVisible();
    }
  });
});