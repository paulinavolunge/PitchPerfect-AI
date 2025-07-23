# Log-User-Login Function Debug Analysis

## Issue Summary
The `log-user-login` Supabase Edge function returns **401 Unauthorized** even with valid JWT tokens.

## Root Cause Analysis

### Potential Issues Identified:

1. **JWT Token Extraction Issues**
   - The function extracts token using `authHeader?.replace("Bearer ", "")`
   - If the Authorization header format is incorrect, token extraction fails
   - Added validation to ensure proper "Bearer " prefix

2. **Environment Variables Missing**
   - Edge functions need `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
   - These must be set in the Supabase project settings for Edge functions
   - Added environment variable validation

3. **JWT Validation Failure**
   - `supabaseClient.auth.getUser(token)` may fail due to:
     - Expired or invalid JWT
     - Wrong signing key/secret
     - Network issues between Edge function and Supabase Auth

4. **Database Table Issues**
   - The `login_events` table exists (confirmed by debugging script)
   - But RLS policies might prevent insertion

## Debugging Improvements Made

### Enhanced Edge Function (`/supabase/functions/log-user-login/index.ts`)

```typescript
// Added comprehensive logging and error handling:
- Environment variable validation
- Authorization header validation  
- JWT extraction validation
- Detailed JWT parsing error messages
- Database insertion error details
- CORS support for browser requests
```

### Key Debugging Features Added:

1. **Environment Check**
   ```typescript
   console.log("🔧 Environment check:");
   console.log("  SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
   console.log("  SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Set" : "❌ Missing");
   ```

2. **JWT Token Validation**
   ```typescript
   console.log("🎫 Token extracted:");
   console.log("  Length:", token.length);
   console.log("  Starts with:", token.substring(0, 20) + "...");
   ```

3. **JWT Parsing Results**
   ```typescript
   console.log("📊 JWT parsing result:");
   console.log("  Error:", error ? error.message : "None");
   console.log("  User:", user ? `✅ Valid (ID: ${user.id})` : "❌ No user");
   ```

## Testing Scripts Created

### 1. General Debug Script (`debug-log-user-login.js`)
- Tests login_events table existence ✅
- Tests JWT token generation and validation
- Tests Edge function invocation
- Provides detailed debugging recommendations

### 2. Function-Specific Test (`test-log-user-login.js`)
- Creates test user with valid session
- Tests Edge function with real JWT token
- Verifies login event insertion in database
- Provides step-by-step debugging output

## How to Debug the Issue

### Step 1: Run the Debug Script
```bash
node debug-log-user-login.js
```

### Step 2: Check Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → log-user-login
3. Check the function logs for detailed debugging output

### Step 3: Verify Environment Variables
Ensure these are set in Supabase Dashboard → Settings → Edge Functions:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Your anon/public key

### Step 4: Test with Valid JWT
```bash
node test-log-user-login.js
```

## Most Likely Solutions

### 1. Environment Variables Not Set
**Problem**: Edge function can't access Supabase
**Solution**: Set environment variables in Supabase Dashboard

### 2. JWT Format Issues
**Problem**: Authorization header not properly formatted
**Solution**: Ensure header is `Authorization: Bearer <token>`

### 3. JWT Validation Configuration
**Problem**: Edge function JWT validation settings
**Solution**: Verify `verify_jwt = true` in `config.toml` is correct

### 4. Network/Connectivity Issues
**Problem**: Edge function can't reach Supabase Auth service
**Solution**: Check Supabase service status and network connectivity

## Expected Function Behavior

With the debugging improvements, the function will now:

1. **Log all steps** with clear emoji indicators
2. **Validate environment** before proceeding
3. **Check Authorization header** format
4. **Extract and validate JWT** token
5. **Parse JWT** and show detailed results
6. **Insert login event** with error handling
7. **Return descriptive errors** instead of generic "Unauthorized"

## Next Steps

1. Deploy the improved function
2. Run the test scripts
3. Check function logs for specific error messages
4. Address the specific issue identified in logs
5. Verify successful login event logging

## Configuration Files Updated

- `/supabase/functions/log-user-login/index.ts` - Enhanced with debugging
- `/tmp-supabase/supabase/functions/log-user-login/index.ts` - Matching copy
- `/tmp-supabase/supabase/config.toml` - Function configuration

The debugging enhancements will provide clear visibility into exactly where the 401 Unauthorized error is occurring and why.