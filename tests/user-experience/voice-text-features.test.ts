import { test, expect } from '@playwright/test';

test.describe('Voice Input & Analysis', () => {
  test.describe('Voice Recording Functionality', () => {
    test('microphone permission requests across browsers', async ({ page, browserName }) => {
      await page.goto('/practice');
      
      // Select voice mode
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Check for permission prompt UI
      await expect(page.locator('[data-testid="mic-permission-prompt"]')).toBeVisible();
      
      // Browser-specific permission handling
      if (browserName === 'chromium') {
        // Chrome-specific permission test
        await expect(page.locator('text=/Allow microphone access/i')).toBeVisible();
      } else if (browserName === 'firefox') {
        // Firefox-specific permission test
        await expect(page.locator('text=/Share your microphone/i')).toBeVisible();
      }
    });

    test('voice recording quality and clarity', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Mock microphone permission granted
      await page.context().grantPermissions(['microphone']);
      
      // Start recording
      await page.getByRole('button', { name: /Start Recording/i }).click();
      
      // Check audio level indicator
      await expect(page.locator('[data-testid="audio-level-meter"]')).toBeVisible();
      
      // Verify recording quality settings
      await expect(page.locator('[data-testid="audio-quality"]')).toHaveText(/High Quality/i);
    });

    test('voice input on different devices', async ({ page, isMobile }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      if (isMobile) {
        // Mobile-specific tests
        await expect(page.locator('[data-testid="mobile-mic-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="mobile-mic-button"]')).toHaveCSS('min-height', '44px');
      } else {
        // Desktop-specific tests
        await expect(page.locator('[data-testid="desktop-mic-button"]')).toBeVisible();
      }
    });

    test('background noise handling', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Check for noise cancellation option
      await expect(page.locator('[data-testid="noise-cancellation-toggle"]')).toBeVisible();
      
      // Enable noise cancellation
      await page.locator('[data-testid="noise-cancellation-toggle"]').click();
      
      // Verify noise level indicator
      await expect(page.locator('[data-testid="noise-level-indicator"]')).toBeVisible();
    });

    test('voice recording length limits', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Check for recording limit display
      await expect(page.locator('text=/Maximum recording time: 5 minutes/i')).toBeVisible();
      
      // Start recording
      await page.getByRole('button', { name: /Start Recording/i }).click();
      
      // Verify timer display
      await expect(page.locator('[data-testid="recording-timer"]')).toBeVisible();
    });

    test('voice-to-text accuracy', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Mock a recording session
      await page.context().grantPermissions(['microphone']);
      await page.getByRole('button', { name: /Start Recording/i }).click();
      
      // Wait and stop
      await page.waitForTimeout(2000);
      await page.getByRole('button', { name: /Stop Recording/i }).click();
      
      // Check for transcription display
      await expect(page.locator('[data-testid="transcription-result"]')).toBeVisible();
      
      // Verify edit transcription option
      await expect(page.getByRole('button', { name: /Edit Transcription/i })).toBeVisible();
    });
  });

  test.describe('AI Voice Analysis', () => {
    test('AI feedback quality and relevance', async ({ page }) => {
      await page.goto('/practice');
      
      // Complete a voice practice
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      await page.context().grantPermissions(['microphone']);
      
      // Mock recording and submission
      await page.getByRole('button', { name: /Start Recording/i }).click();
      await page.waitForTimeout(3000);
      await page.getByRole('button', { name: /Stop Recording/i }).click();
      
      // Wait for AI analysis
      await expect(page.locator('[data-testid="ai-voice-feedback"]')).toBeVisible({ timeout: 15000 });
      
      // Verify feedback categories
      await expect(page.locator('text=/Vocal Delivery/i')).toBeVisible();
      await expect(page.locator('text=/Content Analysis/i')).toBeVisible();
      await expect(page.locator('text=/Overall Effectiveness/i')).toBeVisible();
    });

    test('analysis of vocal tone, pacing, and delivery', async ({ page }) => {
      await page.goto('/practice');
      
      // Complete voice analysis
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      await page.context().grantPermissions(['microphone']);
      await page.getByRole('button', { name: /Use Sample Recording/i }).click(); // For testing
      
      // Wait for analysis
      await expect(page.locator('[data-testid="vocal-analysis"]')).toBeVisible({ timeout: 10000 });
      
      // Check specific metrics
      await expect(page.locator('[data-testid="tone-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="pacing-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="clarity-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
    });

    test('actionable and specific feedback', async ({ page }) => {
      await page.goto('/practice');
      
      // Complete analysis
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      await page.getByRole('button', { name: /Use Sample Recording/i }).click();
      
      // Wait for feedback
      await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 10000 });
      
      // Verify actionable items
      await expect(page.locator('[data-testid="action-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="action-items"] li')).toHaveCount(3, { timeout: 5000 });
    });

    test('various speech patterns and accents', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      // Check for accent/dialect settings
      await page.getByRole('button', { name: /Settings/i }).click();
      await expect(page.locator('select[name="speechVariant"]')).toBeVisible();
      
      // Verify multiple accent options
      const accentOptions = await page.locator('select[name="speechVariant"] option').count();
      expect(accentOptions).toBeGreaterThan(5);
    });

    test('real-time processing speed', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Voice Mode/i }).click();
      
      const startTime = Date.now();
      
      // Submit for analysis
      await page.getByRole('button', { name: /Use Sample Recording/i }).click();
      
      // Wait for results
      await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible();
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Verify processing is under 10 seconds
      expect(processingTime).toBeLessThan(10000);
    });
  });
});

test.describe('Text Input & Feedback', () => {
  test.describe('Text Input Interface', () => {
    test('character limits and validation', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Check character limit display
      await expect(page.locator('[data-testid="character-count"]')).toBeVisible();
      
      // Test max length
      const longText = 'a'.repeat(5000);
      await page.fill('textarea', longText);
      
      // Verify character limit enforcement
      const actualLength = await page.locator('textarea').inputValue();
      expect(actualLength.length).toBeLessThanOrEqual(2000);
      
      // Check warning message
      await expect(page.locator('text=/Character limit reached/i')).toBeVisible();
    });

    test('text formatting and display', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Test various formatting
      const formattedText = `Line 1
      
      Line 2 with "quotes" and special chars: $%&@
      
      - Bullet point 1
      - Bullet point 2`;
      
      await page.fill('textarea', formattedText);
      
      // Verify preview maintains formatting
      await page.getByRole('button', { name: /Preview/i }).click();
      await expect(page.locator('[data-testid="text-preview"]')).toContainText('Line 1');
      await expect(page.locator('[data-testid="text-preview"]')).toContainText('Bullet point 1');
    });

    test('copy/paste functionality', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Test paste
      await page.locator('textarea').click();
      await page.keyboard.type('Test text for copy paste');
      
      // Select all and copy
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Control+C');
      
      // Clear and paste
      await page.fill('textarea', '');
      await page.keyboard.press('Control+V');
      
      // Verify pasted content
      const pastedText = await page.locator('textarea').inputValue();
      expect(pastedText).toBe('Test text for copy paste');
    });

    test('special characters handling', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Test special characters
      const specialChars = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`';
      await page.fill('textarea', specialChars);
      
      // Submit and verify no errors
      await page.getByRole('button', { name: /Submit/i }).click();
      await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
    });

    test('various keyboard layouts', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Test international characters
      const internationalText = 'Café, naïve, résumé, Zürich, señor';
      await page.fill('textarea', internationalText);
      
      // Verify characters are preserved
      const inputValue = await page.locator('textarea').inputValue();
      expect(inputValue).toBe(internationalText);
    });
  });

  test.describe('AI Text Analysis', () => {
    test('AI feedback quality for text responses', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Submit a response
      await page.fill('textarea', 'I understand your concern about the price. Our solution provides significant ROI within 3 months.');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Wait for AI feedback
      await expect(page.locator('[data-testid="ai-text-feedback"]')).toBeVisible({ timeout: 10000 });
      
      // Verify feedback quality
      await expect(page.locator('[data-testid="feedback-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="feedback-details"]')).toContainText(/ROI mention/i);
    });

    test('analysis of objection handling techniques', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Submit objection handling response
      const objectionResponse = `I hear your concern about implementation time. 
      Many of our clients had similar worries initially. 
      However, our phased approach ensures minimal disruption while delivering quick wins.`;
      
      await page.fill('textarea', objectionResponse);
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Wait for analysis
      await expect(page.locator('[data-testid="objection-analysis"]')).toBeVisible({ timeout: 10000 });
      
      // Check for technique identification
      await expect(page.locator('text=/Acknowledgment/i')).toBeVisible();
      await expect(page.locator('text=/Social Proof/i')).toBeVisible();
      await expect(page.locator('text=/Solution Positioning/i')).toBeVisible();
    });

    test('feedback on structure, persuasiveness, and approach', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Submit structured response
      await page.fill('textarea', 'Test response for comprehensive analysis');
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // Wait for comprehensive feedback
      await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible({ timeout: 10000 });
      
      // Verify feedback categories
      await expect(page.locator('[data-testid="structure-feedback"]')).toBeVisible();
      await expect(page.locator('[data-testid="persuasiveness-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="approach-analysis"]')).toBeVisible();
    });

    test('various response lengths and styles', async ({ page }) => {
      await page.goto('/practice');
      await page.getByRole('button', { name: /Text Mode/i }).click();
      
      // Test short response
      await page.fill('textarea', 'Short and direct response.');
      await page.getByRole('button', { name: /Submit/i }).click();
      await expect(page.locator('text=/Consider expanding/i')).toBeVisible({ timeout: 10000 });
      
      // Test long response
      await page.getByRole('button', { name: /Try Again/i }).click();
      const longResponse = 'This is a very detailed response. '.repeat(20);
      await page.fill('textarea', longResponse);
      await page.getByRole('button', { name: /Submit/i }).click();
      await expect(page.locator('text=/Consider being more concise/i')).toBeVisible({ timeout: 10000 });
    });
  });
});
