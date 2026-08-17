import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Run vitest tests under src/, plus the specific vitest regression specs
    // that live under tests/ next to Jest and Playwright specs vitest can't
    // execute. Add new entries explicitly when a vitest test lands outside
    // src/, rather than widening the glob and having to exclude the Jest ones.
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'tests/components/scorePersistence.test.tsx',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});