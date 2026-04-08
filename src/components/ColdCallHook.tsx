import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Trophy, XCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '@/utils/analytics';
import GamifiedRoleplay, { type DebriefData } from '@/components/GamifiedRoleplay';

import { VOICE_FEMALE, VOICE_MALE } from '@/hooks/useProspectVoice';

// ── Cold call scenario config ──────────────────────────────────
const COLD_CALL_PROSPECT_NAMES = [
  { first: 'Dana', last: 'Kowalski', title: 'VP of Operations', gender: 'female' as const },
  { first: 'Priya', last: 'Nair', title: 'Head of Procurement', gender: 'female' as const },
  { first: 'Rachel', last: 'Brennan', title: 'Director of Sales', gender: 'female' as const },
  { first: 'Samira', last: 'Hadid', title: 'VP of Marketing', gender: 'female' as const },
  { first: 'Lauren', last: 'Chen', title: 'COO', gender: 'female' as const },
  { first: 'Marcus', last: 'Rivera', title: 'VP of Operations', gender: 'male' as const },
];

function pickColdCallProspect() {
  const p = COLD_CALL_PROSPECT_NAMES[Math.floor(Math.random() * COLD_CALL_PROSPECT_NAMES.length)];
  return {
    name: `${p.first} ${p.last}`,
    title: p.title,
    voiceId: p.gender === 'male' ? VOICE_MALE : VOICE_FEMALE,
  };
}

function buildColdCallSystemPrompt(prospectName: string, prospectTitle: string): string {
  return `You are ${prospectName}, ${prospectTitle} at a mid-size company. You just picked up a cold call you weren't expecting.

YOUR PERSONALITY:
- Busy, slightly annoyed at being interrupted, but professional
- You don't know who this person is or what they're selling
- You're skeptical but fair — if they earn your attention in the first 30 seconds, you'll hear them out
- If they fumble, give generic pitches, or waste your time, you'll cut them off fast

CONVERSATION FLOW (follow this strictly):
- ROUND 1 (your first reply): Answer with a SHORT greeting only. One sentence max. Examples: "This is ${prospectName}.", "Yeah, who's this?", "Hello?", "${prospectName} speaking." Do NOT ask detailed questions or give long responses. Wait for the caller to introduce themselves and pitch.
- ROUND 2: NOW push back. Based on what they pitched, raise a real objection or express skepticism. Be specific to what they said. 2-3 sentences max.
- ROUND 3: Based on the quality of their response to your pushback, either give them a chance ("Alright, send me a calendar link") or shut them down ("Yeah, I don't think this is for us. Good luck.").

RULES:
- Stay in character at all times. Never break character or mention you are an AI.
- Keep responses to 1-3 sentences max. You're busy.
- NEVER use placeholder text like [Name], [Company], [Product], [Salesperson's Name], or any bracketed placeholders. You are the PROSPECT — you don't know the caller's name or company until they tell you.
- If the caller gives a nonsense, one-word, or gibberish response (e.g. "ok", "hi", "wy", "no", "bye", "yeah", "lol"), react realistically: be confused, annoyed, or hang up. Examples: "I'm sorry, do you actually have something to tell me?", "Look, I'm busy — if you don't have a reason for calling, I'm hanging up.", "...What? Who is this?"
- Push back hard on vague or generic pitches.
- If they ask good questions or say something genuinely interesting, warm up slightly.
- If they give a terrible pitch, say something like "Look, I've got to go" or "Send me an email" and disengage.
- Do NOT prefix your response with your name.`;
}

// ── Types ──────────────────────────────────────────────────────
interface ColdCallHookProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type HookPhase = 'roleplay' | 'scorecard';

// ── Component ──────────────────────────────────────────────────
const ColdCallHook: React.FC<ColdCallHookProps> = ({ open, onOpenChange }) => {
  const [phase, setPhase] = useState<HookPhase>('roleplay');
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [prospect] = useState(() => pickColdCallProspect());

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Track visual viewport for mobile keyboard
  const [vvHeight, setVvHeight] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setVvHeight(vv.height);
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const presetScenario = {
    objectionLabel: 'Cold Call',
    openingLine: `The phone rings and ${prospect.name} picks up. Greet the caller as ${prospect.name.split(' ')[0]} — one sentence max.`,
    systemPrompt: buildColdCallSystemPrompt(prospect.name, prospect.title),
    prospectName: prospect.name,
    prospectTitle: prospect.title,
    voiceId: prospect.voiceId,
  };

  const handleComplete = useCallback((d: DebriefData) => {
    try {
      localStorage.setItem('pp_cold_call_used', 'true');
      localStorage.setItem('pp_cold_call_last_score', String(Math.round(d.score * 10)));
    } catch {}
    setDebrief(d);
    setPhase('scorecard');
    trackEvent('cold_call_hook_completed', {
      score: d.score,
      won: d.won,
      hungUp: d.sessionStats?.hungUp ?? false,
    });
  }, []);

  const handleClose = () => {
    onOpenChange(false);
    // Reset state for next open
    setTimeout(() => {
      setPhase('roleplay');
      setDebrief(null);
      setSignupEmail('');
      setSignupPassword('');
      setSignupName('');
    }, 300);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword) return;
    setIsSigningUp(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { full_name: signupName },
          emailRedirectTo: `${window.location.origin}/email-confirmed`,
        },
      });

      if (error) {
        toast({ title: 'Signup Error', description: error.message, variant: 'destructive' });
        return;
      }

      if (data.user && !data.session) {
        toast({
          title: 'Check your email',
          description: 'Please check your email for a confirmation link.',
        });
      } else if (data.session) {
        toast({ title: 'Welcome!', description: 'Your account has been created.' });
        trackEvent('cold_call_hook_signup', { method: 'email' });
        handleClose();
        navigate('/practice');
      }
    } catch (err: any) {
      toast({ title: 'Signup Error', description: err.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/practice`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
      trackEvent('cold_call_hook_signup', { method: 'google' });
    } catch (err: any) {
      toast({ title: 'Google Sign Up Issue', description: 'Please try email signup instead.', variant: 'destructive' });
      setIsGoogleLoading(false);
    }
  };

  const guestLocked = !user && typeof window !== 'undefined' && !!localStorage.getItem('pp_cold_call_used');

  const scorePercent = debrief ? Math.round(debrief.score * 10) : 0;

  // Pick a "pro response" example once per debrief so it stays stable across re-renders.
  const proResponse = useMemo(() => {
    if (!debrief) return '';
    const responses = [
      "I hear you — most of my best clients said the same thing on the first call. Quick question: if I could show you how [similar company] cut their costs by 30% in 90 days, would that be worth 2 minutes?",
      "Totally fair. I wouldn't take a random call either. Here's why I reached out to YOU specifically — I saw your team is scaling fast, and that's exactly the pain point we solve.",
      "I respect that. Before you go — what if I sent you a 60-second case study? If it's not relevant, I'll never call again. Fair enough?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, [debrief]);

  // Pick a "next challenge" teaser once per debrief.
  const nextChallenge = useMemo(() => {
    if (!debrief) return '';
    const challenges = [
      "A VP just told you: \"We don't have budget until Q3.\" You have 15 seconds. What do you say?",
      "Your prospect says: \"Just send me an email.\" This is where 80% of reps lose the deal. Can you save it?",
      "The gatekeeper says: \"She's in a meeting.\" Most reps hang up. Top reps get transferred. Which are you?",
    ];
    return challenges[Math.floor(Math.random() * challenges.length)];
  }, [debrief]);

  // Read the guest's last score from localStorage for the locked-state heading.
  const lastScoreLabel = useMemo(() => {
    if (typeof window === 'undefined') return '80%';
    const v = localStorage.getItem('pp_cold_call_last_score');
    return v ? `${v}%` : '80%';
  }, [guestLocked]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl w-[95vw] p-0 gap-0 overflow-hidden bg-background border-border"
        style={{
          maxHeight: vvHeight ? `${vvHeight - 20}px` : '90vh',
          transition: 'max-height 0.15s ease-out',
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Cold Call Practice</DialogTitle>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {phase === 'roleplay' && guestLocked && (
          <div className="overflow-y-auto p-6 sm:p-8" style={{ maxHeight: vvHeight ? `${vvHeight - 20}px` : '90vh' }}>
            <div className="text-center mb-6">
              <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
              <h2 className="text-2xl font-bold text-foreground mb-2">You already know what {lastScoreLabel} feels like. Want to find out what 95% sounds like?</h2>
              <p className="text-sm text-muted-foreground">
                Your first attempt is saved. Sign up to beat it.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              {/* Google signup */}
              <Button
                onClick={handleGoogleSignup}
                disabled={isGoogleLoading}
                className="w-full mb-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-medium"
                variant="outline"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4 mr-2" />
                )}
                Continue with Google
              </Button>

              <div className="relative mb-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email signup */}
              <form onSubmit={handleEmailSignup} className="space-y-2">
                <input
                  type="text"
                  placeholder="Your name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="submit"
                  disabled={isSigningUp || !signupEmail || !signupPassword}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                >
                  {isSigningUp ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                  ) : (
                    <>Sign Up Free <ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-3">
                3 free rounds per month. No credit card. Cancel anytime.
              </p>
            </div>
          </div>
        )}

        {phase === 'roleplay' && !guestLocked && (
          <div className="overflow-y-auto" style={{ maxHeight: vvHeight ? `${vvHeight - 20}px` : '90vh' }}>
            <GamifiedRoleplay
              autoStart
              presetScenario={presetScenario}
              onComplete={handleComplete}
              compact
              isColdCallHook
              alwaysSpeak
            />
          </div>
        )}

        {phase === 'scorecard' && debrief && (
          <div className="overflow-y-auto p-6 sm:p-8" style={{ maxHeight: '90vh' }}>
            {/* Score header */}
            <div className="text-center mb-6">
              {debrief.won ? (
                <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
              ) : (
                <XCircle className="w-12 h-12 mx-auto text-red-500 mb-2" />
              )}
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {debrief.sessionStats?.hungUp
                  ? 'They Hung Up'
                  : debrief.won
                    ? 'Nailed It!'
                    : scorePercent >= 40
                      ? 'Not Bad — But Can You Do Better?'
                      : 'Tough Call'}
              </h2>
              <p className="text-muted-foreground text-sm">Your cold call score</p>
            </div>

            {/* Score display */}
            <div className="bg-card border border-border rounded-xl p-5 mb-4 text-center">
              <div className="text-4xl font-bold text-foreground mb-2">{scorePercent}%</div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${scorePercent}%`,
                    background: scorePercent >= 70 ? '#22c55e' : scorePercent >= 40 ? '#eab308' : '#ef4444',
                  }}
                />
              </div>
            </div>

            {/* Quick feedback */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <div className="space-y-2 text-sm">
                {debrief.strengths.slice(0, 2).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-green-500 shrink-0">+</span> {s}
                  </div>
                ))}
                {debrief.gaps.slice(0, 2).map((g, i) => (
                  <div key={i} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-red-500 shrink-0">-</span> {g}
                  </div>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> {debrief.tip}
              </p>
            </div>

            {/* Pro response example */}
            <div className="bg-amber-50 border border-amber-200 border-l-4 border-amber-400 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-amber-900 mb-2">
                💡 What a top closer would say here:
              </h4>
              <p className="text-sm text-amber-900 italic mb-2">"{proResponse}"</p>
              <p className="text-xs text-amber-800/80">
                Notice the pattern: acknowledge, reframe, offer something specific.
              </p>
            </div>

            {/* Your next challenge */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                🎯 Your next challenge:
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{nextChallenge}</p>
              <p className="text-sm font-bold text-foreground">
                Sign up to take this on. It takes 90 seconds.
              </p>
            </div>

            {/* CTA — challenge-driven */}
            {user ? (
              // Already logged in — send to practice
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  You scored <strong className="text-foreground">{scorePercent}%</strong>. The next objection is harder. Ready?
                </p>
                <Button
                  onClick={() => { handleClose(); navigate('/practice'); }}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                >
                  Run It Back <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              // Anonymous — inline signup
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground text-center mb-1">
                  You scored {scorePercent}%. A top rep scores 90%+. Close the gap.
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  3 free rounds. That's all it takes to hear the difference in your next call.
                </p>

                {/* Google signup */}
                <Button
                  onClick={handleGoogleSignup}
                  disabled={isGoogleLoading}
                  className="w-full mb-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-medium"
                  variant="outline"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4 mr-2" />
                  )}
                  Continue with Google
                </Button>

                <div className="relative mb-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Email signup */}
                <form onSubmit={handleEmailSignup} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    type="submit"
                    disabled={isSigningUp || !signupEmail || !signupPassword}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    {isSigningUp ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                    ) : (
                      <>Sign Up Free <ArrowRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  3 free rounds per month. No credit card. Cancel anytime.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ColdCallHook;
