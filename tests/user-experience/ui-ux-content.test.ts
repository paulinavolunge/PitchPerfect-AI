import { test, expect, devices } from '@playwright/test';

test.describe('User Interface & Experience', () => {
  test.describe('Design & Usability', () => {
    test('intuitive navigation and user flow', async ({ page }) => {
      await page.goto('/');
      
      // Test main navigation
      const navItems = ['Practice', 'Analytics', 'Pricing', 'About'];
      for (const item of navItems) {
        await expect(page.getByRole('navigation').getByText(item)).toBeVisible();
      }
      
      // Test navigation flow
      await page.getByRole('link', { name: /Practice/i }).click();
      await expect(page).toHaveURL('/practice');
      
      // Verify breadcrumbs
      await expect(page.locator('[data-testid="breadcrumbs"]')).toBeVisible();
      await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('Home');
      await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('Practice');
      
      // Test back navigation
      await page.goBack();
      await expect(page).toHaveURL('/');
    });

    test('visual hierarchy and information architecture', async ({ page }) => {
      await page.goto('/');
      
      // Check heading hierarchy
      const h1 = await page.locator('h1').first();
      const h1Size = await h1.evaluate(el => window.getComputedStyle(el).fontSize);
      
      const h2 = await page.locator('h2').first();
      const h2Size = await h2.evaluate(el => window.getComputedStyle(el).fontSize);
      
      // Verify h1 is larger than h2
      expect(parseInt(h1Size)).toBeGreaterThan(parseInt(h2Size));
      
      // Check visual spacing
      const sections = await page.locator('section').all();
      for (const section of sections) {
        const padding = await section.evaluate(el => window.getComputedStyle(el).padding);
        expect(padding).not.toBe('0px');
      }
      
      // Verify CTA prominence
      const ctaButton = page.getByRole('button', { name: /Get Started/i }).first();
      const ctaBackground = await ctaButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
      expect(ctaBackground).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
    });

    test('consistent design language across pages', async ({ page }) => {
      const pages = ['/', '/practice', '/analytics', '/pricing', '/about'];
      const designTokens = {
        primaryColor: null,
        fontFamily: null,
        buttonRadius: null
      };
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Get design tokens from first page
        if (pagePath === '/') {
          const button = page.getByRole('button').first();
          designTokens.primaryColor = await button.evaluate(el => window.getComputedStyle(el).backgroundColor);
          designTokens.fontFamily = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);
          designTokens.buttonRadius = await button.evaluate(el => window.getComputedStyle(el).borderRadius);
        } else {
          // Verify consistency on other pages
          const button = page.getByRole('button').first();
          const currentColor = await button.evaluate(el => window.getComputedStyle(el).backgroundColor);
          const currentFont = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);
          const currentRadius = await button.evaluate(el => window.getComputedStyle(el).borderRadius);
          
          expect(currentColor).toBe(designTokens.primaryColor);
          expect(currentFont).toBe(designTokens.fontFamily);
          expect(currentRadius).toBe(designTokens.buttonRadius);
        }
      }
    });

    test('loading states and progress indicators', async ({ page }) => {
      await page.goto('/practice');
      
      // Start a practice session
      await page.getByRole('button', { name: /Text Mode/i }).click();
      await page.fill('textarea', 'Test response');
      
      // Intercept API call to slow it down
      await page.route('**/api/analyze', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });
      
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Verify loading state appears
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await expect(page.locator('text=/Analyzing/i')).toBeVisible();
      
      // Verify button is disabled during loading
      await expect(page.getByRole('button', { name: /Submit/i })).toBeDisabled();
      
      // Verify loading state disappears
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 10000 });
    });

    test('error messages are helpful and actionable', async ({ page }) => {
      await page.goto('/login');
      
      // Test empty form submission
      await page.getByRole('button', { name: /Log In/i }).click();
      
      // Verify error messages
      await expect(page.locator('text=/Email is required/i')).toBeVisible();
      await expect(page.locator('text=/Password is required/i')).toBeVisible();
      
      // Test invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.getByRole('button', { name: /Log In/i }).click();
      await expect(page.locator('text=/Please enter a valid email/i')).toBeVisible();
      
      // Test incorrect credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.getByRole('button', { name: /Log In/i }).click();
      
      // Verify helpful error with action
      await expect(page.locator('text=/Invalid email or password/i')).toBeVisible();
      await expect(page.getByRole('link', { name: /Forgot password/i })).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('mobile devices - iOS', async ({ browser }) => {
      const iPhone = devices['iPhone 13'];
      const context = await browser.newContext({
        ...iPhone
      });
      const page = await context.newPage();
      
      await page.goto('/');
      
      // Verify mobile menu
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Test mobile menu interaction
      await page.locator('[data-testid="mobile-menu-button"]').click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Verify mobile-optimized layout
      const heroSection = page.locator('[data-testid="hero-section"]');
      const width = await heroSection.evaluate(el => el.offsetWidth);
      expect(width).toBeLessThan(400); // Mobile width
      
      await context.close();
    });

    test('mobile devices - Android', async ({ browser }) => {
      const pixel = devices['Pixel 5'];
      const context = await browser.newContext({
        ...pixel
      });
      const page = await context.newPage();
      
      await page.goto('/practice');
      
      // Verify mobile-optimized practice interface
      await expect(page.locator('[data-testid="mobile-practice-layout"]')).toBeVisible();
      
      // Test touch-optimized buttons
      const buttons = await page.getByRole('button').all();
      for (const button of buttons.slice(0, 3)) { // Check first 3 buttons
        const height = await button.evaluate(el => el.offsetHeight);
        expect(height).toBeGreaterThanOrEqual(44); // Minimum touch target
      }
      
      await context.close();
    });

    test('touch interactions work properly', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPad Pro'],
        hasTouch: true
      });
      const page = await context.newPage();
      
      await page.goto('/');
      
      // Test swipe gesture on carousel (if exists)
      const carousel = page.locator('[data-testid="testimonial-carousel"]');
      if (await carousel.isVisible()) {
        await carousel.swipe({ direction: 'left' });
        // Verify carousel moved
        await expect(carousel).toHaveAttribute('data-slide', '2');
      }
      
      // Test tap interactions
      await page.tap('[data-testid="cta-button"]');
      await expect(page).toHaveURL(/signup|practice/);
      
      await context.close();
    });

    test('text readability on small screens', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone SE']
      });
      const page = await context.newPage();
      
      await page.goto('/');
      
      // Check font sizes
      const bodyText = page.locator('p').first();
      const fontSize = await bodyText.evaluate(el => window.getComputedStyle(el).fontSize);
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(14); // Minimum readable size
      
      // Check line height
      const lineHeight = await bodyText.evaluate(el => window.getComputedStyle(el).lineHeight);
      expect(parseInt(lineHeight)).toBeGreaterThanOrEqual(20); // Good readability
      
      // Check contrast
      const color = await bodyText.evaluate(el => window.getComputedStyle(el).color);
      const bgColor = await bodyText.evaluate(el => window.getComputedStyle(el.parentElement).backgroundColor);
      // TODO: Implement proper WCAG color contrast validation
      // Consider using libraries like 'color-contrast-checker' or 'wcag-contrast'
      // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
      expect(color).not.toBe(bgColor); // Basic check for now
      
      await context.close();
    });

    test('landscape and portrait orientations', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPad Mini'],
        viewport: { width: 1024, height: 768 } // Landscape
      });
      const page = await context.newPage();
      
      await page.goto('/practice');
      
      // Verify landscape layout
      await expect(page.locator('[data-testid="landscape-layout"]')).toBeVisible();
      
      // Switch to portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Verify portrait layout
      await expect(page.locator('[data-testid="portrait-layout"]')).toBeVisible();
      
      // Check that content reflows properly
      const contentWidth = await page.locator('main').evaluate(el => el.offsetWidth);
      expect(contentWidth).toBeLessThanOrEqual(768);
      
      await context.close();
    });

    test('interactive elements properly sized for touch', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 13'],
        hasTouch: true
      });
      const page = await context.newPage();
      
      await page.goto('/');
      
      // Check all interactive elements
      const interactiveSelectors = ['button', 'a', 'input', 'select', 'textarea'];
      
      for (const selector of interactiveSelectors) {
        const elements = await page.locator(selector).all();
        for (const element of elements.slice(0, 3)) { // Check first 3 of each type
          if (await element.isVisible()) {
            const box = await element.boundingBox();
            if (box) {
              // Verify minimum touch target size (44x44 pixels)
              expect(box.width).toBeGreaterThanOrEqual(44);
              expect(box.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
      }
      
      await context.close();
    });
  });
});

test.describe('Content & Communication', () => {
  test.describe('Copy & Messaging', () => {
    test('user-facing text clarity and accuracy', async ({ page }) => {
      await page.goto('/');
      
      // Check main headline
      const headline = await page.locator('h1').textContent();
      expect(headline).toBeTruthy();
      expect(headline.length).toBeLessThan(100); // Not too long
      
      // Check for jargon-free language
      const bodyText = await page.locator('main').textContent();
      const jargonTerms = ['leverage', 'synergy', 'paradigm', 'utilize'];
      for (const term of jargonTerms) {
        expect(bodyText.toLowerCase()).not.toContain(term);
      }
      
      // Verify clear value proposition
      await expect(page.locator('text=/Master Sales Objections/i')).toBeVisible();
      await expect(page.locator('text=/AI-powered/i')).toBeVisible();
    });

    test('pricing information matches billing', async ({ page }) => {
      await page.goto('/pricing');
      
      // Get pricing from display
      const starterPrice = await page.locator('[data-testid="starter-price"]').textContent();
      const professionalPrice = await page.locator('[data-testid="professional-price"]').textContent();
      const enterprisePrice = await page.locator('[data-testid="enterprise-price"]').textContent();
      
      // Verify prices are displayed
      expect(starterPrice).toMatch(/\$\d+/);
      expect(professionalPrice).toMatch(/\$\d+/);
      expect(enterprisePrice).toMatch(/Contact|Custom/i);
      
      // Click through to checkout
      await page.getByRole('button', { name: /Get Started.*Starter/i }).click();
      
      // Verify checkout shows same price
      await expect(page.locator('[data-testid="checkout-price"]')).toContainText(starterPrice);
    });

    test('feature descriptions match functionality', async ({ page }) => {
      await page.goto('/');
      
      // Check feature claims
      const features = [
        { claim: 'Voice Analysis', path: '/voice-training' },
        { claim: 'Real-time Feedback', path: '/practice' },
        { claim: 'Progress Tracking', path: '/analytics' }
      ];
      
      for (const feature of features) {
        // Find feature claim on homepage
        await expect(page.locator(`text=/${feature.claim}/i`)).toBeVisible();
        
        // Navigate to feature
        await page.goto(feature.path);
        
        // Verify feature exists
        await expect(page.locator('h1')).toContainText(new RegExp(feature.claim.split(' ')[0], 'i'));
        
        // Return to homepage
        await page.goto('/');
      }
    });

    test('call-to-action buttons and links', async ({ page }) => {
      await page.goto('/');
      
      // Check CTA visibility and clarity
      const ctaButtons = await page.getByRole('button', { name: /Get Started|Start Free|Try Demo|Sign Up/i }).all();
      
      for (const button of ctaButtons) {
        if (await button.isVisible()) {
          // Verify button has clear action text
          const text = await button.textContent();
          expect(text.length).toBeGreaterThan(5);
          expect(text.length).toBeLessThan(30);
          
          // Verify button is clickable
          await expect(button).toBeEnabled();
          
          // Check button styling makes it stand out
          const bgColor = await button.evaluate(el => window.getComputedStyle(el).backgroundColor);
          expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
        }
      }
    });

    test('testimonials and social proof authenticity', async ({ page }) => {
      await page.goto('/');
      
      // Scroll to testimonials section
      await page.locator('[data-testid="testimonials-section"]').scrollIntoViewIfNeeded();
      
      // Check testimonial structure
      const testimonials = await page.locator('[data-testid="testimonial"]').all();
      
      for (const testimonial of testimonials.slice(0, 3)) {
        // Verify required elements
        await expect(testimonial.locator('[data-testid="testimonial-text"]')).toBeVisible();
        await expect(testimonial.locator('[data-testid="testimonial-author"]')).toBeVisible();
        await expect(testimonial.locator('[data-testid="testimonial-role"]')).toBeVisible();
        
        // Check for realistic content
        const text = await testimonial.locator('[data-testid="testimonial-text"]').textContent();
        expect(text.length).toBeGreaterThan(50); // Not too short
        expect(text.length).toBeLessThan(500); // Not too long
        
        // Verify author details
        const author = await testimonial.locator('[data-testid="testimonial-author"]').textContent();
        expect(author).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+/); // Proper name format
      }
    });
  });

  test.describe('Help & Support', () => {
    test('help documentation and FAQs', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to help/FAQ
      await page.getByRole('link', { name: /Help|FAQ|Support/i }).click();
      
      // Verify FAQ structure
      await expect(page.locator('h1')).toContainText(/FAQ|Help|Support/i);
      
      // Check FAQ items
      const faqItems = await page.locator('[data-testid="faq-item"]').all();
      expect(faqItems.length).toBeGreaterThan(5); // Adequate coverage
      
      // Test FAQ interaction
      const firstFaq = faqItems[0];
      await firstFaq.locator('[data-testid="faq-question"]').click();
      await expect(firstFaq.locator('[data-testid="faq-answer"]')).toBeVisible();
      
      // Verify answer has content
      const answerText = await firstFaq.locator('[data-testid="faq-answer"]').textContent();
      expect(answerText.length).toBeGreaterThan(50);
    });

    test('contact forms and support channels', async ({ page }) => {
      await page.goto('/');
      
      // Find and click contact/support link
      await page.getByRole('link', { name: /Contact|Support/i }).click();
      
      // Verify contact form
      await expect(page.locator('form[data-testid="contact-form"]')).toBeVisible();
      
      // Check required fields
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('textarea[name="message"]')).toBeVisible();
      
      // Test form validation
      await page.getByRole('button', { name: /Send|Submit/i }).click();
      await expect(page.locator('text=/required/i')).toBeVisible();
      
      // Fill and submit form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'This is a test message');
      await page.getByRole('button', { name: /Send|Submit/i }).click();
      
      // Verify submission feedback
      await expect(page.locator('text=/Thank you|Sent|Received/i')).toBeVisible();
    });

    test('knowledge base search functionality', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to help/support
      await page.getByRole('link', { name: /Help|Support/i }).click();
      
      // Find search box
      const searchBox = page.locator('input[placeholder*="Search"]');
      await expect(searchBox).toBeVisible();
      
      // Test search
      await searchBox.fill('billing');
      await searchBox.press('Enter');
      
      // Verify search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-result"]').first()).toBeVisible();
      
      // Verify results are relevant
      const firstResult = await page.locator('[data-testid="search-result"]').first().textContent();
      expect(firstResult.toLowerCase()).toContain('billing');
    });

    test('error messages provide helpful guidance', async ({ page }) => {
      // Test 404 page
      await page.goto('/non-existent-page');
      
      // Verify helpful 404 message
      await expect(page.locator('h1')).toContainText(/404|Not Found/i);
      await expect(page.locator('text=/sorry|oops/i')).toBeVisible();
      
      // Check for helpful links
      await expect(page.getByRole('link', { name: /Home|Go Back/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Contact|Support/i })).toBeVisible();
      
      // Test form errors
      await page.goto('/signup');
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', '123'); // Too short
      await page.getByRole('button', { name: /Sign Up/i }).click();
      
      // Verify helpful error messages
      await expect(page.locator('text=/valid email address/i')).toBeVisible();
      await expect(page.locator('text=/at least 8 characters/i')).toBeVisible();
    });
  });
});
