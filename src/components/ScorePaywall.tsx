import React from 'react';
import { X } from 'lucide-react';

export interface ScoreHighlight {
  text: string;
  passed: boolean;
}

export interface ScorePaywallProps {
  score: number;
  highlights: ScoreHighlight[];
  starterPackUrl?: string;
  powerPackUrl?: string;
  unlimitedUrl?: string;
  /** Dismiss the paywall (close X + "Try another free call" link). */
  onClose?: () => void;
  /** Open the existing signup flow. */
  onSignup?: () => void;
}

// Stripe Payment Link for the $29/mo Unlimited Pro subscription.
const DEFAULT_UNLIMITED_URL = 'https://buy.stripe.com/14A14pakJ7eq4NceFs5sA02';

/**
 * Post-cold-call paywall. Shows the user's score + a handful of free
 * high-level bullets, then blurs the full scorecard behind a one-time
 * payment CTA. NO signup, email field, or account creation — payment only.
 *
 * This component is intentionally a default export so the parent can
 * lazy-load it via `React.lazy(() => import('@/components/ScorePaywall'))`.
 */
const ScorePaywall: React.FC<ScorePaywallProps> = ({
  score,
  highlights,
  starterPackUrl = 'https://buy.stripe.com/cNifZjcsR2YadjI68W5sA00',
  powerPackUrl = 'https://buy.stripe.com/14AfZjboN9myenM2WK5sA01',
  unlimitedUrl = DEFAULT_UNLIMITED_URL,
  onClose,
  onSignup,
}) => {
  const scoreGradient =
    score < 50
      ? 'from-red-400 to-red-600'
      : score <= 75
        ? 'from-yellow-300 to-amber-500'
        : 'from-green-400 to-emerald-500';

  return (
    <div className="relative bg-white text-gray-900 rounded-2xl p-5 sm:p-8 w-full max-w-lg mx-auto shadow-2xl border border-gray-200">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-400 hover:text-gray-900 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Score */}
      <div className="text-center mb-6">
        <div className="uppercase tracking-[0.2em] text-[10px] sm:text-xs text-gray-500 mb-2">
          Your Score
        </div>
        <div
          className={`inline-block bg-gradient-to-br ${scoreGradient} bg-clip-text text-transparent font-black leading-none`}
          style={{ fontSize: 'clamp(3.5rem, 14vw, 5.5rem)' }}
        >
          {score}
          <span className="text-2xl sm:text-3xl text-gray-400 font-bold ml-1">/100</span>
        </div>
      </div>

      {/* Free high-level bullets */}
      <ul className="space-y-2 mb-6" role="list">
        {highlights.map((h, i) => (
          <li key={i} className="flex items-start gap-3 text-sm sm:text-base">
            <span
              className={`shrink-0 font-bold ${h.passed ? 'text-green-500' : 'text-red-500'}`}
              aria-hidden="true"
            >
              {h.passed ? '✓' : '✗'}
            </span>
            <span className="text-gray-700">{h.text}</span>
          </li>
        ))}
      </ul>

      {/* Locked scorecard (frosted glass) */}
      <div className="relative rounded-xl overflow-hidden mb-6 border border-gray-200 bg-gray-50">
        {/* Placeholder coaching lines sitting behind the blur */}
        <div
          className="p-5 space-y-3 select-none pointer-events-none"
          aria-hidden="true"
        >
          <div>
            <div className="text-[10px] tracking-widest text-gray-400 mb-1">DISCOVERY</div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your opener was strong, but you failed to establish pain before pitching the
              product — this is why the prospect pushed back on price instead of…
            </p>
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-gray-400 mb-1">
              OBJECTION HANDLING
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              When the prospect said budget was an issue you pivoted to discount instead of
              anchoring value. The fix is a 3-step reframe that top reps use to…
            </p>
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-gray-400 mb-1">CLOSE</div>
            <p className="text-sm text-gray-600 leading-relaxed">
              You never asked for the next step. Closers convert 3× higher by using the
              assumed-next-step technique, which sounds like…
            </p>
          </div>
        </div>

        {/* Frosted overlay */}
        <div className="absolute inset-0 backdrop-blur-md bg-white/70 flex flex-col items-center justify-center p-4 text-center">
          <div className="text-3xl mb-1" aria-hidden="true">🔒</div>
          <div className="text-[10px] tracking-[0.25em] font-bold text-gray-600">
            FULL SCORECARD
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900">LOCKED</div>
        </div>
      </div>

      {/* Primary CTA */}
      <a
        href={starterPackUrl}
        className="block w-full text-center rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-gray-900 font-extrabold py-4 px-5 text-base sm:text-lg shadow-lg shadow-emerald-500/30 transition-colors animate-pulse"
      >
        🔓 Unlock Scorecard + 5 Rounds — $4.99
      </a>

      {/* Secondary CTA */}
      <a
        href={powerPackUrl}
        className="block w-full text-center mt-3 rounded-xl border border-gray-300 hover:border-gray-400 text-gray-900 font-semibold py-3 px-5 text-sm sm:text-base transition-colors"
      >
        Get 15 rounds — $9.99
      </a>

      {/* Tertiary link */}
      <a
        href={unlimitedUrl}
        className="block text-center mt-3 text-xs sm:text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
      >
        Go unlimited — $29/mo
      </a>

      {/* Reassurance */}
      <p className="text-center text-[11px] sm:text-xs text-gray-400 mt-4">
        No subscription required. One-time purchase.
      </p>

      {(onClose || onSignup) && (
        <div className="mt-5 pt-4 border-t border-gray-200 flex flex-col items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              Try another free call →
            </button>
          )}
          {onSignup && (
            <button
              type="button"
              onClick={onSignup}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              Save your progress — sign up free →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScorePaywall;
