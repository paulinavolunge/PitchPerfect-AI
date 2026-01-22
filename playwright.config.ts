import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/tests/e2e/**/*.spec.ts', '**/tests/smoke/**/*.spec.ts'],
  testIgnore: ['**/tests/components/**'],

  // Longer timeouts on CI
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: { timeout: process.env.CI ? 10_000 : 5_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? [['github'], ['html']] : 'html',

  use: {
    // Always target a local preview server for deterministic tests
    baseURL: 'http://localhost:8081',
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

  // Start a production-like preview server in both local and CI runs
  webServer: {
    command: 'npm run build && npm run preview -- --port 8081',
    port: 8081,
    reuseExistingServer: true,
    timeout: 180000,
    env: {
      VITE_SUPABASE_URL: 'https://ggpodadyycvmmxifqwlp.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY',
    },
  },
});
