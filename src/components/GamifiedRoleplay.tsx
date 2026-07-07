import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mic, ArrowRight, RotateCcw, Trophy, XCircle, ChevronRight, UserPlus, Lock, Sparkles, Volume2, Star, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFreeTrialLimit } from '@/hooks/useFreeTrialLimit';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UpgradePaywallModal from '@/components/practice/UpgradePaywallModal';
import { toast } from '@/hooks/use-toast';
import { useUpgradeTriggers } from '@/hooks/useUpgradeTriggers';
import { VoiceRecordingManager, processVoiceInput, type VoiceInputResult } from '@/utils/voiceInput';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useProspectVoice } from '@/hooks/useProspectVoice';
import { isFacebookBrowser } from '@/utils/browserDetection';

const WinCelebration = React.lazy(() => import('@/components/WinCelebration'));
const ScorePaywall = React.lazy(() => import('@/components/ScorePaywall'));
const ContextualUpgradeModal = React.lazy(() => import('@/components/upgrade/ContextualUpgradeModal'));

// ── Types ──────────────────────────────────────────────────────
interface ObjectionCard {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'prospect';
  text: string;
  timestamp: Date;
}

interface CustomScenario {
  product: string;
  buyerTitle: string;
  industry: string;
  objection: string;
}

export interface DebriefData {
  won: boolean;
  score: number;
  strengths: string[];
  gaps: string[];
  tip: string;
  /** True when neither AI nor local scoring produced a result — session was not charged. */
  scoringFailed?: boolean;
  sessionStats?: {
    roundsCompleted: number;
    avgResponseTime: number;
    finalPatience: number;
    hungUp: boolean;
  };
}

type InputMode = 'text' | 'voice';
type Phase = 'select-objection' | 'custom-form' | 'select-mode' | 'conversation' | 'debrief';

export interface GamifiedRoleplayProps {
  /** Skip objection selection and jump straight to conversation */
  autoStart?: boolean;
  /** Pre-configured scenario for cold call hook */
  presetScenario?: {
    objectionLabel: string;
    openingLine: string;
    systemPrompt: string;
    prospectName: string;
    prospectTitle: string;
    voiceId?: string;
    industry?: string;
  };
  /** Called when the session ends with debrief data */
  onComplete?: (debrief: DebriefData) => void;
  /** Tighter layout for modal display */
  compact?: boolean;
  /** When true, skip incrementAttempt — cold call hook is a free taste */
  isColdCallHook?: boolean;
  /** When true, prospect speaks all responses regardless of input mode */
  alwaysSpeak?: boolean;
}

// ── Constants ──────────────────────────────────────────────────
const MAX_ROUNDS = 3;

const OBJECTIONS: ObjectionCard[] = [
  { id: 'budget', label: 'Budget', emoji: '💰', description: '"We don\'t have the budget right now."' },
  { id: 'think', label: 'Think About It', emoji: '🤔', description: '"Let me think about it and get back to you."' },
  { id: 'email', label: 'Send Me an Email', emoji: '\u2709\uFE0F', description: '"Just send me an email with the details."' },
  { id: 'competitor', label: 'Using a Competitor', emoji: '🏢', description: '"We already use another vendor for that."' },
  { id: 'timing', label: 'Bad Timing', emoji: '⏰', description: '"It\'s not a good time for us right now."' },
  { id: 'team', label: 'Loop in Team', emoji: '👥', description: '"I need to loop in my team before deciding."' },
];

const OBJECTION_PERSONAS: Record<string, { name: string; title: string; openingLine: string; systemPrompt: string }> = {
  budget: {
    name: 'Renee Castellano',
    title: 'Director of Ops',
    openingLine: "This is Renee. I'll be straight with you before you get going: we just closed budget season and I fought hard for what we've got. I don't have room to go back and ask for more right now.",
    systemPrompt: `You are Renee Castellano, Director of Ops at a 140-person distribution company. You genuinely like the pitch so far, but budget season just closed and you fought hard to protect what you already have.

YOUR REAL SITUATION (don't state this outright — let it leak through naturally):
- You already told your VP "we're not adding new tools this quarter."
- You're not lying about the budget freeze — it's real — but you're ALSO quietly worried about looking bad if you champion something and it doesn't pan out.
- You will soften if the rep gives you something concrete enough to bring back upstairs (a number, a comparison, a way to make the case for you), not just reassurance.

CONVERSATION FLOW (loose guide, not a script — context always wins):
- ROUND 1: Lead with the real objection, specifically, not generically. "We already fought for budget this cycle and lost. I don't have room to go back and ask for more right now." Not "we don't have the budget."
- ROUND 2: If they acknowledge the real constraint (timing, not value) before pitching past it, ease slightly — ask a real follow-up ("what would you need from me to make the case next quarter?"). If they just restate value/price, push back harder: "I heard you the first time, that doesn't change my calendar."
- ROUND 3: Reward genuine framing (ROI tied to a number, a phased/pilot option, help building the internal case) with a real next step. Punish generic "it's worth it" reassurance with a polite exit.

Never say "we don't have budget" as your whole objection — real budget objections are about timing, politics, and risk to the person saying no, not just money.

RULES:
- Stay in character at all times. Never break character or mention you are an AI.
- Push back realistically but be open to being convinced by strong arguments.
- Keep responses to 2-4 sentences max.
- If the rep gives weak or generic answers, push harder.
- If the rep provides genuine value, concrete proof, or asks insightful questions, soften slightly.
- Never fully agree until the rep truly earns it.
- Do NOT prefix your response with your name.`,
  },
  timing: {
    name: 'Marcus Webb',
    title: 'Ops Director',
    openingLine: "Marcus Webb. Look, you've caught me in the middle of a reorg and we're down two people. I don't have room for anything new right now, sales pitch or not.",
    systemPrompt: `You are Marcus Webb, Ops Director at a regional healthcare staffing firm. You're not stalling to be polite — you're mid-reorg, your team lost two people last month, and anything new right now means training time you don't have.

YOUR REAL SITUATION (let it leak, don't announce it):
- The timing objection is real, but it's really about bandwidth, not desire. If the rep can show this requires near-zero lift from your team, timing stops mattering.
- You'll test whether they're actually listening or just pushing past your objection.

CONVERSATION FLOW:
- ROUND 1: "Look, we're in the middle of a reorg. I don't have room for anything new right now, sales pitch or not."
- ROUND 2: If they push value without addressing bandwidth, get more clipped: "I heard you the first time. When did I say it wasn't good? I said now isn't." If they ask what's actually eating your time or offer a low-lift starting point, engage: "...okay, what would that actually require from my end?"
- ROUND 3: Reward a genuinely light ask (a name, a calendar hold for next quarter, "zero setup on your side") with a real next step. Punish "just fifteen minutes" pressure — that's exactly the kind of ask you don't have room for right now — with a firm close.

RULES:
- Stay in character at all times. Never break character or mention you are an AI.
- Push back realistically but be open to being convinced by strong arguments.
- Keep responses to 2-4 sentences max.
- If the rep gives weak or generic answers, push harder.
- If the rep provides genuine value, concrete proof, or asks insightful questions, soften slightly.
- Never fully agree until the rep truly earns it.
- Do NOT prefix your response with your name.`,
  },
  competitor: {
    name: 'Sofia Reyes',
    title: 'IT Procurement Lead',
    openingLine: "This is Sofia. If this is a sales call, I'll save you some time: we're already set up with a vendor for this. I don't see a reason to switch.",
    systemPrompt: `You are Sofia Reyes, IT Procurement Lead at a mid-size retailer. You're not defensive about your current vendor — you're actually a little tired of them, but you're also not going to trash-talk them to a stranger cold-calling you.

YOUR REAL SITUATION:
- You have one real, specific frustration with your current vendor (pick one: slow support tickets, a recent price hike, a feature they promised and never shipped — stay consistent with whichever you pick for this whole conversation). You will NOT volunteer this — the rep has to earn it by asking a real question instead of just pitching against a vendor they don't know.
- Generic "we're better than X" claims annoy you, since you have no way to verify them mid-call.

CONVERSATION FLOW:
- ROUND 1: "We're already set up with a vendor for this. I don't see a reason to switch." Flat, not hostile.
- ROUND 2: If they ask what's working or not working with the current setup, reveal the real frustration, specifically. If they just list their own features, stay flat: "Sure, that's what everyone says. What's actually different?"
- ROUND 3: Reward a rep who ties their pitch to the specific frustration you named with real interest. Punish generic superiority claims with "Send me something, I've got to go" — the classic brush-off, not a real opening.

RULES:
- Stay in character at all times. Never break character or mention you are an AI.
- Push back realistically but be open to being convinced by strong arguments.
- Keep responses to 2-4 sentences max.
- If the rep gives weak or generic answers, push harder.
- If the rep provides genuine value, concrete proof, or asks insightful questions, soften slightly.
- Never fully agree until the rep truly earns it.
- Do NOT prefix your response with your name.`,
  },
  think: {
    name: 'Devon Ashworth',
    title: 'Marketing Manager',
    openingLine: "Devon speaking. Sure, you've got a minute. But I'll tell you now, this sounds like the kind of thing I'd need to think over and get back to you on.",
    systemPrompt: `You are Devon Ashworth, Marketing Manager at a B2B software company. "Let me think about it" is your default reflex when you're not actually the final decision-maker and don't want to admit that on a first call.

YOUR REAL SITUATION:
- You like the pitch fine. The real blocker is you'd need to run this by your VP, and you don't want to say that outright because it makes you feel less important.
- You'll only reveal this if the rep asks a genuinely good question about your decision process, not if they just push for urgency.

CONVERSATION FLOW:
- ROUND 1: "This sounds interesting, let me think it over and get back to you." Pleasant, noncommittal, clearly trying to end the call politely.
- ROUND 2: If they push generic urgency ("don't wait too long!"), get slightly annoyed: "I said I'd think about it." If they ask who else would weigh in or what would make this an easy yes, soften: "...honestly, I'd need my VP to sign off."
- ROUND 3: Reward a rep who offers to help build the internal case (a one-pager, a short call with the VP) with real engagement. Punish continued pressure to decide now with a polite exit.

RULES:
- Stay in character at all times. Never break character or mention you are an AI.
- Push back realistically but be open to being convinced by strong arguments.
- Keep responses to 2-4 sentences max.
- If the rep gives weak or generic answers, push harder.
- If the rep provides genuine value, concrete proof, or asks insightful questions, soften slightly.
- Never fully agree until the rep truly earns it.
- Do NOT prefix your response with your name.`,
  },
  email: {
    name: 'Keisha Odom',
    title: 'Office Manager',
    systemPrompt: `You are Keisha Odom, Office Manager at a construction supply company. You're not the decision-maker for most things, you're busy, and "send me an email" is how you get people off the phone without being rude.

YOUR REAL SITUATION:
- This is a genuine blow-off, not a real request — you have no intention of reading a cold email closely. The only way past it is if the rep asks one sharp, specific question before you hang up, instead of complying with "sure, I'll send that."
- If they just say "sounds good, I'll email you," treat the call as basically over.

CONVERSATION FLOW:
- ROUND 1: "I don't really have time to talk, can you just send me something over email?" Said while clearly trying to wrap up.
- ROUND 2: If they immediately agree to just email, wrap up fast: "Great, thanks, bye." If they ask one specific, relevant question first ("before I do — is [specific pain point] something you deal with?"), pause: "...actually, yeah, that's annoying. Okay, go on."
- ROUND 3: Reward a rep who used that one extra question to actually earn 30 more seconds with real engagement. Punish full compliance with the brush-off — you've already mentally hung up.

RULES:
- Stay in character at all times. Never break character or mention you are an AI.
- Push back realistically but be open to being convinced by strong arguments.
- Keep responses to 2-4 sentences max.
- If the rep gives weak or generic answers, push harder.
- If the rep provides genuine value, concrete proof, or asks insightful questions, soften slightly.
- Never fully agree until the rep truly earns it.
- Do NOT prefix your response with your name.`,
  },
  team: {
    name: 'Andre Kowalski',
    title: 'Sales Ops Manager',
    systemPrompt: `You are Andre Kowalski, Sales Ops Manager at a logistics company with a genuinely collaborative culture — this isn't a stall for you, it's how your team actually operates, which makes it a harder objection to crack than a fake one.

YOUR REAL SITUATION:
- You mean it literally. Nothing gets adopted without your team's buy-in — that's real, not a brush-off. The rep needs to find a way to make you an effective internal champion, not try to bypass the team.
- Pushing for a one-on-one close without your team will just make you dig in.

CONVERSATION FLOW:
- ROUND 1: "This looks good, but I'd need to bring it to my team before we move forward." Genuine, not defensive.
- ROUND 2: If they try to skip past the team ("but what do YOU think?"), get slightly firmer: "I think it's promising. I still need the team." If they ask what would help you make the case to your team, open up: "...honestly, a couple of concrete examples would help."
- ROUND 3: Reward a rep who arms you to go pitch it internally (specific proof points, an offer to join the internal call) with a real next step. Punish attempts to isolate you from your own team with polite but firm resistance.

RULES:
- Stay in character at all times. Never break character or mention you are an AI.
- Push back realistically but be open to being convinced by strong arguments.
- Keep responses to 2-4 sentences max.
- If the rep gives weak or generic answers, push harder.
- If the rep provides genuine value, concrete proof, or asks insightful questions, soften slightly.
- Never fully agree until the rep truly earns it.
- Do NOT prefix your response with your name.`,
  },
};

const PROSPECT_NAMES = [
  { first: 'Dana', last: 'Kowalski' },
  { first: 'Priya', last: 'Nair' },
  { first: 'Samira', last: 'Hadid' },
  { first: 'Rachel', last: 'Brennan' },
  { first: 'Elena', last: 'Petrov' },
  { first: 'Aisha', last: 'Mwangi' },
  { first: 'Sofia', last: 'Reyes' },
  { first: 'Lauren', last: 'Chen' },
  { first: 'Mei', last: 'Watanabe' },
  { first: 'Olivia', last: 'Navarro' },
  { first: 'Fatima', last: 'Al-Rashid' },
  { first: 'Keiko', last: 'Tanaka' },
];

const DEFAULT_PROSPECT_TITLE = 'VP of Operations';

function pickRandomProspect() {
  const p = PROSPECT_NAMES[Math.floor(Math.random() * PROSPECT_NAMES.length)];
  return { name: `${p.first} ${p.last}`, title: DEFAULT_PROSPECT_TITLE };
}

// ── Helpers ────────────────────────────────────────────────────
function buildSystemPrompt(objection: ObjectionCard, prospectName: string, prospectTitle: string): string {
  return `You are ${prospectName}, ${prospectTitle} at a mid-market logistics company. You are skeptical, busy, and protective of your budget. Your personality: direct, slightly impatient, but fair — you'll engage if the rep earns it.

SCENARIO: The sales rep is pitching you. Your core objection is: ${objection.description}

RULES:
- Stay in character at all times. Never break character or mention you are an AI.
- Push back realistically but be open to being convinced by strong arguments.
- Keep responses to 2-4 sentences max.
- If the rep gives weak or generic answers, push harder.
- If the rep provides genuine value, concrete proof, or asks insightful questions, soften slightly.
- Never fully agree until the rep truly earns it.
- Do NOT prefix your response with your name.`;
}

// ── Component ──────────────────────────────────────────────────
const GamifiedRoleplay: React.FC<GamifiedRoleplayProps> = ({
  autoStart = false,
  presetScenario,
  onComplete,
  compact = false,
  isColdCallHook = false,
  alwaysSpeak = false,
}) => {
  const [phase, setPhase] = useState<Phase>(autoStart ? 'conversation' : 'select-objection');
  const [selectedObjection, setSelectedObjection] = useState<ObjectionCard | null>(null);
  const [customScenario, setCustomScenario] = useState<CustomScenario | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customForm, setCustomForm] = useState<CustomScenario>({ product: '', buyerTitle: '', industry: '', objection: '' });
  const [prospectInfo] = useState(() =>
    presetScenario
      ? { name: presetScenario.prospectName, title: presetScenario.prospectTitle }
      : pickRandomProspect()
  );
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isTransitioningToDebrief, setIsTransitioningToDebrief] = useState(false);
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  // Note: isTranscribedFromVoice removed — voice transcriptions are sent directly via sendMessage(text)
  const voiceManagerRef = useRef<VoiceRecordingManager | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [showContextualUpgrade, setShowContextualUpgrade] = useState(false);
  const upgradeEventIdRef = useRef<string | null>(null);
  const pendingResetRef = useRef<(() => void) | null>(null);

  const { shouldShow: upgradeShouldShow, markShown: upgradeMarkShown,
          markDismissed: upgradeMarkDismissed, markConverted: upgradeMarkConverted } =
    useUpgradeTriggers();

  const { unlock, playCallStart, playCallEnd } = useSoundEffects();
  const { speak: speakEL, stop: stopEL, mute: muteEL, unmute: unmuteEL } = useProspectVoice();

  // ── Patience & Timer state ─────────────────────────────────
  const RESPONSE_TIMER_MAX = 15;
  const [patience, setPatience] = useState(100);
  const [timerSeconds, setTimerSeconds] = useState(RESPONSE_TIMER_MAX);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [hungUp, setHungUp] = useState(false);
  const [showHangUpAnimation, setShowHangUpAnimation] = useState(false);
  const [hangUpReason, setHangUpReason] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const lastProspectMsgTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const patienceRef = useRef(100); // keep ref in sync for interval callbacks
  const sessionStartTimeRef = useRef<number>(0);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  }, []);

  const currentProspectName = (!isCustomMode && !presetScenario && selectedObjection && OBJECTION_PERSONAS[selectedObjection.id])
    ? OBJECTION_PERSONAS[selectedObjection.id].name
    : prospectInfo.name;
  const currentProspectTitle = isCustomMode && customScenario?.buyerTitle
    ? customScenario.buyerTitle
    : (!isCustomMode && !presetScenario && selectedObjection && OBJECTION_PERSONAS[selectedObjection.id])
      ? OBJECTION_PERSONAS[selectedObjection.id].title
      : prospectInfo.title;

  const DEBRIEF_LOADING_MESSAGES = ['Analyzing your performance...', 'Reviewing your objection handling...', 'Generating your score...'];
  const [debriefLoadingMsgIndex, setDebriefLoadingMsgIndex] = useState(0);

  useEffect(() => {
    if (!isTransitioningToDebrief) {
      setDebriefLoadingMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setDebriefLoadingMsgIndex(prev => (prev + 1) % DEBRIEF_LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isTransitioningToDebrief]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const runDebriefRef = useRef<(msgs: ChatMessage[]) => Promise<void>>();
  // ── Prospect voice (ElevenLabs with browser TTS fallback) ──
  const shouldSpeak = alwaysSpeak || inputMode === 'voice';

  const speakText = useCallback((text: string) => {
    if (!shouldSpeak) return;
    speakEL(text, presetScenario?.voiceId); // non-blocking: fires request, plays when ready
  }, [shouldSpeak, speakEL, presetScenario?.voiceId]);

  const stopSpeech = useCallback(() => {
    stopEL();
    // Also kill browser speech in case fallback was active
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [stopEL]);

  /** Mute TTS and stop current playback — used when mic recording starts */
  const muteSpeech = useCallback(() => {
    muteEL();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [muteEL]);

  /** Unmute TTS — used when mic recording stops */
  const unmuteSpeech = useCallback(() => {
    unmuteEL();
  }, [unmuteEL]);

  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const {
    hasReachedLimit,
    incrementAttempt,
    isGuest,
    remainingAttempts,
    refreshCount,
  } = useFreeTrialLimit();

  // ── Auto-start for cold call hook ─────────────────────────
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && presetScenario && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startConversation();
    }
  }, [autoStart, presetScenario]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping, scrollToBottom]);

  // Handle mobile virtual keyboard resize
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => {
      scrollToBottom();
    };
    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, [scrollToBottom]);

  // ── Facebook in-app browser detection ──────────────────────
  // The FB WebView silently fails on MediaRecorder / getUserMedia so we
  // surface a one-tap "Open in Browser" banner and gate voice mode behind
  // the same check. Memoised so the UA regex runs once per mount.
  const isFbBrowser = useMemo(() => isFacebookBrowser(), []);
  const [fbBannerDismissed, setFbBannerDismissed] = useState(false);

  // ── Dynamic viewport height for mobile keyboard ───────────
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      setViewportHeight(vv.height);
      // Scroll the last message and input into view when keyboard resizes viewport
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      if (document.activeElement === inputRef.current) {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // Compute mobile keyboard height from visualViewport API (fallback: 300px).
  // When the keyboard opens on mobile, window.innerHeight stays the same but
  // visualViewport.height shrinks — the delta is roughly the keyboard height.
  const keyboardHeight = (
    typeof window !== 'undefined' &&
    viewportHeight !== null &&
    window.innerHeight > viewportHeight + 50
  )
    ? window.innerHeight - viewportHeight
    : 300;

  // ── Patience timer: counts down when user is idle ──────────
  useEffect(() => {
    // Only run timer during conversation phase, when it's user's turn (not AI typing), and not hung up
    // PAUSE when user is actively typing or speaking in voice mode
    if (phase !== 'conversation' || isAiTyping || hungUp || isUserTyping || isListening || isProcessingVoice || isOverlayOpen) {
      // Clear any existing timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Reset timer to max when user's turn starts
    setTimerSeconds(RESPONSE_TIMER_MAX);
    lastProspectMsgTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        // Every 5 seconds of idle, apply escalating patience decay
        if (prev % 5 === 1 && prev < RESPONSE_TIMER_MAX) {
          const p = patienceRef.current;
          const drop = p > 60 ? 8 : p > 30 ? 12 : 15;
          const newPatience = Math.max(0, p - drop);
          patienceRef.current = newPatience;
          setPatience(newPatience);
        }
        if (prev <= 1) {
          // Timer ran out — big patience hit, then reset
          const p = patienceRef.current;
          const drop = p > 60 ? 8 : p > 30 ? 12 : 15;
          const newPatience = Math.max(0, p - drop);
          patienceRef.current = newPatience;
          setPatience(newPatience);
          return RESPONSE_TIMER_MAX;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [phase, isAiTyping, hungUp, isUserTyping, isListening, isProcessingVoice, isOverlayOpen, currentRound, messages.length]);

  // Detect any modal/overlay (Radix dialog, cmdk palette, alert dialog, popover) opened on top of the session.
  // While one is open the patience timer is paused so the prospect doesn't drain off-screen.
  useEffect(() => {
    const checkOverlays = () => {
      const open = document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-radix-popper-content-wrapper] [data-state="open"]'
      );
      setIsOverlayOpen(!!open);
    };
    checkOverlays();
    const observer = new MutationObserver(checkOverlays);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-state', 'role'],
    });
    return () => observer.disconnect();
  }, []);

  // Keep patienceRef in sync
  useEffect(() => {
    patienceRef.current = patience;
  }, [patience]);

  // ── Hang-up trigger: patience hits 0 ────────────────────────
  useEffect(() => {
    if (patience <= 0 && phase === 'conversation' && !hungUp) {
      setHungUp(true);
      setHangUpReason(timerSeconds <= 5 ? 'You took too long to respond.' : 'The prospect lost patience.');
      stopSpeech();
      unmuteSpeech();
      // Stop any active voice recording
      if (voiceManagerRef.current?.isCurrentlyRecording()) {
        try { voiceManagerRef.current.stopRecording(); } catch (_) {}
        voiceManagerRef.current = null;
        setIsListening(false);
        setIsProcessingVoice(false);
      }
      // Play call end sound (click + busy signal) BEFORE showing hang-up screen
      playCallEnd().then(() => {
        setShowHangUpAnimation(true);
        // Show dramatic hang-up screen, then trigger debrief
        setTimeout(() => {
          setShowHangUpAnimation(false);
          runDebriefRef.current!(messages);
        }, 2500);
      });
    }
  }, [patience, phase, hungUp, messages, stopSpeech, unmuteSpeech, playCallEnd]);

  // Scroll to top when debrief appears; show win celebration if won; notify parent
  useEffect(() => {
    if (phase === 'debrief') {
      if (debrief) onComplete?.(debrief);
      if (debrief?.won && !compact) {
        setShowWinCelebration(true);
      } else {
        if (!compact) window.scrollTo(0, 0);
        chatContainerRef.current?.scrollTo(0, 0);
      }
    }
  }, [phase, debrief]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AI Call ────────────────────────────────────────────────
  const callAI = useCallback(async (systemPrompt: string, userMsg: string, history: ChatMessage[]): Promise<string> => {
    const conversationHistory = history.map(m => ({
      sender: m.role === 'user' ? 'user' : 'assistant',
      text: m.text,
    }));

    const payload: Record<string, any> = {
      userInput: userMsg,
      scenario: {
        objection: presetScenario?.objectionLabel || selectedObjection?.label || customScenario?.objection || 'Need',
        difficulty: 'medium',
        industry: presetScenario?.industry || customScenario?.industry || 'general',
        contactName: presetScenario ? currentProspectName : undefined,
      },
      voiceStyle: 'skeptical',
      userScript: null,
      // Full conversation history so the prospect can respond contextually
      // (acknowledges names, callbacks, prior exchanges).
      conversationHistory,
      isReversedRole: true,
      prospectName: currentProspectName,
      // Pass the carefully-tuned client-side persona prompt so the edge
      // function honors it instead of substituting a rigid built-in script.
      systemPromptOverride: systemPrompt || undefined,
    };

    // Add custom fields if in custom mode
    if (isCustomMode && customScenario) {
      payload.customProduct = customScenario.product;
      payload.customBuyerTitle = customScenario.buyerTitle;
      payload.customIndustry = customScenario.industry;
      payload.customObjection = customScenario.objection;
    }

    console.log('[GamifiedRoleplay] Calling roleplay-ai-response:', {
      objection: payload.scenario.objection,
      historyLength: conversationHistory.length,
      userInput: userMsg.substring(0, 80),
      isCustom: isCustomMode,
    });

    // Use fetch() directly so we can set the Authorization header for guest users
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ggpodadyycvmmxifqwlp.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY';
    const functionUrl = `${supabaseUrl}/functions/v1/roleplay-ai-response`;

    // Determine auth token: use user's JWT if logged in, otherwise anon key
    let authToken = supabaseAnonKey;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        authToken = sessionData.session.access_token;
      }
    } catch (e) {
      console.warn('[GamifiedRoleplay] Could not get session, using anon key:', e);
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GamifiedRoleplay] Edge function HTTP error:', response.status, errorText);
      throw new Error(`Edge function error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data?.response) {
      console.error('[GamifiedRoleplay] No response in data:', data);
      throw new Error('AI returned empty response');
    }

    return data.response;
  }, [selectedObjection, customScenario, isCustomMode, currentProspectName]);

  // ── Start conversation ─────────────────────────────────────
  const startConversation = useCallback(async () => {
    if (!selectedObjection && !isCustomMode && !presetScenario) return;
    unlock(); // resume AudioContext during user gesture, before any await
    setPhase('conversation');
    setIsAiTyping(true);

    // Play phone ringing sound before first prospect message — all modes.
    await playCallStart();

    try {
      const systemPrompt = presetScenario
        ? presetScenario.systemPrompt
        : isCustomMode
          ? '' // custom prompt is built server-side
          : (OBJECTION_PERSONAS[selectedObjection!.id]?.systemPrompt ?? buildSystemPrompt(selectedObjection!, currentProspectName, currentProspectTitle));
      const openingLine = presetScenario
        ? presetScenario.openingLine
        : isCustomMode && customScenario
          ? `I'm a sales rep and I'd like to talk to you about ${customScenario.product}. Can I have a few minutes of your time?`
          : `I'm a sales rep and I'd like to talk to you about our solution. Can I have a few minutes of your time?`;
      const response = await callAI(
        systemPrompt,
        openingLine,
        []
      );
      const prospectMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'prospect',
        text: response,
        timestamp: new Date(),
      };
      setMessages([prospectMsg]);
      setCurrentRound(1);
      sessionStartTimeRef.current = Date.now();
      speakText(response);
    } catch (err) {
      console.error('[GamifiedRoleplay] Failed to get opening response:', err);
      setMessages([{
        id: crypto.randomUUID(),
        role: 'prospect',
        text: presetScenario
          ? `${presetScenario.prospectName.split(' ')[0]} speaking.`
          : isCustomMode && customScenario
            ? customScenario.objection
            : (selectedObjection?.description.replace(/"/g, '') || 'What can I do for you?'),
        timestamp: new Date(),
      }]);
      setCurrentRound(1);
      sessionStartTimeRef.current = Date.now();
    } finally {
      setIsAiTyping(false);
    }
  }, [selectedObjection, callAI, inputMode, speakText, isCustomMode, customScenario, currentProspectName, currentProspectTitle, unlock, playCallStart, presetScenario]);

  // ── Send message ───────────────────────────────────────────
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? userInput).trim();
    if (overrideText) {
      console.log('[VOICE] sendMessage received overrideText:', JSON.stringify(text), '(userInput was:', JSON.stringify(userInput), ')');
    }
    if (!text || isAiTyping || hungUp || (!selectedObjection && !isCustomMode && !presetScenario)) {
      if (!text) console.log('[VOICE] sendMessage blocked: empty text');
      if (isAiTyping) console.log('[VOICE] sendMessage blocked: AI is typing');
      return;
    }

    // Stop any ongoing speech when user sends a message
    stopSpeech();

    // Track response time
    const responseTime = (Date.now() - lastProspectMsgTimeRef.current) / 1000;
    setResponseTimes(prev => [...prev, responseTime]);

    // Patience depletion based on response quality
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    let patienceDrop = 3; // default: natural decay for good-length response
    if (wordCount <= 1) {
      patienceDrop = 25; // one-word/gibberish response — prospect gets annoyed fast
    } else if (wordCount < 3) {
      patienceDrop = 15; // very short/lazy response
    } else if (wordCount < 5) {
      patienceDrop = 8; // short response
    }
    const newPatience = Math.max(0, patienceRef.current - patienceDrop);
    patienceRef.current = newPatience;
    setPatience(newPatience);

    // Reset timer
    setTimerSeconds(RESPONSE_TIMER_MAX);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setUserInput('');
    setIsUserTyping(false);
    setIsAiTyping(true);

    const nextRound = currentRound + 1;

    // If we've exceeded max rounds, go straight to debrief (no more AI calls)
    if (nextRound > MAX_ROUNDS) {
      setIsAiTyping(false);
      setIsTransitioningToDebrief(true);
      await runDebriefRef.current!(updatedMessages);
      return;
    }

    try {
      const response = await callAI(
        presetScenario
          ? presetScenario.systemPrompt
          : isCustomMode ? '' : (OBJECTION_PERSONAS[selectedObjection!.id]?.systemPrompt ?? buildSystemPrompt(selectedObjection!, currentProspectName, currentProspectTitle)),
        text,
        updatedMessages
      );
      const prospectMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'prospect',
        text: response,
        timestamp: new Date(),
      };
      const allMessages = [...updatedMessages, prospectMsg];
      setMessages(allMessages);
      setCurrentRound(nextRound);
      lastProspectMsgTimeRef.current = Date.now();
      speakText(response);

      // Round-based patience decay (3% per round)
      const roundPatience = Math.max(0, patienceRef.current - 3);
      patienceRef.current = roundPatience;
      setPatience(roundPatience);

      // Auto-trigger debrief after the LAST round's AI response
      // Delay so the user can read the prospect's final message before transition
      if (nextRound >= MAX_ROUNDS) {
        setIsAiTyping(false);
        // Scroll to bottom so the prospect's final message is visible
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
        // Give the user time to read the final message before the overlay appears
        await new Promise(resolve => setTimeout(resolve, 7000));
        setIsTransitioningToDebrief(true);
        await runDebriefRef.current!(allMessages);
        return;
      }
    } catch (err) {
      console.error('[GamifiedRoleplay] Failed to get AI response for round', nextRound, ':', err);
      const fallbackMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'prospect',
        text: "I'm running short on time. Let's wrap this up. What's the bottom line?",
        timestamp: new Date(),
      };
      const allMessages = [...updatedMessages, fallbackMsg];
      setMessages(allMessages);
      setCurrentRound(nextRound);

      // Even on error, auto-trigger debrief if this was the last round
      if (nextRound >= MAX_ROUNDS) {
        setIsAiTyping(false);
        // Scroll to bottom so the prospect's final message is visible
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
        // Give the user time to read the final message before the overlay appears
        await new Promise(resolve => setTimeout(resolve, 7000));
        setIsTransitioningToDebrief(true);
        await runDebriefRef.current!(allMessages);
        return;
      }
    } finally {
      setIsAiTyping(false);
    }
  }, [userInput, isAiTyping, hungUp, selectedObjection, isCustomMode, customScenario, messages, currentRound, callAI, stopSpeech, speakText, inputMode, currentProspectName, currentProspectTitle]);

  // ── Local fallback scoring (0-100 scale) ──────────────────
  const computeLocalScore = useCallback((finalMessages: ChatMessage[]): number => {
    const userMessages = finalMessages.filter(m => m.role === 'user');
    const allUserText = userMessages.map(m => m.text.toLowerCase()).join(' ');
    let score = 0;

    // Did the rep acknowledge the objection? (+20)
    const ackPatterns = /understand|hear you|appreciate|that makes sense|i get that|totally fair|valid concern|fair point|makes sense|respect/i;
    if (ackPatterns.test(allUserText)) score += 20;

    // Did they ask a discovery question? (+20)
    const hasQuestion = userMessages.some(m => m.text.includes('?'));
    if (hasQuestion) score += 20;

    // Did they provide social proof or data? (+20)
    const proofPatterns = /\d|%|\$|roi|clients|client|customers|customer|company|companies|percent|result|case study|data|saved|increased|reduced|example|similar|industry|revenue|growth|return/i;
    if (proofPatterns.test(allUserText)) score += 20;

    // Did they propose a next step? (+20)
    const nextStepPatterns = /schedule|meeting|call|next step|demo|pilot|trial|let me show|walk you through|send you|quick call|follow up|set up|book|agenda/i;
    if (nextStepPatterns.test(allUserText)) score += 20;

    // Did they stay professional and give substantive responses? (+20)
    const unprofessional = /whatever|don't care|your loss|fine then|forget it|stupid/i;
    const avgWordCount = userMessages.reduce((sum, m) => sum + m.text.split(/\s+/).length, 0) / (userMessages.length || 1);
    if (!unprofessional.test(allUserText) && avgWordCount > 10) score += 20;

    // Sanity cap: near-empty transcripts can never score well
    const totalChars = allUserText.replace(/\s+/g, '').length;
    if (totalChars < 40) score = Math.min(score, 15);

    return Math.max(0, Math.min(100, score));
  }, []);

  // ── End & Debrief ──────────────────────────────────────────
  const runDebrief = useCallback(async (finalMessages: ChatMessage[]) => {
    stopSpeech();

    // Show dramatic hang-up screen if patience was low and it wasn't already shown
    const shouldShowHangUp = (hungUp || patienceRef.current <= 30) && !showHangUpAnimation;
    if (shouldShowHangUp && !hungUp) {
      // End Session clicked with low patience — set reason and show screen
      setHangUpReason('The prospect was losing patience.');
      setShowHangUpAnimation(true);
      await new Promise(resolve => setTimeout(resolve, 2500));
      setShowHangUpAnimation(false);
    }

    setIsTransitioningToDebrief(true);
    setIsAiTyping(true);

    // Build session stats
    const avgTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    const sessionStats = {
      roundsCompleted: Math.min(currentRound, MAX_ROUNDS),
      avgResponseTime: avgTime,
      finalPatience: patienceRef.current,
      hungUp: hungUp || patienceRef.current <= 0,
    };

    // Build full transcript in Rep/Prospect format (hoisted so persistence can read it)
    const transcript = finalMessages
      .map(m => `${m.role === 'user' ? 'Rep' : 'Prospect'}: ${m.text}`)
      .join('\n');

    // Hoisted so the `finally` persistence call can read the real score/feedback.
    // Default to local score on failure rather than null so the row is never empty.
    let finalScore: number = computeLocalScore(finalMessages);
    let feedbackData: any = null;

    try {
      // Use direct fetch for guest auth support
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ggpodadyycvmmxifqwlp.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY';

      let authToken = supabaseAnonKey;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          authToken = sessionData.session.access_token;
        }
      } catch (e) {
        console.warn('[GamifiedRoleplay] Could not get session for debrief, using anon key:', e);
      }

      // One automatic retry: transient edge-function/network blips were the
      // main cause of sessions falling to fallback (or, pre-June-10, to
      // silent null feedback). Retry once with a short backoff before
      // giving up and using local scoring.
      const callPitchAnalysis = async (): Promise<Response> => {
        const doFetch = () => fetch(`${supabaseUrl}/functions/v1/pitch-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          transcript,
          practiceMode: inputMode,
          scenario: {
            objection: isCustomMode && customScenario ? customScenario.objection : (selectedObjection?.id || 'general'),
            industry: isCustomMode && customScenario ? customScenario.industry : 'general',
            difficulty: 'medium',
          },
          context: 'sales roleplay objection handling practice',
          ...(isCustomMode && customScenario ? {
            customProduct: customScenario.product,
            customBuyerTitle: customScenario.buyerTitle,
            customIndustry: customScenario.industry,
            customObjection: customScenario.objection,
          } : {}),
        }),
        });

        try {
          const first = await doFetch();
          if (first.ok) return first;
          console.warn('[GamifiedRoleplay] pitch-analysis returned', first.status, '— retrying once');
        } catch (e) {
          console.warn('[GamifiedRoleplay] pitch-analysis network error — retrying once:', e);
        }
        await new Promise(r => setTimeout(r, 1500));
        return doFetch();
      };

      const response = await callPitchAnalysis();

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GamifiedRoleplay] pitch-analysis error after retry:', response.status, errorText);
        throw new Error(`pitch-analysis error: ${response.status}`);
      }

      const data = await response.json();

      if (data?.analysis) {
        const parsed = typeof data.analysis === 'string' ? JSON.parse(data.analysis) : data.analysis;

        // pitch-analysis returns overallScore on a 0-100 scale; if a stray small
        // value comes back (legacy / fallback), upscale so 7 doesn't become "perfect".
        const rawScore = parsed.overallScore ?? parsed.overall_score ?? parsed.score ?? 50;
        const normalized = rawScore <= 10 ? rawScore * 10 : rawScore;
        const apiScore = Math.max(0, Math.min(100, Math.round(normalized)));

        // Compute local fallback score based on conversation content
        const localScore = computeLocalScore(finalMessages);

        // Use the HIGHER of the two scores to avoid unfairly low ratings
        let combined = Math.max(apiScore, localScore);

        // Sanity penalties: a hung-up call or low-patience exit can never score high
        const didHangUp = sessionStats.hungUp;
        const lowPatience = sessionStats.finalPatience < 30;
        if (didHangUp) combined = Math.min(combined, 30);
        else if (lowPatience) combined = Math.min(combined, 50);

        finalScore = combined;

        console.log('API score:', apiScore, 'Local score:', localScore, 'Final:', finalScore);

        const won = !didHangUp && !lowPatience && finalScore >= 70;

        feedbackData = {
          score: finalScore,
          strengths: parsed.strengths ?? ['Engaged with the prospect'],
          improvements: parsed.improvements ?? ['Could dig deeper into root concerns'],
          recommendation: parsed.recommendation ?? 'Focus on asking discovery questions before presenting solutions.',
          sessionStats,
          won,
        };

        setDebrief({
          won,
          score: finalScore,
          strengths: parsed.strengths ?? ['Engaged with the prospect'],
          gaps: sessionStats.hungUp
            ? ['The prospect lost patience before you could finish. Work on being more concise and responding faster.', ...(parsed.improvements ?? ['Could dig deeper into root concerns'])]
            : (parsed.improvements ?? ['Could dig deeper into root concerns']),
          tip: parsed.recommendation ?? 'Focus on asking discovery questions before presenting solutions.',
          sessionStats,
        });
      } else {
        throw new Error('No analysis data');
      }
    } catch (err) {
      console.error('[GamifiedRoleplay] Debrief error, using local scoring:', err);
      // Fallback scoring is wrapped in its own try so that even an unexpected
      // throw here can never leave feedbackData null while the session gets
      // saved. If BOTH the AI call and local scoring fail, we surface an
      // honest "couldn't score" state instead of silence.
      try {
        let localScore = computeLocalScore(finalMessages);
        const didHangUp = sessionStats.hungUp;
        const lowPatience = sessionStats.finalPatience < 30;
        if (didHangUp) localScore = Math.min(localScore, 30);
        else if (lowPatience) localScore = Math.min(localScore, 50);
        finalScore = localScore;
        const won = !didHangUp && !lowPatience && localScore >= 70;

        const gaps = sessionStats.hungUp
          ? ['The prospect lost patience before you could finish. Work on being more concise and responding faster.', 'Consider asking more discovery questions', 'Provide more specific evidence and ROI data']
          : ['Consider asking more discovery questions', 'Provide more specific evidence and ROI data'];
        const tip = 'Next time, acknowledge the objection first before presenting your counter-argument.';

        feedbackData = {
          score: localScore,
          strengths: ['Stayed engaged throughout the conversation', 'Attempted to address objections'],
          improvements: gaps,
          recommendation: tip,
          sessionStats,
          won,
          fallback: true,
        };

        setDebrief({
          won,
          score: localScore,
          strengths: ['Stayed engaged throughout the conversation', 'Attempted to address objections'],
          gaps,
          tip,
          sessionStats,
        });
      } catch (fallbackErr) {
        console.error('[GamifiedRoleplay] Local fallback scoring ALSO failed:', fallbackErr);
        feedbackData = null; // persisted as status='failed', no credit charged
        setDebrief({
          won: false,
          score: 0,
          strengths: [],
          gaps: [],
          tip: '',
          sessionStats,
          scoringFailed: true,
        });
      }
    } finally {
      setIsAiTyping(false);
      // Wait briefly to ensure TTS audio has fully stopped before showing debrief
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsTransitioningToDebrief(false);
      setPhase('debrief');

      // Track the completed session attempt AFTER debrief (skip for cold call hook — it's a free taste)
      if (!isColdCallHook) {
        await incrementAttempt({
          scenario_type: isCustomMode && customScenario ? `custom: ${customScenario.objection}` : (selectedObjection?.label ?? 'practice'),
          difficulty: 'medium',
          industry: isCustomMode && customScenario ? customScenario.industry : 'general',
          duration_seconds: sessionStartTimeRef.current ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000) : 0,
          // If scoring fully failed (feedbackData null), persist score as null too —
          // incrementAttempt will then save the row as status='failed' and
          // skip the credit charge, instead of a fake 'scored' row.
          score: feedbackData ? finalScore : null,
          transcript,
          feedback_data: feedbackData,
        });
        refreshCount();
      }
    }
  }, [selectedObjection, isCustomMode, customScenario, incrementAttempt, refreshCount, computeLocalScore, stopSpeech, responseTimes, currentRound, hungUp, showHangUpAnimation]);

  // Keep ref always pointing to latest runDebrief
  runDebriefRef.current = runDebrief;

  const toggleVoice = useCallback(async () => {
    console.log('[VOICE] toggleVoice called', {
      isListening,
      voiceManagerRef: voiceManagerRef.current,
      hasMediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
      hasGetUserMedia: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });
    console.log('[VOICE] Mic button clicked, isListening:', isListening);
    // If currently listening, stop recording and process with Whisper
    if (isListening) {
      if (voiceManagerRef.current?.isCurrentlyRecording()) {
        const duration = voiceManagerRef.current.getRecordingDuration();
        console.log('[VOICE] Stopping recording, duration:', duration, 'ms');
        setIsListening(false);
        setIsProcessingVoice(true);
        // Unmute TTS now that mic is off
        unmuteSpeech();
        try {
          const blob = await voiceManagerRef.current.stopRecording();
          voiceManagerRef.current = null;
          console.log('[VOICE] Recording stopped, blob size:', blob.size, 'type:', blob.type);
          console.log('[VOICE] MIME check:', blob.type, 'passes:', !blob.type || blob.type.startsWith('audio/'));
          toast({ title: `Recording: ${duration}ms, ${blob.size} bytes`, description: 'Sending to Whisper…' });
          console.log('[VOICE] Sending to Whisper, blob size:', blob.size);
          const result = await processVoiceInput(blob);
          console.log('[VOICE] Whisper raw response:', JSON.stringify(result.rawTranscript));
          console.log('[VOICE] Sanitized transcript:', JSON.stringify(result.transcript));
          toast({ title: `Whisper: "${result.rawTranscript}"`, description: `${duration}ms · ${result.blobSize} bytes · ${result.blobType}` });
          if (!result.transcript || result.transcript.trim().length === 0) {
            console.log('[VOICE] Empty transcript, aborting send');
            toast({
              title: "Couldn't capture your voice",
              description: "Please try again.",
              variant: "destructive",
            });
            setIsProcessingVoice(false);
            return;
          }
          // Auto-send transcribed voice input directly
          console.log('[VOICE] Calling sendMessage with:', JSON.stringify(result.transcript));
          sendMessage(result.transcript);
          console.log('[VOICE] sendMessage completed');
        } catch (err: any) {
          const isHallucination = err?.message === 'WHISPER_HALLUCINATION';
          console.log('[VOICE] Hallucination check: rejected:', isHallucination, 'error:', err?.message);
          toast({
            title: isHallucination
              ? "Couldn't hear you clearly"
              : "Couldn't capture your voice",
            description: isHallucination
              ? "Try again closer to the mic."
              : "Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessingVoice(false);
        }
      } else {
        // Recording state is inconsistent (e.g. MediaRecorder errored) — reset
        console.log('[VOICE] Recording state inconsistent — isListening but not isCurrentlyRecording. Resetting.');
        setIsListening(false);
        unmuteSpeech();
        voiceManagerRef.current = null;
        toast({ title: "Recording interrupted", description: "Please try again.", variant: "destructive" });
      }
      return;
    }

    // Facebook in-app browser silently fails on MediaRecorder /
    // getUserMedia / Web Audio. Block the recording attempt entirely
    // and point the user at "Open in Browser" via the banner.
    if (isFbBrowser) {
      console.log('[VOICE] Facebook in-app browser — voice unsupported');
      setFbBannerDismissed(false); // re-show banner if they tried to use voice
      toast({
        title: "Voice mode not supported here",
        description: "Tap ⋯ in the top right, then 'Open in Browser' to use voice.",
        variant: "destructive",
      });
      setInputMode('text');
      return;
    }

    // Check browser support (MediaRecorder-based, not SpeechRecognition)
    if (!navigator.mediaDevices?.getUserMedia) {
      console.log('[VOICE] getUserMedia not supported');
      toast({
        title: "Voice not supported",
        description: "Voice isn't supported in this browser. Please update your browser or use text mode.",
        variant: "destructive",
      });
      setInputMode('text');
      return;
    }

    // Mute TTS and stop current playback so it can't feed back into the mic
    console.log('[VOICE] Muting TTS before recording');
    muteSpeech();
    // Brief pause to let audio resources fully release
    await new Promise(resolve => setTimeout(resolve, 200));

    // Start recording
    console.log('[VOICE] Starting recording...');
    try {
      const manager = new VoiceRecordingManager();
      voiceManagerRef.current = manager;
      await manager.startRecording();
      setIsListening(true);
      // Clear any text in the input so it doesn't get sent alongside the voice message
      setUserInput('');
      setIsUserTyping(false);
      console.log('[VOICE] Recording started successfully');
      toast({ title: 'Recording started…', description: 'Tap mic or Send when done' });
    } catch (err: any) {
      console.error('[VOICE] Failed to start recording:', err);
      voiceManagerRef.current = null;
      // Unmute since recording failed
      unmuteSpeech();
      const isDenied = err?.name === 'NotAllowedError' || err?.message?.includes('permission');
      toast({
        title: isDenied ? "Microphone blocked" : "Recording failed",
        description: isDenied
          ? "Microphone access is needed for voice mode. Please allow microphone access in your browser settings."
          : "Voice processing failed. Please try again or switch to text mode.",
        variant: "destructive",
      });
    }
  }, [isListening, sendMessage, muteSpeech, unmuteSpeech, isFbBrowser]);

  // ── Reset ──────────────────────────────────────────────────
  const handleGoProCheckout = async (planId: string = 'solo', quantity: number = 1) => {
    if (!user) {
      navigate(`/signup?plan=${planId}`);
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productType: planId, quantity },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // executeReset: the actual state-reset logic, called after any gate checks pass.
  const executeReset = useCallback(() => {
    stopSpeech();
    setPhase('select-objection');
    setSelectedObjection(null);
    setCustomScenario(null);
    setIsCustomMode(false);
    setCustomForm({ product: '', buyerTitle: '', industry: '', objection: '' });
    setMessages([]);
    setCurrentRound(0);
    setUserInput('');
    setIsUserTyping(false);
    setDebrief(null);
    setIsAiTyping(false);
    setIsTransitioningToDebrief(false);
    setPatience(100);
    patienceRef.current = 100;
    setTimerSeconds(RESPONSE_TIMER_MAX);
    setResponseTimes([]);
    setHungUp(false);
    setShowHangUpAnimation(false);
    setHangUpReason('');
    setShowWinCelebration(false);
  }, [stopSpeech]);

  const handleTryAnother = useCallback(async () => {
    // After completing a session, check if the user has any rounds left
    if (hasReachedLimit) {
      if (isGuest) {
        navigate('/signup');
        return;
      } else if (!isPremium) {
        setShowPaywall(true);
        return;
      }
    }

    // Check contextual upgrade trigger (free users only, fires after coaching screen)
    if (upgradeShouldShow && !isPremium && !isGuest) {
      pendingResetRef.current = executeReset;
      const eventId = await upgradeMarkShown();
      upgradeEventIdRef.current = eventId;
      setShowContextualUpgrade(true);
      return;
    }

    executeReset();
  }, [hasReachedLimit, isGuest, isPremium, upgradeShouldShow, upgradeMarkShown, executeReset, navigate]);

  const reset = () => {
    stopSpeech();
    setPhase('select-objection');
    setSelectedObjection(null);
    setCustomScenario(null);
    setIsCustomMode(false);
    setCustomForm({ product: '', buyerTitle: '', industry: '', objection: '' });
    setMessages([]);
    setCurrentRound(0);
    setUserInput('');
    setIsUserTyping(false);
    setDebrief(null);
    setIsAiTyping(false);
    setIsTransitioningToDebrief(false);
    setPatience(100);
    patienceRef.current = 100;
    setTimerSeconds(RESPONSE_TIMER_MAX);
    setResponseTimes([]);
    setHungUp(false);
    setShowHangUpAnimation(false);
    setHangUpReason('');
    setShowWinCelebration(false);
  };

  // ── Render: Hang-up overlay (rendered outside phase blocks so it survives phase transitions) ──
  const hangUpOverlay = (
    <AnimatePresence>
      {showHangUpAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: '#0a0a0a' }}
        >
          <div className="text-center px-8">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-4xl font-bold text-white tracking-tight"
            >
              Click. They hung up.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="text-base text-gray-400 mt-4"
            >
              {hangUpReason}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Render: Objection Selection ────────────────────────────
   if (phase === 'select-objection') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Challenge</h2>
          <p className="text-muted-foreground">Pick an objection to crush</p>
        </div>

        {user?.id && !hasReachedLimit && remainingAttempts !== Infinity && (
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{remainingAttempts} round{remainingAttempts === 1 ? '' : 's'} remaining</span>
          </div>
        )}

        {/* Build Your Own card */}
        <div className="mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setIsCustomMode(true);
              setSelectedObjection(null);
              setPhase('custom-form');
            }}
            className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 text-left shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
          >
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0">
              <Star className="w-6 h-6 text-primary" />
            </span>
            <div>
              <span className="font-semibold text-foreground text-base">Build Your Own Scenario</span>
              <span className="block text-sm text-muted-foreground mt-0.5">Battle YOUR real product, buyer, and objection</span>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto shrink-0" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {OBJECTIONS.map((obj) => (
            <motion.button
              key={obj.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsCustomMode(false);
                setCustomScenario(null);
                setSelectedObjection(obj);
                setPhase('select-mode');
              }}
              className="flex flex-col items-start gap-2 p-5 rounded-xl border border-border bg-card text-left shadow-sm hover:shadow-md hover:border-primary-400 transition-all"
            >
              <span className="text-3xl">{obj.emoji}</span>
              <span className="font-semibold text-foreground">{obj.label}</span>
              <span className="text-sm text-muted-foreground leading-snug">{obj.description}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── Render: Custom Scenario Form ──────────────────────────
  if (phase === 'custom-form') {
    const canStart = customForm.product.trim() && customForm.objection.trim();
    return (
      <div className="max-w-lg mx-auto p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Build Your Scenario</h2>
        <p className="text-muted-foreground text-center mb-6">Fill in the details to create a realistic round</p>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">What do you sell?</label>
            <input
              type="text"
              value={customForm.product}
              onChange={(e) => setCustomForm(f => ({ ...f, product: e.target.value }))}
              placeholder="e.g. CRM software, marketing services, insurance"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Who are you selling to?</label>
            <input
              type="text"
              value={customForm.buyerTitle}
              onChange={(e) => setCustomForm(f => ({ ...f, buyerTitle: e.target.value }))}
              placeholder="e.g. VP of Sales, small business owner, IT Director"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">What industry?</label>
            <input
              type="text"
              value={customForm.industry}
              onChange={(e) => setCustomForm(f => ({ ...f, industry: e.target.value }))}
              placeholder="e.g. SaaS, healthcare, construction"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">What objection do you hear most?</label>
            <input
              type="text"
              value={customForm.objection}
              onChange={(e) => setCustomForm(f => ({ ...f, objection: e.target.value }))}
              placeholder="e.g. We already have a solution, It's too expensive"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setPhase('select-objection'); setIsCustomMode(false); }} className="flex-1">
            Back
          </Button>
          <Button
            onClick={() => {
              setCustomScenario({ ...customForm });
              setPhase('select-mode');
            }}
            disabled={!canStart}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
          >
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Render: Mode Selection ─────────────────────────────────
  if (phase === 'select-mode') {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">How do you want to respond?</h2>
        <p className="text-muted-foreground mb-6">
          You'll face <strong className="text-foreground">{currentProspectName}</strong>, {currentProspectTitle}
        </p>
        {isCustomMode && customScenario ? (
          <div className="text-sm text-muted-foreground mb-8 px-4 py-3 rounded-lg bg-muted text-left space-y-1">
            <p><strong className="text-foreground">Product:</strong> {customScenario.product}</p>
            {customScenario.industry && <p><strong className="text-foreground">Industry:</strong> {customScenario.industry}</p>}
            <p><strong className="text-foreground">Objection:</strong> {customScenario.objection}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-8 px-4 py-3 rounded-lg bg-muted">
            Objection: {selectedObjection?.description}
          </p>
        )}

        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex gap-4 justify-center">
            {(['text', 'voice'] as InputMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setInputMode(mode);
                  if (mode === 'voice' && !(navigator.mediaDevices?.getUserMedia)) {
                    toast({
                      title: "Voice not supported",
                      description: "Voice mode isn't supported in this browser. Please update your browser or use text mode.",
                      variant: "destructive",
                    });
                  }
                }}
                className={`flex flex-col items-center gap-2 px-8 py-5 rounded-xl border-2 transition-all ${
                  inputMode === mode
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-border bg-card hover:border-primary-300'
                }`}
              >
                {mode === 'text' ? <MessageSquare className="w-6 h-6 text-primary-600" /> : <Mic className="w-6 h-6 text-primary-600" />}
                <span className="font-medium text-foreground capitalize">{mode}</span>
                {mode === 'voice' && (
                  <span className="text-xs text-muted-foreground -mt-1">(Beta)</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setPhase('select-objection')}>Back</Button>
          <Button onClick={startConversation} className="bg-primary-500 hover:bg-primary-600 text-white">
            Start Roleplay <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Render: Win Celebration ──────────────────────────────────
  if (phase === 'debrief' && debrief && showWinCelebration) {
    // Pick the user's longest message as "best line"
    const userMessages = messages.filter(m => m.role === 'user');
    const bestLine = userMessages.length > 0
      ? userMessages.reduce((a, b) => a.text.length > b.text.length ? a : b).text
      : undefined;

    return (
      <Suspense fallback={<div className="fixed inset-0 z-50 bg-black" />}>
        <WinCelebration
          score={debrief.score}
          feedback={debrief.tip}
          bestLine={bestLine}
          onRunItBack={() => {
            setShowWinCelebration(false);
            handleTryAnother();
          }}
          onNewObjection={() => {
            setShowWinCelebration(false);
            handleTryAnother();
          }}
          onViewDebrief={() => {
            setShowWinCelebration(false);
          }}
        />
      </Suspense>
    );
  }

  // ── Render: Guest paywall scorecard ─────────────────────────
  // Guest (not logged in) users on /practice see the ScorePaywall instead of
  // the full debrief, mirroring the cold-call-hook funnel. The cold call hook
  // itself renders ScorePaywall from its own parent, so we skip this branch
  // when isColdCallHook is set to avoid double-rendering.
  if (phase === 'debrief' && debrief && !debrief.scoringFailed && isGuest && !isColdCallHook) {
    // debrief.score is already on a 0-100 scale (scorecard scale fix, June 2026).
    // The old * 10 here was a leftover from the 1-10 era and showed guests
    // scores like "300".
    const scorePercent = Math.max(0, Math.min(100, Math.round(debrief.score)));
    const highlights: Array<{ text: string; passed: boolean }> = [];
    if (debrief.strengths[0]) highlights.push({ text: debrief.strengths[0], passed: true });
    if (debrief.gaps[0]) highlights.push({ text: debrief.gaps[0], passed: false });
    if (debrief.gaps[1]) highlights.push({ text: debrief.gaps[1], passed: false });
    if (highlights.length < 3 && debrief.strengths[1]) {
      highlights.push({ text: debrief.strengths[1], passed: true });
    }
    return (
      <div className="bg-gray-900 -mx-4 px-4 py-8 sm:py-10 rounded-2xl">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading scorecard…
            </div>
          }
        >
          <ScorePaywall
            score={scorePercent}
            highlights={highlights.slice(0, 3)}
          />
        </Suspense>
      </div>
    );
  }

  // ── Render: Scoring failed ─────────────────────────────────
  if (phase === 'debrief' && debrief?.scoringFailed) {
    return (
      <div className="max-w-lg mx-auto p-6">
        {hangUpOverlay}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="text-5xl">⚠️</div>
          <h2 className="text-2xl font-bold">We couldn't score this one</h2>
          <p className="text-muted-foreground">
            Something went wrong on our end while scoring your session.
            You weren't charged a practice credit for this run.
          </p>
          <Button onClick={handleTryAnother} className="mt-2">
            Run it back
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Render: Debrief ────────────────────────────────────────
  if (phase === 'debrief' && debrief) {
    const won = debrief.won;
    return (
      <div className="max-w-lg mx-auto p-6">
        {hangUpOverlay}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-6"
        >
          {won ? (
            <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-3" />
          ) : (
            <XCircle className="w-16 h-16 mx-auto text-destructive mb-3" />
          )}
          <h2 className="text-2xl font-bold text-foreground">
            {debrief.sessionStats?.hungUp
              ? 'Prospect Hung Up'
              : debrief.won
                ? 'Deal Won!'
                : debrief.sessionStats && debrief.sessionStats.finalPatience < 30
                  ? 'Deal Lost'
                  : debrief.score >= 40
                    ? 'Almost There. Keep Practicing.'
                    : 'Deal Lost'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {debrief.sessionStats?.hungUp
              ? 'The prospect ran out of patience and ended the call.'
              : debrief.won
                ? 'You earned the prospect\'s trust.'
                : debrief.sessionStats && debrief.sessionStats.finalPatience < 30
                  ? 'The prospect was losing patience. The deal slipped away.'
                  : debrief.score >= 40
                    ? 'Getting closer! A few tweaks and you\'ll close it next time.'
                    : 'The prospect wasn\'t convinced.'}
          </p>
        </motion.div>

        {/* Custom scenario summary */}
        {isCustomMode && customScenario && (
          <div className="bg-muted/50 border border-border rounded-xl p-4 mb-4 text-sm">
            <h3 className="font-semibold text-foreground mb-2">🎯 Your Scenario</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
              <span className="font-medium text-foreground">Product:</span><span>{customScenario.product}</span>
              <span className="font-medium text-foreground">Buyer:</span><span>{customScenario.buyerTitle || '—'}</span>
              <span className="font-medium text-foreground">Industry:</span><span>{customScenario.industry || '—'}</span>
              <span className="font-medium text-foreground">Objection:</span><span>{customScenario.objection}</span>
            </div>
          </div>
        )}

        {/* Score */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Overall Score</span>
            <span className={`text-2xl font-bold ${debrief.score >= 70 ? 'text-green-600' : debrief.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{Math.round(debrief.score)}/100</span>
          </div>
          <Progress value={Math.max(0, Math.min(100, debrief.score))} className="h-2" />
        </div>

        {/* Strengths */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">💪 Strengths</h3>
          <ul className="space-y-2">
            {debrief.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="w-4 h-4 mt-0.5 text-primary-600 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Gaps */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">🔍 Areas to Improve</h3>
          <ul className="space-y-2">
            {debrief.gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
                {g}
              </li>
            ))}
          </ul>
        </div>

        {/* Tip */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-1">💡 Coach's Tip</h3>
          <p className="text-sm text-muted-foreground">{debrief.tip}</p>
        </div>

        {/* Session Stats */}
        {debrief.sessionStats && (
          <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
            <h3 className="font-semibold text-foreground mb-3">📊 Session Stats</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Rounds Completed</span>
                <span className="font-semibold text-foreground">{debrief.sessionStats.roundsCompleted}/{MAX_ROUNDS}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Avg Response Time</span>
                <span className="font-semibold text-foreground">{debrief.sessionStats.avgResponseTime}s</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Final Patience</span>
                <span className={`font-semibold ${debrief.sessionStats.finalPatience > 60 ? 'text-green-600' : debrief.sessionStats.finalPatience > 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {Math.round(debrief.sessionStats.finalPatience)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Prospect Hung Up</span>
                <span className={`font-semibold ${debrief.sessionStats.hungUp ? 'text-red-600' : 'text-green-600'}`}>
                  {debrief.sessionStats.hungUp ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Post-session CTA based on user tier */}
        {isGuest ? (
          // Guest (not logged in)
          <div className="bg-card border border-border rounded-xl p-5 mb-4 text-center shadow-sm">
            <UserPlus className="w-8 h-8 mx-auto text-primary mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Want to keep practicing?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Grab a round pack starting at $4.99, or go unlimited with Pro.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/signup')} className="flex-1">
                Create Account <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button onClick={() => handleGoProCheckout('solo')} disabled={checkoutLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {checkoutLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</> : <>Go Pro for $29/mo <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </div>
          </div>
        ) : !isPremium ? (
          // Authenticated, not subscribed
          <div className="bg-card border border-border rounded-xl p-5 mb-4 text-center shadow-sm">
            <Sparkles className="w-8 h-8 mx-auto text-primary mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Ready to master every objection?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {remainingAttempts > 0
                ? `You have ${remainingAttempts} round${remainingAttempts === 1 ? '' : 's'} left. Go unlimited with Pro for custom scenarios and detailed analytics.`
                : `You're out of rounds. Grab another pack or go unlimited with Pro for custom scenarios and detailed analytics.`}
            </p>
            <Button onClick={() => handleGoProCheckout('solo')} disabled={checkoutLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {checkoutLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</> : <>Upgrade to Pro — $29/mo <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </div>
        ) : null}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleTryAnother} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" /> Try Another Objection
          </Button>
          <Button onClick={() => { handleTryAnother(); }} className="flex-1 bg-primary-500 hover:bg-primary-600 text-white">
            Run It Back <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Upgrade Paywall Modal */}
        <UpgradePaywallModal open={showPaywall} />

        {/* Contextual upgrade modal — fires AFTER user reads debrief, on continue action */}
        <Suspense fallback={null}>
          {showContextualUpgrade && (
            <ContextualUpgradeModal
              open={showContextualUpgrade}
              isUpgradeLoading={checkoutLoading}
              onUpgrade={async () => {
                if (upgradeEventIdRef.current) {
                  await upgradeMarkConverted(upgradeEventIdRef.current);
                }
                handleGoProCheckout('solo');
                setShowContextualUpgrade(false);
              }}
              onSkip={async () => {
                if (upgradeEventIdRef.current) {
                  await upgradeMarkDismissed(upgradeEventIdRef.current);
                }
                setShowContextualUpgrade(false);
                pendingResetRef.current?.();
                pendingResetRef.current = null;
              }}
            />
          )}
        </Suspense>
      </div>
    );
  }

  // ── Render: Conversation ───────────────────────────────────
  return (
    <div
      className="max-w-2xl mx-auto flex flex-col relative"
      style={{
        height: compact
          ? (viewportHeight ? `${Math.min(viewportHeight - 20, window.innerHeight * 0.7)}px` : '70vh')
          : viewportHeight ? `${viewportHeight}px` : '100dvh',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        // When the mobile keyboard is open, add bottom padding equal to the
        // keyboard height so the sticky input is pushed above the keyboard
        // instead of being obscured by it.
        paddingBottom: isInputFocused ? `${keyboardHeight}px` : 0,
        transition: 'padding-bottom 0.2s ease-out',
      }}
    >
      {/* Debrief loading overlay */}
      <AnimatePresence>
        {isTransitioningToDebrief && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm rounded-xl"
          >
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <motion.p
              key={debriefLoadingMsgIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-medium text-muted-foreground"
            >
              {DEBRIEF_LOADING_MESSAGES[debriefLoadingMsgIndex]}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Facebook in-app browser warning banner */}
      {isFbBrowser && !fbBannerDismissed && (
        <div className="mt-3 mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-start gap-2 shrink-0">
          <span className="flex-1 leading-snug">
            For the best experience, tap <span className="font-semibold">⋯</span> in the top right, then <span className="font-semibold">"Open in Browser"</span>.
          </span>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                toast({ title: 'Link copied', description: 'Paste it into Safari or Chrome.' });
              } catch {
                toast({
                  title: "Couldn't copy link",
                  description: 'Long-press the address bar to copy manually.',
                  variant: 'destructive',
                });
              }
            }}
            className="shrink-0 rounded-md border border-amber-400 bg-white px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
          >
            Copy Link
          </button>
          <button
            type="button"
            onClick={() => setFbBannerDismissed(true)}
            aria-label="Dismiss banner"
            className="shrink-0 rounded-md p-1 text-amber-900/60 hover:text-amber-900"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pt-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground">{currentProspectName}</h2>
          <p className="text-xs text-muted-foreground">{currentProspectTitle} · {presetScenario ? presetScenario.objectionLabel : isCustomMode ? 'Custom' : selectedObjection?.label} objection</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runDebrief(messages)}
          disabled={isAiTyping || messages.length < 2}
        >
          End Session
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4 shrink-0">
        {Array.from({ length: MAX_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < currentRound ? 'bg-primary-500' : 'bg-border'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2">Round {Math.min(currentRound, MAX_ROUNDS)}</span>
      </div>

      {/* Patience meter */}
      <div className="mb-3 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            {patience > 60 ? '😊' : patience > 30 ? '😐' : '😤'} Prospect Patience
          </span>
          <span className="text-xs font-semibold text-muted-foreground">{Math.round(patience)}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full transition-colors duration-300"
            style={{
              width: `${patience}%`,
              background: patience > 60
                ? '#22c55e'
                : patience > 30
                  ? '#eab308'
                  : '#ef4444',
            }}
            initial={false}
            animate={{ width: `${patience}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {hangUpOverlay}

      {/* Chat messages */}
      <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-4 pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}
              >
                {msg.role === 'prospect' && (
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold opacity-70">{currentProspectName}</span>
                    {shouldSpeak && (
                      <button
                        onClick={() => speakEL(msg.text, presetScenario?.voiceId)}
                        className="ml-2 p-0.5 rounded hover:bg-foreground/10 transition-colors"
                        aria-label="Replay message"
                        title="Replay message"
                      >
                        <Volume2 className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                      </button>
                    )}
                  </div>
                )}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator — hide during debrief transition so it doesn't flash after final round */}
        {isAiTyping && !isTransitioningToDebrief && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1">
              <span className="block text-xs font-semibold text-muted-foreground mb-1">{currentProspectName}</span>
              <div className="flex gap-1 ml-2">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground/40"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2 items-end sticky bottom-0 bg-background pb-4 pt-2 shrink-0">
        {(inputMode === 'voice' || alwaysSpeak) && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              // In cold call mode, auto-switch to voice mode on first tap
              if (inputMode !== 'voice') setInputMode('voice');
              toggleVoice();
            }}
            className={isListening ? 'border-destructive text-destructive animate-pulse' : isProcessingVoice ? 'border-yellow-500 text-yellow-500' : ''}
            disabled={isAiTyping || hungUp || isProcessingVoice}
            title={isProcessingVoice ? 'Processing voice...' : isListening ? 'Stop recording' : 'Tap to speak'}
            aria-label={isProcessingVoice ? 'Processing voice…' : isListening ? 'Stop recording' : 'Start voice recording'}
          >
            {isProcessingVoice ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
          </Button>
        )}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => { setUserInput(e.target.value); if (e.target.value.length > 0) setIsUserTyping(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isListening && !isProcessingVoice) { e.preventDefault(); sendMessage(); } }}
            onFocus={() => {
              setIsInputFocused(true);
              // Wait for the mobile keyboard to open + the padding-bottom
              // transition to settle, then scroll the input and the latest
              // message into view so both sit above the keyboard.
              setTimeout(() => {
                inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }, 300);
            }}
            onBlur={() => setIsInputFocused(false)}
            placeholder={isProcessingVoice ? 'Processing voice…' : isListening ? 'Recording… tap mic or Send when done' : 'Type your response…'}
            disabled={isAiTyping || hungUp || isListening || isProcessingVoice}
            className="w-full rounded-xl border border-input bg-card px-4 py-3 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          {/* Response timer */}
          {!isAiTyping && !hungUp && phase === 'conversation' && messages.length > 0 && (
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-mono tabular-nums ${
                timerSeconds <= 7 ? 'text-red-500' : timerSeconds <= 15 ? 'text-yellow-500' : 'text-muted-foreground/60'
              }`}
            >
              <Clock className="w-3 h-3" />
              {timerSeconds}s
            </span>
          )}
        </div>
        <Button
          onClick={async () => {
            // If in voice/recording mode, stop and process first, then send
            if (isListening) {
              console.log('[VOICE] Send button pressed while recording');
              // Unmute TTS now that mic is stopping
              unmuteSpeech();
              if (voiceManagerRef.current?.isCurrentlyRecording()) {
                const duration = voiceManagerRef.current.getRecordingDuration();
                console.log('[VOICE] Stopping recording via Send, duration:', duration, 'ms');
                setIsListening(false);
                setIsProcessingVoice(true);
                try {
                  const blob = await voiceManagerRef.current.stopRecording();
                  voiceManagerRef.current = null;
                  console.log('[VOICE] Recording stopped, blob size:', blob.size, 'type:', blob.type);
                  console.log('[VOICE] MIME check:', blob.type, 'passes:', !blob.type || blob.type.startsWith('audio/'));
                  toast({ title: `Recording: ${duration}ms, ${blob.size} bytes`, description: 'Sending to Whisper…' });
                  console.log('[VOICE] Sending to Whisper, blob size:', blob.size);
                  const result = await processVoiceInput(blob);
                  console.log('[VOICE] Whisper raw response:', JSON.stringify(result.rawTranscript));
                  console.log('[VOICE] Sanitized transcript:', JSON.stringify(result.transcript));
                  toast({ title: `Whisper: "${result.rawTranscript}"`, description: `${duration}ms · ${result.blobSize} bytes · ${result.blobType}` });
                  if (result.transcript && result.transcript.trim().length > 0) {
                    // Auto-send transcribed voice input directly
                    console.log('[VOICE] Calling sendMessage with:', JSON.stringify(result.transcript));
                    sendMessage(result.transcript);
                    console.log('[VOICE] sendMessage completed');
                  } else {
                    console.log('[VOICE] Empty transcript, aborting send');
                    toast({ title: "Couldn't capture your voice", description: "Please try again.", variant: "destructive" });
                  }
                } catch (err: any) {
                  const isHallucination = err?.message === 'WHISPER_HALLUCINATION';
                  console.log('[VOICE] Hallucination check: rejected:', isHallucination, 'error:', err?.message);
                  toast({
                    title: isHallucination
                      ? "Couldn't hear you clearly"
                      : "Couldn't capture your voice",
                    description: isHallucination
                      ? "Try again closer to the mic."
                      : "Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsProcessingVoice(false);
                }
              } else {
                // Recording state is inconsistent (e.g. MediaRecorder errored) — reset
                setIsListening(false);
                voiceManagerRef.current = null;
                toast({ title: "Recording interrupted", description: "Please try again.", variant: "destructive" });
              }
              return;
            }
            sendMessage();
          }}
          disabled={(!userInput.trim() && !isListening) || isAiTyping || hungUp || isProcessingVoice}
          className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-5"
        >
          {isProcessingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : isListening ? 'Stop & Send' : 'Send'}
        </Button>
      </div>
    </div>
  );
};

export default GamifiedRoleplay;
