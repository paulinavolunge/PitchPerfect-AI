# Verify GA4 is now counting visitors

## Status already confirmed
- The Consent Mode v2 fix is deployed: the live bundle at pitchperfectai.ai contains the new consent-default code (`wait_for_update`).
- The Lovable More > Analytics panel will permanently show 0 — the site is served by Netlify/Cloudflare, so Lovable's tracker never sees requests. This is expected, not a bug.

## Steps
1. Generate a real test visit: load https://pitchperfectai.ai in a fresh browser profile (no consent click) and confirm a `page_view` ping goes to google-analytics.com with `gcs`/`gcd` consent parameters showing denied state.
2. You then check GA4 > Reports > Realtime: the visit should appear within ~1 minute as a cookieless user.
3. Check GA4 standard reports tomorrow — they lag 24–48h and only include data from the deploy date onward.

## Optional decision (not included unless you ask)
- Move hosting from Netlify to Lovable so the native Lovable analytics panel also works. This would replace the current Netlify/Cloudflare setup (custom headers, prerender redirects, edge caching) and is a separate, larger change.

## If Realtime shows nothing after step 1–2
- Then we debug: check the GA4 measurement ID (G-HVCRJT504Y) matches the property you're viewing, and confirm no ad blocker filtered the test.
