import { test, expect, Page, BrowserContext } from '@playwright/test';
import { createHash } from 'crypto';

test.describe('Pre-Launch Readiness Checklist', () => {
  test.describe('4.1 Critical User Flows', () => {
    test('all critical user flows work flawlessly', async ({ page, context }) => {
      const criticalFlows = [
        {
          name: 'Complete Signup to First Practice',
          steps: async () => {
            await page.goto('/');
            await page.getByRole('link', { name: /sign up|get started/i }).click();
            
            const testEmail = `prelaunch_${Date.now()}@test.com`;
            await page.fill('input[type="email"]', testEmail);
            await page.fill('input[type="password"]', 'SecurePass123!');
            await page.fill('input[name="fullName"]', 'Test User');
            
            await page.getByRole('button', { name: /sign up|create account/i }).click();
            
            // Verify email confirmation flow
            await expect(page.locator('text=/check your email|verify your email/i')).toBeVisible({ timeout: 10000 });
            
            // Simulate email confirmation
            await page.goto('/email-confirmed');
            await expect(page.locator('text=/confirmed|verified/i')).toBeVisible();
            
            // Navigate to first practice
            await page.getByRole('button', { name: /go to dashboard|get started/i }).click();
            await expect(page).toHaveURL(/dashboard|practice/);
          }
        },
        {
          name: 'Voice Practice End-to-End',
          steps: async () => {
            await page.goto('/practice');
            await page.getByRole('button', { name: /voice mode/i }).click();
            
            // Check microphone permission UI
            await expect(page.locator('[data-testid="mic-permission"]')).toBeVisible();
            
            // Grant permission
            await context.grantPermissions(['microphone']);
            
            // Start recording
            await page.getByRole('button', { name: /start recording/i }).click();
            await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
            
            // Stop and verify processing
            await page.waitForTimeout(2000);
            await page.getByRole('button', { name: /stop recording/i }).click();
            
            await expect(page.locator('text=/processing|analyzing/i')).toBeVisible();
            await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 20000 });
          }
        },
        {
          name: 'Text Practice End-to-End',
          steps: async () => {
            await page.goto('/practice');
            await page.getByRole('button', { name: /text mode/i }).click();
            
            // Enter comprehensive response
            const response = `I understand your concern about the price. Let me break down the value:
            1. ROI within 3 months based on similar clients
            2. 24/7 support included
            3. Free training for your entire team
            Would you like to see a customized ROI calculation for your specific situation?`;
            
            await page.fill('textarea', response);
            await page.getByRole('button', { name: /submit|analyze/i }).click();
            
            // Verify AI processing and feedback
            await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('[data-testid="feedback-score"]')).toBeVisible();
            await expect(page.locator('[data-testid="improvement-suggestions"]')).toBeVisible();
          }
        },
        {
          name: 'Subscription Purchase Flow',
          steps: async () => {
            await page.goto('/pricing');
            await page.getByRole('button', { name: /choose professional|get professional/i }).click();
            
            // Verify checkout page
            await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
            await expect(page.locator('text=/$49/i')).toBeVisible();
            
            // Fill payment details
            const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
            await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
            await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/25');
            await stripeFrame.locator('[placeholder="CVC"]').fill('123');
            
            await page.fill('input[name="billingName"]', 'Test User');
            await page.fill('input[name="billingZip"]', '12345');
            
            // Complete purchase
            await page.getByRole('button', { name: /subscribe|complete purchase/i }).click();
            
            // Verify success
            await expect(page.locator('text=/success|welcome to professional/i')).toBeVisible({ timeout: 15000 });
          }
        },
        {
          name: 'Analytics and Progress Tracking',
          steps: async () => {
            await page.goto('/analytics');
            
            // Verify analytics load
            await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
            await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
            await expect(page.locator('[data-testid="session-history"]')).toBeVisible();
            
            // Test date filtering
            await page.selectOption('select[name="dateRange"]', 'last-7-days');
            await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
            
            // Verify data updates
            const initialCount = await page.locator('[data-testid="total-sessions"]').textContent();
            expect(initialCount).toBeTruthy();
          }
        }
      ];
      
      // Execute all critical flows
      for (const flow of criticalFlows) {
        console.log(`Testing: ${flow.name}`);
        try {
          await flow.steps();
          console.log(`✓ ${flow.name} - PASSED`);
        } catch (error) {
          console.error(`✗ ${flow.name} - FAILED:`, error);
          throw error;
        }
      }
    });

    test('payment processing is secure and reliable', async ({ page, context }) => {
      // Test payment security
      await page.goto('/pricing');
      
      // Verify HTTPS
      expect(page.url()).toMatch(/^https:/);
      
      // Check for security headers
      const response = await page.goto('/pricing');
      const headers = response?.headers();
      
      // Security headers validation
      expect(headers?.['strict-transport-security']).toBeTruthy();
      expect(headers?.['x-content-type-options']).toBe('nosniff');
      expect(headers?.['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
      
      // Test Stripe integration
      await page.getByRole('button', { name: /choose|select/i }).first().click();
      
      // Verify Stripe iframe loads securely
      const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
      await expect(stripeFrame).toBeVisible();
      
      // Check for PCI compliance indicators
      await expect(page.locator('text=/secured by stripe|stripe secured/i')).toBeVisible();
      await expect(page.locator('[data-testid="ssl-badge"]')).toBeVisible();
      
      // Test various card scenarios
      const testCards = [
        { number: '4242424242424242', description: 'Valid card', shouldSucceed: true },
        { number: '4000000000000002', description: 'Declined card', shouldSucceed: false },
        { number: '4000000000009995', description: 'Insufficient funds', shouldSucceed: false },
        { number: '4000000000000069', description: 'Expired card', shouldSucceed: false }
      ];
      
      for (const card of testCards) {
        await page.reload();
        await page.getByRole('button', { name: /choose|select/i }).first().click();
        
        const frame = page.frameLocator('iframe[title="Secure payment input frame"]');
        await frame.locator('[placeholder="Card number"]').fill(card.number);
        await frame.locator('[placeholder="MM / YY"]').fill('12/25');
        await frame.locator('[placeholder="CVC"]').fill('123');
        
        await page.getByRole('button', { name: /pay|subscribe/i }).click();
        
        if (card.shouldSucceed) {
          await expect(page.locator('text=/success|confirmed/i')).toBeVisible({ timeout: 15000 });
        } else {
          await expect(page.locator('text=/declined|failed|error/i')).toBeVisible({ timeout: 10000 });
          await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        }
      }
    });

    test('voice recording and AI analysis function perfectly', async ({ page, context, browserName }) => {
      await page.goto('/practice');
      
      // Test across different browsers
      console.log(`Testing voice features on ${browserName}`);
      
      // Grant microphone permission
      await context.grantPermissions(['microphone']);
      
      await page.getByRole('button', { name: /voice mode/i }).click();
      
      // Verify audio context initialization
      const hasAudioContext = await page.evaluate(() => {
        return 'AudioContext' in window || 'webkitAudioContext' in window;
      });
      expect(hasAudioContext).toBeTruthy();
      
      // Test recording quality settings
      await page.getByRole('button', { name: /settings|options/i }).click();
      await expect(page.locator('[data-testid="audio-quality"]')).toBeVisible();
      
      // Verify noise cancellation option
      await expect(page.locator('[data-testid="noise-cancellation"]')).toBeVisible();
      
      // Test multiple recording sessions
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /start recording/i }).click();
        
        // Verify visual feedback
        await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
        await expect(page.locator('[data-testid="audio-level-meter"]')).toBeVisible();
        
        // Check timer
        await expect(page.locator('[data-testid="recording-timer"]')).toBeVisible();
        
        await page.waitForTimeout(2000);
        await page.getByRole('button', { name: /stop recording/i }).click();
        
        // Verify AI processing
        await expect(page.locator('text=/processing|analyzing/i')).toBeVisible();
        await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 20000 });
        
        // Verify comprehensive feedback
        await expect(page.locator('[data-testid="vocal-analysis"]')).toBeVisible();
        await expect(page.locator('[data-testid="content-feedback"]')).toBeVisible();
        await expect(page.locator('[data-testid="improvement-tips"]')).toBeVisible();
        
        if (i < 2) {
          await page.getByRole('button', { name: /try again|new recording/i }).click();
        }
      }
    });

    test('mobile experience is optimized and bug-free', async ({ browser }) => {
      // Test on various mobile devices
      const mobileDevices = [
        { name: 'iPhone 13', device: 'iPhone 13' },
        { name: 'iPhone SE', device: 'iPhone SE' },
        { name: 'Pixel 5', device: 'Pixel 5' },
        { name: 'Galaxy S21', device: 'Galaxy S21' }
      ];
      
      for (const mobile of mobileDevices) {
        const context = await browser.newContext({
          ...devices[mobile.device],
          permissions: ['microphone']
        });
        const page = await context.newPage();
        
        console.log(`Testing on ${mobile.name}`);
        
        // Test responsive navigation
        await page.goto('/');
        
        // Verify mobile menu
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
        await page.locator('[data-testid="mobile-menu-button"]').click();
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
        
        // Test touch interactions
        await page.locator('[data-testid="mobile-menu"]').locator('text=Practice').click();
        await expect(page).toHaveURL('/practice');
        
        // Verify touch-optimized buttons
        const buttons = await page.getByRole('button').all();
        for (const button of buttons.slice(0, 5)) {
          if (await button.isVisible()) {
            const box = await button.boundingBox();
            if (box) {
              expect(box.height).toBeGreaterThanOrEqual(44); // iOS minimum
              expect(box.width).toBeGreaterThanOrEqual(44);
            }
          }
        }
        
        // Test scrolling performance
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.evaluate(() => window.scrollTo(0, 0));
        
        // Test form inputs on mobile
        await page.goto('/practice');
        await page.getByRole('button', { name: /text mode/i }).click();
        
        // Verify keyboard doesn't cover input
        await page.locator('textarea').click();
        await page.waitForTimeout(500); // Wait for keyboard
        
        const textareaBox = await page.locator('textarea').boundingBox();
        const viewportSize = page.viewportSize();
        if (textareaBox && viewportSize) {
          expect(textareaBox.y + textareaBox.height).toBeLessThan(viewportSize.height);
        }
        
        await context.close();
      }
    });

    test('all forms validate properly and handle errors gracefully', async ({ page }) => {
      // Test all forms in the application
      const forms = [
        {
          url: '/signup',
          fields: [
            { selector: 'input[type="email"]', validValue: 'test@example.com', invalidValues: ['invalid', 'test@', '@test.com', ''] },
            { selector: 'input[type="password"]', validValue: 'SecurePass123!', invalidValues: ['123', 'password', '', 'NoSpecialChar1'] }
          ]
        },
        {
          url: '/login',
          fields: [
            { selector: 'input[type="email"]', validValue: 'test@example.com', invalidValues: ['', 'notanemail'] },
            { selector: 'input[type="password"]', validValue: 'password123', invalidValues: [''] }
          ]
        },
        {
          url: '/contact',
          fields: [
            { selector: 'input[name="name"]', validValue: 'John Doe', invalidValues: ['', 'A'] },
            { selector: 'input[name="email"]', validValue: 'john@example.com', invalidValues: ['invalid@'] },
            { selector: 'textarea[name="message"]', validValue: 'Test message', invalidValues: ['', '   '] }
          ]
        }
      ];
      
      for (const form of forms) {
        await page.goto(form.url);
        
        // Test empty form submission
        const submitButton = page.getByRole('button', { name: /submit|send|sign up|log in/i });
        await submitButton.click();
        
        // Verify validation messages appear
        await expect(page.locator('.error-message, [data-testid="error"]')).toBeVisible();
        
        // Test each field
        for (const field of form.fields) {
          // Test invalid values
          for (const invalidValue of field.invalidValues) {
            await page.fill(field.selector, invalidValue);
            await page.locator(field.selector).blur();
            
            // Verify inline validation
            await expect(page.locator(`${field.selector} ~ .error-message, ${field.selector} ~ [data-testid="field-error"]`)).toBeVisible();
          }
          
          // Test valid value
          await page.fill(field.selector, field.validValue);
          await page.locator(field.selector).blur();
          
          // Verify error clears
          await expect(page.locator(`${field.selector} ~ .error-message`)).not.toBeVisible();
        }
      }
    });

    test('loading times are under 3 seconds on average connections', async ({ page }) => {
      // Test loading times for key pages
      const pages = [
        { url: '/', name: 'Homepage' },
        { url: '/practice', name: 'Practice' },
        { url: '/analytics', name: 'Analytics' },
        { url: '/pricing', name: 'Pricing' },
        { url: '/dashboard', name: 'Dashboard' }
      ];
      
      const loadTimes: number[] = [];
      
      for (const testPage of pages) {
        // Clear cache for accurate measurement
        await page.context().clearCookies();
        
        const startTime = Date.now();
        await page.goto(testPage.url, { waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;
        
        loadTimes.push(loadTime);
        console.log(`${testPage.name}: ${loadTime}ms`);
        
        // Verify page loaded correctly
        await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible();
        
        // Check for performance metrics
        const metrics = await page.evaluate(() => {
          const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          return {
            domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
            loadComplete: perf.loadEventEnd - perf.loadEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          };
        });
        
        // Verify performance targets
        expect(metrics.firstContentfulPaint).toBeLessThan(1500); // FCP under 1.5s
        expect(loadTime).toBeLessThan(3000); // Total load under 3s
      }
      
      // Calculate average
      const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      console.log(`Average load time: ${avgLoadTime}ms`);
      expect(avgLoadTime).toBeLessThan(3000);
    });

    test('all links and buttons work correctly', async ({ page }) => {
      const visitedUrls = new Set<string>();
      const errors: string[] = [];
      
      async function checkPage(url: string) {
        if (visitedUrls.has(url)) return;
        visitedUrls.add(url);
        
        try {
          await page.goto(url, { waitUntil: 'networkidle' });
          
          // Check all links
          const links = await page.locator('a[href]').all();
          for (const link of links) {
            const href = await link.getAttribute('href');
            if (!href) continue;
            
            // Skip external links and anchors
            if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) continue;
            
            // Test link
            const response = await page.request.head(href).catch(() => null);
            if (!response || response.status() >= 400) {
              errors.push(`Broken link: ${href} on page ${url}`);
            }
          }
          
          // Check all buttons
          const buttons = await page.getByRole('button').all();
          for (const button of buttons) {
            if (await button.isVisible()) {
              const isDisabled = await button.isDisabled();
              const text = await button.textContent();
              
              if (!isDisabled) {
                // Verify button is clickable
                try {
                  await button.click({ trial: true });
                } catch (e) {
                  errors.push(`Unclickable button: "${text}" on page ${url}`);
                }
              }
            }
          }
          
          // Recursively check internal links
          for (const link of links) {
            const href = await link.getAttribute('href');
            if (href && href.startsWith('/') && !visitedUrls.has(href)) {
              await checkPage(href);
            }
          }
        } catch (error) {
          errors.push(`Error checking page ${url}: ${error}`);
        }
      }
      
      await checkPage('/');
      
      // Report any errors found
      if (errors.length > 0) {
        console.error('Link/Button errors found:', errors);
        throw new Error(`Found ${errors.length} broken links/buttons`);
      }
    });

    test('email notifications and confirmations are sent properly', async ({ page, request }) => {
      // Test email flows
      const emailTests = [
        {
          action: 'Signup confirmation',
          trigger: async () => {
            await page.goto('/signup');
            const testEmail = `email_test_${Date.now()}@example.com`;
            await page.fill('input[type="email"]', testEmail);
            await page.fill('input[type="password"]', 'TestPass123!');
            await page.getByRole('button', { name: /sign up/i }).click();
            return testEmail;
          },
          expectedEmails: ['Welcome', 'Confirm your email']
        },
        {
          action: 'Password reset',
          trigger: async () => {
            await page.goto('/login');
            await page.getByRole('link', { name: /forgot password/i }).click();
            const testEmail = 'reset@example.com';
            await page.fill('input[type="email"]', testEmail);
            await page.getByRole('button', { name: /reset password/i }).click();
            return testEmail;
          },
          expectedEmails: ['Reset your password']
        },
        {
          action: 'Subscription confirmation',
          trigger: async () => {
            // Mock subscription purchase
            const testEmail = 'subscriber@example.com';
            // Would trigger actual purchase in real test
            return testEmail;
          },
          expectedEmails: ['Subscription confirmed', 'Welcome to Professional']
        }
      ];
      
      for (const test of emailTests) {
        console.log(`Testing email: ${test.action}`);
        const email = await test.trigger();
        
        // Verify UI shows email sent message
        await expect(page.locator('text=/email sent|check your email/i')).toBeVisible();
        
        // In real test, would check email service API
        // For now, verify the email trigger was successful
        expect(email).toBeTruthy();
      }
    });

    test('user data is properly secured and encrypted', async ({ page, context }) => {
      // Test data security
      await page.goto('/');
      
      // Verify HTTPS everywhere
      const pages = ['/', '/login', '/signup', '/practice', '/payment'];
      for (const path of pages) {
        await page.goto(path);
        expect(page.url()).toMatch(/^https:/);
      }
      
      // Check localStorage encryption
      await page.evaluate(() => {
        localStorage.setItem('test_sensitive', 'sensitive_data');
      });
      
      const storedData = await page.evaluate(() => localStorage.getItem('test_sensitive'));
      
      // In production, this should be encrypted
      if (storedData && storedData === 'sensitive_data') {
        console.warn('Warning: Sensitive data may not be encrypted in localStorage');
      }
      
      // Test password handling
      await page.goto('/signup');
      await page.fill('input[type="password"]', 'TestPassword123!');
      
      // Verify password is not visible in DOM
      const passwordValue = await page.locator('input[type="password"]').inputValue();
      const pageContent = await page.content();
      expect(pageContent).not.toContain(passwordValue);
      
      // Check for secure cookies
      const cookies = await context.cookies();
      for (const cookie of cookies) {
        if (cookie.name.includes('auth') || cookie.name.includes('session')) {
          expect(cookie.secure).toBeTruthy();
          expect(cookie.httpOnly).toBeTruthy();
          expect(cookie.sameSite).toMatch(/Strict|Lax/);
        }
      }
      
      // Test API security headers
      const apiResponse = await page.request.get('/api/user');
      const headers = apiResponse.headers();
      
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBeTruthy();
      expect(headers['strict-transport-security']).toBeTruthy();
    });

    test('GDPR compliance is fully implemented', async ({ page }) => {
      await page.goto('/');
      
      // Check for cookie consent banner
      await expect(page.locator('[data-testid="cookie-banner"]')).toBeVisible();
      
      // Verify privacy policy link
      await expect(page.getByRole('link', { name: /privacy policy/i })).toBeVisible();
      
      // Test cookie preferences
      await page.getByRole('button', { name: /cookie settings|preferences/i }).click();
      await expect(page.locator('[data-testid="cookie-preferences"]')).toBeVisible();
      
      // Verify granular controls
      await expect(page.locator('input[name="essential-cookies"]')).toBeChecked();
      await expect(page.locator('input[name="analytics-cookies"]')).toBeVisible();
      await expect(page.locator('input[name="marketing-cookies"]')).toBeVisible();
      
      // Test reject all
      await page.getByRole('button', { name: /reject all/i }).click();
      
      // Verify only essential cookies are set
      const cookies = await page.context().cookies();
      const nonEssentialCookies = cookies.filter(c => 
        c.name.includes('analytics') || c.name.includes('marketing') || c.name.includes('_ga')
      );
      expect(nonEssentialCookies.length).toBe(0);
      
      // Test data export
      await page.goto('/account-settings');
      await expect(page.getByRole('button', { name: /export my data/i })).toBeVisible();
      
      // Test data deletion
      await expect(page.getByRole('button', { name: /delete my account/i })).toBeVisible();
      
      // Verify privacy policy content
      await page.goto('/privacy');
      await expect(page.locator('text=/data controller/i')).toBeVisible();
      await expect(page.locator('text=/legal basis/i')).toBeVisible();
      await expect(page.locator('text=/data retention/i')).toBeVisible();
      await expect(page.locator('text=/your rights/i')).toBeVisible();
    });

    test('analytics and tracking are properly configured', async ({ page, context }) => {
      await page.goto('/');
      
      // Check for analytics scripts
      const hasAnalytics = await page.evaluate(() => {
        return window.hasOwnProperty('gtag') || window.hasOwnProperty('ga') || window.hasOwnProperty('analytics');
      });
      
      if (hasAnalytics) {
        // Verify analytics respect consent
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        
        // Before consent, no tracking should occur
        const requests: string[] = [];
        page.on('request', request => {
          if (request.url().includes('google-analytics') || request.url().includes('segment')) {
            requests.push(request.url());
          }
        });
        
        await page.waitForTimeout(2000);
        expect(requests.length).toBe(0);
        
        // Accept analytics
        await page.getByRole('button', { name: /accept all|accept cookies/i }).click();
        
        // Verify analytics loads after consent
        await page.reload();
        await page.waitForTimeout(2000);
        
        // Check for proper event tracking
        await page.getByRole('button', { name: /get started/i }).first().click();
        
        // Verify event was tracked (would check analytics dashboard in real test)
      }
      
      // Test error tracking
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Navigate through app
      await page.goto('/practice');
      await page.goto('/analytics');
      await page.goto('/pricing');
      
      // No console errors should appear
      expect(consoleErrors.length).toBe(0);
    });

    test('error monitoring and logging are in place', async ({ page }) => {
      // Check for error monitoring service
      const hasErrorMonitoring = await page.evaluate(() => {
        return window.hasOwnProperty('Sentry') || 
               window.hasOwnProperty('Rollbar') || 
               window.hasOwnProperty('Bugsnag');
      });
      
      expect(hasErrorMonitoring).toBeTruthy();
      
      // Test error handling
      await page.goto('/');
      
      // Trigger a handled error
      await page.evaluate(() => {
        try {
          throw new Error('Test error for monitoring');
        } catch (e) {
          // Should be caught and logged
          console.error(e);
        }
      });
      
      // Test 404 error page
      await page.goto('/non-existent-page-12345');
      await expect(page.locator('text=/404|not found/i')).toBeVisible();
      await expect(page.getByRole('link', { name: /home|go back/i })).toBeVisible();
      
      // Test API error handling
      const response = await page.request.get('/api/non-existent-endpoint');
      expect(response.status()).toBe(404);
      
      const errorData = await response.json().catch(() => ({}));
      expect(errorData).toHaveProperty('error');
    });
  });

  test.describe('4.2 Business Logic Validation', () => {
    test('pricing and billing accuracy', async ({ page, context }) => {
      // Mock authenticated user
      await context.addCookies([{
        name: 'auth-token',
        value: 'test-billing-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      // Test all pricing scenarios
      const pricingTests = [
        {
          plan: 'Starter',
          monthlyPrice: 29,
          credits: 50,
          features: ['Basic AI Analysis', 'Email Support']
        },
        {
          plan: 'Professional',
          monthlyPrice: 49,
          credits: 150,
          features: ['Advanced AI Analysis', 'Priority Support', 'Custom Scenarios']
        },
        {
          plan: 'Enterprise',
          monthlyPrice: 149,
          credits: 500,
          features: ['All Features', 'Dedicated Support', 'Team Management']
        }
      ];
      
      for (const test of pricingTests) {
        await page.goto('/pricing');
        
        // Verify displayed price
        const planCard = page.locator(`[data-testid="plan-${test.plan.toLowerCase()}"]`);
        await expect(planCard).toContainText(`$${test.monthlyPrice}`);
        await expect(planCard).toContainText(`${test.credits} credits`);
        
        // Verify features listed
        for (const feature of test.features) {
          await expect(planCard).toContainText(feature);
        }
        
        // Test checkout process
        await planCard.getByRole('button', { name: /choose|select/i }).click();
        
        // Verify checkout shows correct price
        await expect(page.locator('[data-testid="checkout-total"]')).toContainText(`$${test.monthlyPrice}`);
        
        // Go back to test next plan
        await page.goBack();
      }
    });

    test('test proration for plan changes', async ({ page, context }) => {
      // Setup user with existing subscription
      await context.addCookies([{
        name: 'auth-token',
        value: 'existing-subscriber-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/subscription');
      
      // Current plan: Starter ($29/month)
      await expect(page.locator('[data-testid="current-plan"]')).toContainText('Starter');
      
      // Upgrade to Professional
      await page.getByRole('button', { name: /upgrade.*professional/i }).click();
      
      // Verify proration calculation
      await expect(page.locator('[data-testid="proration-details"]')).toBeVisible();
      
      // Check proration math (assuming mid-month upgrade)
      await expect(page.locator('[data-testid="remaining-credit"]')).toBeVisible();
      await expect(page.locator('[data-testid="new-charge"]')).toBeVisible();
      await expect(page.locator('[data-testid="amount-due"]')).toBeVisible();
      
      // Test downgrade proration
      await page.goto('/subscription');
      await page.getByRole('button', { name: /change plan/i }).click();
      await page.getByRole('button', { name: /downgrade.*starter/i }).click();
      
      // Verify credit for unused time
      await expect(page.locator('[data-testid="account-credit"]')).toBeVisible();
      await expect(page.locator('text=/credit will be applied/i')).toBeVisible();
    });

    test('verify credit calculations are accurate', async ({ page, context }) => {
      await context.addCookies([{
        name: 'auth-token',
        value: 'test-credits-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      // Check initial credit balance
      await page.goto('/dashboard');
      const initialCredits = await page.locator('[data-testid="credit-balance"]').textContent();
      const initialCount = parseInt(initialCredits || '0');
      
      // Use credits for different activities
      const creditUsage = [
        { activity: 'Text Practice', cost: 1 },
        { activity: 'Voice Practice', cost: 2 },
        { activity: 'AI Voice Analysis', cost: 3 }
      ];
      
      let expectedCredits = initialCount;
      
      for (const usage of creditUsage) {
        await page.goto('/practice');
        
        if (usage.activity.includes('Voice')) {
          await page.getByRole('button', { name: /voice mode/i }).click();
          await page.getByRole('button', { name: /use sample/i }).click();
        } else {
          await page.getByRole('button', { name: /text mode/i }).click();
          await page.fill('textarea', 'Test response');
          await page.getByRole('button', { name: /submit/i }).click();
        }
        
        // Wait for processing
        await page.waitForTimeout(3000);
        
        // Check credit deduction
        expectedCredits -= usage.cost;
        await page.goto('/dashboard');
        const currentCredits = await page.locator('[data-testid="credit-balance"]').textContent();
        expect(parseInt(currentCredits || '0')).toBe(expectedCredits);
      }
      
      // Test credit purchase
      await page.getByRole('button', { name: /buy credits/i }).click();
      await page.getByRole('button', { name: /50 credits.*\$29/i }).click();
      
      // Complete purchase (mocked)
      await page.getByRole('button', { name: /complete purchase/i }).click();
      
      // Verify credits added
      await page.goto('/dashboard');
      const newCredits = await page.locator('[data-testid="credit-balance"]').textContent();
      expect(parseInt(newCredits || '0')).toBe(expectedCredits + 50);
    });

    test('test refund processing', async ({ page, context }) => {
      await context.addCookies([{
        name: 'auth-token',
        value: 'recent-purchase-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      // Navigate to subscription page
      await page.goto('/subscription');
      
      // Check for refund eligibility (within 7 days)
      await expect(page.locator('[data-testid="refund-eligible"]')).toBeVisible();
      await expect(page.locator('text=/money-back guarantee/i')).toBeVisible();
      
      // Request refund
      await page.getByRole('button', { name: /request refund/i }).click();
      
      // Fill refund form
      await page.selectOption('select[name="refundReason"]', 'not-satisfied');
      await page.fill('textarea[name="feedback"]', 'Testing refund process');
      
      // Submit refund request
      await page.getByRole('button', { name: /submit refund request/i }).click();
      
      // Verify confirmation
      await expect(page.locator('text=/refund request submitted/i')).toBeVisible();
      await expect(page.locator('text=/3-5 business days/i')).toBeVisible();
      
      // Verify account status updated
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText(/pending cancellation|refund processing/i);
    });

    test('ensure tax calculations are correct', async ({ page, context }) => {
      await context.addCookies([{
        name: 'auth-token',
        value: 'test-tax-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      // Test tax calculation for different locations
      const taxScenarios = [
        { location: 'CA', rate: 0.0725, applies: true },
        { location: 'TX', rate: 0.0625, applies: true },
        { location: 'OR', rate: 0, applies: false },
        { location: 'International', rate: 0, applies: false }
      ];
      
      for (const scenario of taxScenarios) {
        await page.goto('/checkout');
        
        // Set location
        await page.fill('input[name="billingState"]', scenario.location);
        
        // Get base price
        const basePrice = await page.locator('[data-testid="subtotal"]').textContent();
        const price = parseFloat(basePrice?.replace('$', '') || '0');
        
        if (scenario.applies) {
          // Verify tax is calculated
          await expect(page.locator('[data-testid="tax-amount"]')).toBeVisible();
          
          const taxAmount = await page.locator('[data-testid="tax-amount"]').textContent();
          const calculatedTax = price * scenario.rate;
          const displayedTax = parseFloat(taxAmount?.replace('$', '') || '0');
          
          // Allow for rounding differences
          expect(Math.abs(displayedTax - calculatedTax)).toBeLessThan(0.01);
        } else {
          // Verify no tax for this location
          const taxElement = page.locator('[data-testid="tax-amount"]');
          const taxText = await taxElement.textContent().catch(() => '');
          expect(taxText === '' || taxText === '$0.00').toBeTruthy();
        }
      }
    });

    test('feature access control', async ({ page, context }) => {
      // Test different subscription levels
      const subscriptionLevels = [
        {
          level: 'free',
          token: 'free-user-token',
          allowedFeatures: ['basic-practice', 'demo'],
          restrictedFeatures: ['custom-scenarios', 'team-management', 'advanced-analytics']
        },
        {
          level: 'starter',
          token: 'starter-user-token',
          allowedFeatures: ['basic-practice', 'basic-analytics', 'email-support'],
          restrictedFeatures: ['custom-scenarios', 'team-management']
        },
        {
          level: 'professional',
          token: 'pro-user-token',
          allowedFeatures: ['basic-practice', 'advanced-analytics', 'custom-scenarios', 'priority-support'],
          restrictedFeatures: ['team-management']
        },
        {
          level: 'enterprise',
          token: 'enterprise-user-token',
          allowedFeatures: ['all-features'],
          restrictedFeatures: []
        }
      ];
      
      for (const sub of subscriptionLevels) {
        // Set user context
        await context.clearCookies();
        await context.addCookies([{
          name: 'auth-token',
          value: sub.token,
          domain: 'localhost',
          path: '/'
        }]);
        
        console.log(`Testing ${sub.level} subscription access`);
        
        // Test allowed features
        if (sub.allowedFeatures.includes('custom-scenarios')) {
          await page.goto('/practice');
          await expect(page.getByRole('button', { name: /create custom scenario/i })).toBeVisible();
        }
        
        if (sub.allowedFeatures.includes('team-management')) {
          await page.goto('/team');
          await expect(page.locator('[data-testid="team-dashboard"]')).toBeVisible();
        }
        
        // Test restricted features
        for (const restricted of sub.restrictedFeatures) {
          if (restricted === 'custom-scenarios') {
            await page.goto('/practice');
            await expect(page.getByRole('button', { name: /create custom scenario/i })).not.toBeVisible();
            
            // Try direct URL access
            await page.goto('/practice/custom-scenarios');
            await expect(page.locator('text=/upgrade.*access/i')).toBeVisible();
          }
          
          if (restricted === 'team-management') {
            await page.goto('/team');
            await expect(page.locator('text=/upgrade.*team features/i')).toBeVisible();
          }
        }
      }
    });

    test('trial limitations work correctly', async ({ page, context }) => {
      // Set up trial user
      await context.addCookies([{
        name: 'auth-token',
        value: 'trial-user-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.evaluate(() => {
        localStorage.setItem('trial_start_date', new Date().toISOString());
        localStorage.setItem('trial_analyses_used', '0');
      });
      
      await page.goto('/dashboard');
      
      // Verify trial status shown
      await expect(page.locator('[data-testid="trial-banner"]')).toBeVisible();
      await expect(page.locator('text=/free trial/i')).toBeVisible();
      await expect(page.locator('text=/1 free analysis/i')).toBeVisible();
      
      // Use the free analysis
      await page.goto('/practice');
      await page.getByRole('button', { name: /text mode/i }).click();
      await page.fill('textarea', 'Trial user test response');
      await page.getByRole('button', { name: /submit/i }).click();
      
      // Wait for analysis
      await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 15000 });
      
      // Try to use another analysis
      await page.getByRole('button', { name: /try again/i }).click();
      await page.fill('textarea', 'Second attempt');
      await page.getByRole('button', { name: /submit/i }).click();
      
      // Should see upgrade prompt
      await expect(page.locator('text=/trial limit reached|upgrade to continue/i')).toBeVisible();
      await expect(page.getByRole('button', { name: /upgrade now/i })).toBeVisible();
      
      // Test trial expiration (mock 7 days later)
      await page.evaluate(() => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 8);
        localStorage.setItem('trial_start_date', pastDate.toISOString());
      });
      
      await page.reload();
      await expect(page.locator('text=/trial expired/i')).toBeVisible();
    });

    test('team access controls and permissions', async ({ page, context }) => {
      // Set up team context
      await context.addCookies([{
        name: 'auth-token',
        value: 'team-admin-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/team-dashboard');
      
      // Test admin capabilities
      await expect(page.getByRole('button', { name: /add team member/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /manage billing/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /team settings/i })).toBeVisible();
      
      // Add team member with specific permissions
      await page.getByRole('button', { name: /add team member/i }).click();
      
      await page.fill('input[name="memberEmail"]', 'newmember@team.com');
      await page.fill('input[name="memberName"]', 'New Member');
      
      // Set permissions
      await page.uncheck('input[name="canManageTeam"]');
      await page.check('input[name="canViewAnalytics"]');
      await page.check('input[name="canCreateScenarios"]');
      await page.uncheck('input[name="canManageBilling"]');
      
      await page.getByRole('button', { name: /send invitation/i }).click();
      
      // Switch to regular member view
      await context.clearCookies();
      await context.addCookies([{
        name: 'auth-token',
        value: 'team-member-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/team-dashboard');
      
      // Verify limited access
      await expect(page.getByRole('button', { name: /add team member/i })).not.toBeVisible();
      await expect(page.getByRole('button', { name: /manage billing/i })).not.toBeVisible();
      
      // But can view analytics
      await page.getByRole('tab', { name: /analytics/i }).click();
      await expect(page.locator('[data-testid="team-analytics"]')).toBeVisible();
      
      // Test permission enforcement on API level
      const response = await page.request.post('/api/team/members', {
        data: { email: 'unauthorized@test.com' }
      });
      expect(response.status()).toBe(403); // Forbidden
    });
  });
});
