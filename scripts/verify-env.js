#!/usr/bin/env node

import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Determine which env file to use based on NODE_ENV
const mode = process.env.NODE_ENV || 'development';
const envFile = mode === 'production' ? '.env.production' : '.env';

// Load environment variables
if (existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`✅ Loaded environment from ${envFile}`);
} else {
  console.error(`❌ ${envFile} file not found!`);
  process.exit(1);
}

// Required environment variables
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

// Optional but recommended variables
const optionalVars = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_SENTRY_DSN',
  'VITE_POSTHOG_API_KEY',
];

// Check required variables
const missingRequired = [];
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingRequired.push(varName);
  }
});

// Check optional variables
const missingOptional = [];
optionalVars.forEach(varName => {
  if (!process.env[varName]) {
    missingOptional.push(varName);
  }
});

// Report results
console.log('\n🔍 Environment Variables Check:\n');

if (missingRequired.length > 0) {
  console.error('❌ Missing REQUIRED environment variables:');
  missingRequired.forEach(v => console.error(`   - ${v}`));
  console.error('\nBuild cannot proceed without these variables!');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
}

if (missingOptional.length > 0) {
  console.warn('\n⚠️  Missing OPTIONAL environment variables:');
  missingOptional.forEach(v => console.warn(`   - ${v}`));
  console.warn('\nThese features will be disabled:');
  if (missingOptional.includes('VITE_STRIPE_PUBLISHABLE_KEY')) {
    console.warn('   - Payment processing (Stripe)');
  }
  if (missingOptional.includes('VITE_SENTRY_DSN')) {
    console.warn('   - Error tracking (Sentry)');
  }
  if (missingOptional.includes('VITE_POSTHOG_API_KEY')) {
    console.warn('   - Analytics (PostHog)');
  }
} else {
  console.log('✅ All optional environment variables are set');
}

// Validate Supabase URL format
const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-zA-Z0-9]+\.supabase\.co$/)) {
  console.error('\n❌ Invalid VITE_SUPABASE_URL format!');
  console.error('   Expected format: https://your-project.supabase.co');
  process.exit(1);
}

// Validate Stripe key format
const stripeKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (stripeKey && !stripeKey.startsWith('pk_')) {
  console.error('\n❌ Invalid VITE_STRIPE_PUBLISHABLE_KEY!');
  console.error('   Stripe publishable keys should start with "pk_"');
  process.exit(1);
}

console.log('\n✅ Environment validation complete!\n');