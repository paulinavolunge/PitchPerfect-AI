# Release Notes

## Summary
- Stabilized Playwright config for local/CI, ensured alias resolution via vite-tsconfig-paths
- Removed lovable-tagger to resolve Vite peer conflicts
- Added Netlify security headers (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Introduced Lighthouse CI workflow against production
- Ensured testing utilities export screen from RTL

## How to Roll Back
- Revert vite.config.ts to previous plugin list if needed
- Remove netlify.toml headers to restore previous behavior
- Disable Lighthouse workflow by deleting .github/workflows/lighthouse.yml

## Verification
- Run: npm ci && npm run build
- Run e2e: npx playwright test
- Check Playwright report in playwright-report/
- Verify headers in production response via browser DevTools -> Network -> Headers
