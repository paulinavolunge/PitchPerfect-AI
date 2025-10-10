#!/usr/bin/env node

// Test script to verify auth flow is working correctly
// Run with: node scripts/test-auth-flow.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;


const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  console.log('🔍 Testing PitchPerfect AI Auth Flow...\n');

  // Test 1: Check if Supabase is accessible
  console.log('1️⃣ Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err.message);
  }

  // Test 2: Check auth configuration
  console.log('\n2️⃣ Checking auth configuration...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Auth configuration error:', error.message);
    } else {
      console.log('✅ Auth configuration is valid');
      console.log('   Current session:', session ? 'Active' : 'None');
    }
  } catch (err) {
    console.error('❌ Auth check failed:', err.message);
  }

  // Test 3: Test signup flow (with a test email)
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log('\n3️⃣ Testing signup flow...');
  console.log(`   Test email: ${testEmail}`);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (error) {
      console.error('❌ Signup error:', error.message);
    } else {
      console.log('✅ Signup successful');
      console.log('   User ID:', data.user?.id);
      console.log('   Email confirmation required:', !data.session);
      
      // Test 4: Check if user profile was created
      if (data.user) {
        console.log('\n4️⃣ Checking user profile creation...');
        
        // Wait a bit for trigger to execute
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.error('❌ User profile not found:', profileError.message);
          console.error('   This is the main issue - the trigger is not creating profiles!');
        } else {
          console.log('✅ User profile created successfully');
          console.log('   Credits:', profile.credits_remaining);
          console.log('   Trial used:', profile.trial_used);
        }
      }
    }
  } catch (err) {
    console.error('❌ Signup test failed:', err.message);
  }

  // Test 5: Check RPC functions
  console.log('\n5️⃣ Testing RPC functions...');
  try {
    // This will fail without a valid user, but we're testing if the function exists
    const { error } = await supabase.rpc('log_security_event', {
      p_event_type: 'test_event',
      p_event_details: { test: true }
    });
    
    if (error && error.message.includes('does not exist')) {
      console.error('❌ RPC function log_security_event not found');
    } else {
      console.log('✅ RPC functions are accessible');
    }
  } catch (err) {
    console.error('❌ RPC test failed:', err.message);
  }

  console.log('\n📊 Test Summary:');
  console.log('- If user profile creation failed, the database trigger is missing');
  console.log('- Run the new migration to fix this issue');
  console.log('- Check Supabase dashboard for email confirmation settings');
}

testAuthFlow().then(() => {
  console.log('\n✅ Tests completed');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test script error:', err);
  process.exit(1);
});