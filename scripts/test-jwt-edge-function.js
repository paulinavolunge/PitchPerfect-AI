#!/usr/bin/env node

/**
 * JWT Edge Function Testing Script
 * 
 * This script generates a test JWT and calls the roleplay-ai-response edge function.
 * 
 * Usage:
 * 1. Set your JWT_SECRET environment variable in .env
 * 2. Run: node scripts/test-jwt-edge-function.js
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  console.log('💡 Add JWT_SECRET to your .env file');
  console.log('💡 You can find this in your Supabase dashboard under Settings > API');
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL environment variable is required');
  console.log('💡 Add VITE_SUPABASE_URL to your .env file');
  console.log('💡 You can find this in your Supabase dashboard under Settings > API');
  process.exit(1);
}

// Generate test JWT
function generateTestJWT() {
  const payload = {
    sub: 'test-user-12345',
    aud: 'authenticated',
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60), // 2 hours from now
    iat: Math.floor(Date.now() / 1000),
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {}
  };

  return jwt.sign(payload, JWT_SECRET);
}

// Test the edge function
async function testEdgeFunction() {
  console.log('🔐 Generating test JWT...');
  const token = generateTestJWT();
  console.log('✅ JWT generated successfully');
  
  const functionUrl = `${SUPABASE_URL}/functions/v1/roleplay-ai-response`;
  console.log(`🚀 Testing edge function: ${functionUrl}`);
  
  const testPayload = {
    userInput: "I'm not sure if your solution is worth the cost.",
    scenario: {
      industry: "Software",
      objection: "Price",
      difficulty: "Medium"
    },
    voiceStyle: "friendly",
    conversationHistory: [],
    isReversedRole: false
  };

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': process.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const responseData = await response.text();
    console.log('📝 Response Body:');
    console.log(responseData);
    
    if (response.ok) {
      console.log('✅ Edge function test successful!');
    } else {
      console.log('❌ Edge function test failed');
    }
    
  } catch (error) {
    console.error('💥 Error testing edge function:', error.message);
  }
}

// Validate JWT
function validateJWT() {
  console.log('🔍 Validating JWT generation...');
  try {
    const token = generateTestJWT();
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT validation successful');
    console.log('📋 JWT Payload:', JSON.stringify(decoded, null, 2));
    return token;
  } catch (error) {
    console.error('❌ JWT validation failed:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🧪 JWT Edge Function Testing Script\n');
  
  // First validate JWT generation
  const token = validateJWT();
  if (!token) {
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test the edge function
  await testEdgeFunction();
  
  console.log('\n🏁 Test completed');
}

main().catch(console.error);
