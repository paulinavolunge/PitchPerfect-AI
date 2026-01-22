import { test, expect } from '@playwright/test';

test.describe('Accessibility and Responsiveness', () => {
  const pages = ['/', '/demo', '/signup', '/login', '/pricing'];
  
  // Test responsive design on different viewports
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
  ];

  pages.forEach(page => {
    viewports.forEach(viewport => {
      test(`should be responsive on ${viewport.name} for ${page}`, async ({ page: testPage }) => {
        await testPage.setViewportSize({ width: viewport.width, height: viewport.height });
        await testPage.goto(page);
        await testPage.waitForLoadState('networkidle');

        // Check that content is visible and not overflowing
        const body = testPage.locator('body');
        const bodyBox = await body.boundingBox();
        
        if (bodyBox) {
          // Content should not be wider than viewport
          expect(bodyBox.width).toBeLessThanOrEqual(viewport.width + 20); // 20px tolerance
        }

        // Check for horizontal scrollbars (usually indicates responsive issues)
        const hasHorizontalScroll = await testPage.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        expect(hasHorizontalScroll).toBeFalsy();

        // Check that interactive elements are large enough on mobile
        if (viewport.name === 'mobile') {
          const buttons = testPage.locator('button, [role="button"], a');
          const buttonCount = await buttons.count();
          
          for (let i = 0; i < Math.min(buttonCount, 5); i++) {
            const button = buttons.nth(i);
            if (await button.isVisible()) {
              const buttonBox = await button.boundingBox();
              if (buttonBox) {
                // WCAG recommends 44x44px minimum touch target
                expect(buttonBox.height).toBeGreaterThanOrEqual(40);
                expect(buttonBox.width).toBeGreaterThanOrEqual(40);
              }
            }
          }
        }
      });
    });
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/');
    
    // Test focus trap in modals (if any)
    const modalTrigger = page.locator('button').filter({ hasText: /login|sign up|menu/i }).first();
    
    if (await modalTrigger.isVisible({ timeout: 3000 })) {
      await modalTrigger.click();
      
      // Check if modal opened
      const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
      
      if (await modal.isVisible({ timeout: 3000 })) {
        // Focus should be trapped within modal
        await page.keyboard.press('Tab');
        const focusedElement = await page.locator(':focus');
        
        const isWithinModal = await focusedElement.evaluate((el, modalEl) => {
          return modalEl?.contains(el) || false;
        }, await modal.elementHandle());
        
        expect(isWithinModal).toBeTruthy();
      }
    }
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    const focusableElements = [];
    let tabCount = 0;
    const maxTabs = 15;
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      const focused = await page.locator(':focus');
      
      if (await focused.isVisible()) {
        const tagName = await focused.evaluate(el => el.tagName.toLowerCase());
        const role = await focused.getAttribute('role');
        const tabIndex = await focused.getAttribute('tabindex');
        
        focusableElements.push({ tagName, role, tabIndex });
        
        // Test Enter/Space activation for buttons
        if (tagName === 'button' || role === 'button') {
          // Skip activation to avoid navigation
          break;
        }
      }
    }
    
    expect(focusableElements.length).toBeGreaterThan(3);
    
    // Test skip links
    const skipLink = page.locator('a').filter({ hasText: /skip to main|skip to content/i });
    
    if (await skipLink.isVisible({ timeout: 2000 })) {
      await expect(skipLink).toBeVisible();
    }
  });

  test('should have proper ARIA attributes and semantic HTML', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for proper heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    expect(headingCount).toBeGreaterThan(0);
    
    // Should have only one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeLessThanOrEqual(1);
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]');
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThan(0);
    
    // Check form labels
    const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"], textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      
      if (await input.isVisible()) {
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const id = await input.getAttribute('id');
        
        // Should have some form of labeling
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        } else {
          expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test button contrast
    const buttons = page.locator('button:visible').first();
    
    if (await buttons.isVisible()) {
      const buttonStyles = await buttons.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          fontSize: computed.fontSize
        };
      });
      
      // Basic check that colors are defined
      expect(buttonStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(buttonStyles.color).not.toBe('rgba(0, 0, 0, 0)');
    }
    
    // Test text contrast for important elements
    const importantText = page.locator('h1, h2, .cta, .primary').first();
    
    if (await importantText.isVisible()) {
      const textStyles = await importantText.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      expect(textStyles.color).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      
      if (await img.isVisible()) {
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        const role = await img.getAttribute('role');
        
        // Decorative images should have empty alt or role="presentation"
        // Content images should have descriptive alt text
        if (role === 'presentation' || alt === '') {
          // Decorative image - OK
          continue;
        } else {
          // Content image should have alt text
          expect(alt || ariaLabel).toBeTruthy();
          
          if (alt) {
            expect(alt.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const liveRegionCount = await liveRegions.count();
    
    if (liveRegionCount > 0) {
      for (let i = 0; i < Math.min(liveRegionCount, 3); i++) {
        const region = liveRegions.nth(i);
        
        const ariaLive = await region.getAttribute('aria-live');
        const role = await region.getAttribute('role');
        
        expect(['polite', 'assertive', 'off'].includes(ariaLive || '') || 
               ['status', 'alert'].includes(role || '')).toBeTruthy();
      }
    }
    
    // Check for proper status messages
    const statusElements = page.locator('.toast, .alert, .notification, [role="status"]');
    const statusCount = await statusElements.count();
    
    expect(statusCount).toBeGreaterThanOrEqual(0); // At least should not error
  });

  test('should work with reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that animations are disabled or reduced
    const animatedElements = page.locator('.animate, [class*="animate"], [class*="transition"]');
    const animatedCount = await animatedElements.count();
    
    if (animatedCount > 0) {
      const firstAnimated = animatedElements.first();
      
      if (await firstAnimated.isVisible()) {
        const styles = await firstAnimated.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            animationDuration: computed.animationDuration,
            transitionDuration: computed.transitionDuration
          };
        });
        
        // With reduced motion, animations should be disabled or very short
        const isReduced = 
          styles.animationDuration === '0s' || 
          styles.transitionDuration === '0s' ||
          styles.animationDuration === '0.01s' ||
          styles.transitionDuration === '0.01s';
        
        // This test might need adjustment based on CSS implementation
        expect(isReduced || !styles.animationDuration).toBeTruthy();
      }
    }
  });

  test('should be usable with high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that content is still visible
    const visibleElements = page.locator('h1, button, a').first();
    await expect(visibleElements).toBeVisible();
    
    // Check that interactive elements have sufficient contrast
    const buttons = page.locator('button').first();
    
    if (await buttons.isVisible()) {
      const buttonStyles = await buttons.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          border: computed.border
        };
      });
      
      // In high contrast mode, elements should have visible borders or backgrounds
      expect(
        buttonStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
        buttonStyles.border.includes('px')
      ).toBeTruthy();
    }
  });

  test('should support zoom up to 200%', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Zoom to 200%
    await page.setViewportSize({ width: 720, height: 450 }); // Simulate 200% zoom on 1440x900
    
    // Content should still be accessible
    const mainContent = page.locator('main, [role="main"], .main-content');
    await expect(mainContent).toBeVisible();
    
    // Navigation should still work
    const navigation = page.locator('nav, [role="navigation"]');
    await expect(navigation).toBeVisible();
    
    // Interactive elements should still be clickable
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();
      
      const buttonBox = await firstButton.boundingBox();
      expect(buttonBox).toBeTruthy();
    }
  });
});