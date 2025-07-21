#!/usr/bin/env node

/**
 * Test script to validate the roleplay flow
 * Run with: node scripts/test-roleplay-flow.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRoleplayFlow() {
  console.log('🚀 Testing Roleplay Flow...\n');

  try {
    // Test 1: Check if roleplay AI function exists
    console.log('1️⃣ Testing roleplay-ai-response function...');
    const { data: aiData, error: aiError } = await supabase.functions.invoke('roleplay-ai-response', {
      body: {
        userInput: "I understand your concern about the price. Let me show you the ROI you can expect.",
        scenario: {
          difficulty: 'Beginner',
          objection: 'Price',
          industry: 'Technology'
        },
        voiceStyle: 'friendly',
        conversationHistory: [],
        isReversedRole: true
      }
    });

    if (aiError) {
      console.error('❌ AI response error:', aiError);
    } else {
      console.log('✅ AI response received:', aiData?.response ? 'Success' : 'No response');
    }

    // Test 2: Check if ElevenLabs TTS function exists
    console.log('\n2️⃣ Testing elevenlabs-tts function...');
    const { data: ttsData, error: ttsError } = await supabase.functions.invoke('elevenlabs-tts', {
      body: {
        text: "This is a test of the text to speech system.",
        voiceId: 'CwhRBWXzGAHq8TQ4Fs17'
      }
    });

    if (ttsError) {
      console.error('❌ TTS error:', ttsError);
    } else {
      console.log('✅ TTS response received:', ttsData?.audioContent ? 'Audio generated' : 'No audio');
    }

    // Test 3: Check if voice-to-text function exists
    console.log('\n3️⃣ Testing voice-to-text function...');
    const { data: sttData, error: sttError } = await supabase.functions.invoke('voice-to-text', {
      body: {
        audio: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', // Empty WAV file
        format: 'wav'
      }
    });

    if (sttError) {
      console.error('❌ STT error:', sttError);
    } else {
      console.log('✅ STT response received:', sttData ? 'Transcription complete' : 'No transcription');
    }

    // Test 4: Check database tables
    console.log('\n4️⃣ Testing database tables...');
    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    console.log('✅ user_profiles table:', profileError ? `Error: ${profileError.message}` : 'Accessible');

    const { error: sessionError } = await supabase
      .from('practice_sessions')
      .select('id')
      .limit(1);
    
    console.log('✅ practice_sessions table:', sessionError ? `Error: ${sessionError.message}` : 'Accessible');

    console.log('\n✅ All tests completed!');
    console.log('\nKey findings:');
    console.log('- AI response function:', aiData?.response ? '✅ Working' : '⚠️ Check function');
    console.log('- TTS function:', ttsData?.audioContent ? '✅ Working' : '⚠️ Check function');
    console.log('- STT function:', sttError ? '⚠️ Check function' : '✅ Working');
    console.log('- Database access:', (!profileError && !sessionError) ? '✅ Working' : '⚠️ Check permissions');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRoleplayFlow();