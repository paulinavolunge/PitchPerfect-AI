

## Plan: Fix Scenario Context and Post-Roleplay Scoring

### Fix 1: Practice page passes `scenario: null` to pitch-analysis

**Problem**: In `src/pages/Practice.tsx` line 118, the pitch-analysis call hardcodes `scenario: null`. The Practice page has no scenario selection UI, so there's no scenario state to pass.

**Solution**: Add a simple scenario selector to the Practice page (industry + objection type dropdowns) and pass that data to the `pitch-analysis` call.

**Changes**:
- `src/pages/Practice.tsx`:
  - Add state for `selectedIndustry` (default: "Technology") and `selectedObjection` (default: "Price") and `selectedDifficulty` (default: "Beginner")
  - Add a small UI section with Select dropdowns for industry, objection type, and difficulty before the text/voice input area
  - Replace `scenario: null` on line 118 with the actual scenario object: `{ industry: selectedIndustry, objection: selectedObjection, difficulty: selectedDifficulty }`

### Fix 2: Roleplay sessions never get scored by pitch-analysis

**Problem**: In `src/components/roleplay/ConversationInterface.tsx`, after each user response, only `generateEnhancedFeedback` (a local heuristic function) runs. The `pitch-analysis` edge function is never called, so the user never gets a real AI-scored evaluation of their roleplay performance.

**Solution**: Add an "End Session" button that, when clicked, compiles the full conversation transcript and sends it to `pitch-analysis` for a proper AI evaluation. Display the results.

**Changes**:
- `src/components/roleplay/ConversationInterface.tsx`:
  - Add state: `sessionEnded`, `sessionAnalysis`, `isAnalyzing`
  - Add an "End Session & Get Score" button in the UI (visible after at least 2 user messages)
  - When clicked: compile all messages into a single transcript string, call `supabase.functions.invoke('pitch-analysis', { body: { transcript, practiceMode: mode, scenario, userContext: { userId: user?.id } } })` with the actual scenario data
  - Display the returned analysis (overall score, category scores, strengths, improvements) in a summary card
  - Save the session with the AI-generated score via `saveSessionToDatabase`
  - Deduct credits for the analysis

### Technical Details

- The `pitch-analysis` edge function already accepts `scenario` with `{ industry, objection, difficulty }` and uses it to contextualize feedback -- no backend changes needed
- The transcript sent from roleplay will be formatted as a conversation: "User: ... | AI: ..." so the AI evaluator can see the full exchange
- Credits: 1 credit for the end-of-session analysis (same as Practice page)

