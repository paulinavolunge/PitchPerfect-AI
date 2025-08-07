import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Longer timeouts on CI
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: { timeout: process.env.CI ? 10_000 : 5_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? [['github'], ['html']] : 'html',

  use: {
    // In CI hit the real site; locally hit Vite on 8080
    baseURL: process.env.CI
      ? 'https://pitchperfectai.ai'
      : process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'chromium-mobile', use: { ...devices['iPhone X'] } },
    { name: 'webkit-mobile', use: { ...devices['iPhone X'] } },
  ],

  // Only start the dev server locally; CI points to the deployed site
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        port: 8080,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stderr: 'pipe',
        stdout: 'pipe',
        env: { PORT: '8080' }, // harmless if Vite already sets this
      },
});
