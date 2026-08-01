import React from 'react';

type QA = { q: string; a: string };

const FAQS: QA[] = [
  {
    q: 'How does PitchPerfect AI cold call practice actually work?',
    a: 'You pick a scenario, hit record, and start talking to an AI prospect that pushes back like a real buyer. Rounds run about 90 seconds. When you finish, you get a score out of 100 with specific coaching on your hook, tone, objection handling, and closing ask. No calendar bookings, no waiting for a coach.',
  },
  {
    q: 'Do I need to sign up or add a card to try it?',
    a: 'No. Your first cold call round is free with no signup and no credit card. You only create an account when you want to unlock your full scorecard, save history, or run more rounds.',
  },
  {
    q: 'What objections can the AI prospect throw at me?',
    a: 'The standard set that kills real deals: "send me an email," "we already use someone," "not a good time," "no budget," "just email me the deck," "call me back next quarter." You can also pick scenario packs for cold outbound, discovery, and pricing pushback.',
  },
  {
    q: 'How is my score calculated?',
    a: 'Every round is scored on four things: your opener hook, your tone and pace, how you handled the objection, and whether you asked for the next step. Each is graded 1–25, summed to a score out of 100. The scorecard also flags filler words, talk-to-listen ratio, and where you lost the prospect.',
  },
  {
    q: 'Is this only for SDRs, or does it work for AEs and founders too?',
    a: 'Both. SDRs use it for cold-call openers and quick objection reps. AEs use it for discovery frameworks and pricing conversations. Founders use it to practice their pitch before their first enterprise call. The scenario packs cover all three.',
  },
  {
    q: 'Can my manager or team see my scores?',
    a: 'Not by default. Individual scores stay private on Solo plans. If you\'re on a Team plan (3+ seats), an admin dashboard shows aggregate progress but not per-round transcripts unless you choose to share.',
  },
  {
    q: 'What happens to my voice recordings after a round?',
    a: 'Audio is processed to produce the score and coaching, then discarded by default. It\'s never sold, never used to train third-party models, and never shared outside the round. You can also delete your account and all associated data from your settings at any time.',
  },
  {
    q: 'How is this different from watching sales training on YouTube?',
    a: 'Videos teach frameworks. PitchPerfect makes you actually run the reps. You\'ll fumble the same objection four times in a row before it clicks — which is exactly how muscle memory forms. Watching a great AE handle "not interested" is not the same as saying it out loud yourself under pressure.',
  },
];

const HomepageFAQ: React.FC = () => {
  return (
    <section className="pp-section pp-faq-section" aria-labelledby="pp-faq-heading">
      <div className="pp-container" style={{ maxWidth: 820 }}>
        <h2
          id="pp-faq-heading"
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 800,
            color: 'var(--pp-text, #1e293b)',
            textAlign: 'center',
            marginBottom: '.5rem',
          }}
        >
          Frequently asked questions
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--pp-text-muted, #64748b)',
            marginBottom: '2rem',
            fontSize: '1rem',
          }}
        >
          Everything reps ask before their first round.
        </p>
        <div>
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              style={{
                borderTop: '1px solid #e2e8f0',
                padding: '1rem 0',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: 'var(--pp-text, #1e293b)',
                  listStyle: 'none',
                }}
              >
                {q}
              </summary>
              <p
                style={{
                  marginTop: '.75rem',
                  color: 'var(--pp-text-muted, #475569)',
                  lineHeight: 1.7,
                  fontSize: '.98rem',
                }}
              >
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomepageFAQ;
