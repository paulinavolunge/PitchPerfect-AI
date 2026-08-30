# Fix GA4 coverage so visits are actually counted

## Why analytics show 0

- The live site `pitchperfectai.ai` is served by **Netlify behind Cloudflare** (`x-nf-request-id`, `server: cloudflare`). The Lovable-hosted URL only 302-redirects to the custom domain, so Lovable's native analytics never sees a request. That panel will stay at 0 unless hosting moves — not a tracking bug.
- Google Analytics currently loads **only after** a visitor clicks accept on the cookie banner. Most visitors never do, so GA4 also records almost nothing.

## What to change

Switch GA4 to **Google Consent Mode v2**: the tag loads for everyone on the first page load, but starts in a denied/cookieless state. Google still receives anonymous, cookieless pings, so visitor and pageview counts become real. Accepting the banner upgrades the same tag to full cookie-based measurement (returning-visitor recognition, attribution).

This keeps the site GDPR-compliant — no analytics cookies are written until consent is granted.

### Files

**`src/utils/analytics.ts`**
- Load the gtag script on init regardless of consent (still only on the production hostnames).
- Before `config`, push default consent: `analytics_storage: denied`, `ad_storage: denied`, `ad_user_data: denied`, `ad_personalization: denied`, plus `wait_for_update: 500`.
- Keep `anonymize_ip: true`, `allow_google_signals: false`, `allow_ad_personalization_signals: false`.
- Remove the `hasValidConsent()` early return from `loadGAScript` / `initGA`; keep the production-host guard in `trackPageView` and `trackEvent`.
- `setAnalyticsConsent(true)` now calls `gtag('consent', 'update', { analytics_storage: 'granted' })` instead of being the trigger that loads the script; `setAnalyticsConsent(false)` / `revokeAnalyticsConsent` push an explicit `denied` update.
- `checkAnalyticsConnection()` gains a `consentMode` field ('granted' | 'denied') so the status panel reflects reality.

**`src/components/consent/PrivacyCompliantAnalytics.tsx`**
- Always call `autoInitAnalytics()` and track the initial pageview; drop the `hasValidConsent()` gate.

**`src/hooks/usePageTracking.ts`**
- Drop the consent gate on route-change tracking (consent state is now handled inside gtag, not by suppressing events).

**`src/components/AnalyticsStatusPanel.tsx`**
- Replace the "Analytics consent granted" pass/fail row with a "Consent mode" row showing granted/denied, since denied is now a valid working state.

**`src/components/consent/ConsentBanner.tsx`**
- No behavior change beyond calling the updated consent setters; wording adjusted only if it claims tracking is off entirely.

## Notes

- Lovable's native analytics panel will still read 0 — that requires moving hosting off Netlify, which is out of scope here.
- New GA4 data starts from deploy; it will not backfill the last 30 days.
- After deploying, verify in GA4 Realtime from an incognito window without touching the banner.
