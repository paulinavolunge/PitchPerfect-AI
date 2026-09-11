# Phase 2A — Simulator reliability

Status: **PASS — Phase 2A reliability validation completed on 2026-09-10.**

## Architecture decisions

- Every roleplay request carries a session ID and stable logical turn ID.
- The Edge Function returns an explicit success or typed failure result.
- Model calls time out after 30 seconds through `AbortController`.
- A failed prospect request is shown as a recoverable failed turn. It is not rendered as dialogue and does not advance rounds, reduce patience, start scoring, or consume a credit.
- Retry keeps the original turn ID and rep message. An immediate in-flight guard prevents repeated clicks from creating concurrent retry requests.
- Attempt and session guards reject stale results before they can mutate the conversation.
- Opening-call failures use the same visible recovery state and never become synthetic prospect dialogue.
- Ending an unresolved failure produces the existing explicitly unscored debrief and does not persist or charge the attempt.

## Failure types

`MODEL_ERROR`, `MODEL_TIMEOUT`, `NETWORK_ERROR`, `INVALID_RESPONSE`, `TRANSCRIPTION_ERROR`, and `TTS_ERROR` are supported categories. User-facing text omits provider details.

## Timeout and retry rules

- Model timeout: 30 seconds.
- Retry is user-triggered; there is no automatic retry.
- Retry count starts at zero and increments for each attempt against the same logical turn.
- Reset aborts the request, invalidates the active attempt, and creates a new session ID.

## Telemetry schema

`roleplay_turn_succeeded` and `roleplay_turn_failed` include `session_id`, `turn_id`, `scenario`, `input_mode`, `success`, `error_type`, `retry_count`, `model_latency_ms`, and `total_ai_response_latency_ms`.

The failed voice-capture event includes `session_id`, `input_mode`, and `error_type`. Transcription telemetry includes recording MIME type, blob size, recording duration, transcription latency, HTTP status, and error type. TTS latency is not currently returned by the voice API, so `tts_latency_ms` remains unavailable. Raw audio and spoken content are not included.

## VALIDATION RESULTS

The focused deterministic tests validate successful responses, typed failure handling, retry success, retry failure, rapid repeat-click suppression, stable turn IDs, unchanged round and patience after failure, no attempt/credit call after failure, stale-attempt/session rejection, opening failure behavior, unscored failure termination, quota recovery, voice transcription failure/retry behavior, all six scripted scenarios, and success/failure telemetry. The production build passes.

The supplied desktop Chrome recording after the OpenAI account was funded confirms working voice capture, transcription, prospect responses, ordered transcript, correct round progression through Round 3, and normal continuation. Live calls to the six roleplay scenarios and pitch analysis also returned valid responses. Phase 2A is therefore upgraded to PASS. Voice timing fields that the provider does not expose remain documented limitations.

## TEST RESULTS

- Focused Phase 2A Vitest: 18 passed, 0 failed, 0 skipped on the last successful run.
- Repository-wide Vitest: 26 passed across 5 files, 0 failed, 0 skipped on the last successful run. One additional quota-recovery test was added afterward; it is covered by the focused test source and was not included in that last repository-wide count because the final rerun hit the Codex usage limit.
- Production build and prerender: passed; 10 of 10 routes prerendered.
- Existing Playwright desktop Chromium smoke tests: 0 passed, 3 failed. The failures are stale assertions for old homepage/demo copy and routing and do not exercise Phase 2A.
- Live endpoint checks: all six scripted roleplay scenarios returned non-empty prospect responses; pitch analysis returned a valid analysis and score.

The original Vitest startup error was caused by the Codex filesystem sandbox denying esbuild traversal while loading `vitest.config.ts`. Running the unchanged repository configuration outside that sandbox succeeds. No repository-wide Vitest configuration fix was needed.

## CHROME QA RESULTS

Installed Google Chrome exists on the host, and the local app loads successfully in the available in-app Chromium browser. The automation connector did not expose the installed Chrome profile. The `/practice` route requires an authenticated account, while the available browser session was unauthenticated.

| Scenario | Selection and scripted opener | Successful/failure turn contract | Authenticated Chrome end-to-end |
|---|---:|---:|---:|
| Budget | Passed | Passed | Passed by live endpoint and supplied Chrome recording evidence |
| Think About It | Passed | Passed | Passed by live endpoint evidence |
| Send Me an Email | Passed | Passed | Passed by live endpoint evidence |
| Using a Competitor | Passed | Passed | Passed by live endpoint evidence |
| Bad Timing | Passed | Passed | Passed by live endpoint evidence |
| Loop in Team | Passed | Passed | Passed by live endpoint evidence |

Text-mode failure and recovery behavior passed deterministic component testing. Voice failure, retry, patience pause, and transcription telemetry passed deterministic tests; the supplied Chrome recording also showed successful spoken input and response.

## KNOWN ENVIRONMENT LIMITATIONS

- The connected desktop automation surface exposes only the Codex in-app browser, not the installed Chrome profile. The supplied recording provides manual Chrome evidence instead.
- Playwright browsers were initially absent. Chromium was installed during validation; the existing smoke suite then reached the app but failed on unrelated stale assertions.
- Provider TTS latency is not exposed, so `tts_latency_ms` cannot currently be populated.
- This workspace copy contains no `.git` directory, so a native `git diff` cannot be produced.

## REGRESSIONS FOUND

- A stale roleplay attempt could finish after a newer attempt and still execute its caller's state updates.
- Rapid Retry clicks could enter the callback more than once before React committed the disabled state.
- Turn telemetry used `latency_ms` and omitted explicit success, error, retry, model-latency, and total-latency fields required by the validation contract.

The existing Playwright smoke suite also has stale product-copy and route expectations. Those failures predate and are unrelated to Phase 2A, so they were not changed.

## REGRESSIONS FIXED

- Added active-attempt plus session matching before committing a result.
- Added a synchronous in-flight request guard.
- Preserved and incremented retry count for the same logical turn.
- Added the complete roleplay success/failure telemetry field set.
- Added deterministic component tests for the failure/retry UI and all six scripted scenario openings.
- Added persistent voice transcription failure recovery, patience pause during recording/processing, safe transcription error classification, and deterministic voice/quota tests.

## REMAINING BLOCKERS

1. Deploy the validated local changes through the normal release process when explicitly authorized; no deployment was performed during this audit.
2. Add provider-side TTS latency if the voice service exposes it in a future revision.

## Root-cause incident

The earlier desktop and mobile failures correlated with the OpenAI account reaching a zero prepaid balance. `voice-to-text`, `roleplay-ai-response`, and `pitch-analysis` returned HTTP 500 while the balance was exhausted. After the account was funded, the supplied Chrome recording showed normal transcription and roleplay behavior. The unrelated CSP warnings for the Perplexity font and Cloudflare beacon were blocked third-party assets and did not cause the simulator failure.

## Deployment configuration

No new Supabase secrets or hosting settings are required. No production deployment was performed.
