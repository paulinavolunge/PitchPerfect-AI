import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, Phone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import LazyLoadManager from '@/components/optimized/LazyLoadManager';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { Helmet } from 'react-helmet-async';
import { trackEvent } from '@/utils/analytics';
import { useAuth } from '@/context/AuthContext';

const Footer = lazy(() => import('@/components/Footer'));
const PricingCTA = lazy(() => import('@/components/PricingCTA'));
const ColdCallHook = lazy(() => import('@/components/ColdCallHook'));

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('pp-visible');
          obs.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const Reveal: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ref = useReveal();
  return <div ref={ref} className={`pp-reveal ${className}`}>{children}</div>;
};

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [coldCallOpen, setColdCallOpen] = useState(false);
  const [pendingUnlockSessionId, setPendingUnlockSessionId] = useState<string | null>(null);
  const coldCallUsed = typeof window !== 'undefined' && !!localStorage.getItem('pp_cold_call_used');
  const coldCallLocked = coldCallUsed && !user;
  const coldCallLabel = coldCallLocked ? 'Get Started Free' : 'Try a cold call — free, no signup';

  // Check for an unfinished Stripe purchase whose buyer skipped the
  // /scorecard-unlock signup step. If they're still anonymous, surface
  // a sticky banner so they can finish setup. If they've since logged
  // in, silently clear the flag.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('pp_pending_unlock_session_id');
    } catch {
      return;
    }
    if (!stored) {
      setPendingUnlockSessionId(null);
      return;
    }
    if (user) {
      try { localStorage.removeItem('pp_pending_unlock_session_id'); } catch {}
      setPendingUnlockSessionId(null);
      return;
    }
    setPendingUnlockSessionId(stored);
  }, [user]);

  // Auto-open the cold call dialog when visitors arrive via ?cta=cold-call.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('cta') === 'cold-call') {
      if (coldCallLocked) {
        navigate('/login', { replace: true });
        return;
      }
      setColdCallOpen(true);
      trackEvent('cta_click', { button: 'try_cold_call', location: 'pricing_redirect' });
      // Strip the query param so reloads / back-navigation don't keep re-opening
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Scroll to anchor sections (e.g. #pricing) on load and on hash change.
  // Lazy-loaded sections may not be in the DOM yet, so retry briefly.
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts++ < 20) {
        setTimeout(tryScroll, 100);
      }
    };
    tryScroll();
  }, [location.hash]);

  const handleColdCallClick = () => {
    if (coldCallLocked) {
      trackEvent('cta_click', { button: 'cold_call_locked_signup', location: 'homepage_hero' });
      navigate('/login');
      return;
    }
    trackEvent('cta_click', { button: 'try_cold_call', location: 'homepage_hero' });
    setColdCallOpen(true);
  };

  const handleGetStartedClick = () => {
    trackEvent('cta_click', { button: 'practice_free', location: 'homepage_hero' });
    navigate('/practice');
  };

  const handleWatchDemoClick = () => {
    trackEvent('cta_click', { button: 'see_how_it_works', location: 'homepage_hero' });
    navigate('/demo');
  };

  const handleSeePricingClick = () => {
    trackEvent('cta_click', { button: 'see_pricing', location: 'homepage_hero' });
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>PitchPerfect AI - Stop Losing Deals Because You Weren't Ready</title>
        <meta name="description" content="Go head-to-head with AI buyers who push back with real objections. Get scored in 30 seconds. Close more deals. Free round — no signup required." />
        <meta name="keywords" content="sales rounds, cold call challenge, AI buyer, objection handling, sales skills, close more deals, revenue enablement" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pitchperfectai.ai/" />
        <meta property="og:title" content="PitchPerfect AI - Stop Losing Deals Because You Weren't Ready" />
        <meta property="og:description" content="Go head-to-head with AI buyers who fight back. Get scored in 30 seconds. Free round — no signup." />
        <meta property="og:image" content="https://pitchperfectai.ai/og-image.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://pitchperfectai.ai/" />
        <meta property="twitter:title" content="PitchPerfect AI - Stop Losing Deals Because You Weren't Ready" />
        <meta property="twitter:description" content="Go head-to-head with AI buyers who fight back. Get scored in 30 seconds. Free round — no signup." />
        <meta property="twitter:image" content="https://pitchperfectai.ai/og-image.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "PitchPerfect AI",
            "applicationCategory": "BusinessApplication",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "127" },
            "description": "AI cold call challenge that pushes back with real objections so you crush your next deal."
          })}
        </script>
      </Helmet>

      <div className="min-h-screen pp-page">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        {pendingUnlockSessionId && (
          <div className="sticky top-0 z-[60] bg-emerald-500 text-gray-900 text-sm font-semibold px-4 py-2.5 shadow-md">
            <div className="max-w-5xl mx-auto flex items-center justify-center gap-3 text-center">
              <span>You have a purchase waiting — finish setup to unlock your rounds.</span>
              <button
                type="button"
                onClick={() => navigate(`/scorecard-unlock?session_id=${encodeURIComponent(pendingUnlockSessionId)}`)}
                className="underline underline-offset-2 hover:text-gray-700 whitespace-nowrap"
              >
                Finish setup →
              </button>
            </div>
          </div>
        )}
        <Navbar />

        <main>
          {/* ═══════════ HERO ═══════════ */}
          <section id="main-content" className="pp-hero" role="main" aria-labelledby="hero-heading" data-onboarding="hero">
            <div className="pp-container">
              <div className="pp-hero-grid">
                {/* Left column */}
                <div>
                  <div className="pp-hero-badge">
                    <span className="pp-badge-dot" />
                    TRUSTED BY SALES REPS WHO HATE LOSING DEALS
                  </div>
                  <h1 id="hero-heading" className="pp-hero-h1">
                    Bomb cold calls in private, not on real prospects.
                  </h1>
                  <p className="pp-hero-sub">
                    Practice cold opens and objection handling against AI buyers that push back like the real thing. Get scored in 90 seconds. Pick up the phone Monday without the dread.
                  </p>
                  <div className="pp-hero-cta-row">
                    <button className="pp-btn-primary pp-btn-lg" onClick={handleColdCallClick}>
                      <Phone className="h-4 w-4" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                      {coldCallLabel}
                    </button>
                    <button className="pp-btn-ghost" onClick={handleSeePricingClick}>
                      See pricing →
                    </button>
                  </div>
                  <div className="pp-hero-trust-badges">
                    <span className="pp-trust-badge-item">🎙 No voice recordings stored</span>
                    <span className="pp-trust-badge-item">⚡ Score in 90 seconds</span>
                    <span className="pp-trust-badge-item">🆓 Free demo, no card</span>
                  </div>
                </div>

                {/* Right column — product mockup */}
                <div className="pp-mockup-wrapper">
                  <div className="pp-mockup-card">
                    <div className="pp-mockup-topbar">
                      <div className="pp-dot pp-dot-r" />
                      <div className="pp-dot pp-dot-y" />
                      <div className="pp-dot pp-dot-g" />
                      <span className="pp-mockup-title">PitchPerfect AI — Cold Call Round</span>
                    </div>
                    <div className="pp-mockup-body">
                      <div className="pp-bubble pp-bubble-ai">
                        <span className="pp-bubble-label">🤖 Skeptical VP of Procurement</span>
                        We already have a vendor for this. I don't see why I should take another meeting. What makes you different?
                      </div>
                      <div className="pp-bubble pp-bubble-user">
                        <span className="pp-bubble-label">Your Response</span>
                        I completely understand — the last thing I want to do is waste your time. The reason companies like yours switch is...
                      </div>
                      <div className="pp-mockup-input">
                        <span>Type your response or tap the mic...</span>
                        <div className="pp-mic-btn">
                          <Mic className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Floating score card */}
                  <div className="pp-score-card">
                    <div className="pp-score-label">Session Score</div>
                    <div className="pp-score-num">7.4<span>/10</span></div>
                    <div className="pp-score-bar"><div className="pp-score-fill" /></div>
                    <div className="pp-score-feedback">
                      ✓ Strong opening acknowledgment<br />
                      △ Didn't address competitor directly<br />
                      ✓ Good transition to value prop
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Testimonials ── */}
              <div className="pp-hero-testimonials">
                <div className="pp-testimonial-track">
                  {([
                    {
                      initials: 'JM',
                      color: '#2563EB',
                      quote: "I was winging every cold call opener. After two weeks of reps on PitchPerfect, I booked 7 meetings in a row. The AI doesn't let you off easy.",
                      name: 'Jake M.',
                      role: 'SDR',
                      company: 'Series B SaaS',
                      li: 'https://linkedin.com',
                    },
                    {
                      initials: 'SK',
                      color: '#7C3AED',
                      quote: "The 'we already have a vendor' objection used to end my calls. I ran it on PitchPerfect until I had three solid responses cold. Game changer.",
                      name: 'Sara K.',
                      role: 'Account Executive',
                      company: 'B2B Tech',
                      li: 'https://linkedin.com',
                    },
                    {
                      initials: 'MT',
                      color: '#0F766E',
                      quote: "Had my whole SDR team do 5 rounds before Monday call blitz. Connect-to-meeting went 6% → 11% that week. It's now a standing ritual.",
                      name: 'Marcus T.',
                      role: 'Sales Manager',
                      company: 'Enterprise Software',
                      li: 'https://linkedin.com',
                    },
                  ] as const).map((t, i) => (
                    <div key={i} className="pp-testimonial-card">
                      <p className="pp-testimonial-quote">"{t.quote}"</p>
                      <div className="pp-testimonial-footer">
                        <div className="pp-testimonial-avatar" style={{ background: t.color }}>
                          {t.initials}
                        </div>
                        <div className="pp-testimonial-meta-text">
                          <div className="pp-testimonial-name">{t.name}</div>
                          <div className="pp-testimonial-role">{t.role} · {t.company}</div>
                        </div>
                        <a
                          href={t.li}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pp-testimonial-li"
                          aria-label={`${t.name} on LinkedIn`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════ TRUST BAR ═══════════ */}
          <div className="pp-trust-bar">
            <div className="pp-container pp-trust-inner">
              <div className="pp-trust-item"><span>🏢</span> Listed in <strong>Lohfeld Consulting</strong> AI Guide — $170B+ in proposals won</div>
              <div className="pp-trust-item"><span>🔒</span> 100% Private — No manager dashboards</div>
              <div className="pp-trust-item"><span>🚀</span> Featured on <strong>Product Hunt</strong></div>
            </div>
          </div>

          {/* ═══════════ CHATGPT COMPARISON ═══════════ */}
          <Reveal>
            <section className="pp-section pp-comparison" id="compare">
              <div className="pp-container">
                <div className="text-center" style={{ marginBottom: 8 }}>
                  <div className="pp-section-label">Why not ChatGPT?</div>
                  <h2 className="pp-section-title">This Isn't ChatGPT With a Sales Prompt.</h2>
                  <p className="pp-section-sub mx-auto">ChatGPT agrees with you, goes off-topic, and never pushes back. PitchPerfect AI runs structured sales scenarios with a scoring engine. You get a score, not a pep talk.</p>
                </div>
                <div className="pp-comp-grid">
                  <div className="pp-comp-card pp-comp-chatgpt">
                    <div className="pp-comp-label">💬 ChatGPT Response</div>
                    <div className="pp-comp-msg pp-comp-msg-chatgpt">
                      "That's a great pitch! You're doing really well. Here are some tips to consider: try to be more empathetic, use the prospect's name, and remember to ask open-ended questions. Keep it up! 😊"
                    </div>
                    <div className="pp-comp-verdict pp-verdict-bad">✗ Generic advice. No pushback. No score.</div>
                  </div>
                  <div className="pp-comp-card pp-comp-ppai">
                    <div className="pp-comp-label pp-comp-label-ppai">⚡ PitchPerfect AI Response</div>
                    <div className="pp-comp-msg pp-comp-msg-ppai">
                      "We already use another vendor and we're happy with them. I've got a board meeting in 20 minutes. Give me one concrete reason I should keep listening instead of hanging up."
                    </div>
                    <div className="pp-comp-verdict pp-verdict-good">✓ Realistic pushback. Scored 7.4/10. Specific feedback.</div>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          {/* ═══════════ HOW IT WORKS ═══════════ */}
          <Reveal>
            <section className="pp-section" id="how-it-works">
              <div className="pp-container">
                <div className="text-center">
                  <div className="pp-section-label">How it works</div>
                  <h2 className="pp-section-title">Three steps. Ten minutes. Ready for anything.</h2>
                  <p className="pp-section-sub mx-auto">No setup. No tutorials. Pick a scenario, battle-test, get your score.</p>
                </div>
                <div className="pp-steps-grid">
                  {[
                    { n: '1', title: 'Pick Your Scenario', text: 'Cold call, pricing objection, demo close, gatekeeper bypass — choose the exact conversation you need to nail.' },
                    { n: '2', title: 'Spar With a Tough Buyer', text: 'Type or use your mic. The AI pushes back with realistic objections — no softballs, because your prospects won\'t throw softballs.' },
                    { n: '3', title: 'Get Scored & Improve', text: 'See your 1-10 performance score with specific notes on what worked, what didn\'t, and what to say differently next time.' },
                  ].map((s) => (
                    <div key={s.n} className="pp-step-card">
                      <div className="pp-step-num">{s.n}</div>
                      <h3 className="pp-step-title">{s.title}</h3>
                      <p className="pp-step-text">{s.text}</p>
                    </div>
                  ))}
                </div>
                <div className="text-center" style={{ marginTop: 40 }}>
                  <button className="pp-btn-primary pp-btn-lg" onClick={handleGetStartedClick}>
                    Try It Free — Pick Your First Scenario →
                  </button>
                </div>
              </div>
            </section>
          </Reveal>

          {/* ═══════════ SCENARIOS ═══════════ */}
          <Reveal>
            <section className="pp-section pp-scenarios">
              <div className="pp-container">
                <div className="text-center">
                  <div className="pp-section-label">Real sales scenarios</div>
                  <h2 className="pp-section-title">Battle-Test the Exact Call You're About to Make.</h2>
                  <p className="pp-section-sub mx-auto">Not generic communication tips. Real sales scenarios designed around the conversations that make or break your month.</p>
                </div>
                <div className="pp-scenario-grid">
                  {[
                    { icon: '🎯', title: 'Cold Call — First 30 Seconds', text: 'Get past "I\'m not interested" and earn the meeting. Battle-test your opener and handle instant rejection.' },
                    { icon: '💰', title: 'Pricing Objection', text: 'Handle "That\'s too expensive" without flinching. Battle-test value framing and avoiding the discount trap.' },
                    { icon: '🎤', title: 'Demo Close', text: 'Ask for the business when the demo goes well. Battle-test trial closes and handling "let me think about it."' },
                    { icon: '🚪', title: 'Gatekeeper Bypass', text: 'Get past the front desk to the decision-maker with assertive-but-respectful techniques that work.' },
                  ].map((s, i) => (
                    <div key={i} className="pp-scenario-card">
                      <div className="pp-scenario-icon">{s.icon}</div>
                      <h3 className="pp-scenario-title">{s.title}</h3>
                      <p className="pp-scenario-text">{s.text}</p>
                    </div>
                  ))}
                </div>
                <div className="text-center" style={{ marginTop: 40 }}>
                  <button className="pp-btn-outline" onClick={() => navigate('/practice')}>
                    Start With Any Scenario — Free →
                  </button>
                </div>
              </div>
            </section>
          </Reveal>

          {/* ═══════════ LIVE DEMO MOCKUP ═══════════ */}
          <Reveal>
            <section className="pp-section pp-demo-section">
              <div className="pp-container">
                <div className="text-center">
                  <div className="pp-section-label">See it in action</div>
                  <h2 className="pp-section-title">Here's What a Real Session Looks Like.</h2>
                  <p className="pp-section-sub mx-auto">A pricing objection round — from pushback to score — in under 3 minutes.</p>
                </div>
                <div className="pp-demo-window">
                  <div className="pp-demo-topbar">
                    <div className="pp-demo-dot pp-demo-dot-red" />
                    <div className="pp-demo-dot pp-demo-dot-yellow" />
                    <div className="pp-demo-dot pp-demo-dot-green" />
                  </div>
                  <div className="pp-demo-body">
                    <div className="pp-demo-label">
                      <span className="pp-demo-live-dot" />
                      Live Round — Pricing Objection
                    </div>
                    <div className="pp-chat-bubble pp-bubble-prospect">
                      <span className="pp-chat-label pp-chat-label-prospect">AI Prospect</span>
                      "Honestly, this is way more than we budgeted. We were thinking more like half that. Can you do better on price?"
                    </div>
                    <div className="pp-chat-bubble pp-bubble-you">
                      <span className="pp-chat-label pp-chat-label-you">You</span>
                      "I understand budget is a priority. Before we talk numbers — what would the cost be if your team keeps losing 3-4 deals a month to the same objections?"
                    </div>
                    <div className="pp-chat-bubble pp-bubble-prospect">
                      <span className="pp-chat-label pp-chat-label-prospect">AI Prospect</span>
                      "That's a fair point, but my CFO is going to want to see hard numbers. What ROI are other clients seeing?"
                    </div>
                    <div className="pp-chat-bubble pp-bubble-you">
                      <span className="pp-chat-label pp-chat-label-you">You</span>
                      "Absolutely — I'll walk you through two case studies from teams your size. But first, is budget the only thing standing between us and a decision?"
                    </div>
                    <div className="pp-demo-score-inline">
                      <div className="pp-demo-score-num">7.4</div>
                      <div className="pp-demo-score-detail">
                        <h4>Session Score</h4>
                        <p>Strong reframe on value. Good isolating question at the end. Work on: providing the proof faster — the prospect asked twice.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          {/* ═══════════ FAQ / OBJECTIONS ═══════════ */}
          <Reveal>
            <section className="pp-section" id="faq">
              <div className="pp-container">
                <div className="text-center">
                  <div className="pp-section-label">Straight answers</div>
                  <h2 className="pp-section-title">You're Skeptical. Good — That Means You're a Real Salesperson.</h2>
                </div>
                <div className="pp-objection-grid">
                  {[
                    { q: "I don't have time for this.", a: "A session takes under 10 minutes. That's less time than replaying a call you lost in your head on the drive home." },
                    { q: "Will this actually help me close more?", a: "You battle-test against realistic objections before the real call. You walk in prepared instead of winging it. Preparation beats talent when talent doesn't prepare." },
                    { q: "Why not just use ChatGPT?", a: "ChatGPT won't push back, won't score you, and won't run structured scenarios. It gives advice. We give reps. There's a difference between reading about pushups and doing them." },
                    { q: "$29/month seems like a lot.", a: "It's less than the commission on one deal you'd lose by freezing on an objection you never battle-tested. One closed deal pays for years of PitchPerfect AI." },
                    { q: "I've been selling for 15 years.", a: "The AI adapts. Veterans get harder pushback — multi-layered objections, misdirections, the kind of thing a VP of Procurement throws at you. This sharpens the edge, not teaches the basics." },
                    { q: "What if I try it and it's not for me?", a: "Free first session. No credit card. Under 10 minutes. If it doesn't help, you've lost nothing except a few minutes." },
                  ].map((faq, i) => (
                    <div key={i} className="pp-objection-card">
                      <div className="pp-objection-q">
                        <span className="pp-q-badge">Q</span>
                        "{faq.q}"
                      </div>
                      <p className="pp-objection-a">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </Reveal>

          {/* ═══════════ PRICING ═══════════ */}
          <Reveal>
            <section className="pp-section pp-pricing-section" id="pricing">
              <div className="pp-container">
                <div className="text-center">
                  <div className="pp-section-label">Simple pricing</div>
                  <h2 className="pp-section-title">Less Than One Lost Commission.</h2>
                  <p className="pp-section-sub mx-auto">Your first session is free. After that, invest less than the price of a lunch meeting.</p>
                </div>
                <div className="pp-pricing-grid">
                  {/* Tier 1 — $4.99 one-time (Most Popular) */}
                  <div className="pp-price-card pp-price-featured">
                    <div className="pp-price-badge">Most Popular</div>
                    <div className="pp-price-name">Starter Pack</div>
                    <div className="pp-price-amount">$4.99<span> one-time</span></div>
                    <p className="pp-price-desc">Unlock your full scorecard + 5 rounds</p>
                    <ul className="pp-price-features">
                      <li>Unlock full scorecard</li>
                      <li>5 practice rounds</li>
                      <li>All sales scenarios</li>
                      <li>Voice + text input</li>
                    </ul>
                    <button className="pp-btn-primary pp-btn-full" onClick={() => { window.location.href = 'https://buy.stripe.com/cNifZjcsR2YadjI68W5sA00'; }}>
                      Unlock Scorecard — $4.99 →
                    </button>
                  </div>
                  {/* Tier 2 — $9.99 one-time */}
                  <div className="pp-price-card">
                    <div className="pp-price-name">Power Pack</div>
                    <div className="pp-price-amount">$9.99<span> one-time</span></div>
                    <p className="pp-price-desc">15 rounds + full scorecard every time</p>
                    <ul className="pp-price-features">
                      <li>15 practice rounds</li>
                      <li>Full scorecard every time</li>
                      <li>All sales scenarios</li>
                      <li>Voice + text input</li>
                    </ul>
                    <button className="pp-btn-outline pp-btn-full" onClick={() => { window.location.href = 'https://buy.stripe.com/14AfZjboN9myenM2WK5sA01'; }}>
                      Get 15 Rounds — $9.99 →
                    </button>
                  </div>
                  {/* Tier 3 — $29/mo Solo */}
                  <div className="pp-price-card">
                    <div className="pp-price-name">Solo</div>
                    <div className="pp-price-amount">$29<span>/mo</span></div>
                    <p className="pp-price-desc">Unlimited rounds · cancel anytime</p>
                    <ul className="pp-price-features">
                      <li>Unlimited rounds</li>
                      <li>All sales scenarios</li>
                      <li>Voice + text input</li>
                      <li>AI voice responses</li>
                      <li>1–10 scoring with feedback</li>
                      <li>Progress dashboard</li>
                    </ul>
                    <button className="pp-btn-outline pp-btn-full" onClick={() => { window.location.href = 'https://buy.stripe.com/14A14pakJ7eq4NceFs5sA02'; }}>
                      Go Unlimited — $29/mo →
                    </button>
                  </div>
                  {/* Tier 4 — $49/seat/mo Team */}
                  <div className="pp-price-card">
                    <div className="pp-price-name">Team</div>
                    <div className="pp-price-amount">$49<span>/seat/mo</span></div>
                    <p className="pp-price-desc">For sales teams (3-seat minimum)</p>
                    <ul className="pp-price-features">
                      <li>Everything in Solo</li>
                      <li>Team management dashboard</li>
                      <li>Custom team scenarios</li>
                      <li>Onboarding support</li>
                      <li>Priority support</li>
                    </ul>
                    <button className="pp-btn-outline pp-btn-full" onClick={() => { window.location.href = 'mailto:sales@pitchperfectai.ai?subject=Team Plan Inquiry'; }}>
                      Contact for Team Access
                    </button>
                  </div>
                </div>
                <p className="text-center" style={{ marginTop: 20, fontSize: 13, color: 'var(--pp-text-muted)' }}>
                  Cancel anytime · Free first session on all plans
                </p>
              </div>
            </section>
          </Reveal>

          {/* ═══════════ FOUNDER ═══════════ */}
          <Reveal>
            <section className="pp-section pp-founder-section">
              <div className="pp-container">
                <div className="pp-founder-inner">
                  <div className="pp-founder-avatar">P</div>
                  <div>
                    <p className="pp-founder-text">
                      I built PitchPerfect AI because I spent years as an Account Executive, handling objections on hundreds of sales calls and learning the hard way that preparation beats talent. Every rep deserves a sparring partner that tells them the truth — not a chatbot that says "great job."
                    </p>
                    <div className="pp-founder-name">Paulina Vol — Founder</div>
                    <div className="pp-founder-role">Former Account Executive · 5+ years in B2B sales</div>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          {/* ═══════════ FINAL CTA ═══════════ */}
          <section className="pp-final-cta">
            <div className="pp-container text-center">
              <h2>Your next deal is this week.<br />Are you walking in cold?</h2>
              <p>One round against the AI. That's all it takes to feel the difference.<br />No signup, no credit card, no one watching.</p>
              <button className="pp-btn-primary pp-btn-lg" onClick={handleColdCallClick}>
                <Phone className="h-4 w-4" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                {coldCallLabel}
              </button>
              <div className="pp-hero-micro" style={{ justifyContent: 'center', color: '#64748B', marginTop: 16 }}>
                <span>✓ No signup required</span>
                <span>✓ No credit card</span>
                <span>✓ Under 2 minutes</span>
              </div>
            </div>
          </section>

          {/* ═══════════ FOOTER ═══════════ */}
          <LazyLoadManager priority="low">
            <Footer />
          </LazyLoadManager>

          {/* Mobile sticky CTA */}
          <div className="pp-mobile-cta">
            <button className="pp-btn-primary pp-btn-full" onClick={handleColdCallClick}>
              <Phone className="h-4 w-4" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              {coldCallLabel}
            </button>
          </div>
        </main>
        <div className="h-[72px] md:hidden" />
      </div>

      {/* Cold Call Hook Modal */}
      <Suspense fallback={null}>
        {coldCallOpen && (
          <ColdCallHook open={coldCallOpen} onOpenChange={setColdCallOpen} />
        )}
      </Suspense>
    </>
  );
};

export default Index;
