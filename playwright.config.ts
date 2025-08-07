
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: process.env.CI ? 60000 : 30000,
  expect: {
    timeout: process.env.CI ? 10000 : 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : 'html',
  use: {
    baseURL: process.env.CI ? 'https://pitchperfectai.ai' : 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 }
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['iPhone X'],
      },
    },
    {
      name: 'webkit-mobile',
      use: {
        ...devices['iPhone X'],
      },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stderr: 'pipe',
    stdout: 'pipe',
  },
});
