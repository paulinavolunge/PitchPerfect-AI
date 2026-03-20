import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mic, ArrowRight, RotateCcw, Trophy, XCircle, ChevronRight, UserPlus, Lock, Sparkles, Volume2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFreeTrialLimit } from '@/hooks/useFreeTrialLimit';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UpgradePaywallModal from '@/components/practice/UpgradePaywallModal';

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
}

type InputMode = 'text' | 'voice';
type Phase = 'select-objection' | 'custom-form' | 'select-mode' | 'conversation' | 'debrief';

// ── Constants ──────────────────────────────────────────────────
const MAX_ROUNDS = 3;

const OBJECTIONS: ObjectionCard[] = [
  { id: 'budget', label: 'Budget', emoji: '💰', description: '"We don\'t have the budget right now."' },
  { id: 'think', label: 'Think About It', emoji: '🤔', description: '"Let me think about it and get back to you."' },
  { id: 'email', label: 'Send Me an Email', emoji: '📧', description: '"Just send me an email with the details."' },
  { id: 'competitor', label: 'Using a Competitor', emoji: '🏢', description: '"We already use [Competitor] for that."' },
  { id: 'timing', label: 'Bad Timing', emoji: '⏰', description: '"It\'s not a good time for us right now."' },
  { id: 'team', label: 'Loop in Team', emoji: '👥', description: '"I need to loop in my team before deciding."' },
];

const PROSPECT_NAMES = [
  { first: 'Dana', last: 'Kowalski' },
  { first: 'Marcus', last: 'Chen' },
  { first: 'Priya', last: 'Nair' },
  { first: 'James', last: 'Okafor' },
  { first: 'Samira', last: 'Hadid' },
  { first: 'Tomás', last: 'Reyes' },
  { first: 'Rachel', last: 'Brennan' },
  { first: 'Kenji', last: 'Watanabe' },
  { first: 'Elena', last: 'Petrov' },
  { first: 'David', last: 'Lundgren' },
  { first: 'Aisha', last: 'Mwangi' },
  { first: 'Carlos', last: 'Navarro' },
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
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const currentProspectName = isCustomMode ? prospectInfo.name : prospectInfo.name;
  const currentProspectTitle = isCustomMode && customScenario?.buyerTitle ? customScenario.buyerTitle : prospectInfo.title;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
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

  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    hasReachedLimit,
    incrementAttempt,
    isGuest,
    remainingAttempts,
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

  // Scroll to top when debrief appears
  useEffect(() => {
    if (phase === 'debrief') {
      window.scrollTo(0, 0);
      chatContainerRef.current?.scrollTo(0, 0);
    }
  }, [phase]);

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
    } finally {
      setIsAiTyping(false);
    }
  }, [selectedObjection, callAI, inputMode, speakText, isCustomMode, customScenario, currentProspectName, currentProspectTitle]);

  // ── Send message ───────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = userInput.trim();
    if (!text || isAiTyping || (!selectedObjection && !isCustomMode)) return;

    // Stop any ongoing speech when user sends a message
    stopSpeech();

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setUserInput('');
    setIsAiTyping(true);

    const nextRound = currentRound + 1;

    // If we've exceeded max rounds, go straight to debrief (no more AI calls)
    if (nextRound > MAX_ROUNDS) {
      setIsAiTyping(false);
      await runDebrief(updatedMessages);
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
      if (inputMode === 'voice') speakText(response);

      // Auto-trigger debrief after the LAST round's AI response
      if (nextRound >= MAX_ROUNDS) {
        setIsAiTyping(false);
        await runDebrief(allMessages);
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
        await runDebrief(allMessages);
        return;
      }
    } finally {
      setIsAiTyping(false);
    }
  }, [userInput, isAiTyping, selectedObjection, messages, currentRound, callAI, stopSpeech, speakText, inputMode]);

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
    if (!selectedObjection) return;
    setIsAiTyping(true);

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
          practiceMode: 'text',
          scenario: {
            objection: selectedObjection.id,
            industry: 'general',
            difficulty: 'medium',
          },
          context: 'sales roleplay objection handling practice',
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

        setDebrief({
          won: finalScore >= 7,
          score: finalScore,
          strengths: parsed.strengths ?? ['Engaged with the prospect'],
          gaps: parsed.improvements ?? ['Could dig deeper into root concerns'],
          tip: parsed.recommendation ?? 'Focus on asking discovery questions before presenting solutions.',
        });
      } else {
        throw new Error('No analysis data');
      }
    } catch (err) {
      console.error('[GamifiedRoleplay] Debrief error, using local scoring:', err);
      const localScore = computeLocalScore(finalMessages);
      setDebrief({
        won: localScore >= 7,
        score: localScore,
        strengths: ['Stayed engaged throughout the conversation', 'Attempted to address objections'],
        gaps: ['Consider asking more discovery questions', 'Provide more specific evidence and ROI data'],
        tip: 'Next time, acknowledge the objection first before presenting your counter-argument.',
      });
    } finally {
      setIsAiTyping(false);
      setPhase('debrief');

      // Track the completed session attempt AFTER debrief
      await incrementAttempt({
        scenario_type: selectedObjection?.label ?? 'practice',
        difficulty: 'medium',
        industry: 'general',
        duration_seconds: 0,
        score: null,
      });
      refreshCount();
    }
  }, [selectedObjection, incrementAttempt, refreshCount, computeLocalScore]);

  // ── Voice input ────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(prev => prev + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // ── Reset ──────────────────────────────────────────────────
  const handleTryAnother = () => {
    // After completing a session, check if the user has hit their limit
    if (hasReachedLimit) {
      if (isGuest) {
        // Guest used their 1 free session — don't reset, show signup prompt (rendered in debrief)
        return;
      } else {
        // Free user used their 3 monthly sessions — show paywall
        setShowPaywall(true);
        return;
      }
    }

    // Still has attempts — reset normally
    setPhase('select-objection');
    setSelectedObjection(null);
    setCustomScenario(null);
    setIsCustomMode(false);
    setCustomForm({ product: '', buyerTitle: '', industry: '', objection: '' });
    setMessages([]);
    setCurrentRound(0);
    setUserInput('');
    setDebrief(null);
    setIsAiTyping(false);
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
    setDebrief(null);
    setIsAiTyping(false);
  };

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

        <div className="flex gap-4 justify-center mb-8">
          {(['text', 'voice'] as InputMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setInputMode(mode)}
              className={`flex flex-col items-center gap-2 px-8 py-5 rounded-xl border-2 transition-all ${
                inputMode === mode
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-border bg-card hover:border-primary-300'
              }`}
            >
              {mode === 'text' ? <MessageSquare className="w-6 h-6 text-primary-600" /> : <Mic className="w-6 h-6 text-primary-600" />}
              <span className="font-medium text-foreground capitalize">{mode}</span>
            </button>
          ))}
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
            {debrief.score >= 7 ? 'Deal Won!' : debrief.score >= 4 ? 'Almost There — Keep Practicing' : 'Deal Lost'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {debrief.score >= 7
              ? 'You earned the prospect\'s trust.'
              : debrief.score >= 4
                ? 'Getting closer! A few tweaks and you\'ll close it next time.'
                : 'The prospect wasn\'t convinced.'}
          </p>
        </motion.div>

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

        {/* Post-session gating: show appropriate CTA based on user state */}
        {hasReachedLimit && isGuest ? (
          // Guest used their 1 free session — prompt to create account
          <div className="bg-muted border border-border rounded-xl p-5 mb-4 text-center">
            <UserPlus className="w-8 h-8 mx-auto text-primary mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Want to keep practicing?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a free account and get {FREE_ACCOUNT_MONTHLY_LIMIT} practice sessions per month — free forever.
            </p>
            <Button onClick={() => navigate('/signup')} className="w-full bg-primary-500 hover:bg-primary-600 text-white">
              <UserPlus className="w-4 h-4 mr-2" /> Create Free Account
            </Button>
          </div>
        ) : hasReachedLimit && !isGuest ? (
          // Free user hit their monthly limit — show upgrade prompt
          <div className="bg-muted border border-border rounded-xl p-5 mb-4 text-center">
            <Lock className="w-8 h-8 mx-auto text-primary mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Monthly limit reached</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You've used all {currentLimit} free sessions this month. Upgrade for unlimited practice.
            </p>
            <Button onClick={() => setShowPaywall(true)} className="w-full bg-primary-500 hover:bg-primary-600 text-white">
              <ArrowRight className="w-4 h-4 mr-2" /> View Plans
            </Button>
          </div>
        ) : (
          // Still has attempts — normal "Try Another" button
          <Button onClick={handleTryAnother} className="w-full bg-primary-500 hover:bg-primary-600 text-white">
            <RotateCcw className="w-4 h-4 mr-2" /> Try Another Objection
          </Button>
        )}

        {/* Upgrade Paywall Modal */}
        <UpgradePaywallModal open={showPaywall} />
      </div>
    );
  }

  // ── Render: Conversation ───────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: '100dvh', padding: '0 1.5rem' }}>
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

        {/* Typing indicator */}
        {isAiTyping && (
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
            disabled={isAiTyping}
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          onFocus={() => setTimeout(scrollToBottom, 300)}
          placeholder={isListening ? 'Listening…' : 'Type your response…'}
          disabled={isAiTyping}
          className="flex-1 rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button
          onClick={sendMessage}
          disabled={!userInput.trim() || isAiTyping}
          className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-5"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default GamifiedRoleplay;
