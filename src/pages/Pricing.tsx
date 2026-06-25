import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';
import TrustStrip from '@/components/pricing/TrustStrip';
import BillingToggle from '@/components/pricing/BillingToggle';
import PricingFAQ from '@/components/pricing/PricingFAQ';
import ComparisonTable from '@/components/pricing/ComparisonTable';
import { STRIPE, SOLO, TEAM } from '@/lib/pricing';

/**
 * Pricing page — four-tier ladder:
 * $4.99 one-time → $9.99 one-time → $29/mo Solo → $49/seat/mo Team.
 * Annual toggle reduces Solo to $23/mo and Team to $39/seat/mo.
 * Billing period persists in ?billing=annual query param.
 */
const Pricing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAnnual = searchParams.get('billing') === 'annual';

  const handleBillingChange = (annual: boolean) => {
    setSearchParams(annual ? { billing: 'annual' } : {}, { replace: true });
  };

  const solo = isAnnual ? SOLO.annual : SOLO.monthly;
  const team = isAnnual ? TEAM.annual : TEAM.monthly;

  return (
    <>
      <Helmet>
        <title>Pricing. PitchPerfect AI</title>
        <meta
          name="description"
          content="Solo $29/mo. Team $49/seat/mo. 7-day money-back guarantee. Cancel anytime in one click."
        />
        <link rel="canonical" href="https://www.pitchperfectai.ai/pricing" />
        <meta property="og:title" content="PitchPerfect AI Pricing. Solo, Team & Pay-As-You-Go" />
        <meta property="og:description" content="Solo $29/mo, Team $49/seat/mo, or one-time packs from $4.99. 7-day money-back guarantee." />
        <meta property="og:url" content="https://www.pitchperfectai.ai/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.pitchperfectai.ai/assets/logo-pitchperfectai.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PitchPerfect AI Pricing. Solo, Team & Pay-As-You-Go" />
        <meta name="twitter:description" content="Solo $29/mo, Team $49/seat/mo, or one-time packs from $4.99. 7-day money-back guarantee." />
        <meta name="twitter:image" content="https://www.pitchperfectai.ai/assets/logo-pitchperfectai.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Will my voice recordings be stored?",
              "acceptedAnswer": { "@type": "Answer", "text": "No. We process audio in-session and discard it. We never use your voice for training." }
            },
            {
              "@type": "Question",
              "name": "Can I cancel anytime?",
              "acceptedAnswer": { "@type": "Answer", "text": "Yes. One click in your account settings. No questions, no retention dance." }
            },
            {
              "@type": "Question",
              "name": "How is this different from Gong or Chorus?",
              "acceptedAnswer": { "@type": "Answer", "text": "Gong analyzes real calls after they happen. We let you practice before the call so the real call is the second time you've heard those objections, not the first." }
            },
            {
              "@type": "Question",
              "name": "What's the difference between Starter Pack and Solo?",
              "acceptedAnswer": { "@type": "Answer", "text": "Starter Pack is one-time ($4.99), perfect for trying the product or a one-off interview prep. Solo is a subscription with unlimited practice, built for reps who practice daily." }
            },
            {
              "@type": "Question",
              "name": "Why is there a 3-seat minimum on Team?",
              "acceptedAnswer": { "@type": "Answer", "text": "The Team tier includes a manager dashboard and team analytics, features that only make sense with multiple reps. For solo practice, pick Solo at $29/mo." }
            },
            {
              "@type": "Question",
              "name": "Is there a free version?",
              "acceptedAnswer": { "@type": "Answer", "text": "Yes. Your first session is free, no signup required. After that, Starter Pack at $4.99 is the lowest-commitment way to unlock your full scorecard." }
            }
          ]
        })}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        <main className="flex-grow px-4 py-16">
          <div className="max-w-5xl mx-auto">

            {/* ── Header ── */}
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                Simple pricing. Cancel anytime.
              </h1>
              <p className="text-base sm:text-lg text-gray-700 font-medium max-w-xl mx-auto">
                Less than one lost commission. Practice for free. Upgrade when you're ready to take it seriously.
              </p>
              <TrustStrip />
            </div>

            {/* ── Billing toggle ── */}
            <BillingToggle isAnnual={isAnnual} onChange={handleBillingChange} />

            {/* ── Tier cards ── */}
            <h2 className="sr-only">Pricing plans</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">


              {/* Tier 1 — $4.99 one-time */}
              <div className="relative bg-white rounded-2xl border-2 border-emerald-500 shadow-lg p-6 flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Starter Pack</p>
                <p className="text-3xl font-black text-gray-900 mb-1">$4.99</p>
                <p className="text-xs text-gray-600 mb-4">one-time · no subscription</p>
                <ul className="text-sm text-gray-700 space-y-2 flex-grow list-none p-0 mb-4">
                  <li>✓ Unlock full scorecard</li>
                  <li>✓ 5 practice rounds</li>
                  <li>✓ All sales scenarios</li>
                  <li>✓ Voice + text input</li>
                </ul>
                <p className="text-xs text-gray-600 italic mb-4">Less than a coffee. Worth one practice session.</p>
                <a
                  href={STRIPE.starter}
                  className="block w-full text-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 transition-colors"
                >
                  Unlock Scorecard for $4.99
                </a>
              </div>

              {/* Tier 2 — $9.99 one-time */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                <p className="text-sm font-semibold text-gray-500 mb-1">Power Pack</p>
                <p className="text-3xl font-black text-gray-900 mb-1">$9.99</p>
                <p className="text-xs text-gray-600 mb-4">one-time · no subscription</p>
                <ul className="text-sm text-gray-700 space-y-2 flex-grow list-none p-0 mb-4">
                  <li>✓ 15 practice rounds</li>
                  <li>✓ Full scorecard every time</li>
                  <li>✓ All sales scenarios</li>
                  <li>✓ Voice + text input</li>
                </ul>
                <p className="text-xs text-gray-600 italic mb-4">Less than a fast-food lunch. 15 real reps.</p>
                <a
                  href={STRIPE.power}
                  className="block w-full text-center rounded-xl border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 transition-colors"
                >
                  Get 15 Rounds for $9.99
                </a>
              </div>

              {/* Tier 3 — Solo (price changes with toggle) */}
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                {isAnnual && solo.saveBadge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {solo.saveBadge}
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-500 mb-1">Solo</p>
                <div className="mb-1">
                  <span className="text-3xl font-black text-gray-900">{solo.amount}</span>
                  <span className="text-base text-gray-600 font-normal">{solo.period}</span>
                </div>
                <p className="text-xs text-gray-600 mb-4">{solo.subtext}</p>
                <ul className="text-sm text-gray-700 space-y-2 flex-grow list-none p-0 mb-4">
                  <li>✓ Unlimited rounds</li>
                  <li>✓ All sales scenarios</li>
                  <li>✓ Voice + text input</li>
                  <li>✓ AI voice responses</li>
                  <li>✓ 1–10 scoring with feedback</li>
                  <li>✓ Progress dashboard</li>
                </ul>
                <p className="text-xs text-gray-600 italic mb-4">One booked meeting per month covers the entire year.</p>
                <a
                  href={STRIPE.solo}
                  className="block w-full text-center rounded-xl border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 transition-colors"
                >
                  {solo.ctaLabel}
                </a>
              </div>

              {/* Tier 4 — Team (price changes with toggle) */}
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                {isAnnual && team.saveBadge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {team.saveBadge}
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-500 mb-1">Team</p>
                <div className="mb-1">
                  <span className="text-3xl font-black text-gray-900">{team.amount}</span>
                  <span className="text-base text-gray-600 font-normal">{team.period}</span>
                </div>
                <p className="text-xs text-gray-600 mb-4">{team.subtext}</p>
                <ul className="text-sm text-gray-700 space-y-2 flex-grow list-none p-0 mb-4">
                  <li>✓ Everything in Solo</li>
                  <li>✓ Manager dashboard</li>
                  <li>✓ Custom team scenarios</li>
                  <li>✓ Onboarding support</li>
                  <li>✓ Priority support</li>
                </ul>
                <p className="text-xs text-gray-600 italic mb-4">Breaks even at one extra deal per rep per quarter.</p>
                <a
                  href="mailto:sales@pitchperfectai.ai?subject=Team Plan Inquiry"
                  className="block w-full text-center rounded-xl border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 transition-colors"
                >
                  Contact for Team Access
                </a>
              </div>
            </div>

            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-8">
              Cancel anytime · Free first session on all plans
            </p>

            <h2 className="sr-only">Frequently asked questions</h2>
            <PricingFAQ />
            <h2 className="sr-only">Plan comparison</h2>
            <ComparisonTable />

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Pricing;
