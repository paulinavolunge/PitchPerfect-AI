import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';

const STARTER_URL = 'https://buy.stripe.com/cNifZjcsR2YadjI68W5sA00';
const POWER_URL = 'https://buy.stripe.com/14AfZjboN9myenM2WK5sA01';
const SOLO_URL = 'https://buy.stripe.com/14A14pakJ7eq4NceFs5sA02';

/**
 * Pricing page — shows the full four-tier ladder in the same order as ScorePaywall:
 * $4.99 (one-time) → $9.99 (one-time) → $29/mo (Solo) → $49/seat/mo (Team).
 *
 * The /pricing route is retained for external links, SEO, and bookmarks.
 */
const Pricing = () => {
  return (
    <>
      <Helmet>
        <title>Pricing — PitchPerfect AI</title>
        <meta
          name="description"
          content="Plans start at $4.99. Unlock your scorecard and 5 practice rounds for a one-time payment, or go unlimited at $29/mo. No subscription required."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        <main className="flex-grow px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                Simple pricing. Start free.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Plans start at $4.99. No subscription required.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Tier 1 — $4.99 one-time */}
              <div className="relative bg-white rounded-2xl border-2 border-emerald-500 shadow-lg p-6 flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Starter Pack</p>
                <p className="text-3xl font-black text-gray-900 mb-1">$4.99</p>
                <p className="text-xs text-gray-400 mb-4">one-time · no subscription</p>
                <ul className="text-sm text-gray-700 space-y-2 mb-6 flex-grow list-none p-0">
                  <li>✓ Unlock full scorecard</li>
                  <li>✓ 5 practice rounds</li>
                  <li>✓ All sales scenarios</li>
                  <li>✓ Voice + text input</li>
                </ul>
                <a
                  href={STARTER_URL}
                  className="block w-full text-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 transition-colors"
                >
                  Unlock Scorecard — $4.99
                </a>
              </div>

              {/* Tier 2 — $9.99 one-time */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                <p className="text-sm font-semibold text-gray-500 mb-1">Power Pack</p>
                <p className="text-3xl font-black text-gray-900 mb-1">$9.99</p>
                <p className="text-xs text-gray-400 mb-4">one-time · no subscription</p>
                <ul className="text-sm text-gray-700 space-y-2 mb-6 flex-grow list-none p-0">
                  <li>✓ 15 practice rounds</li>
                  <li>✓ Full scorecard every time</li>
                  <li>✓ All sales scenarios</li>
                  <li>✓ Voice + text input</li>
                </ul>
                <a
                  href={POWER_URL}
                  className="block w-full text-center rounded-xl border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 transition-colors"
                >
                  Get 15 Rounds — $9.99
                </a>
              </div>

              {/* Tier 3 — $29/mo Solo */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                <p className="text-sm font-semibold text-gray-500 mb-1">Solo</p>
                <div className="mb-1">
                  <span className="text-3xl font-black text-gray-900">$29</span>
                  <span className="text-base text-gray-400 font-normal">/mo</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">unlimited rounds · cancel anytime</p>
                <ul className="text-sm text-gray-700 space-y-2 mb-6 flex-grow list-none p-0">
                  <li>✓ Unlimited rounds</li>
                  <li>✓ All sales scenarios</li>
                  <li>✓ Voice + text input</li>
                  <li>✓ AI voice responses</li>
                  <li>✓ 1–10 scoring with feedback</li>
                  <li>✓ Progress dashboard</li>
                </ul>
                <a
                  href={SOLO_URL}
                  className="block w-full text-center rounded-xl border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 transition-colors"
                >
                  Go Unlimited — $29/mo
                </a>
              </div>

              {/* Tier 4 — $49/seat/mo Team */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                <p className="text-sm font-semibold text-gray-500 mb-1">Team</p>
                <div className="mb-1">
                  <span className="text-3xl font-black text-gray-900">$49</span>
                  <span className="text-base text-gray-400 font-normal">/seat/mo</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">3-seat minimum</p>
                <ul className="text-sm text-gray-700 space-y-2 mb-6 flex-grow list-none p-0">
                  <li>✓ Everything in Solo</li>
                  <li>✓ Manager dashboard</li>
                  <li>✓ Custom team scenarios</li>
                  <li>✓ Onboarding support</li>
                  <li>✓ Priority support</li>
                </ul>
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
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Pricing;
