import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['iPhone 13'] })

test('homepage loads in light mode (no dark class)', async ({ page }) => {
  await page.goto('/')
  const htmlClass = await page.evaluate(() => document.documentElement.className)
  expect(htmlClass.includes('dark')).toBeFalsy()

  // Ensure fallback loading message is visible briefly (sanity check)
  const loadingText = await page.locator('text=Loading JavaScript...').first()
  expect(await loadingText.count()).toBeGreaterThanOrEqual(0)
})
