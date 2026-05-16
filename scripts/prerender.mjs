#!/usr/bin/env node
/**
 * scripts/prerender.mjs
 *
 * Post-build static HTML generator. Runs after `vite build`.
 * For each route in SEO_ROUTES, clones dist/index.html, injects
 * correct <title>, <meta>, OG/Twitter tags, canonical URL, and
 * pre-rendered body HTML into #root so crawlers see real content.
 *
 * NO headless browser / puppeteer required — pure string manipulation.
 * React hydrates normally when JS loads in the browser.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = resolve(__dirname, '..');
const DIST    = resolve(ROOT, 'dist');
const BASE    = 'https://www.pitchperfectai.ai';
const OG_IMG  = `${BASE}/og-image.png`;

// ── Escape helper ────────────────────────────────────────────────────────────
const esc = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

// ── Route definitions ────────────────────────────────────────────────────────
/**
 * Each route needs:
 *   path         – URL path (leading slash)
 *   title        – <title> content
 *   description  – <meta name="description">
 *   ogTitle      – og:title (can differ from title — shorter for sharing)
 *   ogDesc       – og:description
 *   body         – HTML string injected into #root before JS hydrates
 */
const SEO_ROUTES = [
  {
    path: '/',
    title: 'PitchPerfect AI — AI Cold Call Practice & Pitch Coach',
    description: 'Practice cold calls with an AI prospect. Get scored instantly. Handle any objection and close more deals — free to start.',
    ogTitle: 'PitchPerfect AI — Practice Cold Calls with AI',
    ogDesc: 'AI roleplay for sales reps. Get scored in 90 seconds. Free to start.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem">
  <header style="margin-bottom:2rem">
    <strong style="font-size:1.2rem;color:#1e3a5f">PitchPerfect AI</strong>
  </header>
  <main>
    <h1 style="font-size:clamp(1.8rem,5vw,3.2rem);font-weight:800;color:#1e293b;line-height:1.15;margin-bottom:1rem">
      Beat the AI prospect. Get scored instantly.
    </h1>
    <p style="font-size:1.15rem;color:#475569;max-width:560px;margin-bottom:2rem">
      Practice cold calls and objection handling in a 90-second AI roleplay. Hear your score, see your gaps, improve every round.
    </p>
    <a href="/signup" style="display:inline-block;background:#2563eb;color:#fff;padding:.85rem 2rem;border-radius:.75rem;font-weight:700;font-size:1.05rem;text-decoration:none;margin-bottom:2.5rem">
      Start free — no credit card
    </a>
    <div style="display:flex;flex-wrap:wrap;gap:1.5rem;margin-bottom:3rem">
      <div style="background:#f1f5f9;border-radius:1rem;padding:1.25rem 1.5rem;flex:1;min-width:200px">
        <div style="font-size:1.5rem;margin-bottom:.5rem">🎙️</div>
        <h2 style="font-size:1rem;font-weight:700;color:#1e293b;margin:0 0 .25rem">AI Roleplay</h2>
        <p style="font-size:.875rem;color:#64748b;margin:0">Face a tough AI prospect and handle real objections in real time.</p>
      </div>
      <div style="background:#f1f5f9;border-radius:1rem;padding:1.25rem 1.5rem;flex:1;min-width:200px">
        <div style="font-size:1.5rem;margin-bottom:.5rem">📊</div>
        <h2 style="font-size:1rem;font-weight:700;color:#1e293b;margin:0 0 .25rem">Instant Scorecard</h2>
        <p style="font-size:.875rem;color:#64748b;margin:0">Get a score out of 100 with specific coaching on what to fix.</p>
      </div>
      <div style="background:#f1f5f9;border-radius:1rem;padding:1.25rem 1.5rem;flex:1;min-width:200px">
        <div style="font-size:1.5rem;margin-bottom:.5rem">🏆</div>
        <h2 style="font-size:1rem;font-weight:700;color:#1e293b;margin:0 0 .25rem">Track Progress</h2>
        <p style="font-size:.875rem;color:#64748b;margin:0">See your streak, avg score, and weakest area improve over time.</p>
      </div>
    </div>
    <p style="font-size:.9rem;color:#94a3b8;text-align:center">
      Used by SDRs, AEs, Sales Managers, and Founders. Free to start. Plans from $4.99.
    </p>
  </main>
</div>`,
  },

  {
    path: '/pricing',
    title: 'Pricing — PitchPerfect AI',
    description: 'Plans start at $4.99. Unlock your scorecard and 5 practice rounds. Go unlimited at $29/mo. No subscription required to get started.',
    ogTitle: 'PitchPerfect AI Pricing — From $4.99',
    ogDesc: 'Unlock your full scorecard for $4.99. Go unlimited at $29/mo. Start free — no credit card needed.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem">
  <main>
    <h1 style="font-size:2.5rem;font-weight:800;color:#1e293b;text-align:center;margin-bottom:.75rem">
      Simple pricing. Start free.
    </h1>
    <p style="text-align:center;color:#64748b;font-size:1.1rem;margin-bottom:2.5rem">
      Plans start at $4.99. No subscription required.
    </p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.25rem">
      <div style="border:1px solid #e2e8f0;border-radius:1rem;padding:1.5rem">
        <h2 style="font-size:1.1rem;font-weight:700;color:#1e293b;margin-bottom:.5rem">Starter</h2>
        <p style="font-size:1.8rem;font-weight:800;color:#1e293b;margin:0 0 1rem"><span>$4.99</span><small style="font-size:.9rem;font-weight:400;color:#64748b"> one-time</small></p>
        <ul style="font-size:.875rem;color:#475569;padding-left:1rem;margin:0 0 1rem">
          <li>Full scorecard unlocked</li>
          <li>5 practice rounds</li>
          <li>AI coaching feedback</li>
        </ul>
      </div>
      <div style="border:2px solid #2563eb;border-radius:1rem;padding:1.5rem;position:relative">
        <span style="position:absolute;top:-12px;left:1rem;background:#2563eb;color:#fff;font-size:.75rem;padding:.2rem .6rem;border-radius:1rem;font-weight:600">Best Value</span>
        <h2 style="font-size:1.1rem;font-weight:700;color:#1e293b;margin-bottom:.5rem">Power</h2>
        <p style="font-size:1.8rem;font-weight:800;color:#1e293b;margin:0 0 1rem"><span>$9.99</span><small style="font-size:.9rem;font-weight:400;color:#64748b"> one-time</small></p>
        <ul style="font-size:.875rem;color:#475569;padding-left:1rem;margin:0 0 1rem">
          <li>Full scorecard unlocked</li>
          <li>15 practice rounds</li>
          <li>AI coaching feedback</li>
        </ul>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:1rem;padding:1.5rem">
        <h2 style="font-size:1.1rem;font-weight:700;color:#1e293b;margin-bottom:.5rem">Unlimited</h2>
        <p style="font-size:1.8rem;font-weight:800;color:#1e293b;margin:0 0 1rem"><span>$29</span><small style="font-size:.9rem;font-weight:400;color:#64748b">/month</small></p>
        <ul style="font-size:.875rem;color:#475569;padding-left:1rem;margin:0 0 1rem">
          <li>Unlimited rounds</li>
          <li>All objection scenarios</li>
          <li>Cancel anytime</li>
        </ul>
      </div>
    </div>
  </main>
</div>`,
  },

  {
    path: '/about',
    title: 'About — PitchPerfect AI',
    description: 'PitchPerfect AI was built for sales reps who want to improve faster. Learn about our mission to make AI-powered sales coaching accessible to everyone.',
    ogTitle: 'About PitchPerfect AI',
    ogDesc: 'Built for sales reps who want to improve faster. AI coaching, real feedback, real results.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:2rem 1rem">
  <main>
    <h1 style="font-size:2.25rem;font-weight:800;color:#1e293b;margin-bottom:1rem">About PitchPerfect AI</h1>
    <p style="font-size:1.1rem;color:#475569;line-height:1.7;margin-bottom:1.5rem">
      PitchPerfect AI was built for sales professionals who want to improve faster than weekly call-coaching allows.
      We believe every rep deserves instant, honest feedback — not just the top performers.
    </p>
    <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin-bottom:1.5rem">
      Our AI prospect is trained to push back like a real buyer: raising budget objections,
      asking hard questions, and hanging up when you're not concise. Get scored after every round.
      See exactly where you improved and where you're losing deals.
    </p>
    <h2 style="font-size:1.4rem;font-weight:700;color:#1e293b;margin-bottom:.75rem">Our mission</h2>
    <p style="font-size:1rem;color:#475569;line-height:1.7">
      Make world-class sales coaching accessible to every rep — not just those with access to great managers.
    </p>
  </main>
</div>`,
  },

  {
    path: '/login',
    title: 'Log In — PitchPerfect AI',
    description: 'Log in to your PitchPerfect AI account to access your practice rounds, scorecard, and coaching history.',
    ogTitle: 'Log in to PitchPerfect AI',
    ogDesc: 'Access your practice rounds, scores, and AI coaching history.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:420px;margin:4rem auto;padding:0 1rem;text-align:center">
  <h1 style="font-size:1.75rem;font-weight:800;color:#1e293b;margin-bottom:.5rem">Welcome back</h1>
  <p style="color:#64748b;margin-bottom:2rem">Log in to continue your practice streak.</p>
  <p><a href="/signup" style="color:#2563eb;text-decoration:none;font-weight:600">Don't have an account? Sign up free →</a></p>
</div>`,
  },

  {
    path: '/signup',
    title: 'Sign Up Free — PitchPerfect AI',
    description: 'Create your free PitchPerfect AI account. Start practicing cold calls with AI in under 2 minutes. No credit card required.',
    ogTitle: 'Sign up free — PitchPerfect AI',
    ogDesc: 'Start practicing cold calls with AI in 2 minutes. No credit card required.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:480px;margin:4rem auto;padding:0 1rem;text-align:center">
  <h1 style="font-size:1.75rem;font-weight:800;color:#1e293b;margin-bottom:.5rem">Create your free account</h1>
  <p style="color:#64748b;margin-bottom:.75rem">Start your first 90-second AI cold-call round today.</p>
  <ul style="list-style:none;padding:0;color:#475569;font-size:.95rem;margin-bottom:2rem;line-height:2">
    <li>✓ AI prospect roleplay — budget, timing, competitor objections</li>
    <li>✓ Score out of 100 after every round</li>
    <li>✓ No credit card required to start</li>
  </ul>
  <p><a href="/login" style="color:#2563eb;text-decoration:none">Already have an account? Log in →</a></p>
</div>`,
  },

  {
    path: '/privacy',
    title: 'Privacy Policy — PitchPerfect AI',
    description: 'Read the PitchPerfect AI Privacy Policy to understand how we collect, use, and protect your personal data.',
    ogTitle: 'Privacy Policy — PitchPerfect AI',
    ogDesc: 'How PitchPerfect AI handles and protects your personal data.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:2rem 1rem">
  <main>
    <h1 style="font-size:2rem;font-weight:800;color:#1e293b;margin-bottom:1rem">Privacy Policy</h1>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      At PitchPerfect AI, we take your privacy seriously. This policy describes how we collect, use, and protect your information.
    </p>
    <h2 style="font-size:1.25rem;font-weight:700;color:#1e293b;margin-bottom:.5rem">What we collect</h2>
    <p style="color:#475569;line-height:1.7">
      We collect account information (name, email), usage data (practice sessions, scores),
      and audio recordings only while you are actively recording a practice round.
      We do not sell your personal data to third parties.
    </p>
  </main>
</div>`,
  },

  {
    path: '/terms',
    title: 'Terms of Service — PitchPerfect AI',
    description: 'Read the PitchPerfect AI Terms of Service. Understand your rights and responsibilities when using our AI-powered sales coaching platform.',
    ogTitle: 'Terms of Service — PitchPerfect AI',
    ogDesc: 'Terms and conditions for using PitchPerfect AI.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:2rem 1rem">
  <main>
    <h1 style="font-size:2rem;font-weight:800;color:#1e293b;margin-bottom:1rem">Terms of Service</h1>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      By using PitchPerfect AI you agree to these terms. Please read them carefully.
    </p>
    <h2 style="font-size:1.25rem;font-weight:700;color:#1e293b;margin-bottom:.5rem">Use of the platform</h2>
    <p style="color:#475569;line-height:1.7">
      PitchPerfect AI is a sales training platform. You may use it for lawful practice and professional development purposes only.
      Accounts are personal and non-transferable.
    </p>
  </main>
</div>`,
  },

  {
    path: '/for-sdrs',
    title: 'PitchPerfect AI for SDRs & BDRs — AI Cold Call Training',
    description: 'SDRs: practice cold-call openers against a tough AI prospect. Get scored on your hook, tone, and objection handling. Beat quota faster.',
    ogTitle: 'PitchPerfect AI for SDRs — Master Cold Calls in 90 Seconds',
    ogDesc: 'Practice cold-call openers with AI. Get scored on your hook, pace, and objection handling.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:2rem 1rem">
  <main>
    <p style="font-size:.875rem;font-weight:600;color:#2563eb;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.75rem">For SDRs &amp; BDRs</p>
    <h1 style="font-size:clamp(1.8rem,5vw,3rem);font-weight:800;color:#1e293b;line-height:1.15;margin-bottom:1rem">
      Stop fumbling the opener. Practice until cold calls feel easy.
    </h1>
    <p style="font-size:1.1rem;color:#475569;max-width:600px;margin-bottom:2rem;line-height:1.7">
      PitchPerfect AI's AI prospect hangs up on weak openers and pushes back hard on budget and timing.
      Get scored after every 90-second round — see exactly where you're losing the conversation.
    </p>
    <a href="/signup" style="display:inline-block;background:#2563eb;color:#fff;padding:.85rem 2rem;border-radius:.75rem;font-weight:700;font-size:1rem;text-decoration:none;margin-bottom:2.5rem">
      Start free — no credit card
    </a>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.25rem;margin-bottom:2.5rem">
      <div style="background:#eff6ff;border-radius:1rem;padding:1.25rem">
        <h2 style="font-size:.95rem;font-weight:700;color:#1e3a8a;margin:0 0 .5rem">Cold-call opener drills</h2>
        <p style="font-size:.85rem;color:#334155;margin:0">Practice your first 15 seconds until they're automatic. AI scores your hook, pace, and confidence.</p>
      </div>
      <div style="background:#eff6ff;border-radius:1rem;padding:1.25rem">
        <h2 style="font-size:.95rem;font-weight:700;color:#1e3a8a;margin:0 0 .5rem">Objection handling</h2>
        <p style="font-size:.85rem;color:#334155;margin:0">"Send me an email." "We already use someone." "Bad timing." Train responses until they're instant.</p>
      </div>
      <div style="background:#eff6ff;border-radius:1rem;padding:1.25rem">
        <h2 style="font-size:.95rem;font-weight:700;color:#1e3a8a;margin:0 0 .5rem">Score out of 100</h2>
        <p style="font-size:.85rem;color:#334155;margin:0">Each round is scored on hook, tone, objection handling, and ask. Track your improvement week by week.</p>
      </div>
    </div>
    <blockquote style="border-left:3px solid #2563eb;padding:.75rem 1.25rem;background:#f8fafc;border-radius:0 .5rem .5rem 0;color:#475569;font-style:italic;font-size:1rem;margin:0">
      "I went from 4% connect-to-meeting rate to 11% in 3 weeks just by drilling my opener every morning."
      <footer style="font-style:normal;font-size:.85rem;color:#64748b;margin-top:.5rem">— SDR, B2B SaaS</footer>
    </blockquote>
  </main>
</div>`,
  },

  {
    path: '/for-founders',
    title: 'PitchPerfect AI for Founders — Practice Your Sales Pitch',
    description: 'Founders doing their own sales: practice discovery calls and pitch objections with AI. Get scored, get feedback, close your first customers faster.',
    ogTitle: 'PitchPerfect AI for Founders — Nail Your First Sales Calls',
    ogDesc: 'Practice discovery calls with AI. Know your pitch cold before talking to your first enterprise buyer.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:2rem 1rem">
  <main>
    <p style="font-size:.875rem;font-weight:600;color:#7c3aed;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.75rem">For Founders</p>
    <h1 style="font-size:clamp(1.8rem,5vw,3rem);font-weight:800;color:#1e293b;line-height:1.15;margin-bottom:1rem">
      Know your pitch cold before the meeting that matters.
    </h1>
    <p style="font-size:1.1rem;color:#475569;max-width:600px;margin-bottom:2rem;line-height:1.7">
      You built the product. Now practice selling it. PitchPerfect AI runs you through discovery calls,
      budget objections, and "we already have a vendor" pushback — so the real call feels like a replay.
    </p>
    <a href="/signup" style="display:inline-block;background:#7c3aed;color:#fff;padding:.85rem 2rem;border-radius:.75rem;font-weight:700;font-size:1rem;text-decoration:none;margin-bottom:2.5rem">
      Start free — no credit card
    </a>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.25rem;margin-bottom:2.5rem">
      <div style="background:#faf5ff;border-radius:1rem;padding:1.25rem">
        <h2 style="font-size:.95rem;font-weight:700;color:#4c1d95;margin:0 0 .5rem">Discovery call practice</h2>
        <p style="font-size:.85rem;color:#334155;margin:0">Learn to ask the right questions before pitching. AI scores your discovery framework and listening ratio.</p>
      </div>
      <div style="background:#faf5ff;border-radius:1rem;padding:1.25rem">
        <h2 style="font-size:.95rem;font-weight:700;color:#4c1d95;margin:0 0 .5rem">Founder-specific objections</h2>
        <p style="font-size:.85rem;color:#334155;margin:0">"You're too early." "We tried something like this." "I need to check with my team." Know your answers cold.</p>
      </div>
      <div style="background:#faf5ff;border-radius:1rem;padding:1.25rem">
        <h2 style="font-size:.95rem;font-weight:700;color:#4c1d95;margin:0 0 .5rem">Instant AI feedback</h2>
        <p style="font-size:.85rem;color:#334155;margin:0">Get scored on talk ratio, filler words, confidence, and closing ask — after every 90-second round.</p>
      </div>
    </div>
    <blockquote style="border-left:3px solid #7c3aed;padding:.75rem 1.25rem;background:#f8fafc;border-radius:0 .5rem .5rem 0;color:#475569;font-style:italic;font-size:1rem;margin:0">
      "I closed my first $50k enterprise deal two weeks after starting to practice with PitchPerfect."
      <footer style="font-style:normal;font-size:.85rem;color:#64748b;margin-top:.5rem">— Founder, Series A startup</footer>
    </blockquote>
  </main>
</div>`,
  },
];

// ── Root-div replacer (depth-tracking, handles arbitrary nesting) ─────────────
/**
 * Vite may place <script> before OR after <div id="root"> depending on version,
 * so we cannot use a "<\/div>(?=\s*<script)" lookahead.
 * Instead, walk the HTML character-by-character tracking <div>/<\/div> depth.
 */
function replaceRootContent(html, newContent) {
  const marker = 'id="root"';
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) {
    console.warn('[prerender] WARNING: id="root" not found in template');
    return html;
  }

  // Walk backwards from the marker to find the opening '<div'
  const divStart = html.lastIndexOf('<div', markerIdx);
  // Find the end of the opening <div ...> tag
  const openTagEnd = html.indexOf('>', markerIdx) + 1;

  // Walk forward tracking nesting depth to find the matching </div>
  let depth = 1;
  let i = openTagEnd;
  while (i < html.length && depth > 0) {
    const nextOpen  = html.indexOf('<div',  i);
    const nextClose = html.indexOf('</div>', i);

    if (nextOpen !== -1 && (nextClose === -1 || nextOpen < nextClose)) {
      depth++;
      i = nextOpen + 4; // skip '<div'
    } else if (nextClose !== -1) {
      depth--;
      if (depth === 0) {
        const end = nextClose + '</div>'.length;
        return (
          html.slice(0, divStart) +
          `<div id="root">\n${newContent}\n</div>` +
          html.slice(end)
        );
      }
      i = nextClose + '</div>'.length;
    } else {
      break; // malformed HTML guard
    }
  }

  console.warn('[prerender] WARNING: could not find closing </div> for #root');
  return html;
}

// ── Template manipulation helpers ─────────────────────────────────────────────

function buildOgBlock(route) {
  const url = `${BASE}${route.path}`;
  return `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="PitchPerfect AI" />
    <meta property="og:title" content="${esc(route.ogTitle)}" />
    <meta property="og:description" content="${esc(route.ogDesc)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${OG_IMG}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(route.ogTitle)}" />
    <meta name="twitter:description" content="${esc(route.ogDesc)}" />
    <meta name="twitter:image" content="${OG_IMG}" />`.trim();
}

function processTemplate(template, route) {
  let html = template;

  // 1. Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(route.title)}</title>`);

  // 2. Replace meta description
  html = html.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${esc(route.description)}" />`
  );

  // 3. Replace canonical
  const canonicalUrl = `${BASE}${route.path}`;
  html = html.replace(
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // 4. Replace all OG + Twitter meta (strip existing, inject fresh block)
  html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
  // Inject after </title>
  html = html.replace('</title>', `</title>\n    ${buildOgBlock(route)}`);

  // 5. Replace #root content with prerendered body HTML (depth-aware)
  html = replaceRootContent(html, route.body.trim());

  return html;
}

// ── Main ─────────────────────────────────────────────────────────────────────
(function main() {
  const templatePath = resolve(DIST, 'index.html');
  let template;

  try {
    template = readFileSync(templatePath, 'utf-8');
  } catch {
    console.error(`[prerender] ERROR: ${templatePath} not found. Run "npm run build" first.`);
    process.exit(1);
  }

  let count = 0;
  const errors = [];

  for (const route of SEO_ROUTES) {
    try {
      const html = processTemplate(template, route);

      if (route.path === '/') {
        // Root: overwrite dist/index.html in place
        writeFileSync(templatePath, html, 'utf-8');
        console.log(`[prerender] /  → dist/index.html`);
      } else {
        // Sub-routes: create dist/<path>/index.html
        const dirPath = resolve(DIST, ...route.path.slice(1).split('/'));
        mkdirSync(dirPath, { recursive: true });
        const outFile = resolve(dirPath, 'index.html');
        writeFileSync(outFile, html, 'utf-8');
        console.log(`[prerender] ${route.path}  → dist${route.path}/index.html`);
      }
      count++;
    } catch (err) {
      errors.push(`${route.path}: ${err.message}`);
    }
  }

  console.log(`\n[prerender] ✓ ${count}/${SEO_ROUTES.length} routes prerendered.`);
  if (errors.length) {
    console.error('[prerender] Errors:');
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
  }
})();
