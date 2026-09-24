# Generalization Phase 2 — Send Me an Email

Phase 1 was fast-forwarded and pushed to main at ef6e32e2ebbdb2445c391141b36a2fcbd9c3f940. The Email work remains an uncommitted local diff. No production deployment or database migration was performed.

## Scope and policy

Only standard Send Me an Email joins Budget in the server-owned registry. Keisha Odom is the canonical Office Manager at a construction supply company; her canonical opening is reused. Time pressure is the primary constraint, and lack of purchasing authority is the sole secondary complication. No other standard scenario or public Cold Call route is migrated.

Email config starts at patience 65, interest 15, trust 25, relevance 15. Anchored classifications select deterministic bounded deltas. Respecting time and asking one relevant concise question earn engagement; generic pitches, ignored objections, burdensome questions, rambling, unsupported claims and repeated asks lose ground. Immediate unearned email-only compliance ends the call. A relevant next step requires at least four turns, trust 55, relevance 55, interest 40 and a resolved objection. Six turns, 120 seconds of accounted activity, 15 seconds of inactivity, aggression and accumulated poor behavior retain deterministic terminal enforcement.

The shared reducer, session engine, adapter, activity-clock implementation and Budget policy are unchanged. Email uses the existing capability hashing, receipts, atomic versions, server-owned transcript, typed failure and terminal/debrief handling. Existing budget-prefixed wire fields are deliberately retained for protocol compatibility; they do not imply that Email uses Budget policy.

## Persistence and rollout

The new email_prospect_sessions table isolates scenario storage and capabilities. Its migration enables RLS, denies public/anon/authenticated access, and grants service_role only SELECT/INSERT/UPDATE/DELETE. The migration SQL was exercised only in the isolated local QA database. No unrelated migration was run.

Production rollout is not performed or authorized by this work. Before release, review the migration, apply only the Email migration, verify schema/RLS/grants, and coordinate deployment of roleplay-ai-response with the matching frontend. Old Email browser clients lack the session capability and fail safely against the new route; a client refresh/controlled release window is required. Do not release the frontend ahead of its schema/function. Retain the Phase 1 function/frontend artifacts for rollback and preserve Email session data rather than dropping the table during rollback.

## Validation

- Email deterministic policy/protocol tests: 27 passed.
- Budget golden parity: 85 cases match through both wrappers and shared engine; fixtures and golden unchanged.
- Full Vitest: 150 passed, 8 opt-in live tests skipped.
- Dedicated live provider tests: Budget 4 passed; Email 4 passed.
- Isolated Supabase: Budget 30/30; Email 30/30. Email reused the existing harness with its scenario identifier and table changed; its inherited success label still says Budget.
- Application and shared server-module TypeScript: passed.
- Build/prerender: 10/10 routes.
- Local browser Email TEXT: canonical opening at Round 0/patience 65; one submitted rep turn; contextual Keisha reply at Round 1/patience 69; one persisted receipt and one user transcript entry. Subsequent inactivity persisted HUNG_UP without adding an accepted turn.
- Real Email microphone/VOICE acceptance: not yet run. Existing Budget voice acceptance is not counted as Email voice evidence.

Live classification initially mislabeled a single question as many_questions. Email-only classifier instructions were clarified with classification examples (not canned dialogue); the dedicated live cases and browser turn then passed. Provider classifications remain probabilistic and should be monitored in controlled release smoke tests.

No known shared-engine or Budget regression was found. Production acceptance still requires controlled release checks, including real Email voice playback. Generated MCP output is excluded from the change.
