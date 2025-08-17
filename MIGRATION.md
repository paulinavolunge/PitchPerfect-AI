# Migration Guide

This document describes the required environment and deployment steps to run PitchPerfect AI securely.

## 1. Environment variables

Create a `.env` file at the repository root based on `.env.example`:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_ALLOWED_ORIGINS (typically https://pitchperfectai.ai)
- ALLOWED_ORIGINS (for Supabase Edge functions; same as above)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- OPENAI_API_KEY
- RESEND_API_KEY
- Optional CRM webhooks: VITE_ZAPIER_WEBHOOK_URL, VITE_HUBSPOT_WEBHOOK_URL, VITE_SALESFORCE_WEBHOOK_URL, VITE_FRESHSALES_WEBHOOK_URL, VITE_CUSTOM_WEBHOOK_URL

Notes:
- Do not commit `.env` to version control.
- In CI, configure the corresponding repository secrets.

## 2. Supabase functions

Edge functions expect the following runtime env in the Supabase project:
- ALLOWED_ORIGINS
- SUPABASE_URL
- SUPABASE_ANON_KEY
- OPENAI_API_KEY
- RESEND_API_KEY

Deploy all functions:

```bash
npx supabase functions deploy all
```

## 3. CSP and CORS

- Vercel deployment uses `vercel.json` headers with a strict CSP. Ensure external resources are whitelisted.
- Netlify uses `netlify.toml` headers. Adjust if deploying there.

## 4. Running locally

```bash
npm ci
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run dev
```

## 5. CI

GitHub Actions workflow `.github/workflows/tests.yml` requires the following repository secrets:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

The workflow will: install deps, build, run unit/integration tests, install Playwright, run Playwright, and upload the report on failure.