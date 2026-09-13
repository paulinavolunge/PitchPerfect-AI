# Phase 2B — Budget prospect state machine

Status: PASS for the local Budget pilot acceptance tests. No commit, push, deployment, or remote migration was performed.
Baseline: main at c904b27b6659650bc12727ea84a37a6041b4d7fb.
Canonical workspace: C:\Users\pauli\Projects\PitchPerfect AI Astra\PitchPerfect-AI-git.

## Architecture

Only the standard Budget objection uses the new protocol. Custom scenarios and the five other standard scenarios retain their existing paths. The Budget opener is the existing Renee line, now returned by the server when the session is created.

The Edge Function owns a persistent PostgreSQL session document, transcript, logical-turn receipts and version. It never accepts client prospect metrics, conversation history, or persona instructions as authoritative Budget state. Browser requests contain a session ID, stable logical turn ID, expected accepted-turn count, action and a random 256-bit session capability. The server hashes the capability and binds it to the authenticated user ID (or a guest owner). The capability is not included in telemetry.

The new table has RLS enabled, no grants to public/anon/authenticated, and explicit service_role grants. The service credential is used only in the Edge Function. Every write compares id, owner and version atomically, then increments the version. A model request reserves its logical input before calling the provider. Failure leaves prospect state and transcript unchanged and freezes service/retry time. A successful state, transcript and cached response are committed together. Concurrent attempts cannot both commit. Repeated turn IDs replay the committed result; altered input or stale expected counts are rejected. Closing a pending session invalidates its outstanding result.

Two model calls share a 27-second abort budget, inside the existing 30-second client timeout:
1. An external behavioral evaluator returns strict JSON-schema output with literal evidence quotes.
2. Deterministic code validates the proposal and computes the accepted state. A reply generator receives that state and addresses the latest rep message without controlling the transition.

Model state/delta flags are advisory. The policy selects fixed bounded changes from valid contextual behavior evidence; model numbers cannot override policy. A concise reason is stored internally with the turn receipt, never shown in dialogue or returned to the UI.

## State schema

Required fields: state, patience, interest, trust, relevance, objectionsResolved, turnCount, elapsedMs, primaryObjectionStatus, nextStepEarned, hungUp.
Metrics are bounded 0–100. Objection status is UNADDRESSED, ACKNOWLEDGED or RESOLVED. Additional counters track poor turns, ignored objections and meeting asks. Initial values: ANSWERED, patience 80, interest 20, trust 25, relevance 20, zero turns/time, no resolved objections.

## Allowed transitions

Self-transitions are allowed. Other allowed targets:

| From | Targets |
| --- | --- |
| ANSWERED | GUARDED, SKEPTICAL, HUNG_UP |
| GUARDED | ENGAGED, SKEPTICAL, OBJECTION, LOSING_INTEREST, HUNG_UP |
| ENGAGED | SKEPTICAL, OBJECTION, LOSING_INTEREST, NEXT_STEP_EARNED, HUNG_UP |
| SKEPTICAL | ENGAGED, OBJECTION, LOSING_INTEREST, HUNG_UP |
| OBJECTION | ENGAGED, SKEPTICAL, LOSING_INTEREST, NEXT_STEP_EARNED, HUNG_UP |
| LOSING_INTEREST | OBJECTION, SKEPTICAL, HUNG_UP |
| NEXT_STEP_EARNED | terminal |
| HUNG_UP | terminal |

Impossible transitions are not applied. HUNG_UP cannot recover, and NEXT_STEP_EARNED ends this pilot session.

## Budget persona

Renee Castellano remains Director of Ops at a 140-person distribution company. She speaks directly in short buyer responses, with no coaching, assistant behavior or instructions about overcoming her objection. Budget season has closed and her allocation is frozen. Her underlying need is reducing manual order rework without adding headcount. Her private motivation is protecting her credibility after fighting for the current allocation. She distrusts unverified savings and vague pilots. The primary objection is no new funding this cycle. The sole secondary complication is the personal risk of sponsoring an unproven purchase.

## Thresholds and delta limits

Contextual positive evidence requires a literal rep quote and a literal quote from the previous buyer statement. The evaluator sees server-owned history. Keywords themselves never trigger a reward. Bad behavior overrides positive labels on the same turn.

- Relevant discovery: up to +3 patience, +8 interest, +15 relevance.
- Accurate reflection: +10 trust, +10 relevance.
- Credible proof: +15 interest, +10 trust, +10 relevance.
- Objection handling: +15 trust, +15 relevance; first acknowledgment cannot instantly resolve the objection.
- Default accepted turn: -2 patience.
- Generic, ignored, repeated-ask or other poor turns: -12 patience, -8 interest, -5 trust, -12 relevance.
- Rambling over 90 words: at least -18 patience, independent of model labeling.
- Unsupported claims/contradictions: -20 trust.
- Nonsense: -30 patience, -20 interest, -15 trust, -25 relevance.
- Aggression: patience becomes zero immediately.

Overlapping positive behaviors use the strongest applicable metric gain, rather than adding unlimited gains. Metrics are clamped after every accepted turn.

## Hang-up and next-step rules

Zero patience, three poor turns, two ignored-objection turns, aggression, pushing after LOSING_INTEREST, the hard duration limit, or six accepted rep turns without an earned next step end the call. Inactivity also ends the session through the server clock. Terminal wording comes from the state-constrained buyer renderer (or a fixed closing line for timer/manual closure).

An earned next step requires at least four accepted rep turns, trust >=60, relevance >=60, interest >=45, a RESOLVED primary objection, an appropriate contextual ask, no poor behavior on that turn, and an allowed transition from the current state. Asking for a meeting alone never qualifies.

## Duration rules

Soft limit: 75 seconds of active rep time, pushing the prospect toward LOSING_INTEREST where the transition permits it. Hard limit: 120 active seconds. Maximum: six accepted rep turns. Inactivity: 15 seconds while awaiting input.

Server timestamps own elapsed time. Typing and recording count toward duration but disable inactivity. Model execution, transcription, TTS, recovery failures and overlays pause the clock. The UI sends activity notifications and polls every three seconds; expiration is also checked when a turn arrives. Timing is observed at server receipt, so network transport introduces small boundary uncertainty. The server cannot independently verify a browser's claim that it is recording/playing audio; activity notifications are a client-observation trust boundary, not a client-authoritative numeric state.

The TTS hook now returns a completion promise that waits for audio completion/cancellation and browser speech fallback, rather than releasing the Budget clock after an arbitrary 15 seconds. No scoring algorithm or credit logic was redesigned.

## Telemetry

Existing session_id and turn_id remain. State results add state_before, state_after, patience_before/after, interest_before/after, trust_before/after, relevance_before/after, hang_up, next_step_earned and turn_count. Authorized failed turns report the unchanged state. Logical receipts keep retries associated with their original turn. Internal reason is bounded and stored with the service-only receipt. The capability is never logged or returned as telemetry.

## Validation

- Full deterministic regression suite: 60 passed, 0 failed; four opt-in live tests skipped in the offline command.
- Those four live tests were then executed separately: 4 passed, 0 failed.
- New deterministic coverage includes all 19 requested Budget categories, concurrency, changed-input replay rejection, owner isolation, server clock pauses, active speaking duration, close-versus-model races, Budget UI failure/retry and TTS completion beyond 15 seconds/cancellation.
- Embedded PostgreSQL (PGlite 0.5.8, pinned dev dependency) executes the actual migration and confirms role restrictions and version-conditional update behavior.
- Dedicated server-module TypeScript check: passed.
- Production build and prerender: passed, 10/10 routes.

Commands:

```powershell
npm exec vitest run --reporter=dot
$env:BUDGET_LIVE='1'
npm exec vitest run src/types/budgetLive.test.ts --reporter=verbose
npm run build
```

## Live/adversarial results

All live requests used synthetic dialogue against OpenAI and local in-memory session persistence, through the same Budget orchestration/model adapter. No production simulator or remote database was used.

| Call | Final validation |
| --- | --- |
| Strong | Gradual improvement in relevance; no first-turn agreement |
| Weak | Declining patience |
| Terrible/aggressive | HUNG_UP |
| Keyword nonsense | No interest/relevance improvement and no earned next step |

Earlier live runs exposed evaluator role confusion and invalid enum responses. Separating the classifier from the buyer persona and enforcing provider-side strict JSON schema fixed those failures. All four final live cases passed. This is a small behavioral sample, not proof against every possible prompt injection or semantic misclassification.

## Known limitations

- Docker's daemon was unavailable. The full local Supabase/PostgREST/Edge runtime was not exercised; PostgreSQL migration behavior was tested in PGlite and the orchestration in deterministic/live tests.
- The migration has not been applied to any hosted database. Budget frontend, Edge Function and migration require coordinated release later, after explicit authorization.
- No fresh manual browser/microphone QA was performed for this pilot. Automated UI and voice lifecycle tests passed; production voice recordings from Phase 2A do not validate this new pilot.
- Semantic behavior classification and generated wording remain model-dependent. Deterministic code owns transition and numeric policy, not natural-language understanding. The live strong-call test asserts gradual engagement, not guaranteed meeting conversion; the earned-next-step gate is separately tested deterministically.
- Inactivity closure is evaluated on polling/next request, not a background scheduler. A disconnected browser's session is not proactively expired until a subsequent request.
- Failed/lost activity notifications and browser-reported activity require further end-to-end adverse-network validation. They can delay or misalign clock pause boundaries.
- Session receipts retain transcripts in a service-only table; a retention/cleanup policy should be selected before production release.
- Session ownership binds to the current authenticated identity. Signing in/out during a Budget session requires starting a fresh session.

## Migration plan for remaining scenarios

No other scenario has been migrated. After reviewing this Budget pilot, validate the integrated development runtime and manual voice timing, then separately define each remaining persona, transition thresholds and adversarial cases. Reuse the transaction/receipt mechanism only after each scenario's explicit acceptance. No Phase 2C work is included.

## Phase 2B.1 integration validation — 2026-09-11

**Current integration decision: FAIL. Do not treat the earlier local-pilot PASS as integrated-application acceptance. Not recommended for commit as validated yet.**

### Environment and migration

Reconfirmed main at c904b27 with only the 16 Phase 2B pilot files changed before validation. Docker Desktop was started for local Supabase, but its Linux engine never became usable; docker info and supabase status could not connect to the dockerDesktopLinuxEngine pipe. No local Supabase migration or Edge Function runtime was started successfully.

Read-only connector discovery found only the production PitchPerfect AI project and no development branches. No paid branch was created. No production database, schema, function, or hosting deployment was changed.

The actual migration was rerun through the existing embedded PostgreSQL test and passed its service-role/browser-role privilege and atomic-version-update checks. This does not substitute for testing PostgREST and the deployed Edge Function together. Creation, persistence, idempotency, stale-turn rejection and ownership have local test evidence only; capability hashing/authentication and the hosted Data API remain unverified end to end.

### Fresh browser check

Started a temporary Vite frontend at http://127.0.0.1:5180 with Supabase explicitly pointed at http://127.0.0.1:54321 and a non-production placeholder key. Opened /practice in the available Codex in-app browser. It redirected to /login. Without working local Supabase/Auth or an available development project, an authenticated Budget session could not be created.

- Browser text strong/weak/aggressive/retry calls: BLOCKED, not passed.
- Browser voice capture/transcription/TTS/server-clock integration: BLOCKED, not passed.
- No microphone verification is claimed.
- The temporary browser tab and frontend server were closed after the check.

### Adverse-network results

Two acceptance failures are reproduced in src/types/budgetNetwork.test.ts and intentionally marked with it.fails. These are OPEN defects, not successful acceptance checks:

1. A delayed older resume can undo a newer pause. Activity messages have no monotonic sequence/receipt ordering. Repro: resume at 1000ms, pause at 2000ms, delayed old resume at 3000ms; readyAt becomes non-null, restarting a clock that should remain paused.
2. A lost pause can charge transcription time and trigger HUNG_UP. Repro: resume at 1000ms, transcription begins at 2000ms but its pause is dropped, rep turn arrives at 25000ms; the server treats the elapsed service time as inactivity. The client currently swallows activity errors without an acknowledged recovery protocol.

A repeated acknowledged resume leaves the original inactivity deadline unchanged. A model timeout followed by retry applies exactly one logical turn and excludes the failed attempt's waiting time. Unrecognized client metric fields cannot overwrite server-owned state in the session handler.

Required clock remediation: ordered/idempotent activity commands and an acknowledged pause/recovery protocol that prevents service work from proceeding with an unconfirmed clock state. Validate lost responses, reordered delivery and session closure in the integrated runtime after implementing it. No clock remediation is claimed in this validation pass.

### Regressions and small fixes

The full application TypeScript check uncovered Array.at usage incompatible with the repository's configured library target and boolean-union narrowing errors. Replaced last-element access with equivalent indexing and used explicit ok === false discrimination. Fixed a test helper's turn-ID type annotation. These are compatibility fixes only; no scoring or prospect behavior redesign was performed.

The build regenerates an unrelated MCP bundle on Windows. That generated change was restored to HEAD after validation; it is excluded from this work.

### Rerun results

- Full Vitest: **63 passed, 2 expected failures, 4 skipped** (69 total). The two expected failures are the open clock defects above. The four skipped tests are opt-in live tests, executed separately.
- Live Budget: **4 passed, 0 failed** on a fresh rerun, using synthetic OpenAI dialogue and local in-memory persistence. This validates model/orchestrator samples, not the missing Supabase/browser integration.
- Full application type check (tsc --noEmit -p tsconfig.app.json): PASS after the compatibility fixes.
- Dedicated server-module type check: PASS.
- Build/prerender: PASS, 10/10 routes.
- git diff --check: PASS.

### Remaining integration blockers

1. Repair/start local Docker/Supabase or supply an explicitly selected non-production development environment. Execute the migration and full Edge Function/auth/capability/RLS/version/terminal-state checks there.
2. Fix the two confirmed activity-clock defects and convert their expected-failure tests into ordinary passing acceptance tests.
3. Complete fresh authenticated Budget browser text and voice QA against that development backend, including actual TTS timing and adverse-network delivery.

No commit, push, production deployment, other-scenario migration, or Phase 2C work occurred.


## Phase 2B.2 clock remediation — 2026-09-11

**Clock remediation: PASS. Full Phase 2B integration remains unvalidated for the environment/browser reasons below.** This section supersedes the two open deterministic defects in the historical Phase 2B.1 results. Both former `it.fails` cases are ordinary passing tests now; no expected-failure markers remain in budgetNetwork.test.ts.

### Root cause and protocol

Previously activity commands lacked ordering, and the frontend swallowed notification failures while beginning service work. A late resume could replace a newer pause; a lost pause left the clock running through transcription.

The server session JSON now persists `activity: { sequence, mode, checkpointAt }`. Each new client intent allocates a monotonically increasing sequence. Retries retain that sequence and command ID. Lower sequences and conflicting reuse are rejected; an exact duplicate returns the accepted acknowledgement without changing the database version, clock or deadline. Existing row-version compare-and-swap serializes changes. Responses include `activityAck: { sessionId, sequence, mode }`; client acceptance checks all three fields. Tick observations carry the current sequence and cannot alter a newer activity state. Closure fences subsequent activity, retaining terminal state. Ownership/capability and service-role enforcement are unchanged. This is a JSON protocol change; no additional SQL migration is required for the unreleased pilot.

`BudgetActivityClock` shares in-flight identical intents, fences superseded acknowledgements, and makes at most three delivery attempts per transition. The frontend bounds each activity fetch to three seconds. A subsequent recovery attempt reuses the failed intent. Failure leaves recovery visible and blocks dependent work. Transcription, microphone startup and model requests require a matching pause acknowledgement; the opening is acknowledged paused before playback. The existing TTS completion lifecycle determines when activity can resume. Closing/resetting invalidates the local helper as well as closing the server session. Logical turn receipts and turn-version checks are retained independently of activity sequence.

### Server timing and recovery tradeoff

Active time is accumulated at server heartbeat checkpoints (the frontend polls every three seconds). A newly accepted pause discards the uncheckpointed tail, which may contain pause-delivery/recovery delay. This deliberately undercounts that uncertain interval instead of charging infrastructure wait to the rep; normally it is at most one polling interval, but an outage can make it longer. No client duration or timestamp is trusted. While pause acknowledgement is pending, this client stops issuing heartbeat observations and does not begin dependent service work. Matching paused ticks do not advance time. Ordinary acknowledged resumed inactivity still hangs up at 15 seconds when polled; engaged activity still reaches the 120-second hard duration. No background expiry scheduler was added.

### Tests and validation

- Full Vitest: **78 passed, 0 failed, 4 skipped; 82 total**, across 9 passing files and 1 opt-in live file. The four skipped cases were run separately.
- Budget live rerun: **4 passed, 0 failed** (strong, weak, aggressive, keyword nonsense). These use synthetic OpenAI requests and local in-memory persistence; they do not exercise hosted Supabase or browser permissions.
- Unique tests executed across the two runs: **82 passed, 0 failed**. No unresolved expected failures.
- Clock acceptance: **18 ordinary passing tests**, including both reorder directions, duplicate pause/resume, conflicting sequence, lost request and acknowledgement, bounded retries/manual recovery, blocked service without acknowledgement, owner/session rejection, terminal closure, legitimate inactivity, stale tick, unpaused model rejection, logical-turn retry, foreign acknowledgement, superseded acknowledgement and client closure.
- Existing component fixtures now acknowledge activity explicitly, preserving Budget retry and all six scenario regressions.
- Application TypeScript check: PASS (`tsc --noEmit -p tsconfig.app.json`).
- Server module TypeScript check: PASS (state/session/adapter, ES2022 bundler resolution).
- Build/prerender: PASS, **10/10 routes**. Restored only the unrelated Windows-generated MCP bundle after the build.
- `git diff --check`: PASS.

### Files changed for this remediation

- `src/lib/budgetActivityClock.ts` (new acknowledged client protocol)
- `src/components/GamifiedRoleplay.tsx` (service gates, transport and recovery)
- `supabase/functions/_shared/budget/session.ts` (ordered persistence and conservative clock checkpoints)
- `supabase/functions/_shared/budget/adapter.ts` (forward activity sequence)
- `src/types/budgetNetwork.test.ts` (18 passing acceptance tests)
- `src/types/budgetState.test.ts` (versioned clock fixtures and conservative elapsed-time expectation)
- `src/components/GamifiedRoleplay.reliability.test.tsx` (acknowledgement-aware fixtures)
- `PHASE-2B-PROSPECT-STATE-MACHINE.md` (these results)

The real Git diff remains cumulative against Phase 2A `c904b27`, including the earlier uncommitted Phase 2B pilot and integration tests. Scoring, personas, state-transition policy, other scenarios and the SQL migration were not changed during clock remediation.

### Remaining blockers for full Phase 2B integration

1. Execute the migration plus Edge Function/Auth/capability/RLS/version/terminal checks together in an available local Supabase runtime or explicitly selected non-production development project. Docker repair and remote migration were not attempted in this task.
2. Complete authenticated Budget browser text and voice QA against that backend, including real capture, transcription, TTS completion and adverse-network delivery of the new protocol. Automated protocol/component tests do not substitute for that end-to-end evidence.

No commit, push, deployment, remote migration, other-scenario migration or Phase 2C work occurred.


## Phase 2B.5 Wren reconciliation — 2026-09-12

**Reconciliation PASS; full browser/voice integration acceptance remains blocked.** All changes are uncommitted. No migration was applied, and no commit, push, merge, cherry-pick, rebase, reset, clean, production deployment or other-scenario migration was performed.

### Three-way comparison

Fetched only remote branch references before editing. Local HEAD, local main and fetched origin/main all remain `c904b27b6659650bc12727ea84a37a6041b4d7fb`. Wren `origin/wren-review` is `b88b63fdf4bfa59dedf50a2c353e8b1a40fdbed5`, with that baseline as its sole direct parent. Wren changes eight files: 764 insertions and 172 deletions.

Before reconciliation, the local diff contained these 19 paths (18 Phase 2B paths plus an already-modified MCP bundle):

```
PHASE-2B-PROSPECT-STATE-MACHINE.md
package-lock.json
package.json
src/components/GamifiedRoleplay.reliability.test.tsx
src/components/GamifiedRoleplay.tsx
src/hooks/useProspectVoice.test.ts
src/hooks/useProspectVoice.ts
src/lib/budgetActivityClock.ts
src/types/budgetDatabase.test.ts
src/types/budgetLive.test.ts
src/types/budgetNetwork.test.ts
src/types/budgetState.test.ts
src/types/roleplayReliability.ts
supabase/functions/_shared/budget/adapter.ts
supabase/functions/_shared/budget/session.ts
supabase/functions/_shared/budget/state.ts
supabase/functions/mcp/index.ts
supabase/functions/roleplay-ai-response/index.ts
supabase/migrations/20260911015511_budget_prospect_sessions.sql
```

Four overlapping files: `src/components/GamifiedRoleplay.tsx`, `src/hooks/useProspectVoice.ts`, `src/types/roleplayReliability.ts`, `supabase/functions/roleplay-ai-response/index.ts`.

### Wren hunk decisions

Every Wren-changed file was reviewed. Related hunks are grouped below; no overlapping file was wholesale replaced.

| Wren file / hunk behavior | Classification and disposition |
| --- | --- |
| `src/components/Footer.tsx`: remove repeated bottom legal links | KEEP. Main Legal column and all routes remain. |
| `src/components/GamifiedRoleplay.tsx`: voice constants, per-persona assignments, active voice selection, replay voice | KEEP WITH ADAPTATION. Existing promise-returning speakText is retained; timing/Marcus and team/Andre use male, think/Devon uses female, preset overrides win. No persona text/state policy changes. |
| Same: patience recovery constants and word-count/question bonuses | REJECT — browser/keyword authority conflicts with deterministic Budget metrics. No non-Budget behavior retuning either. |
| Same: patience bucket payload | REJECT — Budget server state remains authoritative. |
| Same: SSE parser, incremental handlers, stream request flag, partial text/message IDs, onSentence playback, streamed opening/turn completion, sentencesSpoken dedup | UNRELATED / DEFER. Speech and partial dialogue escape before final success and before Budget CAS commit; callbacks lack per-delta session/attempt fencing. Requires a separate committed-state streaming design. |
| Same: estimatedScore field, fallback score toast and display | UNRELATED / DEFER. Scoring changes are outside reconciliation scope. |
| `src/types/roleplayReliability.ts`: sentencesSpoken flag | DEFER with streaming. Added SESSION_CLOSED to the existing failure union for the required terminal fix instead. |
| `src/hooks/useProspectVoice.ts`: visible backup notice/cooldown and bounded provider fetch | KEEP WITH ADAPTATION. One cooldown notice; 15-second fetch/body bound, while actual audio/browser-speech completion continues to control the returned promise. |
| Same: epoch cancellation, stale response handling | KEEP WITH ADAPTATION. stop/mute invalidates queued/in-flight speech; stale fetch completion cannot play or trigger fallback. Preserved Phase 2B completion promises. |
| Same: concurrent audio fetch, split fetch/play pipeline and streaming queue | DEFER with streaming; retained serial generation/playback for committed responses. |
| Same: 15-second playback/fallback safety completion | REJECT — resolves before actual playback ends and would resume Budget timing during service playback. |
| `supabase/functions/elevenlabs-tts/index.ts`: anon-key shortcut and redundant later branch removal | KEEP WITH ADAPTATION. Early return uses the existing allowed-guest null identity; authenticated getUser validation unchanged. Existing redundant fallback retained to minimize diff. |
| `supabase/functions/pitch-analysis/index.ts`: guest shortcut | KEEP. Existing guest rate limits unchanged. |
| Same: retry loop, payload restructuring, per-attempt timeout | KEEP WITH ADAPTATION. Shared bounded helper replaces duplication without changing scoring/payload. |
| `supabase/functions/voice-to-text/index.ts`: guest shortcut | KEEP. Existing guest identity/rate limits unchanged. |
| Same: Whisper retry loop/timeout | KEEP WITH ADAPTATION using the same shared helper; transcription result/error handling retained. |
| `supabase/functions/roleplay-ai-response/index.ts`: guest shortcut | KEEP WITH ADAPTATION. Budget SHA256 capability binding and authenticated identity remain unchanged and pass integrated checks. |
| Same: patienceBucket direction/client-owned hang-up comments | REJECT — conflicts with server-owned Budget state and terminal policy. |
| Same: SSE request/stream response blocks | DEFER with client streaming. Budget still routes to its session adapter before any legacy persona/history handling. |
| Same: retry/quota/timeout loop | KEEP WITH ADAPTATION. Shared helper also used by Budget's adapter, within its existing 27-second whole-turn deadline. |

The shared OpenAI helper retries at most once for network TypeError, 5xx, or non-quota 429, with 500ms bounded backoff and one 25-second deadline including body delivery. Caller abort is preserved; timeout is not retried. Quota/billing/insufficient-credit 429 fails fast. Budget reports typed MODEL_ERROR with retryable:false on quota, without committing a turn or exposing provider details. Wren's separate 25-second per-attempt budgets were not copied because two attempts could outlive the client deadline.

Automatic review initially interpreted the anon shortcut as rejecting guests. Inspection established that null already means an allowed guest in all four handlers; the narrower patch was accepted and real guest capability checks passed.

### Terminal fix and invariant verification

In session.ts, ownership validation and exact receipt replay remain first. After version validation, a new `turn` in a terminal session returns `{...fail("SESSION_CLOSED"), retryable:false}`. Activity rejection remains unchanged; idempotent close remains allowed. The guard returns before CAS, transcript writes, turn increments or provider calls. No credits logic changed; failures remain on the existing uncounted/unscored client path. Tests cover HUNG_UP, NEXT_STEP_EARNED, manual close, inactivity, hard duration and max-turn closure; whole-row equality, provider spies, exact committed replay, altered/stale/foreign rejection verify isolation.

Budget retains the server document/history, capability/owner binding, row versions, turn receipts, deterministic reducer and acknowledged activity protocol. No systemPromptOverride, client metrics or client history were made authoritative. No early speech/streaming was retained.

### Validation

- Full Vitest: **97 passed, 0 failed, 4 opt-in skipped** (101 total; 10 passing files, 1 opt-in file).
- Separate Budget live tests: **4 passed, 0 failed**. Total distinct tests executed across runs: **101 passed**.
- Terminal/network file: **25 passing tests**, including 7 new terminal/replay cases.
- Retry helper: **10 passing tests**, including transient retry, quota fast failure, caller cancellation and body timeout.
- Voice hook: **4 passing tests**, including >15-second playback, stop completion, cancelled fetch and visible fallback/completion.
- Application TypeScript and Budget server-module/helper TypeScript: PASS.
- Build/prerender: PASS, **10/10 routes**.
- Local real Supabase integration: **30/30 passed**, previously 29/30. Updated only local function copies in the existing isolated `pp-budget-integration` environment. No SQL migration was reapplied. Real Auth/Edge/PostgREST/Postgres tests cover guest/auth ownership, hashing, table denial, ordering, duplicate/lost delivery, CAS, provider success, receipt replay, terminal rejection and server-owned metrics. NEXT_STEP_EARNED persistence is tested with a privileged fixture, not claimed as a newly live-earned outcome.
- git diff --check: PASS. Existing pre-task MCP bundle bytes were preserved across build; not silently restored to HEAD.

### Browser and deployment limitations

Local frontend was explicitly bound to `127.0.0.1:54321` backend. Real local sign-in succeeded. Dashboard then showed a React "Rendered fewer hooks than expected" error. Direct /practice opened and Budget selection worked, but its opening stalled with `SupersededActivity: Session changed`. Inspection found `useEffect(() => () => { mountedRef.current = false; }, [])` already present in c904b27; StrictMode's cleanup/setup leaves the mounted flag false because setup never restores it. This was not introduced by reconciliation and was not repaired in this task. Browser text turn/retry/hang-up and microphone/transcription/TTS/clock acceptance remain BLOCKED. No microphone or live TTS success is claimed; the isolated environment also lacks an ElevenLabs key. Streaming QA is not applicable because streaming was deferred.

The old repository-wide local migration failure (`public.user_login_events` missing) remains untouched. The existing isolated Budget environment bypasses that legacy chain; it is not evidence for full dashboard/schema integration.

Wren includes no workflow changes. Canonical workflow inspection found only CI (build/test on main/PR) and Lighthouse (manual/scheduled audit). Neither deploys Edge Functions. No missing Wren deployment files were invented; no equivalent deployment-named files were found in the workspace search. Production release must remain a separate manual/gated operation with the Budget migration verified first; this task adds no deployment mechanism.

The reconciled implementation is suitable as a **local restore point**, with these limitations documented; it is not certified for production or full browser/voice acceptance. Any later restore-point commit should explicitly exclude or separately review the pre-existing MCP bundle change. Nothing was committed here.

Files touched by reconciliation: this document; Footer.tsx; GamifiedRoleplay.tsx and its reliability test; useProspectVoice.ts and its test; roleplayReliability.ts; budgetNetwork.test.ts; new openaiRetry.test.ts; Budget adapter.ts/session.ts; new shared openaiRetry.ts; roleplay-ai-response, elevenlabs-tts, pitch-analysis and voice-to-text index.ts. All other initial local changes were preserved.

## Phase 2B.6 browser lifecycle validation — 2026-09-12

**BROWSER ACCEPTANCE: FAIL (remaining browser coverage/environment blockers).** The lifecycle fix and all automated checks pass. This is suitable for a reviewed restore-point commit, not full browser/voice acceptance or production release. Nothing was committed, pushed, deployed or migrated in this task.

### Root cause and exact fix

The mounted ref was initialized true but its effect only assigned false during cleanup. React StrictMode's development setup/cleanup/setup therefore left a mounted component marked unmounted. The effect now assigns `mountedRef.current = true` on every setup and still assigns false on cleanup. Session IDs, attempt guards, receipt/version handling and acknowledged activity protocol were not changed. This defect existed in c904b27.

Two component regressions cover real StrictMode setup/cleanup/setup accepting exactly one Budget opening at Round 0 / 80% patience, and a deferred opening resolving after genuine unmount producing no success telemetry or credit charge. Focused component suite: 16/16 passed.

### Fresh validation

- Full Vitest: 99 passed, 0 failed, 4 opt-in live tests skipped (103 total).
- Separate live Budget suite: 4 passed, 0 failed; 103 unique automated passes across both runs.
- Existing isolated local Supabase integration: 30/30 passed, 0 failed. No migration reapplied. Includes closed new-turn rejection, receipt replay, ownership/RLS, state persistence, CAS and activity ordering/idempotency. NEXT_STEP_EARNED persistence uses a privileged fixture, not an earned live browser call.
- Application TypeScript and server-module TypeScript: PASS.
- Build/prerender: PASS, 10/10 routes. Git whitespace check: PASS.

### Browser observations and limitations

Authenticated in-app browser against local Vite (127.0.0.1:5180) and isolated Supabase (127.0.0.1:54321). Budget opening appeared at Round 0, patience 80%. Relevant discovery received a contextual response, advancing to Round 1 / 83%. A second contextual turn advanced to Round 2 / 81%, with ordered transcript. A later inactivity timeout ended that call; no complete strong-call success is claimed. A fresh aggressive text call reached the Prospect Hung Up debrief with final patience 0%. Post-terminal new-turn rejection passed the local API integration; it was not submitted through the disabled/ended browser UI.

Voice opening appeared, but local ElevenLabs returned `TTS service not configured` and the hook attempted browser fallback. Clicking the microphone remained in Processing voice without confirmed recording. Real capture, transcription, audible playback completion and end-to-end clock transitions are **BLOCKED**, not passed. No synthetic microphone input was substituted.

Further fresh weak-call and induced-failure/retry browser checks were blocked by the account's free-round gate after the aggressive call. It was not bypassed. The isolated database also reports profile loading and practice-attempt persistence errors; it contains the Budget schema, not the complete legacy application schema. Automated/live evidence is not a substitute for these incomplete browser cases.

Dashboard navigation displayed the first-round empty state and Skip the tour returned to practice without reproducing the prior hooks error. Inspection found no conditional hook ordering in the reviewed Dashboard/auth/data-hook path; these files are unchanged from HEAD. The earlier `Rendered fewer hooks than expected` cause remains unconfirmed, not proven fixed or classified as pre-existing. No unrelated hook workaround was introduced. Reproduce with a complete non-production account/schema and capture the component stack before broadening scope.

### MCP disposition and remaining work

The MCP file is a generated Vite-plugin bundle (`@lovable.dev/mcp-js` writes the generated Edge entry). Build regenerated its 119-line baseline into a bundled file. After stopping Vite, restored only `supabase/functions/mcp/index.ts` to HEAD under explicit authorization; its diff is empty. All reconciled source work remains intact.

This task changed GamifiedRoleplay.tsx, its reliability test, and this document, plus the authorized generated-file restoration. Remaining acceptance work: complete strong/weak/retry browser cases with an appropriately provisioned non-production test account; verify real microphone/transcription/TTS and clock completion; reproduce or conclusively dispose of the dashboard hooks report. No prospect/clock redesign, scoring change, other-scenario migration or Phase 2C work occurred.

## Phase 2B.3 final integration attempt — 2026-09-11

**FINAL INTEGRATION: FAIL — environment blocked. Budget is not yet recommended for commit as an integration-validated pilot.** No application or protocol redesign was performed.

### Environment diagnosis

Read the latest Phase 2B.2 results and confirmed the existing 18-file uncommitted pilot work remains present. Docker was initially stopped. Rechecked outside the filesystem sandbox to distinguish permission restrictions from a real engine failure: the selected desktop-linux context could not connect to the dockerDesktopLinuxEngine named pipe. WSL listed docker-desktop as stopped.

Attempted one normal Docker Desktop startup. The fresh host backend log at 2026-09-11T12:31:32Z reports a startup crash:

`starting services: initializing Inference manager: listening on unix://C:/Users/pauli/AppData/Local/Docker/run/dockerInference: remove C:/Users/pauli/AppData/Local/Docker/run/dockerInference: The file cannot be accessed by the system. (listener: The filename, directory name, or volume label syntax is incorrect.)`

The backend then reported that all local engines stopped. This establishes the immediate runtime blocker; the underlying cause of the inaccessible socket/path has not been established. No factory reset, deletion of images/volumes or speculative filesystem repair was attempted. Stopped integration attempts according to the user's explicit stop condition. No alternate development project was selected and production was not substituted.

### Results

- Environment used: local Docker/Supabase startup attempt only; no working integration backend.
- Migration: NOT APPLIED in this attempt.
- Integrated security/RLS/service-role/authenticated and guest ownership/capability hashing: BLOCKED.
- Integrated session persistence, atomic updates, receipts, stale turns, terminal states and metric overwrite rejection: BLOCKED.
- Authenticated browser text and voice: NOT RUN; no capture/transcription/TTS verification claimed.
- Integrated activity/network sequence convergence, delivery loss/retry and in-flight closure: NOT RUN.
- Regression commands were not rerun after the explicit environment stop condition. The latest Phase 2B.2 evidence remains 78 Vitest passes plus 4 separately passing live cases (82 unique passes), passing application/server type checks, 10/10 build/prerender routes, and passing diff check. These are prior results, not fresh Phase 2B.3 results.
- Regressions: none established by this blocked attempt; integrated regression validation remains incomplete.
- Files changed in Phase 2B.3: this document only. Existing pilot implementation/tests preserved.

### Remaining blockers

1. Restore a working local Docker/Supabase runtime without destructive reset, or explicitly select a non-production development project for a subsequent validation attempt.
2. Apply the unreleased migration there and complete all required integrated security, persistence, activity/network and authenticated browser text/voice checks, then rerun the requested regression commands.

No commit, push, production deployment, remote migration, other-scenario migration or Phase 2C work occurred.
