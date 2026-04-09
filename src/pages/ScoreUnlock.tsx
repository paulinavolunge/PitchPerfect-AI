import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle2, XCircle, X, Lock, ArrowRight } from 'lucide-react';

/**
 * Stripe redirects buyers here after a successful purchase. Configure each
 * Stripe Payment Link with:
 *   success_url: https://pitchperfectai.ai/scorecard-unlock?session_id={CHECKOUT_SESSION_ID}
 *
 * Flow:
 *   1. Read session_id from URL
 *   2. Verify the session via the verify-stripe-session edge function
 *   3. Render the full unblurred scorecard from the debrief saved in
 *      localStorage during the cold call
 *   4. Offer a one-step signup form (email pre-filled, password only) so
 *      the user can save their purchase. The handle_pending_credits trigger
 *      fires on signup and grants the credits / activates the subscription.
 *   5. Skip → store session_id locally for later prompting
 */

interface VerifyResponse {
  paid: boolean;
  email: string | null;
  mode: 'payment' | 'subscription' | 'setup' | null;
  amountTotal: number | null;
  productLabel: string | null;
}

interface SavedDebrief {
  score: number;
  strengths: string[];
  gaps: string[];
  tip: string;
  won?: boolean;
  sessionStats?: { hungUp?: boolean };
}

const SCORE_HEX = (score10: number) =>
  score10 < 5 ? '#ef4444' : score10 <= 7.5 ? '#eab308' : '#22c55e';

const ScoreUnlock: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [verifyState, setVerifyState] = useState<'loading' | 'verified' | 'failed'>(
    'loading',
  );
  const [verified, setVerified] = useState<VerifyResponse | null>(null);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pull the saved debrief once. If a user comes here without having
  // completed a call (rare), we still show the celebratory state but
  // skip the scorecard body.
  const debrief = useMemo<SavedDebrief | null>(() => {
    try {
      const raw = localStorage.getItem('pp_cold_call_last_debrief');
      return raw ? (JSON.parse(raw) as SavedDebrief) : null;
    } catch {
      return null;
    }
  }, []);

  const scorePercent = debrief ? Math.round(debrief.score * 10) : null;

  // Verify the Stripe session on mount
  useEffect(() => {
    if (!sessionId) {
      setVerifyState('failed');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-stripe-session', {
          body: { session_id: sessionId },
        });
        if (cancelled) return;
        if (error || !data) {
          console.error('verify-stripe-session error:', error);
          setVerifyState('failed');
          return;
        }
        const v = data as VerifyResponse;
        if (!v.paid) {
          setVerifyState('failed');
          return;
        }
        setVerified(v);
        setVerifyState('verified');
      } catch (err) {
        console.error('verify-stripe-session exception:', err);
        if (!cancelled) setVerifyState('failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // If the user is already authenticated when they hit this page (e.g. they
  // bought from inside the app), the webhook + signup trigger have already
  // done their work. Just send them to practice.
  useEffect(() => {
    if (user && verifyState === 'verified') {
      toast({ title: 'Purchase confirmed', description: 'Your rounds are ready.' });
      navigate('/practice');
    }
  }, [user, verifyState, navigate, toast]);

  const handleSkip = () => {
    if (sessionId) {
      try {
        localStorage.setItem('pp_pending_unlock_session_id', sessionId);
      } catch {}
    }
    navigate('/');
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified?.email || !password) return;
    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Use at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: verified.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmed`,
        },
      });

      if (error) {
        // If the buyer's email already has an account, send them to login
        // with the email pre-filled instead of leaving them stuck.
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists')) {
          toast({
            title: 'You already have an account — logging you in',
          });
          navigate(`/login?email=${encodeURIComponent(verified.email)}`);
          return;
        }

        toast({
          title: 'Could not create account',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Clear the local debrief now that the user is set up. The
      // pending_credits trigger has already granted their purchase.
      try {
        localStorage.removeItem('pp_pending_unlock_session_id');
      } catch {}

      if (data.user && !data.session) {
        toast({
          title: 'Check your email',
          description: 'Confirm your address to finish setup. Your rounds are saved.',
        });
        navigate('/');
      } else if (data.session) {
        toast({
          title: 'You\'re in!',
          description: 'Your rounds are ready to go.',
        });
        navigate('/practice');
      }
    } catch (err: any) {
      toast({
        title: 'Could not create account',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────── Loading ───────────────
  if (verifyState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
        <Helmet>
          <title>Unlocking your scorecard… — PitchPerfect AI</title>
        </Helmet>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-lg text-gray-200">Verifying your purchase…</p>
          <p className="text-sm text-gray-500 mt-1">This takes about a second.</p>
        </div>
      </div>
    );
  }

  // ─────────────── Verification failed ───────────────
  if (verifyState === 'failed') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
        <Helmet>
          <title>Could not verify purchase — PitchPerfect AI</title>
        </Helmet>
        <div className="max-w-md w-full text-center bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">We couldn't verify that purchase</h1>
          <p className="text-sm text-gray-400 mb-6">
            If you just paid, give it a moment and refresh. Otherwise contact support and
            we'll sort it out — your payment is safe.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-gray-900 font-bold"
          >
            Back to homepage
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────── Verified — show unblurred scorecard ───────────────
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Helmet>
        <title>You're in! — PitchPerfect AI</title>
        <meta name="description" content="Your full scorecard is unlocked. Save your rounds by creating an account." />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 relative">
        {/* Skip / close */}
        <button
          onClick={handleSkip}
          aria-label="Skip for now"
          className="absolute right-4 top-4 sm:right-6 sm:top-6 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebratory header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">You're in!</h1>
          <p className="text-base text-gray-300">
            {verified?.productLabel
              ? `Unlocked: ${verified.productLabel}. Here's your scorecard.`
              : "Here's your scorecard."}
          </p>
        </div>

        {/* Score */}
        {scorePercent !== null && debrief ? (
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5 sm:p-6 mb-5">
            <div className="text-center mb-5">
              <div className="uppercase tracking-[0.2em] text-[10px] sm:text-xs text-gray-400 mb-1">
                Final Score
              </div>
              <div
                className="font-black leading-none"
                style={{
                  fontSize: 'clamp(3.5rem, 14vw, 5.5rem)',
                  color: SCORE_HEX(debrief.score),
                }}
              >
                {scorePercent}
                <span className="text-2xl sm:text-3xl text-gray-500 font-bold ml-1">/100</span>
              </div>
              <div className="mt-3 text-sm text-gray-400">
                {debrief.sessionStats?.hungUp
                  ? 'They hung up before you could close.'
                  : debrief.won
                    ? 'You earned the next meeting.'
                    : scorePercent >= 70
                      ? 'Strong run — close to a win.'
                      : scorePercent >= 40
                        ? 'Mixed bag — clear places to tighten.'
                        : 'Tough call. Plenty to work on.'}
              </div>
            </div>

            {/* Strengths */}
            {debrief.strengths.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs uppercase tracking-widest text-emerald-400 mb-2">
                  What worked
                </h3>
                <ul className="space-y-2 text-sm">
                  {debrief.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-200">
                      <span className="text-emerald-400 shrink-0 font-bold">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {debrief.gaps.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs uppercase tracking-widest text-red-400 mb-2">
                  What to fix
                </h3>
                <ul className="space-y-2 text-sm">
                  {debrief.gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-200">
                      <span className="text-red-400 shrink-0 font-bold">−</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Coaching tip */}
            {debrief.tip && (
              <div className="bg-amber-500/10 border border-amber-500/30 border-l-4 border-l-amber-400 rounded-xl p-4">
                <h3 className="text-xs uppercase tracking-widest text-amber-400 mb-1">
                  Coach's tip
                </h3>
                <p className="text-sm text-amber-100">{debrief.tip}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6 mb-5 text-center">
            <p className="text-sm text-gray-400">
              Your scorecard isn't on this device — sign in after creating your account
              to find it on your dashboard.
            </p>
          </div>
        )}

        {/* Inline signup prompt */}
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Save your rounds — create your account in 10 seconds
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Set a password to lock in your purchase and access your rounds anywhere.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateAccount} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">
                Email
              </label>
              <input
                type="email"
                value={verified?.email ?? ''}
                readOnly
                className="w-full rounded-lg bg-gray-800/70 border border-gray-700 px-3 py-2.5 text-sm text-gray-200 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
                autoFocus
                className="w-full rounded-lg bg-gray-800/70 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !verified?.email || password.length < 6}
              className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-gray-900 font-extrabold py-5 text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={handleSkip}
            className="block w-full text-center mt-4 text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreUnlock;
