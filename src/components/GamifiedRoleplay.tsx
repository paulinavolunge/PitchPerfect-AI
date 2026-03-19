import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mic, ArrowRight, RotateCcw, Trophy, XCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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

interface DebriefData {
  won: boolean;
  score: number;
  strengths: string[];
  gaps: string[];
  tip: string;
}

type InputMode = 'text' | 'voice';
type Phase = 'select-objection' | 'select-mode' | 'conversation' | 'debrief';

// ── Constants ──────────────────────────────────────────────────
const MAX_ROUNDS = 5;

const OBJECTIONS: ObjectionCard[] = [
  { id: 'budget', label: 'Budget', emoji: '💰', description: '"We don\'t have the budget right now."' },
  { id: 'think', label: 'Think About It', emoji: '🤔', description: '"Let me think about it and get back to you."' },
  { id: 'email', label: 'Send Me an Email', emoji: '📧', description: '"Just send me an email with the details."' },
  { id: 'competitor', label: 'Using a Competitor', emoji: '🏢', description: '"We already use [Competitor] for that."' },
  { id: 'timing', label: 'Bad Timing', emoji: '⏰', description: '"It\'s not a good time for us right now."' },
  { id: 'team', label: 'Loop in Team', emoji: '👥', description: '"I need to loop in my team before deciding."' },
];

const PROSPECT_NAME = 'Dana Kowalski';
const PROSPECT_TITLE = 'VP of Operations';

// ── Helpers ────────────────────────────────────────────────────
function buildSystemPrompt(objection: ObjectionCard): string {
  return `You are ${PROSPECT_NAME}, ${PROSPECT_TITLE} at a mid-market logistics company. You are skeptical, busy, and protective of your budget. Your personality: direct, slightly impatient, but fair — you'll engage if the rep earns it.

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

function buildDebriefPrompt(messages: ChatMessage[], objection: ObjectionCard): string {
  const transcript = messages.map(m => `${m.role === 'user' ? 'Sales Rep' : PROSPECT_NAME}: ${m.text}`).join('\n');
  return `You are a senior sales coach. Analyze this roleplay transcript where a sales rep tried to overcome a "${objection.label}" objection from ${PROSPECT_NAME}.

TRANSCRIPT:
${transcript}

Respond ONLY with valid JSON matching this exact schema (no markdown, no code fences):
{
  "won": boolean,
  "score": number (1-10),
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "tip": "one actionable practice tip"
}

Scoring guide:
- 1-3: Weak — generic responses, no discovery questions, gave up easily
- 4-6: Average — some good moves but missed key opportunities
- 7-8: Strong — good objection handling with evidence and questions
- 9-10: Exceptional — masterful reframing, built genuine trust`;
}

// ── Component ──────────────────────────────────────────────────
const GamifiedRoleplay: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('select-objection');
  const [selectedObjection, setSelectedObjection] = useState<ObjectionCard | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [isListening, setIsListening] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  // ── AI Call ────────────────────────────────────────────────
  const callAI = useCallback(async (systemPrompt: string, userMsg: string, history: ChatMessage[]): Promise<string> => {
    const conversationHistory = history.map(m => ({
      sender: m.role === 'user' ? 'user' : 'ai',
      text: m.text,
    }));

    const { data, error } = await supabase.functions.invoke('roleplay-ai-response', {
      body: {
        userInput: userMsg,
        scenario: { objection: selectedObjection?.label || 'Need', difficulty: 'medium', industry: 'general' },
        voiceStyle: 'skeptical',
        userScript: null,
        conversationHistory: conversationHistory.slice(-6),
        isReversedRole: true,
      },
    });

    if (error || !data?.response) throw new Error('AI response failed');
    return data.response;
  }, [selectedObjection]);

  // ── Start conversation ─────────────────────────────────────
  const startConversation = useCallback(async () => {
    if (!selectedObjection) return;
    setPhase('conversation');
    setIsAiTyping(true);

    try {
      const response = await callAI(
        buildSystemPrompt(selectedObjection),
        `I'm a sales rep and I'd like to talk to you about our solution. Can I have a few minutes of your time?`,
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
    } catch {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'prospect',
        text: selectedObjection.description.replace(/"/g, ''),
        timestamp: new Date(),
      }]);
      setCurrentRound(1);
    } finally {
      setIsAiTyping(false);
    }
  }, [selectedObjection, callAI]);

  // ── Send message ───────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = userInput.trim();
    if (!text || isAiTyping || !selectedObjection) return;

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

    // If we've hit max rounds, go to debrief
    if (nextRound > MAX_ROUNDS) {
      setIsAiTyping(false);
      await runDebrief(updatedMessages);
      return;
    }

    try {
      const response = await callAI(buildSystemPrompt(selectedObjection), text, updatedMessages);
      const prospectMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'prospect',
        text: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, prospectMsg]);
      setCurrentRound(nextRound);

      // Auto-debrief after prospect's final response at round 5
      if (nextRound === MAX_ROUNDS) {
        // Let user send one more reply before debriefing
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'prospect',
        text: "I'm running short on time. Let's wrap this up — what's the bottom line?",
        timestamp: new Date(),
      }]);
      setCurrentRound(nextRound);
    } finally {
      setIsAiTyping(false);
    }
  }, [userInput, isAiTyping, selectedObjection, messages, currentRound, callAI]);

  // ── End & Debrief ──────────────────────────────────────────
  const runDebrief = useCallback(async (finalMessages: ChatMessage[]) => {
    if (!selectedObjection) return;
    setIsAiTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('pitch-analysis', {
        body: {
          transcript: finalMessages.map(m => `${m.role === 'user' ? 'Sales Rep' : PROSPECT_NAME}: ${m.text}`).join('\n'),
          industry: 'general',
          difficulty: 'medium',
          scenarioType: selectedObjection.label,
        },
      });

      if (data?.analysis) {
        // Try to parse structured debrief from analysis
        try {
          const parsed = typeof data.analysis === 'string' ? JSON.parse(data.analysis) : data.analysis;
          setDebrief({
            won: (parsed.score ?? parsed.overall_score ?? 5) >= 7,
            score: parsed.score ?? parsed.overall_score ?? 5,
            strengths: parsed.strengths ?? parsed.positive_points ?? ['Engaged with the prospect'],
            gaps: parsed.gaps ?? parsed.improvements ?? ['Could dig deeper into root concerns'],
            tip: parsed.tip ?? parsed.practice_tip ?? 'Focus on asking discovery questions before presenting solutions.',
          });
        } catch {
          setDebrief({
            won: false,
            score: 5,
            strengths: ['Completed the roleplay session'],
            gaps: ['Review could not be fully parsed'],
            tip: 'Try to ask more discovery questions in your next session.',
          });
        }
      } else {
        throw new Error('No analysis data');
      }
    } catch {
      // Fallback debrief
      const userMsgCount = finalMessages.filter(m => m.role === 'user').length;
      const score = Math.min(10, Math.max(3, userMsgCount + 2));
      setDebrief({
        won: score >= 7,
        score,
        strengths: ['Stayed engaged throughout the conversation', 'Attempted to address objections'],
        gaps: ['Consider asking more discovery questions', 'Provide more specific evidence and ROI data'],
        tip: 'Next time, acknowledge the objection first before presenting your counter-argument.',
      });
    } finally {
      setIsAiTyping(false);
      setPhase('debrief');
    }
  }, [selectedObjection]);

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
  const reset = () => {
    setPhase('select-objection');
    setSelectedObjection(null);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {OBJECTIONS.map((obj) => (
            <motion.button
              key={obj.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
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

  // ── Render: Mode Selection ─────────────────────────────────
  if (phase === 'select-mode') {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">How do you want to respond?</h2>
        <p className="text-muted-foreground mb-6">
          You'll face <strong className="text-foreground">{PROSPECT_NAME}</strong>, {PROSPECT_TITLE}
        </p>
        <p className="text-sm text-muted-foreground mb-8 px-4 py-3 rounded-lg bg-muted">
          Objection: {selectedObjection?.description}
        </p>

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
          <h2 className="text-2xl font-bold text-foreground">{won ? 'Deal Won!' : 'Deal Lost'}</h2>
          <p className="text-muted-foreground mt-1">{won ? 'You earned the prospect\'s trust.' : 'The prospect wasn\'t convinced this time.'}</p>
        </motion.div>

        {/* Score */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Overall Score</span>
            <span className="text-2xl font-bold text-foreground">{debrief.score}/10</span>
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

        <Button onClick={reset} className="w-full bg-primary-500 hover:bg-primary-600 text-white">
          <RotateCcw className="w-4 h-4 mr-2" /> Try Another Objection
        </Button>
      </div>
    );
  }

  // ── Render: Conversation ───────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{PROSPECT_NAME}</h2>
          <p className="text-xs text-muted-foreground">{PROSPECT_TITLE} · {selectedObjection?.label} objection</p>
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

      {/* Round dots */}
      <div className="flex items-center gap-2 mb-4">
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
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
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
                  <span className="block text-xs font-semibold mb-1 opacity-70">{PROSPECT_NAME}</span>
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
              <span className="block text-xs font-semibold text-muted-foreground mb-1">{PROSPECT_NAME}</span>
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

      {/* Input area */}
      <div className="flex gap-2 items-end">
        {inputMode === 'voice' && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVoice}
            className={isListening ? 'border-red-400 text-red-500 animate-pulse' : ''}
            disabled={isAiTyping}
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
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
