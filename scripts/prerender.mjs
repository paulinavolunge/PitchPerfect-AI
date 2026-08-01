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
const BASE    = 'https://pitchperfectai.ai';
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

    <section aria-labelledby="pp-faq-heading" style="margin-top:3.5rem;padding-top:2rem;border-top:1px solid #e2e8f0">
      <h2 id="pp-faq-heading" style="font-size:1.8rem;font-weight:800;color:#1e293b;text-align:center;margin-bottom:.5rem">Frequently asked questions</h2>
      <p style="text-align:center;color:#64748b;margin-bottom:1.75rem">Everything reps ask before their first round.</p>

      <h3 style="font-size:1.05rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">How does PitchPerfect AI cold call practice actually work?</h3>
      <p style="color:#475569;line-height:1.7;margin:0 0 1rem">You pick a scenario, hit record, and start talking to an AI prospect that pushes back like a real buyer. Rounds run about 90 seconds. When you finish, you get a score out of 100 with specific coaching on your hook, tone, objection handling, and closing ask.</p>

      <h3 style="font-size:1.05rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">Do I need to sign up or add a card to try it?</h3>
      <p style="color:#475569;line-height:1.7;margin:0 0 1rem">No. Your first cold call round is free with no signup and no credit card. You only create an account when you want to unlock your full scorecard, save history, or run more rounds.</p>

      <h3 style="font-size:1.05rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">What objections can the AI prospect throw at me?</h3>
      <p style="color:#475569;line-height:1.7;margin:0 0 1rem">The standard set that kills real deals: "send me an email," "we already use someone," "not a good time," "no budget," "just email me the deck," "call me back next quarter." You can also pick scenario packs for cold outbound, discovery, and pricing pushback.</p>

      <h3 style="font-size:1.05rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">How is my score calculated?</h3>
      <p style="color:#475569;line-height:1.7;margin:0 0 1rem">Every round is scored on four things: your opener hook, your tone and pace, how you handled the objection, and whether you asked for the next step. Each is graded 1&ndash;25, summed to a score out of 100. The scorecard also flags filler words, talk-to-listen ratio, and where you lost the prospect.</p>

      <h3 style="font-size:1.05rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">Is this only for SDRs, or does it work for AEs and founders too?</h3>
      <p style="color:#475569;line-height:1.7;margin:0 0 1rem">Both. SDRs use it for cold-call openers and quick objection reps. AEs use it for discovery frameworks and pricing conversations. Founders use it to practice their pitch before their first enterprise call.</p>

      <h3 style="font-size:1.05rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">Can my manager or team see my scores?</h3>
      <p style="color:#475569;line-height:1.7;margin:0 0 1rem">Not by default. Individual scores stay private on Solo plans. On Team plans, an admin dashboard shows aggregate progress but not per-round transcripts unless you share.</p>

      <h3 style="font-size:1.05rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">What happens to my voice recordings after a round?</h3>
      <p style="color:#475569;line-height:1.7;margin:0 0 1rem">Audio is processed to produce the score and coaching, then discarded by default. It is never sold, never used to train third-party models, and never shared outside the round.</p>

      <h3 style="font-size:1.05rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">How is this different from watching sales training on YouTube?</h3>
      <p style="color:#475569;line-height:1.7;margin:0 0 1rem">Videos teach frameworks. PitchPerfect makes you run the reps. You will fumble the same objection four times in a row before it clicks &mdash; which is exactly how muscle memory forms.</p>
    </section>

    <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"How does PitchPerfect AI cold call practice actually work?","acceptedAnswer":{"@type":"Answer","text":"You pick a scenario, hit record, and start talking to an AI prospect that pushes back like a real buyer. Rounds run about 90 seconds. When you finish, you get a score out of 100 with specific coaching on your hook, tone, objection handling, and closing ask."}},{"@type":"Question","name":"Do I need to sign up or add a card to try it?","acceptedAnswer":{"@type":"Answer","text":"No. Your first cold call round is free with no signup and no credit card. You only create an account when you want to unlock your full scorecard, save history, or run more rounds."}},{"@type":"Question","name":"What objections can the AI prospect throw at me?","acceptedAnswer":{"@type":"Answer","text":"The standard set that kills real deals: send me an email, we already use someone, not a good time, no budget, just email me the deck, call me back next quarter. You can also pick scenario packs for cold outbound, discovery, and pricing pushback."}},{"@type":"Question","name":"How is my score calculated?","acceptedAnswer":{"@type":"Answer","text":"Every round is scored on four things: your opener hook, your tone and pace, how you handled the objection, and whether you asked for the next step. Each is graded 1 to 25, summed to a score out of 100. The scorecard also flags filler words, talk-to-listen ratio, and where you lost the prospect."}},{"@type":"Question","name":"Is this only for SDRs, or does it work for AEs and founders too?","acceptedAnswer":{"@type":"Answer","text":"Both. SDRs use it for cold-call openers and quick objection reps. AEs use it for discovery frameworks and pricing conversations. Founders use it to practice their pitch before their first enterprise call."}},{"@type":"Question","name":"Can my manager or team see my scores?","acceptedAnswer":{"@type":"Answer","text":"Not by default. Individual scores stay private on Solo plans. On Team plans, an admin dashboard shows aggregate progress but not per-round transcripts unless you share."}},{"@type":"Question","name":"What happens to my voice recordings after a round?","acceptedAnswer":{"@type":"Answer","text":"Audio is processed to produce the score and coaching, then discarded by default. It is never sold, never used to train third-party models, and never shared outside the round."}},{"@type":"Question","name":"How is this different from watching sales training on YouTube?","acceptedAnswer":{"@type":"Answer","text":"Videos teach frameworks. PitchPerfect makes you run the reps. You will fumble the same objection four times in a row before it clicks, which is exactly how muscle memory forms."}}]}</script>
  </main>
</div>`,
  },

  {
    path: '/pricing',
    title: 'Pricing — PitchPerfect AI',
    description: 'Solo $29/mo. Team $49/seat/mo. 7-day money-back guarantee. Cancel anytime in one click.',
    ogTitle: 'PitchPerfect AI Pricing — Solo $29/mo · Team $49/seat/mo',
    ogDesc: 'Solo $29/mo. Team $49/seat/mo. 7-day money-back guarantee. Cancel anytime in one click.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem">
  <main>
    <h1 style="font-size:2.5rem;font-weight:800;color:#1e293b;text-align:center;margin-bottom:.75rem">
      Simple pricing. Cancel anytime.
    </h1>
    <p style="text-align:center;color:#64748b;font-size:1.1rem;margin-bottom:2.5rem">
      Practice for free. Upgrade when you're ready to take it seriously.
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
    <p style="font-size:1.15rem;color:#475569;line-height:1.7;margin-bottom:1.5rem">
      PitchPerfect AI is a sales coaching tool for reps who want to improve faster than weekly manager
      call-coaching allows. Every SDR, AE, and founder deserves instant, honest feedback &mdash; not just
      the top performers who already get manager time.
    </p>

    <h2 style="font-size:1.4rem;font-weight:700;color:#1e293b;margin:2rem 0 .75rem">Why this exists</h2>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      Most sales training is broken in the same way: you watch a great AE on YouTube handle an objection,
      you nod, and then the next time you hear "just send me an email" on a real call, you freeze anyway.
      Watching is not practice. Practice is doing the reps until the words come out without thinking.
    </p>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      The problem is that live practice is expensive. Roleplaying with a manager takes their calendar time
      and your ego. Roleplaying with a peer feels awkward and never happens. Recording your real calls and
      grading them is slow and skips the "try again immediately" step where learning actually happens.
    </p>
    <p style="color:#475569;line-height:1.7;margin-bottom:1.5rem">
      PitchPerfect AI closes that loop. You practice against an AI prospect that pushes back like a real
      buyer, get scored in seconds, and try the same objection again with your ego intact.
    </p>

    <h2 style="font-size:1.4rem;font-weight:700;color:#1e293b;margin:2rem 0 .75rem">How the AI prospect works</h2>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      The AI is trained on real B2B objection patterns: budget, timing, incumbent vendor, decision-maker
      access, and the classic "just email me." It will raise second-order objections when you fumble the
      first one, hang up when you go on too long, and reward concise, specific answers with warmer replies.
      It is intentionally not a chatbot that says "great job." If you were vague, it will call you vague.
    </p>

    <h2 style="font-size:1.4rem;font-weight:700;color:#1e293b;margin:2rem 0 .75rem">Who this is for</h2>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      SDRs and BDRs drilling cold-call openers and objection responses. AEs sharpening discovery frameworks,
      pricing conversations, and pushback on procurement. Founders who are doing their own selling and want
      to know their pitch cold before their first enterprise call. And sales managers who want their team
      running reps between one-on-ones instead of only during them.
    </p>

    <h2 style="font-size:1.4rem;font-weight:700;color:#1e293b;margin:2rem 0 .75rem">What PitchPerfect AI is not</h2>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      It is not a call recording tool for grading your real prospect calls after the fact. It is not a
      script generator that writes your outbound email for you. It is not a manager dashboard for scoring
      your team. Those are useful tools, but they do not replace the reps. What PitchPerfect does is give
      you a safe place to be bad at the thing you want to be good at, until you are not bad at it anymore.
    </p>

    <h2 style="font-size:1.4rem;font-weight:700;color:#1e293b;margin:2rem 0 .75rem">Our mission</h2>
    <p style="color:#475569;line-height:1.7">
      Make world-class sales coaching accessible to every rep &mdash; not just those with great managers,
      big training budgets, or the confidence to roleplay in front of coworkers.
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
    path: '/compare',
    title: 'PitchPerfect AI vs Enterprise Sales Training Tools',
    description: 'Most AI sales roleplay tools are built for sales orgs buying seats for a whole team. See what changes when the tool is built for one rep instead.',
    ogTitle: 'PitchPerfect AI vs Enterprise Sales Training Tools',
    ogDesc: 'No demo call, no seat minimum, no manager dashboard. Built for the rep, not the sales org.',
    body: `
<div style="font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:2rem 1rem">
  <main>
    <h1 style="font-size:clamp(1.8rem,4.5vw,2.6rem);font-weight:800;color:#1e293b;line-height:1.2;margin-bottom:1rem">
      Why not an enterprise sales tool instead?
    </h1>
    <p style="font-size:1.1rem;color:#475569;line-height:1.7;margin-bottom:1.75rem">
      Most AI sales roleplay tools are built for VPs of Sales buying seats for a whole team, with a demo
      call before you even get to try it. Your next objection is not waiting for a sales cycle. Here is
      what changes when it is built for one rep instead, starting right now.
    </p>

    <h2 style="font-size:1.35rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">Getting started: minutes, not weeks</h2>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      PitchPerfect gives you a free cold call round in 90 seconds. No signup, no credit card, no calendar
      invite for a "quick 30-minute discovery call" from an SDR trying to sell you the tool. Most enterprise
      training platforms require a demo call first, then wait days for a slot, then a pilot proposal.
      You are trying to get better at sales, not sit through someone else's pitch.
    </p>

    <h2 style="font-size:1.35rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">Pricing: month-to-month, not annual contracts</h2>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      Solo is $29/month. Cancel in one click from your account page. Team is $49/seat/month with a 3-seat
      minimum. Most enterprise sales training tools require a custom quote, an annual contract, and a
      procurement review. If you are the rep, or a founder doing your own sales, that pricing is a
      non-starter before the tool has even proved it works for you.
    </p>

    <h2 style="font-size:1.35rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">Who sees your scores</h2>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      On Solo, just you. Your scores stay on your account and are never pushed to a manager dashboard by
      default. Most team-focused training tools put your scores on a leaderboard the second you sign in,
      which changes what practice feels like. You will not push through a bad round you needed to hear if
      you know your manager sees it in real time.
    </p>

    <h2 style="font-size:1.35rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">Built for the rep, not the sales org</h2>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      Roleplaying objections live in a room of coworkers is nerve-wracking, not something a VP shopping
      for a training platform worries about. Most tools in this space are built to be sold to a sales org:
      a manager watching a dashboard, a demo call before you can try it, a contract sized for a whole team,
      weeks before anyone actually gets to practice. PitchPerfect skips all of that. You find out if it
      helps you in the time it takes to make one practice call, not a 30-minute sales pitch for a tool
      that is supposed to help you sell.
    </p>

    <h2 style="font-size:1.35rem;font-weight:700;color:#1e293b;margin:1.5rem 0 .5rem">When an enterprise tool is the right fit</h2>
    <p style="color:#475569;line-height:1.7;margin-bottom:1rem">
      If you are already inside a sales org with budget for an enterprise platform, a manager who wants
      to track the whole team, and an ops function to run rollout, those tools might be the right fit.
      If you are the rep who wants to stop freezing on the same objection, on your own time, with no one
      else seeing your scores &mdash; that is who this is built for.
    </p>

    <p style="font-weight:600;color:#2563eb;margin-top:1.5rem">
      Try your first round free, right now. No demo call required.
    </p>
    <a href="/signup" style="display:inline-block;background:#2563eb;color:#fff;padding:.85rem 2rem;border-radius:.75rem;font-weight:700;font-size:1rem;text-decoration:none;margin-top:.75rem">
      Start free &mdash; no credit card
    </a>
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
