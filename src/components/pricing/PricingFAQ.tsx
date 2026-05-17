import React from 'react';

const FAQS = [
  {
    q: 'Will my voice recordings be stored?',
    a: 'No. We process audio in-session and discard it. We never use your voice for training.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — one click in your account settings. No questions, no retention dance.',
  },
  {
    q: 'How is this different from Gong or Chorus?',
    a: "Gong analyzes real calls after they happen. We let you practice before the call so the real call is the second time you've heard those objections, not the first.",
  },
  {
    q: "What's the difference between Starter Pack and Solo?",
    a: 'Starter Pack is one-time ($4.99) — perfect for trying the product or a one-off interview prep. Solo is a subscription with unlimited practice — built for reps who practice daily.',
  },
  {
    q: 'Why is there a 3-seat minimum on Team?',
    a: 'The Team tier includes a manager dashboard and team analytics — features that only make sense with multiple reps. For solo practice, pick Solo at $29/mo.',
  },
  {
    q: 'Is there a free version?',
    a: 'Yes. Your first session is free, no signup required. After that, Starter Pack at $4.99 is the lowest-commitment way to unlock your full scorecard.',
  },
] as const;

const PricingFAQ: React.FC = () => (
  <section className="mt-16 max-w-2xl mx-auto" aria-label="Frequently asked questions">
    <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Common questions</h2>
    <div className="space-y-2">
      {FAQS.map(({ q, a }) => (
        <details
          key={q}
          className="group bg-white border border-gray-200 rounded-xl px-5 py-4 open:shadow-sm transition-shadow"
        >
          <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden font-semibold text-gray-900 text-sm">
            {q}
            <span
              className="ml-4 text-gray-400 group-open:rotate-45 transition-transform duration-200 text-xl leading-none flex-shrink-0 inline-block"
              aria-hidden
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">{a}</p>
        </details>
      ))}
    </div>
  </section>
);

export default PricingFAQ;
