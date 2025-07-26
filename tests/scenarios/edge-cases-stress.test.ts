import { test, expect, Browser, BrowserContext } from '@playwright/test';

test.describe('Edge Cases & Stress Testing', () => {
  test.describe('High Usage Scenarios', () => {
    test('test with maximum character limits in text input', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Generate text at various limits
      const maxChars = 2000; // Assumed max
      const longText = 'A'.repeat(maxChars);
      
      // Test exact limit
      await page.fill('textarea', longText);
      const charCount = await page.locator('[data-testid="character-count"]').textContent();
      expect(charCount).toContain('2000/2000');
      
      // Try to exceed limit
      await page.fill('textarea', longText + 'EXTRA');
      const actualValue = await page.locator('textarea').inputValue();
      expect(actualValue.length).toBe(maxChars);
      
      // Submit max length response
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify it processes successfully
      await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 20000 });
      
      // Test with unicode characters (each may count as multiple chars)
      const unicodeText = '你好世界🌍'.repeat(200);
      await page.fill('textarea', unicodeText);
      
      // Verify proper handling
      await page.getByRole('button', { name: /Submit/i }).click();
      await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 20000 });
    });

    test('test with very long voice recordings', async ({ page, context }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Grant microphone permission
      await context.grantPermissions(['microphone']);
      
      // Check maximum recording time
      await expect(page.locator('text=/Maximum recording time/i')).toBeVisible();
      const maxTime = await page.locator('[data-testid="max-recording-time"]').textContent();
      expect(maxTime).toContain('5 minutes');
      
      // Start recording
      await page.getByRole('button', { name: /Start Recording/i }).click();
      
      // Verify timer starts
      await expect(page.locator('[data-testid="recording-timer"]')).toBeVisible();
      
      // Fast forward to near limit (in real test would wait)
      await page.evaluate(() => {
        // Mock timer at 4:55
        const timer = document.querySelector('[data-testid="recording-timer"]');
        if (timer) timer.textContent = '4:55';
      });
      
      // Verify warning appears
      await expect(page.locator('[data-testid="time-warning"]')).toBeVisible();
      await expect(page.locator('text=/Recording will stop in/i')).toBeVisible();
      
      // Test auto-stop at limit
      await page.evaluate(() => {
        // Mock timer at 5:00
        const timer = document.querySelector('[data-testid="recording-timer"]');
        if (timer) timer.textContent = '5:00';
      });
      
      // Verify recording stopped automatically
      await expect(page.locator('[data-testid="recording-stopped-message"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /Start Recording/i })).toBeVisible();
      
      // Test large file processing
      await expect(page.locator('text=/Processing large recording/i')).toBeVisible();
      await expect(page.locator('[data-testid="processing-progress"]')).toBeVisible();
    });

    test('simulate high concurrent user load', async ({ browser }) => {
      const userCount = 10; // Adjust based on test environment
      const contexts: BrowserContext[] = [];
      const pages: any[] = [];
      
      // Create multiple browser contexts
      for (let i = 0; i < userCount; i++) {
        const context = await browser.newContext();
        contexts.push(context);
        const page = await context.newPage();
        pages.push(page);
        
        // Mock different user sessions
        await context.addCookies([{
          name: 'auth-token',
          value: `user-token-${i}`,
          domain: 'localhost',
          path: '/'
        }]);
      }
      
      // Simulate concurrent actions
      const promises = pages.map(async (page, index) => {
        await page.goto('/practice');
        
        // Stagger actions slightly to be more realistic
        await page.waitForTimeout(index * 100);
        
        // Each user performs different action
        if (index % 3 === 0) {
          // Voice practice
          await page.getByRole('button', { name: /Voice Mode/i }).click();
          await page.getByRole('button', { name: /Use Sample Recording/i }).click();
        } else if (index % 3 === 1) {
          // Text practice
          await page.getByRole('button', { name: /Text Mode/i }).click();
          await page.fill('textarea', `Concurrent user ${index} response`);
          await page.getByRole('button', { name: /Submit/i }).click();
        } else {
          // Analytics view
          await page.goto('/analytics');
        }
        
        // Verify no errors
        const errorLocator = page.locator('.error-message, [data-testid="error"]');
        await expect(errorLocator).not.toBeVisible();
        
        // Verify reasonable response times
        const startTime = Date.now();
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(5000); // 5 second max
      });
      
      // Wait for all concurrent operations
      await Promise.all(promises);
      
      // Cleanup
      for (const context of contexts) {
        await context.close();
      }
    });

    test('test rapid successive API calls', async ({ page }) => {
      await page.goto('/practice');
      
      // Monitor network requests
      const apiCalls: string[] = [];
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          apiCalls.push(request.url());
        }
      });
      
      // Rapid text submissions
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      for (let i = 0; i < 5; i++) {
        await page.fill('textarea', `Rapid test ${i}`);
        await page.getByRole('button', { name: /Submit/i }).click();
        
        // Don't wait for response, immediately try next
        await page.waitForTimeout(100);
        
        // Try to submit again while processing
        await page.fill('textarea', `Rapid test ${i} retry`);
        await page.getByRole('button', { name: /Submit/i }).click();
      }
      
      // Verify rate limiting or queueing works
      await page.waitForTimeout(2000);
      
      // Check for rate limit message if implemented
      const rateLimitMessage = page.locator('text=/Please wait|Rate limit|Too many requests/i');
      if (await rateLimitMessage.isVisible()) {
        // Verify graceful handling
        await expect(rateLimitMessage).toBeVisible();
        await page.waitForTimeout(5000); // Wait for rate limit to clear
      }
      
      // Verify system remains stable
      await page.reload();
      await expect(page.locator('[data-testid="practice-interface"]')).toBeVisible();
      
      // Test rapid navigation
      const routes = ['/dashboard', '/analytics', '/practice', '/progress', '/subscription'];
      for (const route of routes) {
        await page.goto(route);
        // Don't wait for full load
      }
      
      // Verify we can still use the app
      await page.goto('/practice');
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('test with poor internet connectivity', async ({ page, context }) => {
      await page.goto('/practice');
      
      // Simulate offline mode
      await context.setOffline(true);
      
      // Try to submit practice
      await page.getByRole('button', { name: /Text Mode/i }).click();
      await page.fill('textarea', 'Test response while offline');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify offline error handling
      await expect(page.locator('text=/No internet connection|Offline|Connection lost/i')).toBeVisible();
      
      // Verify retry option
      await expect(page.getByRole('button', { name: /Retry|Try Again/i })).toBeVisible();
      
      // Go back online
      await context.setOffline(false);
      
      // Retry submission
      await page.getByRole('button', { name: /Retry|Try Again/i }).click();
      
      // Verify it works now
      await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 15000 });
      
      // Test slow connection
      await page.route('**/*', async route => {
        // Delay all requests by 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.continue();
      });
      
      // Verify timeout handling
      await page.fill('textarea', 'Test with slow connection');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Should show loading state for extended time
      await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
      
      // Should eventually timeout or complete
      await expect(page.locator('text=/Taking longer than usual|Timeout|Slow connection/i')).toBeVisible({ timeout: 30000 });
    });

    test('test microphone access denied scenarios', async ({ page, context }) => {
      await page.goto('/practice');
      
      // Explicitly deny microphone permission
      await context.clearPermissions();
      
      // Try to use voice mode
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Verify permission denied message
      await expect(page.locator('text=/Microphone access denied|Permission denied/i')).toBeVisible();
      
      // Verify helpful instructions
      await expect(page.locator('text=/enable microphone|allow microphone|grant permission/i')).toBeVisible();
      
      // Verify alternative options
      await expect(page.getByRole('button', { name: /Use Text Mode Instead/i })).toBeVisible();
      
      // Test browser-specific instructions
      const browserName = page.context().browser()?.browserType().name();
      if (browserName === 'chromium') {
        await expect(page.locator('text=/Chrome.*settings/i')).toBeVisible();
      } else if (browserName === 'firefox') {
        await expect(page.locator('text=/Firefox.*permissions/i')).toBeVisible();
      }
      
      // Verify settings link
      await expect(page.getByRole('link', { name: /Browser Settings|Microphone Settings/i })).toBeVisible();
    });

    test('test payment failures and retries', async ({ page, context }) => {
      // Mock authenticated user
      await context.addCookies([{
        name: 'auth-token',
        value: 'test-user-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/pricing');
      
      // Select a plan
      await page.getByRole('button', { name: /Choose Professional/i }).click();
      
      // Fill payment form with card that will be declined
      const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
      await stripeFrame.locator('[placeholder="Card number"]').fill('4000000000000002'); // Stripe test card for decline
      await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/25');
      await stripeFrame.locator('[placeholder="CVC"]').fill('123');
      
      // Try to complete purchase
      await page.getByRole('button', { name: /Complete Purchase|Subscribe/i }).click();
      
      // Verify payment failure message
      await expect(page.locator('text=/Payment failed|Card declined|Transaction failed/i')).toBeVisible();
      
      // Verify specific error details
      await expect(page.locator('text=/card was declined|insufficient funds/i')).toBeVisible();
      
      // Verify retry option
      await expect(page.getByRole('button', { name: /Try Again|Use Different Card/i })).toBeVisible();
      
      // Test with different payment method
      await page.getByRole('button', { name: /Use Different Card/i }).click();
      
      // Use successful test card
      await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
      await page.getByRole('button', { name: /Complete Purchase|Subscribe/i }).click();
      
      // Verify success after retry
      await expect(page.locator('text=/Payment successful|Welcome to Professional/i')).toBeVisible({ timeout: 10000 });
    });

    test('test invalid input handling', async ({ page }) => {
      await page.goto('/practice');
      
      // Test empty submission
      await page.getByRole('button', { name: /Text Mode/i }).click();
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify validation message
      await expect(page.locator('text=/Please enter a response|Response required/i')).toBeVisible();
      
      // Test with only whitespace
      await page.fill('textarea', '   \n\t   ');
      await page.getByRole('button', { name: /Submit/i }).click();
      await expect(page.locator('text=/Please enter a valid response/i')).toBeVisible();
      
      // Test script injection attempts
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '${alert("XSS")}',
        '{{constructor.constructor("alert(1)")()}}'
      ];
      
      for (const input of maliciousInputs) {
        await page.fill('textarea', input);
        await page.getByRole('button', { name: /Submit/i }).click();
        
        // Verify no alerts appear
        let alertAppeared = false;
        page.on('dialog', () => { alertAppeared = true; });
        await page.waitForTimeout(1000);
        expect(alertAppeared).toBe(false);
        
        // Verify input is sanitized in display
        if (await page.locator('[data-testid="ai-feedback"]').isVisible()) {
          const feedbackText = await page.locator('[data-testid="ai-feedback"]').textContent();
          expect(feedbackText).not.toContain('<script>');
          expect(feedbackText).not.toContain('javascript:');
        }
      }
      
      // Test SQL injection attempts in search
      await page.goto('/analytics');
      if (await page.locator('input[name="search"]').isVisible()) {
        const sqlInjections = [
          "' OR '1'='1",
          "1; DROP TABLE users--",
          "admin'--",
          "1' UNION SELECT * FROM users--"
        ];
        
        for (const injection of sqlInjections) {
          await page.fill('input[name="search"]', injection);
          await page.press('input[name="search"]', 'Enter');
          
          // Verify no errors and safe handling
          await expect(page.locator('text=/Error|Exception|SQL/i')).not.toBeVisible();
        }
      }
    });

    test('test session timeout scenarios', async ({ page, context }) => {
      // Mock authenticated session
      await context.addCookies([{
        name: 'auth-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/practice');
      
      // Start a practice session
      await page.getByRole('button', { name: /Text Mode/i }).click();
      await page.fill('textarea', 'Starting practice session...');
      
      // Simulate session timeout by clearing auth
      await context.clearCookies();
      
      // Try to submit after timeout
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify session timeout handling
      await expect(page.locator('text=/Session expired|Please log in again|Session timeout/i')).toBeVisible();
      
      // Verify data preservation option
      await expect(page.locator('text=/Your work has been saved|Don\'t worry/i')).toBeVisible();
      
      // Verify redirect to login
      await expect(page.getByRole('button', { name: /Log In Again/i })).toBeVisible();
      
      // Click login and verify response is preserved
      await page.getByRole('button', { name: /Log In Again/i }).click();
      await expect(page).toHaveURL(/login/);
      
      // Verify return URL is set
      expect(page.url()).toContain('return=/practice');
    });
  });

  test.describe('Browser & Device Edge Cases', () => {
    test('test on older browser versions', async ({ page, browserName }) => {
      // Set user agent to older browser
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36');
      
      await page.goto('/');
      
      // Check for browser compatibility warning
      const compatWarning = page.locator('text=/browser is outdated|update your browser|compatibility/i');
      if (await compatWarning.isVisible()) {
        // Verify warning is helpful
        await expect(compatWarning).toContainText(/recommended browsers/i);
      }
      
      // Verify core functionality still works
      await page.goto('/practice');
      await expect(page.locator('h1')).toBeVisible();
      
      // Test fallbacks for modern features
      // Check if CSS Grid fallback works
      const mainLayout = await page.locator('main').evaluate(el => {
        return window.getComputedStyle(el).display;
      });
      
      // Verify layout is not broken
      expect(['grid', 'block', 'flex']).toContain(mainLayout);
      
      // Test JavaScript feature detection
      const hasModernFeatures = await page.evaluate(() => {
        return {
          webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
          mediaRecorder: 'MediaRecorder' in window,
          speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
        };
      });
      
      // Verify appropriate fallbacks are shown
      if (!hasModernFeatures.mediaRecorder) {
        await page.goto('/practice');
        await page.getByRole('button', { name: /Voice Mode/i }).click();
        await expect(page.locator('text=/browser does not support|voice recording not available/i')).toBeVisible();
      }
    });

    test('test with ad blockers enabled', async ({ page, context }) => {
      // Simulate ad blocker by blocking common tracking/analytics domains
      await context.route(/google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.com\/tr|analytics\.|segment\.io/, route => {
        route.abort();
      });
      
      await page.goto('/');
      
      // Verify page loads without errors
      await expect(page.locator('h1')).toBeVisible();
      
      // Verify core functionality works
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      await page.fill('textarea', 'Test with ad blocker');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify AI features work (not blocked)
      await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 15000 });
      
      // Check if payment processing still works
      await page.goto('/pricing');
      await page.getByRole('button', { name: /Choose/i }).first().click();
      
      // Verify Stripe loads (should not be blocked)
      await expect(page.frameLocator('iframe[title="Secure payment input frame"]')).toBeVisible();
    });

    test('test with JavaScript disabled (graceful degradation)', async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false
      });
      const page = await context.newPage();
      
      await page.goto('/');
      
      // Verify basic content is visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('p')).first().toBeVisible();
      
      // Verify navigation links work
      await page.click('a[href="/about"]');
      await expect(page).toHaveURL('/about');
      
      // Verify noscript message
      await expect(page.locator('noscript')).toContainText(/JavaScript is required|Enable JavaScript/i);
      
      // Verify critical information is still accessible
      await page.goto('/pricing');
      await expect(page.locator('text=/$\d+/i')).toBeVisible(); // Prices visible
      
      await context.close();
    });

    test('test on low-end mobile devices', async ({ browser }) => {
      // Simulate low-end device
      const context = await browser.newContext({
        viewport: { width: 320, height: 568 }, // iPhone SE size
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        // Throttle CPU and network
        offline: false,
      });
      
      // Further throttle via CDP if using Chromium
      const page = await context.newPage();
      
      if (context.browser()?.browserType().name() === 'chromium') {
        const client = await page.context().newCDPSession(page);
        // Throttle CPU 6x
        await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });
        // Throttle network to 3G
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 400,
          downloadThroughput: 1.6 * 1024 * 1024 / 8,
          uploadThroughput: 750 * 1024 / 8,
        });
      }
      
      await page.goto('/');
      
      // Measure initial load performance
      const loadTime = await page.evaluate(() => {
        return performance.timing.loadEventEnd - performance.timing.navigationStart;
      });
      
      // Verify reasonable load time even on slow device
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
      
      // Verify optimized images load
      const images = await page.locator('img').all();
      for (const img of images.slice(0, 3)) {
        const src = await img.getAttribute('src');
        if (src) {
          // Verify responsive images or lazy loading
          const loading = await img.getAttribute('loading');
          const srcset = await img.getAttribute('srcset');
          expect(loading === 'lazy' || srcset !== null).toBeTruthy();
        }
      }
      
      // Test memory usage doesn't cause issues
      await page.goto('/practice');
      
      // Perform memory-intensive operation
      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: /Text Mode/i }).click();
        await page.fill('textarea', `Low memory test ${i}`);
        await page.getByRole('button', { name: /Submit/i }).click();
        await page.waitForTimeout(1000);
      }
      
      // Verify app remains responsive
      await expect(page.locator('h1')).toBeVisible();
      
      await context.close();
    });

    test('test with various screen resolutions and zoom levels', async ({ browser }) => {
      const resolutions = [
        { width: 1920, height: 1080, name: 'Full HD' },
        { width: 1366, height: 768, name: 'Common Laptop' },
        { width: 1024, height: 768, name: 'Tablet Landscape' },
        { width: 768, height: 1024, name: 'Tablet Portrait' },
        { width: 375, height: 812, name: 'iPhone X' },
        { width: 2560, height: 1440, name: '2K' },
        { width: 3840, height: 2160, name: '4K' }
      ];
      
      for (const resolution of resolutions) {
        const context = await browser.newContext({
          viewport: { width: resolution.width, height: resolution.height }
        });
        const page = await context.newPage();
        
        await page.goto('/');
        
        // Verify layout doesn't break
        await expect(page.locator('h1')).toBeVisible();
        
        // Check for horizontal scroll (shouldn't exist)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
        
        // Test different zoom levels
        const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2];
        
        for (const zoom of zoomLevels) {
          // Simulate zoom with CSS
          await page.evaluate((zoomLevel) => {
            document.body.style.zoom = `${zoomLevel}`;
          }, zoom);
          
          // Verify content remains accessible
          await expect(page.locator('h1')).toBeVisible();
          
          // Verify buttons remain clickable
          const button = page.getByRole('button').first();
          if (await button.isVisible()) {
            const isClickable = await button.isEnabled();
            expect(isClickable).toBe(true);
          }
        }
        
        await context.close();
      }
    });
  });
});
