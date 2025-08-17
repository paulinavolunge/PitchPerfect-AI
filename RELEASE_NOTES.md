# Release Notes

- Security hardening
  - Moved all secrets to environment variables (.env); added .env.example
  - Locked CORS for edge functions to production origin via ALLOWED_ORIGINS
  - Enforced JWT verification on Supabase edge functions; optional on email sender for rate limiting
  - Strict CSP updated in vercel.json (no inline/eval; allowed GA script only)
  - Minimized production logging
- Core functionality stability
  - Fixed demo mic stuck on "Listening" by robustly stopping recognition and tracks
  - Stabilized Waitlist email modal to avoid submit flicker and unwanted redirects
  - Enforced light mode only; removed theme switching surface
  - Onboarding flow: retained steps without disappearing; timing improvements
  - Dashboard: safer defaults for new users; prevented crash paths
- Developer experience and CI
  - Added Playwright smoke tests for auth, onboarding, demo mic, dashboard
  - Added unit/integration test placeholders for objection handler and voice pipeline
  - Added GitHub Action to install, build, run tests, and upload Playwright reports on failure
  - Updated Playwright config to read env vars instead of hardcoded keys
