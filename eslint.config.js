module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react-hooks',
    'react-refresh'
  ],
  ignorePatterns: [
    'dist',
    'node_modules',
    '**/*.js',
    'public/**',
    'supabase/functions/**/index.ts',
    '*.config.*',
    'playwright.config.ts',
    'capacitor.config.ts',
    'tailwind.config.ts'
  ],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { 
      allow: ['warn', 'error', 'info'] 
    }],
    'prefer-const': 'warn',
    'no-var': 'error',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-unused-vars': 'off',
  },
};
