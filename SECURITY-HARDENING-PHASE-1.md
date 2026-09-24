# Security hardening Phase 1

## Scope and evidence

Started clean at protected Email restore point `3cfc5faf3c747e1d2e75e6c69ff423be6c063c71`, on new branch `astra/security-hardening-phase1`. No production changes, push or commit in this phase. Budget/Email policies, shared session/reducer/clock, scoring logic, pricing and public Cold Call implementation are unchanged.

The production policy findings were supplied as independently verified by the user. This phase confirms the defects against repository definitions and a local reproduction, not a fresh production catalog dump. Production drift must be checked before rollout. The current repository contains historical attempted corrections and later policy recreation; replaying all historical migrations is not a safe release procedure.

## Confirmed vulnerabilities and implemented boundaries

1. `voice_rate_limits`: permissive SELECT policies combine with OR. The `Authenticated users only` policy exposes other users' rows despite the owner/admin policy. The new migration drops only that broad policy; owner/admin SELECT and service management remain unchanged.
2. `security_logs`: public INSERT WITH CHECK(true) permits forged audit rows. No direct browser table writes were found, but three RPC entry points existed: `SafeRPCService.logSecurityEvent` (AuthContext, OptimizedAuthContext, SecurityMonitoringService/securityHeaders), `SecureDataService.logSecurityEvent`, and `useSecurityMonitoring`. Dropping INSERT alone would leave the SECURITY DEFINER `log_security_event` RPC callable by clients. The migration removes known client INSERT policies, revokes browser INSERT and trusted RPC EXECUTE, and preserves service access. Trusted nested SECURITY DEFINER credit/admin functions continue calling the old RPC as owner.
3. Legitimate browser diagnostics now use `report_client_security_event`. It derives identity from auth.uid(), rejects another user's supplied ID, bounds event type and JSON size, fixes event_type to `client_report`, and nests arbitrary claims under `reported_details` with a fixed `untrusted_client` source. Clients cannot author trusted event types. This is intentionally untrusted telemetry, not proof that an auth/credit/admin event occurred. Signed-out reports are rejected; the existing best-effort callers already tolerate unavailable logging. Authenticated anonymous users, if enabled later, may report only under their own UID, still explicitly untrusted. No browser direct INSERT is retained.
4. `verify-stripe-session`: buyer email was required only for signup convenience, not Stripe verification or scorecard unlock. Public response now explicitly allows only paid/mode/amountTotal/productLabel. The user supplies their checkout email for signup; existing webhook/pending-credit fulfillment remains authoritative. No alternate customer identifier is exposed. The old comment calling checkout IDs signed authentication proof was corrected: they are bearer lookup references.

Migration: `supabase/migrations/20260924171220_security_phase1_rate_limits_and_audit.sql`.

## Complete repository caller map for affected AI endpoints

| Endpoint | Direct caller | Product path / identity | Existing boundary and remaining issue |
|---|---|---|---|
| roleplay-ai-response | GamifiedRoleplay.callAI plus activity and close requests | `/practice` authenticated or signed-out; Budget/Email server sessions; legacy/custom practice | Session JWT when available, otherwise public anon key. Budget/Email bind user-or-guest plus hashed capability and use receipts/CAS. Guest-created capability is not an entitlement or abuse quota. |
| roleplay-ai-response | Same GamifiedRoleplay through Index → ColdCallHook, presetScenario/alwaysSpeak/isColdCallHook | Public homepage Cold Call; signed-out anon-key or authenticated visitor | Intentionally separate legacy public path. Client localStorage gate is not durable server entitlement. |
| roleplay-ai-response | components/roleplay/chat/ChatLogic.generateAIResponse (roleplay chat chain) | Legacy roleplay UI; Supabase SDK session JWT or anon-key fallback | Caller-supplied history/context; no shared-engine session binding on this legacy path. |
| pitch-analysis | GamifiedRoleplay.runDebrief | Authenticated practice, guest practice and homepage Cold Call | Server validates available JWT but permits absent/invalid tokens as guest; accepts client transcript; user/IP in-memory limit only. |
| elevenlabs-tts | useProspectVoice.speak, consumed by GamifiedRoleplay | Authenticated/guest TEXT when alwaysSpeak and VOICE; homepage opening/replies | JWT or public anon key; arbitrary caller text/voice ID, 500-character truncation and in-memory limit, no receipt/text-hash binding. |
| demo-feedback | No current frontend or internal/server caller found across repository | Deployed public legacy endpoint; `/demo` now redirects to `/practice` and therefore uses the callers above | Allows guest requests; per-instance IP limiter. Do not disable without checking external callers/traffic. |
| verify-stripe-session | ScoreUnlock at `/scorecard-unlock` | Public Stripe redirect and authenticated purchasers | Bearer checkout lookup; optional SDK JWT is not ownership proof. No email needed to unlock. |

No server-to-server callers of these four AI endpoints were found. Related transcription uses `utils/voiceInput` → `lib/whisper-api` → `voice-to-text`, which has a different gateway configuration; it must be included in any future guest-capability rollout rather than accidentally breaking microphone UX.

No `signInAnonymously` call exists in the application; checked-in `enable_anonymous_sign_ins` is false. The public anon key represents the `anon` database role and has no individual user ID. A genuine Supabase anonymous-auth user instead has a validated user JWT/UID, authenticated database role and is_anonymous claim; it must not receive paid entitlements merely for being in that role. Actual hosted Auth settings were not changed or re-read here.

The public AI functions accept absent/invalid identity as guest and rely on in-memory rate limits. CORS/Origin are not authentication. These exposure findings remain open; switching verify_jwt globally would break intended public behavior and would not establish entitlement on its own.

## practice_sessions write audit and Phase 2 design

The only direct browser INSERT found is `useFreeTrialLimit.incrementAttempt`, called from GamifiedRoleplay. It supplies user_id, scenario_type, difficulty, industry, duration_seconds, score, transcript, feedback_data, status and completed_at. No direct browser UPDATE to this table was found. `RecentRoundsList.handleDelete` performs owner-filtered DELETE through RLS. Dashboard, SessionDetail, CommandPalette, statistics hooks and MCP tools read the table. `score-round` performs trusted updates of status/reason/transcript and verifies authenticated ownership; it is not the current GamifiedRoleplay text finalization boundary. `daily-streak-job` consumes scored rows, so browser-authored scores/status also affect streak integrity.

A broad UPDATE revoke alone is insufficient: forged scored INSERTs remain possible and the active client persistence flow would still own authoritative fields. Deferred implementation sequence:

1. Add a trusted finalization endpoint using validated identity, scenario session/capability and stable logical operation ID. For Budget/Email, load committed server transcript/outcome; never accept browser score/status/feedback/completion time as truth. For legacy/custom/public flows, first create bounded server-owned session/transcript storage without changing their prospect policies.
2. Run the existing scoring calculation at that boundary (no scoring redesign), atomically persist outcome and charge entitlement exactly once. Use unique finalization keys/receipts; retries return the original result. Provider failure creates no scored outcome or credit charge. Keep zero-turn terminal sessions unscored.
3. Switch incrementAttempt to submit only the reference/operation ID and display the returned result. No existing browser-authoritative score column needs a column-level UPDATE grant. Retain safe owner SELECT; move deletion through an explicit ownership-checked operation if it affects rewards/streak history.
4. Only after migrated callers and rollback support are verified, revoke browser authoritative INSERT/UPDATE. Confirm all cron/reward/MCP readers consume only trusted finalized rows. Include genuine authenticated/anonymous-auth identities, cross-owner access, forged status/score, retries and credit/streak consistency in acceptance.

## Durable AI protection design (deferred)

1. A shared admission boundary validates product user JWTs with the Auth service. Invalid supplied JWTs fail instead of silently becoming guest. Authenticated anonymous users are explicitly classified as guest tier. Preserve a separate intentional public admission route for current anon-key homepage visitors.
2. The public route issues cryptographically random short-lived capabilities tied to one server session, permitted scenario/actions, maximum turns, input/output budgets and expiration. Admission itself needs durable per-identity/IP/device-risk/global cost budgets and server-verified anti-automation proof where needed; issuing unlimited tokens would merely relocate the proxy. Do not use Origin/CORS as proof. Reuse the existing Budget/Email owner binding, not replace it with browser metrics.
3. Reserve durable quota transactionally before provider work across all instances, with unique logical operation IDs, lease/retry handling, bounded provider retries and global spend cutoffs. Distinguish provider spend accounting from customer credit charging; failed providers do not charge the customer, but abuse failures cannot reset cost controls indefinitely.
4. TTS accepts a committed receipt/opening reference and server-selected voice, with text hash/session binding and cached replay, rather than arbitrary paid text conversion. Pitch analysis accepts a finalized transcript reference; demo-feedback gets an explicit bounded demo capability or a reviewed retirement plan. Transcription uploads get matching bounded session admission.
5. Roll out behind explicit server flags with metrics/shadow admission first, then switch each caller and enforce. Test public homepage, guest/anonymous-auth, paid users, existing session retries, transcription/TTS completion and acknowledged clocks. No state-machine or scenario migration is needed for this security work.

## Validation and local fixture scope

- Security tests: 19 passed (11 PostgreSQL policy/RPC tests, 4 Stripe handler tests, 4 checkout UI tests).
- Full Vitest: 170 passed, 8 opt-in live tests skipped.
- Budget parity: 85/85 through both wrapper/shared-engine paths. Email deterministic tests: 27 passed. Component reliability/debrief tests: 20 passed.
- Real isolated Supabase REST/RPC RLS test: 15/15 using two newly created distinct signed-in Auth users plus public anon and service roles. Unit tests additionally exercise an anonymous-auth-shaped UID and verified-admin policy. Anonymous Auth is disabled in current local config, so no real anonymous-auth signup was manufactured.
- Local Budget integration 30/30; Email 30/30, including live provider turns, owner binding, retries and terminal rejection.
- App and shared server-module TypeScript passed. Build/prerender 10/10. No full remote-import Deno type-check or real Stripe charge was performed; the extracted production handler uses injected Stripe retrieval in tests.
- Public flow source and endpoint/config files are unchanged; existing guest component regressions pass. No fresh manual homepage/voice or retired demo browser test is claimed in this phase.

`tests/security/phase1-fixture.sql` is deliberately test-only. The isolated Docker database previously lacked the two tables/RPC; the fixture created only their minimal reproductions plus a test admin helper before executing the new migration SQL locally. Local fixtures/users remain for repeatability. Never apply this fixture remotely. No historical migration chain or user_login_events repair was attempted.

## Production release dependencies and rollback

1. Verify deployed function/frontend versions and inspect exact target policy/grants, table schemas/constraints and log_security_event signature/owner/EXECUTE grants. Confirm trusted database callers and event consumers. Check for other broad SELECT policies, column INSERT grants, overloaded RPCs or role inheritance not represented in the supplied findings. Stop on mismatch; archive definitions for rollback.
2. This branch inherits unreleased Email code. Do not blindly deploy its complete frontend. Either complete the separately authorized coordinated Email rollout first, or review a narrow security backport against the actual production release. This task authorizes neither production path.
3. Deploy the compatible checkout/client-report frontend in a controlled window with the new diagnostic RPC migration coordinated. The frontend accepts old extra email fields but ignores them; deploy the privacy-safe verify-stripe-session function after that frontend to avoid breaking old signup UI. Force refresh old clients. Apply only the new security migration after prerequisites are verified; do not run all pending migrations. Old clients calling the trusted log RPC will be denied after migration; their best-effort diagnostic reports are intentionally not accepted as audit facts. A planned refresh and monitoring makes this explicit rather than a silent compatibility assumption.
4. Verify owner/admin/service behavior with distinct test users and anon, trusted SQL/server logging, labeled client reporting, valid/invalid Stripe lookups and signup email matching. Confirm guest/public AI, Budget and Email behavior remains unchanged. Migration execution itself changes authorization immediately even before function deployment.
5. Rollback: retain old schema/definitions for diagnosis, but do not restore public audit insertion, broad rate-limit SELECT, trusted audit RPC browser access or leaked email. Use a forward corrective migration if trusted logging has an unexpected dependency. Keep the new RPC while rolling back UI as needed; old UI must not be paired with an email-free endpoint if it requires prefill. Restore a privacy-compatible previous frontend/function pair or temporarily pause only checkout signup while preserving verified purchase handling. Never bulk-reset production or drop audit/session data.

## Remaining findings / release decision

The three scoped fixes are locally validated and ready for controlled release review subject to production preflight and the inherited Email dependency. This is not a claim that all Lovable findings are resolved: paid AI proxy abuse/durable quotas and practice-session score/streak integrity remain open as designed above. Additional audit surfaces include client `security_events` writes (a separate table), report spam limits/retention, bearer checkout lookup reuse, and the existing paid predicate accepting status=complete (unchanged for this email-only privacy fix). A real Stripe sandbox end-to-end payment/webhook run and external demo caller confirmation remain release checks. No Lovable bulk fixes or production scanner rerun was performed.
