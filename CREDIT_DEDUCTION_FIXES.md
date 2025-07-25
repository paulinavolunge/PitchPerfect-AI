# Credit Deduction Logic Fixes

## Summary of Changes

Fixed the credit deduction logic to ensure credits are only deducted when users receive actual AI-powered objection-handling features.

## Key Changes Made

### 1. Demo.tsx
- **Before**: Credits deducted before AI call, even if AI failed
- **After**: Credits deducted only after successful AI response (not fallback)
- Added `aiSuccess` flag to track real vs fallback responses

### 2. Practice.tsx  
- **Before**: Credits deducted before analysis, user charged even if AI failed
- **After**: Credits deducted only after successful AI pitch analysis
- Fallback analysis doesn't consume credits

### 3. ConversationInterface.tsx (Roleplay)
- **Before**: No credit deduction for roleplay sessions
- **After**: Credits deducted after successful AI conversation responses
- Voice/hybrid mode costs 2 credits, text mode costs 1 credit
- Credits based on interaction mode and scenario type

### 4. DemoSandbox.tsx
- **Before**: Credits deducted before analysis started
- **After**: Credits deducted only after demo completion with actual transcript
- Only authenticated users with meaningful transcript content are charged

## Credit Deduction Rules

### When Credits ARE Deducted:
✅ Successful AI demo feedback (not fallback)
✅ Successful AI pitch analysis (not fallback) 
✅ Successful AI roleplay responses (not fallback)
✅ Demo sandbox completion with real transcript

### When Credits ARE NOT Deducted:
❌ AI service failures or errors
❌ Fallback responses (local/mock analysis)
❌ Empty or invalid inputs
❌ Guest mode usage
❌ Service timeouts or connection issues

## Credit Amounts:
- **Demo objection (text)**: 1 credit
- **Demo objection (voice)**: 2 credits  
- **Pitch analysis**: 1 credit
- **Roleplay (text)**: 1 credit
- **Roleplay (voice/hybrid)**: 2 credits
- **Demo sandbox**: 1 credit

## Error Handling:
- If credit deduction fails AFTER successful AI response, user keeps the value
- Warnings logged but flow continues
- Users are not penalized for system failures
- No interruption of user experience for backend issues

This ensures users only pay for actual AI value received, not for system failures or fallback responses.