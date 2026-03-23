import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mic, ArrowRight, RotateCcw, Trophy, XCircle, ChevronRight, UserPlus, Lock, Sparkles, Volume2, Star, Clock, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFreeTrialLimit } from '@/hooks/useFreeTrialLimit';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UpgradePaywallModal from '@/components/practice/UpgradePaywallModal';
import { toast } from '@/hooks/use-toast';

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

interface DebriefData {
  won: boolean;
  score: number;
  strengths: string[];
  gaps: string[];
  tip: string;
  sessionStats?: {
    roundsCompleted: number;
    avgResponseTime: number;
    finalPatience: number;
    hungUp: boolean;
  };
}

type InputMode = 'text' | 'voice';
type Phase = 'select-objection' | 'custom-form' | 'select-mode' | 'conversation' | 'debrief';

// ── Constants ──────────────────────────────────────────────────
const MAX_ROUNDS = 6;

const OBJECTIONS: ObjectionCard[] = [
  { id: 'budget', label: 'Budget', emoji: '💰', description: '"We don\'t have the budget right now."' },
  { id: 'think', label: 'Think About It', emoji: '🤔', description: '"Let me think about it and get back to you."' },
  { id: 'email', label: 'Send Me an Email', emoji: '📧', description: '"Just send me an email with the details."' },
  { id: 'competitor', label: 'Using a Competitor', emoji: '🏢', description: '"We already use another vendor for that."' },
  { id: 'timing', label: 'Bad Timing', emoji: '⏰', description: '"It\'s not a good time for us right now."' },
  { id: 'team', label: 'Loop in Team', emoji: '👥', description: '"I need to loop in my team before deciding."' },
];

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
const GamifiedRoleplay: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('select-objection');
  const [selectedObjection, setSelectedObjection] = useState<ObjectionCard | null>(null);
  const [customScenario, setCustomScenario] = useState<CustomScenario | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customForm, setCustomForm] = useState<CustomScenario>({ product: '', buyerTitle: '', industry: '', objection: '' });
  const [prospectInfo] = useState(() => pickRandomProspect());
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isTransitioningToDebrief, setIsTransitioningToDebrief] = useState(false);
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [isListening, setIsListening] = useState(false);
  const isManualStopRef = useRef(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // ── Patience & Timer state ─────────────────────────────────
  const RESPONSE_TIMER_MAX = 25;
  const [patience, setPatience] = useState(100);
  const [timerSeconds, setTimerSeconds] = useState(RESPONSE_TIMER_MAX);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [hungUp, setHungUp] = useState(false);
  const [showHangUpAnimation, setShowHangUpAnimation] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const lastProspectMsgTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const patienceRef = useRef(100); // keep ref in sync for interval callbacks
  const sessionStartTimeRef = useRef<number>(0);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  }, []);

  const currentProspectName = isCustomMode ? prospectInfo.name : prospectInfo.name;
  const currentProspectTitle = isCustomMode && customScenario?.buyerTitle ? customScenario.buyerTitle : prospectInfo.title;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const runDebriefRef = useRef<(msgs: ChatMessage[]) => Promise<void>>();
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

  // ── TTS: find a female voice ──────────────────────────────
  const getPreferredVoice = useCallback((): SpeechSynthesisVoice | null => {
    const synth = synthRef.current;
    if (!synth) return null;
    const voices = synth.getVoices();
    const preferred = ['samantha', 'google us english female', 'microsoft zira', 'female'];
    for (const pref of preferred) {
      const match = voices.find(v => v.name.toLowerCase().includes(pref));
      if (match) return match;
    }
    // fallback: any English voice
    return voices.find(v => v.lang.startsWith('en')) || null;
  }, []);

  const speakText = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel(); // stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  }, [getPreferredVoice]);

  const stopSpeech = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const {
    hasReachedLimit,
    incrementAttempt,
    isGuest,
    remainingAttempts,
    attemptCount,
    currentLimit,
    FREE_ACCOUNT_MONTHLY_LIMIT,
    refreshCount,
  } = useFreeTrialLimit();

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

  // ── Dynamic viewport height for mobile keyboard ───────────
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      setViewportHeight(vv.height);
      // Scroll the last message into view when keyboard resizes viewport
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // ── Cancel TTS immediately when debrief appears ───────────
  useEffect(() => {
    if (debrief) {
      window.speechSynthesis?.cancel();
    }
  }, [debrief]);

  // ── Patience timer: counts down when user is idle ──────────
  useEffect(() => {
    // Only run timer during conversation phase, when it's user's turn (not AI typing), and not hung up
    // PAUSE when user is actively typing or speaking in voice mode
    if (phase !== 'conversation' || isAiTyping || hungUp || isUserTyping || isListening) {
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
        if (prev <= 1) {
          // Timer ran out — deplete patience by 20%
          const newPatience = Math.max(0, patienceRef.current - 20);
          patienceRef.current = newPatience;
          setPatience(newPatience);
          // Reset timer for next cycle
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
  }, [phase, isAiTyping, hungUp, isUserTyping, isListening, currentRound, messages.length]);

  // Keep patienceRef in sync
  useEffect(() => {
    patienceRef.current = patience;
  }, [patience]);

  // ── Hang-up trigger: patience hits 0 ────────────────────────
  useEffect(() => {
    if (patience <= 0 && phase === 'conversation' && !hungUp) {
      setHungUp(true);
      setShowHangUpAnimation(true);
      stopSpeech();
      // Stop any active speech recognition
      if (recognitionRef.current) {
        isManualStopRef.current = true;
        try { recognitionRef.current.stop(); } catch (_) {}
        try { recognitionRef.current.abort(); } catch (_) {}
        recognitionRef.current = null;
        setIsListening(false);
      }
      // Show hang-up animation for 2.5 seconds, then trigger debrief
      setTimeout(() => {
        setShowHangUpAnimation(false);
        runDebriefRef.current!(messages);
      }, 2500);
    }
  }, [patience, phase, hungUp, messages, stopSpeech]);

  // Scroll to top and stop TTS when debrief appears
  useEffect(() => {
    if (phase === 'debrief') {
      stopSpeech();
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      window.scrollTo(0, 0);
      chatContainerRef.current?.scrollTo(0, 0);
    }
  }, [phase, stopSpeech]);

  // ── AI Call ────────────────────────────────────────────────
  const callAI = useCallback(async (systemPrompt: string, userMsg: string, history: ChatMessage[]): Promise<string> => {
    const conversationHistory = history.map(m => ({
      sender: m.role === 'user' ? 'user' : 'assistant',
      text: m.text,
    }));

    const payload: Record<string, any> = {
      userInput: userMsg,
      scenario: {
        objection: selectedObjection?.label || customScenario?.objection || 'Need',
        difficulty: 'medium',
        industry: customScenario?.industry || 'general',
      },
      voiceStyle: 'skeptical',
      userScript: null,
      conversationHistory,
      isReversedRole: true,
      prospectName: currentProspectName,
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
    if (!selectedObjection && !isCustomMode) return;
    setPhase('conversation');
    setIsAiTyping(true);

    try {
      const systemPrompt = isCustomMode
        ? '' // custom prompt is built server-side
        : buildSystemPrompt(selectedObjection!, currentProspectName, currentProspectTitle);
      const openingLine = isCustomMode && customScenario
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
      if (inputMode === 'voice') speakText(response);
    } catch (err) {
      console.error('[GamifiedRoleplay] Failed to get opening response:', err);
      setMessages([{
        id: crypto.randomUUID(),
        role: 'prospect',
        text: isCustomMode && customScenario
          ? customScenario.objection
          : (selectedObjection?.description.replace(/"/g, '') || 'What can I do for you?'),
        timestamp: new Date(),
      }]);
      setCurrentRound(1);
      sessionStartTimeRef.current = Date.now();
    } finally {
      setIsAiTyping(false);
    }
  }, [selectedObjection, callAI, inputMode, speakText, isCustomMode, customScenario, currentProspectName, currentProspectTitle]);

  // ── Send message ───────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = userInput.trim();
    if (!text || isAiTyping || hungUp || (!selectedObjection && !isCustomMode)) return;

    // Stop any ongoing speech when user sends a message
    stopSpeech();

    // Track response time
    const responseTime = (Date.now() - lastProspectMsgTimeRef.current) / 1000;
    setResponseTimes(prev => [...prev, responseTime]);

    // Patience depletion based on response quality
    let patienceDrop = 3; // default: natural decay for good-length response
    if (text.split(/\s+/).filter(Boolean).length < 3) {
      patienceDrop = 8; // short/lazy response
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
        isCustomMode ? '' : buildSystemPrompt(selectedObjection!, currentProspectName, currentProspectTitle),
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
      if (inputMode === 'voice') speakText(response);

      // Round-based patience decay (3% per round)
      const roundPatience = Math.max(0, patienceRef.current - 3);
      patienceRef.current = roundPatience;
      setPatience(roundPatience);

      // Auto-trigger debrief after the LAST round's AI response
      if (nextRound >= MAX_ROUNDS) {
        setIsAiTyping(false);
        setIsTransitioningToDebrief(true);
        await runDebriefRef.current!(allMessages);
        return;
      }
    } catch (err) {
      console.error('[GamifiedRoleplay] Failed to get AI response for round', nextRound, ':', err);
      const fallbackMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'prospect',
        text: "I'm running short on time. Let's wrap this up — what's the bottom line?",
        timestamp: new Date(),
      };
      const allMessages = [...updatedMessages, fallbackMsg];
      setMessages(allMessages);
      setCurrentRound(nextRound);

      // Even on error, auto-trigger debrief if this was the last round
      if (nextRound >= MAX_ROUNDS) {
        setIsAiTyping(false);
        setIsTransitioningToDebrief(true);
        await runDebriefRef.current!(allMessages);
        return;
      }
    } finally {
      setIsAiTyping(false);
    }
  }, [userInput, isAiTyping, hungUp, selectedObjection, isCustomMode, customScenario, messages, currentRound, callAI, stopSpeech, speakText, inputMode, currentProspectName, currentProspectTitle]);

  // ── Local fallback scoring ─────────────────────────────────
  const computeLocalScore = useCallback((finalMessages: ChatMessage[]): number => {
    const userMessages = finalMessages.filter(m => m.role === 'user');
    const allUserText = userMessages.map(m => m.text.toLowerCase()).join(' ');
    let score = 0;

    // Did the rep acknowledge the objection? (+2)
    const ackPatterns = /understand|hear you|appreciate|that makes sense|i get that|totally fair|valid concern|fair point|makes sense|respect/i;
    if (ackPatterns.test(allUserText)) score += 2;

    // Did they ask a discovery question? (+2)
    const hasQuestion = userMessages.some(m => m.text.includes('?'));
    if (hasQuestion) score += 2;

    // Did they provide social proof or data? (+2)
    const proofPatterns = /\d|%|\$|roi|clients|client|customers|customer|company|companies|percent|result|case study|data|saved|increased|reduced|example|similar|industry|revenue|growth|return/i;
    if (proofPatterns.test(allUserText)) score += 2;

    // Did they propose a next step? (+2)
    const nextStepPatterns = /schedule|meeting|call|next step|demo|pilot|trial|let me show|walk you through|send you|quick call|follow up|set up|book|agenda/i;
    if (nextStepPatterns.test(allUserText)) score += 2;

    // Did they stay professional and give substantive responses? (+2)
    const unprofessional = /whatever|don't care|your loss|fine then|forget it|stupid/i;
    const avgWordCount = userMessages.reduce((sum, m) => sum + m.text.split(/\s+/).length, 0) / (userMessages.length || 1);
    if (!unprofessional.test(allUserText) && avgWordCount > 10) score += 2;

    return Math.max(1, Math.min(10, score));
  }, []);

  // ── End & Debrief ──────────────────────────────────────────
  const runDebrief = useCallback(async (finalMessages: ChatMessage[]) => {
    stopSpeech();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
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

    try {
      // Build full transcript in Rep/Prospect format
      const transcript = finalMessages
        .map(m => `${m.role === 'user' ? 'Rep' : 'Prospect'}: ${m.text}`)
        .join('\n');

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

      const response = await fetch(`${supabaseUrl}/functions/v1/pitch-analysis`, {
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GamifiedRoleplay] pitch-analysis error:', response.status, errorText);
        throw new Error(`pitch-analysis error: ${response.status}`);
      }

      const data = await response.json();

      if (data?.analysis) {
        const parsed = typeof data.analysis === 'string' ? JSON.parse(data.analysis) : data.analysis;

        // pitch-analysis returns overallScore on a 1-100 scale; convert to X.X/10
        const rawScore = parsed.overallScore ?? parsed.overall_score ?? parsed.score ?? 50;
        const apiScore = rawScore > 10 ? Math.round(rawScore) / 10 : rawScore;

        // Compute local fallback score based on conversation content
        const localScore = computeLocalScore(finalMessages);

        // Use the HIGHER of the two scores to avoid unfairly low ratings
        const finalScore = Math.max(apiScore, localScore);

        console.log('API score:', apiScore, 'Local score:', localScore, 'Final:', finalScore);

        // Determine outcome factoring in patience state
        const didHangUp = sessionStats.hungUp;
        const lowPatience = sessionStats.finalPatience < 30;
        const won = !didHangUp && !lowPatience && finalScore >= 7;

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
      const localScore = computeLocalScore(finalMessages);
      // Determine outcome factoring in patience state
      const didHangUp = sessionStats.hungUp;
      const lowPatience = sessionStats.finalPatience < 30;
      const won = !didHangUp && !lowPatience && localScore >= 7;

      setDebrief({
        won,
        score: localScore,
        strengths: ['Stayed engaged throughout the conversation', 'Attempted to address objections'],
        gaps: sessionStats.hungUp
          ? ['The prospect lost patience before you could finish. Work on being more concise and responding faster.', 'Consider asking more discovery questions', 'Provide more specific evidence and ROI data']
          : ['Consider asking more discovery questions', 'Provide more specific evidence and ROI data'],
        tip: 'Next time, acknowledge the objection first before presenting your counter-argument.',
        sessionStats,
      });
    } finally {
      setIsAiTyping(false);
      setPhase('debrief');

      // Track the completed session attempt AFTER debrief
      await incrementAttempt({
        scenario_type: isCustomMode && customScenario ? `custom: ${customScenario.objection}` : (selectedObjection?.label ?? 'practice'),
        difficulty: 'medium',
        industry: isCustomMode && customScenario ? customScenario.industry : 'general',
        duration_seconds: sessionStartTimeRef.current ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000) : 0,
        score: null,
      });
      refreshCount();
    }
  }, [selectedObjection, isCustomMode, customScenario, incrementAttempt, refreshCount, computeLocalScore, stopSpeech, responseTimes, currentRound, hungUp]);

  // Keep ref always pointing to latest runDebrief
  runDebriefRef.current = runDebrief;

  const toggleVoice = useCallback(() => {
    // If currently listening, do a manual stop
    if (isListening) {
      isManualStopRef.current = true;
      try { recognitionRef.current?.stop(); } catch (_) {}
      try { recognitionRef.current?.abort(); } catch (_) {}
      recognitionRef.current = null;
      accumulatedTranscriptRef.current = '';
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Voice not supported",
        description: "Voice isn't supported in this browser. Try Chrome or Safari.",
        variant: "destructive",
      });
      setInputMode('text');
      return;
    }

    // Create a brand new instance every time — stop and abort any lingering previous one
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    isManualStopRef.current = false;
    accumulatedTranscriptRef.current = '';

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      // Rebuild transcript from ALL results in this event — never append to existing input
      let finalText = '';
      let lastInterim = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          // Only keep the very last interim result
          lastInterim = transcript;
        }
      }
      const currentText = accumulatedTranscriptRef.current + finalText + lastInterim;
      setUserInput(currentText);

      // When we get a final result, save it to accumulated and prepare for restart
      if (finalText) {
        accumulatedTranscriptRef.current = accumulatedTranscriptRef.current + finalText;
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[Voice] recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // If NOT a manual stop and this is still the active instance, auto-restart
      if (!isManualStopRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
          return;
        } catch (e) {
          console.warn('[Voice] failed to auto-restart:', e);
        }
      }
      // Only clean up if this is still the active instance
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

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

  const handleTryAnother = () => {
    // After completing a session, check if the user has hit their limit
    if (hasReachedLimit) {
      if (isGuest) {
        // Guest used their 1 free session — navigate to signup
        navigate('/signup');
        return;
      } else if (!isPremium) {
        // Free user used their 3 monthly sessions — show paywall
        setShowPaywall(true);
        return;
      }
    }

    // Still has attempts (or premium) — reset and go back to objection selection
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
  };

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
  };

  // ── Render: Hang-up overlay (rendered outside phase blocks so it survives phase transitions) ──
  const hangUpOverlay = (
    <AnimatePresence>
      {showHangUpAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [0, -8, 8, -6, 6, -3, 3, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.75)' }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center px-8"
          >
            <Phone className="w-20 h-20 mx-auto text-red-400 mb-5 rotate-[135deg]" />
            <p className="text-3xl font-bold text-white" style={{ fontSize: '28px' }}>
              Click. {currentProspectName} hung up.
            </p>
          </motion.div>
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
          <p className="text-muted-foreground">Pick an objection to practice overcoming</p>
        </div>

        {user?.id && !hasReachedLimit && remainingAttempts !== Infinity && (
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{remainingAttempts} of {currentLimit} free sessions remaining this month</span>
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
              <span className="block text-sm text-muted-foreground mt-0.5">Practice with YOUR real product, buyer, and objection</span>
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
        <p className="text-muted-foreground text-center mb-6">Fill in the details to create a realistic practice session</p>

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
                  if (mode === 'voice' && !(window as any).SpeechRecognition && !(window as any).webkitSpeechRecognition) {
                    toast({
                      title: "Voice not supported",
                      description: "Voice mode isn't supported in this browser. Try Chrome or Safari for the best experience, or use text mode.",
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
                  : debrief.score >= 4
                    ? 'Almost There — Keep Practicing'
                    : 'Deal Lost'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {debrief.sessionStats?.hungUp
              ? 'The prospect ran out of patience and ended the call.'
              : debrief.won
                ? 'You earned the prospect\'s trust.'
                : debrief.sessionStats && debrief.sessionStats.finalPatience < 30
                  ? 'The prospect was losing patience — the deal slipped away.'
                  : debrief.score >= 4
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
            <span className="text-2xl font-bold text-foreground">{debrief.score.toFixed(1)}/10</span>
          </div>
          <Progress value={debrief.score * 10} className="h-2" />
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
          <h3 className="font-semibold text-foreground mb-1">💡 Practice Tip</h3>
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
              Create a free account to get 3 practice sessions per month — or go unlimited with Pro.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/signup')} className="flex-1">
                Sign Up Free <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button onClick={() => handleGoProCheckout('solo')} disabled={checkoutLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {checkoutLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</> : <>Go Pro — $29/mo <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </div>
          </div>
        ) : !isPremium ? (
          // Free user (logged in, not subscribed)
          <div className="bg-card border border-border rounded-xl p-5 mb-4 text-center shadow-sm">
            <Sparkles className="w-8 h-8 mx-auto text-primary mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Ready to master every objection?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              You've used {attemptCount} of 3 free sessions this month. Upgrade to Pro for unlimited practice, custom scenarios, and detailed analytics.
            </p>
            <div className="mb-4">
              <Progress value={Math.min((attemptCount / 3) * 100, 100)} className="h-2" />
              <span className="text-xs text-muted-foreground mt-1 block">{attemptCount}/3 sessions used</span>
            </div>
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
            Practice Again <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Upgrade Paywall Modal */}
        <UpgradePaywallModal open={showPaywall} />
      </div>
    );
  }

  // ── Render: Conversation ───────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh', padding: '0 1.5rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pt-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground">{currentProspectName}</h2>
          <p className="text-xs text-muted-foreground">{currentProspectTitle} · {isCustomMode ? 'Custom' : selectedObjection?.label} objection</p>
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
        <span className="text-xs text-muted-foreground ml-2">Round {Math.min(currentRound, MAX_ROUNDS)}/{MAX_ROUNDS}</span>
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
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                    {inputMode === 'voice' && (
                      <button
                        onClick={() => speakText(msg.text)}
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
        {inputMode === 'voice' && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVoice}
            className={isListening ? 'border-destructive text-destructive animate-pulse' : ''}
            disabled={isAiTyping || hungUp}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => { setUserInput(e.target.value); if (e.target.value.length > 0) setIsUserTyping(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            onFocus={() => {
              setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }, 300);
            }}
            placeholder={isListening ? 'Listening… tap Send when done' : 'Type your response…'}
            disabled={isAiTyping || hungUp}
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
          onClick={() => {
            // Manual stop: set flag, stop+abort recognition, then send
            if (isListening) {
              isManualStopRef.current = true;
              try { recognitionRef.current?.stop(); } catch (_) {}
              try { recognitionRef.current?.abort(); } catch (_) {}
              recognitionRef.current = null;
              accumulatedTranscriptRef.current = '';
              setIsListening(false);
            }
            sendMessage();
          }}
          disabled={!userInput.trim() || isAiTyping || hungUp}
          className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-5"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default GamifiedRoleplay;
