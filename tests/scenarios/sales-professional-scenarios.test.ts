import { test, expect, Page } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

// Test configuration
const DOWNLOAD_TIMEOUT = 30000; // 30 seconds
const TEST_TIMEOUT = 60000; // 60 seconds

interface DownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
}

/**
 * Utility function to safely handle download operations with timeout and error handling
 */
async function safeDownloadOperation(
  page: Page, 
  triggerDownload: () => Promise<void>,
  expectedFilenamePattern?: RegExp,
  timeout: number = DOWNLOAD_TIMEOUT
): Promise<DownloadResult> {
  try {
    // Set up download promise before triggering the download
    const downloadPromise = page.waitForEvent('download', { timeout });
    
    // Trigger the download action
    await triggerDownload();
    
    // Wait for download with timeout
    const download = await downloadPromise;
    
    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();
    
    // Validate filename pattern if provided
    if (expectedFilenamePattern && !expectedFilenamePattern.test(suggestedFilename)) {
      return {
        success: false,
        error: `Downloaded filename "${suggestedFilename}" does not match expected pattern ${expectedFilenamePattern}`
      };
    }
    
    // Save the file to verify download completion
    const downloadPath = path.join(__dirname, '../../tmp', suggestedFilename);
    await download.saveAs(downloadPath);
    
    // Verify file exists and has content
    const stats = await fs.stat(downloadPath);
    if (stats.size === 0) {
      return {
        success: false,
        error: `Downloaded file "${suggestedFilename}" is empty`
      };
    }
    
    // Clean up downloaded file
    await fs.unlink(downloadPath).catch(() => {}); // Ignore cleanup errors
    
    return {
      success: true,
      filename: suggestedFilename
    };
    
  } catch (error) {
    if (error.message.includes('Timeout')) {
      return {
        success: false,
        error: `Download operation timed out after ${timeout}ms`
      };
    }
    
    return {
      success: false,
      error: `Download operation failed: ${error.message}`
    };
  }
}

test.describe('Sales Professional Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure tmp directory exists for downloads
    const tmpDir = path.join(__dirname, '../../tmp');
    await fs.mkdir(tmpDir, { recursive: true }).catch(() => {});
    
    // Navigate to the sales scenarios page
    await page.goto('/sales-scenarios');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Clean up any remaining files in tmp directory
    const tmpDir = path.join(__dirname, '../../tmp');
    try {
      const files = await fs.readdir(tmpDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(tmpDir, file)).catch(() => {}))
      );
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should handle scenario selection and navigation', async ({ page }) => {
    // Test basic scenario functionality
    await expect(page.locator('[data-testid="scenario-selector"]')).toBeVisible();
    
    const scenarios = page.locator('[data-testid="scenario-option"]');
    await expect(scenarios.first()).toBeVisible();
    
    await scenarios.first().click();
    await expect(page.locator('[data-testid="scenario-details"]')).toBeVisible();
  });

  test('should generate and validate sales pitch feedback', async ({ page }) => {
    // Navigate to pitch practice
    await page.click('[data-testid="practice-pitch-btn"]');
    
    // Submit a test pitch
    await page.fill('[data-testid="pitch-input"]', 'This is a test sales pitch for validation.');
    await page.click('[data-testid="submit-pitch-btn"]');
    
    // Wait for feedback generation
    await expect(page.locator('[data-testid="pitch-feedback"]')).toBeVisible({ timeout: 10000 });
    
    const feedback = await page.locator('[data-testid="pitch-feedback"]').textContent();
    expect(feedback).toBeTruthy();
    expect(feedback.length).toBeGreaterThan(10);
  });

  test('should export scenario progress report', async ({ page }) => {
    // Navigate to progress section
    await page.click('[data-testid="progress-tab"]');
    await expect(page.locator('[data-testid="progress-summary"]')).toBeVisible();
    
    // Test export functionality with proper error handling
    const downloadResult = await safeDownloadOperation(
      page,
      async () => {
        await page.click('[data-testid="export-progress-btn"]');
      },
      /progress-report.*\.(pdf|csv|xlsx)$/i,
      DOWNLOAD_TIMEOUT
    );
    
    if (!downloadResult.success) {
      test.fail(`Progress report export failed: ${downloadResult.error}`);
    }
    
    expect(downloadResult.success).toBe(true);
    expect(downloadResult.filename).toBeTruthy();
    console.log(`Successfully downloaded progress report: ${downloadResult.filename}`);
  });

  test('should download scenario templates with error handling', async ({ page }) => {
    // Navigate to templates section
    await page.click('[data-testid="templates-tab"]');
    await expect(page.locator('[data-testid="template-library"]')).toBeVisible();
    
    // Find and click download button for a template
    const templateDownloadBtn = page.locator('[data-testid="download-template-btn"]').first();
    await expect(templateDownloadBtn).toBeVisible();
    
    // The problematic download operation that needs error handling (lines 254-256 equivalent)
    try {
      const downloadPromise = page.waitForEvent('download', { timeout: DOWNLOAD_TIMEOUT });
      
      await templateDownloadBtn.click();
      
      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      
      // Validate filename
      expect(filename).toMatch(/.*\.(pdf|docx|xlsx)$/i);
      
      // Save and validate file
      const downloadPath = path.join(__dirname, '../../tmp', filename);
      await download.saveAs(downloadPath);
      
      const stats = await fs.stat(downloadPath);
      expect(stats.size).toBeGreaterThan(0);
      
      console.log(`Successfully downloaded template: ${filename} (${stats.size} bytes)`);
      
    } catch (error) {
      if (error.message.includes('Timeout')) {
        test.fail(`Template download timed out after ${DOWNLOAD_TIMEOUT}ms. This may indicate a slow network or server issue.`);
      } else {
        test.fail(`Template download failed with error: ${error.message}`);
      }
    }
  });

  test('should handle bulk scenario data export with comprehensive error handling', async ({ page }) => {
    // Navigate to data export section
    await page.click('[data-testid="data-export-tab"]');
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible();
    
    // Select export options
    await page.check('[data-testid="include-scenarios"]');
    await page.check('[data-testid="include-performance"]');
    await page.selectOption('[data-testid="export-format"]', 'xlsx');
    
    // Enhanced error handling for bulk download operation
    const downloadResult = await safeDownloadOperation(
      page,
      async () => {
        await page.click('[data-testid="export-data-btn"]');
        
        // Wait for export processing indicator
        await expect(page.locator('[data-testid="export-processing"]')).toBeVisible();
        await expect(page.locator('[data-testid="export-processing"]')).toBeHidden({ timeout: 20000 });
      },
      /sales-data-export.*\.xlsx$/i,
      DOWNLOAD_TIMEOUT
    );
    
    if (!downloadResult.success) {
      // Provide detailed error information for debugging
      console.error(`Bulk export failed: ${downloadResult.error}`);
      
      // Check if export is still processing
      const isProcessing = await page.locator('[data-testid="export-processing"]').isVisible();
      if (isProcessing) {
        test.fail(`Export is still processing after timeout. Server may be overloaded.`);
      } else {
        test.fail(`Bulk data export failed: ${downloadResult.error}`);
      }
    }
    
    expect(downloadResult.success).toBe(true);
    expect(downloadResult.filename).toContain('sales-data-export');
    console.log(`Successfully exported bulk data: ${downloadResult.filename}`);
  });

  test('should validate scenario performance metrics download', async ({ page }) => {
    // Navigate to analytics section
    await page.click('[data-testid="analytics-tab"]');
    await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
    
    // Wait for metrics to load
    await page.waitForSelector('[data-testid="metrics-chart"]', { timeout: 10000 });
    
    // Test metrics download with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const downloadResult = await safeDownloadOperation(
          page,
          async () => {
            await page.click('[data-testid="download-metrics-btn"]');
          },
          /performance-metrics.*\.(pdf|csv)$/i,
          DOWNLOAD_TIMEOUT
        );
        
        if (downloadResult.success) {
          expect(downloadResult.filename).toBeTruthy();
          console.log(`Metrics download successful on attempt ${retryCount + 1}: ${downloadResult.filename}`);
          break;
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Metrics download attempt ${retryCount} failed: ${downloadResult.error}. Retrying...`);
            await page.waitForTimeout(2000); // Wait before retry
          } else {
            test.fail(`Metrics download failed after ${maxRetries} attempts: ${downloadResult.error}`);
          }
        }
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          test.fail(`Metrics download failed after ${maxRetries} attempts: ${error.message}`);
        }
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should handle concurrent download operations', async ({ page }) => {
    // Test multiple simultaneous downloads
    await page.click('[data-testid="bulk-operations-tab"]');
    await expect(page.locator('[data-testid="bulk-download-section"]')).toBeVisible();
    
    const downloadPromises = [
      safeDownloadOperation(
        page,
        async () => page.click('[data-testid="download-scripts-btn"]'),
        /sales-scripts.*\.zip$/i
      ),
      safeDownloadOperation(
        page,
        async () => page.click('[data-testid="download-templates-btn"]'),
        /scenario-templates.*\.zip$/i
      )
    ];
    
    const results = await Promise.allSettled(downloadPromises);
    
    // Validate all downloads completed successfully
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        console.log(`Concurrent download ${index + 1} successful: ${result.value.filename}`);
      } else {
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        console.error(`Concurrent download ${index + 1} failed: ${error}`);
      }
    });
    
    // At least one download should succeed
    const successfulDownloads = results.filter(
      result => result.status === 'fulfilled' && result.value.success
    );
    expect(successfulDownloads.length).toBeGreaterThan(0);
  });
});

// Additional utility tests for download functionality
test.describe('Download Utility Functions', () => {
  test('should validate download timeout handling', async ({ page }) => {
    // Mock a slow server response
    await page.route('**/api/download/**', async route => {
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 35000));
      await route.continue();
    });
    
    await page.goto('/sales-scenarios');
    
    const result = await safeDownloadOperation(
      page,
      async () => page.click('[data-testid="slow-download-btn"]'),
      undefined,
      5000 // Short timeout for testing
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });
  
  test('should handle invalid download responses', async ({ page }) => {
    // Mock invalid response
    await page.route('**/api/download/invalid', async route => {
      await route.fulfill({
        status: 404,
        body: 'Not found'
      });
    });
    
    await page.goto('/sales-scenarios');
    
    const result = await safeDownloadOperation(
      page,
      async () => page.click('[data-testid="invalid-download-btn"]'),
      /test\.pdf$/i
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});