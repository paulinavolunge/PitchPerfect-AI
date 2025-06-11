import React, { useState, useEffect, useRef } from 'react';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';
import { useToast } from "@/hooks/use-toast";
import { getScenarioIntro, generateAIResponse } from './chat/ChatLogic';
import { useAuth } from '@/context/AuthContext';
import PremiumModal from '@/components/PremiumModal';
import VoiceSynthesis from '@/utils/VoiceSynthesis';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ProgressSummary from '../gamification/ProgressSummary';
import { Button } from '@/components/ui/button';
import { Flag, CheckCircle } from 'lucide-react';
import LoadingIndicator from '@/components/ui/loading-indicator';
import FeedbackPrompt from '@/components/feedback/FeedbackPrompt';
import { useGuestMode } from "@/context/GuestModeContext";
import { useNavigate } from 'react-router-dom';
import MicrophonePermissionCheck from '@/components/voice/MicrophonePermissionCheck';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ConversationInterfaceProps {
  mode: 'voice' | 'text' | 'hybrid';
  scenario: {
    difficulty: string;
    objection: string;
    industry: string;
    custom?: string;
  };
  voiceStyle: 'friendly' | 'assertive' | 'skeptical' | 'rushed';
  volume: number;
  userScript?: string | null;
  onProcessingStateChange?: (isProcessing: boolean) => void;
  onFirstAIReply?: () => void;
}

const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  mode,
  scenario,
  voiceStyle,
  volume,
  userScript,
  onProcessingStateChange,
  onFirstAIReply
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [actualMode, setActualMode] = useState<'voice' | 'text' | 'hybrid'>('text');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userIdleTime, setUserIdleTime] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [firstAIReplyTriggered, setFirstAIReplyTriggered] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState<boolean | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Destructure new auth values
  const { user, isPremium, creditsRemaining, trialUsed, startFreeTrial, deductUserCredits } = useAuth();
  const { isGuestMode } = useGuestMode();
  const navigate = useNavigate();

  const voiceSynthRef = useRef<VoiceSynthesis | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [sessionStats, setSessionStats] = useState({
    responseTime: 0,
    clarity: 0,
    relevance: 0,
    effectiveness: 0,
  });

  // Suggested responses based on the scenario
  const suggestedResponses = {
    'Price': [
      "I understand price is a concern. Let's look at the ROI our solution provides...",
      "Our pricing reflects the value we deliver. For example...",
      "What specific budget constraints are you working within?"
    ],
    'Timing': [
      "I understand timing is important. When would be ideal to implement?",
      "What timeline would work better for your organization?",
      "The implementation can be phased to accommodate your schedule."
    ],
    'Competition': [
      "I'd like to understand what you appreciate about their solution.",
      "Our differentiator is actually in how we handle...",
      "What specific features are most important to your team?"
    ],
    'Need': [
      "What specific challenges is your team currently facing?",
      "How are you currently addressing this problem?",
      "Would it be helpful if I shared how other companies in your industry use our solution?"
    ],
    'Default': [
      "Could you tell me more about your specific concerns?",
      "What aspects of this solution are most important to you?",
      "How does your team currently handle this process?"
    ]
  };

  // Get the appropriate suggestions based on scenario
  const getRelevantSuggestions = () => {
    if (scenario.objection in suggestedResponses) {
      return suggestedResponses[scenario.objection as keyof typeof suggestedResponses];
    }
    return suggestedResponses.Default;
  };

  useEffect(() => {
    // Initialize voice synthesis
    if (typeof window !== 'undefined') {
      voiceSynthRef.current = VoiceSynthesis.getInstance();
      setBrowserSupportsSpeech(
        voiceSynthRef.current.isVoiceSupported() && 
        (window.SpeechRecognition || (window as any).webkitSpeechRecognition)
      );
    }

    return () => {
      // Stop speaking when component unmounts
      if (voiceSynthRef.current) {
        voiceSynthRef.current.stop();
      }

      // Clear idle timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Voice features (voice/hybrid modes) now require premium or credits
    if (mode !== 'text' && !isPremium && creditsRemaining <= 0) {
      setActualMode('text'); // Fallback to text mode if not premium/no credits for voice features
      if (mode === 'voice' || mode === 'hybrid') {
        setShowPremiumModal(true); // Prompt upgrade
      }
    } else {
      setActualMode(mode);
      // Default voice to enabled when premium user or user with credits selects voice/hybrid mode
      if ((isPremium || creditsRemaining > 0) && (mode === 'voice' || mode === 'hybrid')) {
        setVoiceEnabled(true);
      }
    }
  }, [mode, isPremium, creditsRemaining]); // Added creditsRemaining to dependencies

  useEffect(() => {
    // Initialize with AI greeting
    const greeting = getScenarioIntro(scenario, getAIPersona);
    const initialMessage: Message = {
      id: `ai-${Date.now()}`,
      text: greeting,
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages([initialMessage]);
    setSessionComplete(false);
    setShowFeedback(false);
    setFirstAIReplyTriggered(false);

    // Speak the initial greeting if voice is enabled and mode allows
    if (voiceEnabled && (isPremium || creditsRemaining > 0) && volume > 0 && actualMode !== 'text' && voiceSynthRef.current) {
      speakMessage(initialMessage.text);
    }

    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    // Reset idle timer
    resetIdleTimer();
  }, [scenario]); // Removed voiceEnabled, isPremium, actualMode, volume, voiceSynthRef to prevent re-runs

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Update parent component with processing state
  useEffect(() => {
    if (onProcessingStateChange) {
      onProcessingStateChange(isProcessing);
    }
  }, [isProcessing, onProcessingStateChange]);

  const getAIPersona = () => {
    const styles = {
      friendly: 'Alex',
      assertive: 'Jordan',
      skeptical: 'Morgan',
      rushed: 'Taylor',
    };
    return styles[voiceStyle] || 'Customer';
  };

  const speakMessage = async (text: string) => {
    if (!voiceSynthRef.current || !voiceEnabled) return;

    setIsAISpeaking(true);

    try {
      const voiceVolume = volume / 100;
      const persona = voiceStyle || 'friendly';

      await voiceSynthRef.current.speak({
        text: text,
        volume: voiceVolume,
        rate: persona === 'rushed' ? 1.2 : 1,
        pitch: persona === 'skeptical' ? 0.9 : persona === 'friendly' ? 1.1 : 1,
        voice: persona
      });
    } catch (error) {
      console.error('Error speaking:', error);
      toast({
        title: "Voice Error",
        description: "Could not play AI voice. Please try again or switch to text mode.",
        variant: "destructive",
      });
    } finally {
      setIsAISpeaking(false);
    }
  };

  const resetIdleTimer = () => {
    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    setUserIdleTime(0);
    setShowSuggestions(false);

    // Set new timer - check every 5 seconds
    idleTimerRef.current = setInterval(() => {
      setUserIdleTime(prev => {
        const newTime = prev + 5;
        // Show suggestions after 15 seconds of inactivity
        if (newTime >= 15 && !showSuggestions && messages.length > 0) {
          setShowSuggestions(true);
        }
        return newTime;
      });
    }, 5000);
  };

  const handleSendMessage = async (text: string) => {
    // Reset idle timer when user sends a message
    resetIdleTimer();
    setShowSuggestions(false);

    // Add user message immediately for responsiveness
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Stop any ongoing AI speech when user speaks
    if (voiceSynthRef.current && isAISpeaking) {
      voiceSynthRef.current.stop();
      setIsAISpeaking(false);
    }

    // --- Credit Deduction Logic ---
    let creditsToDeduct = 0;
    let featureType = '';

    if (!isGuestMode) { // Credits only apply to authenticated users
      if (actualMode === 'text') {
        creditsToDeduct = 1;
        featureType = 'roleplay_text_analysis';
      } else if (actualMode === 'voice' || actualMode === 'hybrid') {
        creditsToDeduct = 5; // Placeholder for 3-10 credits, adjust as needed
        featureType = `roleplay_voice_analysis_${scenario.difficulty.toLowerCase()}`;
      }

      if (creditsToDeduct > 0) {
        const deducted = await deductUserCredits(featureType, creditsToDeduct);
        if (!deducted) {
          // deductUserCredits already shows a toast on failure
          setIsProcessing(false); // Stop processing state if deduction failed
          return; // Stop execution if credits couldn't be deducted
        }
      }
    }
    // --- End Credit Deduction Logic ---

    // Show processing state after successful deduction
    setIsProcessing(true);

    // Simulate thinking delay
    setTimeout(() => {
      // Generate AI response
      const aiResponse = generateAIResponse(text, scenario, userScript || null, getAIPersona);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsProcessing(false);

      // Trigger first AI reply callback for guest mode prompts
      if (!firstAIReplyTriggered && onFirstAIReply) {
        setFirstAIReplyTriggered(true);
        onFirstAIReply();
      }

      // Speak the AI response if voice is enabled
      if (voiceEnabled && (isPremium || creditsRemaining > 0) && volume > 0 && actualMode !== 'text' && voiceSynthRef.current) {
        speakMessage(aiResponse);
      }

      // Set session complete after a certain number of exchanges (e.g., 4 AI responses)
      const aiMessagesCount = messages.filter(msg => msg.sender === 'ai').length + 1; // +1 for the current AI response
      const shouldCompleteSession = aiMessagesCount >= 4; // Complete after 4 AI responses (5 total messages including intro)

      if (shouldCompleteSession) {
        // Generate random stats for demo
        const stats = {
          responseTime: Math.floor(Math.random() * 30) + 70, // 70-100%
          clarity: Math.floor(Math.random() * 40) + 60, // 60-100%
          relevance: Math.floor(Math.random() * 30) + 70, // 70-100%
          effectiveness: Math.floor(Math.random() * 35) + 65, // 65-100%
        };
        setSessionStats(stats);
        setSessionComplete(true);

        toast({
          title: "Session Complete",
          description: "Great job! You've completed this practice session and can now view your detailed feedback.",
          duration: 5000,
        });
      }

    }, 1500);
  };

  const toggleVoice = () => {
    // If not premium and not enough credits, show modal
    if (!isPremium && creditsRemaining <= 0 && !voiceEnabled) {
      setShowPremiumModal(true);
      return;
    }

    // Check if speech synthesis is supported
    if (!voiceSynthRef.current?.isVoiceSupported() && !voiceEnabled) {
      toast({
        title: "Voice Not Supported",
        description: "Your browser does not support AI voice. Please try using Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    setVoiceEnabled(!voiceEnabled);

    // Stop speaking if turning off
    if (voiceEnabled && voiceSynthRef.current && isAISpeaking) {
      voiceSynthRef.current.stop();
      setIsAISpeaking(false);
    }

    toast({
      title: voiceEnabled ? "AI Voice disabled" : "AI Voice enabled",
      description: voiceEnabled ? "AI will respond with text only." : "AI will respond with voice and text.",
      duration: 3000,
    });
  };

  const handleFinishSession = () => {
    // Generate random stats for demo
    const stats = {
      responseTime: Math.floor(Math.random() * 30) + 70, // 70-100%
      clarity: Math.floor(Math.random() * 40) + 60, // 60-100%
      relevance: Math.floor(Math.random() * 30) + 70, // 70-100%
      effectiveness: Math.floor(Math.random() * 35) + 65, // 65-100%
    };
    setSessionStats(stats);
    setSessionComplete(true);

    toast({
      title: "Session Complete",
      description: "You've marked this session as complete.",
      duration: 3000,
    });
  };

  const handleShowFeedback = () => {
    setShowFeedback(true);
  };

  const handleCloseFeedback = () => {
    setShowFeedback(false);
    // Reset session
    const greeting = getScenarioIntro(scenario, getAIPersona);
    const initialMessage: Message = {
      id: `ai-${Date.now()}`,
      text: greeting,
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages([initialMessage]);
    setSessionComplete(false);
    setFirstAIReplyTriggered(false);

    // Speak the initial greeting if voice is enabled
    if (voiceEnabled && (isPremium || creditsRemaining > 0) && volume > 0 && actualMode !== 'text' && voiceSynthRef.current) {
      speakMessage(initialMessage.text);
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Handle microphone permission changes
  const handleMicPermissionChange = (hasPermission: boolean) => {
    setMicPermissionGranted(hasPermission);
  };

  // If speech recognition not supported, provide a warning
  const renderSpeechSupportWarning = () => {
    if (browserSupportsSpeech === false && (actualMode === 'voice' || actualMode === 'hybrid')) {
      return (
        <div className="px-4 py-2 bg-amber-50 border-amber-200 border rounded-md text-sm text-amber-700 mb-2">
          <p>Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari for voice features, or switch to text mode.</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden relative">
        <div className="bg-white p-2 flex justify-between items-center border-b">
          <div className="flex items-center">
            {!isGuestMode && user && (
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mr-2">
                Credits: {creditsRemaining}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs h-8 min-w-[100px] group"
              onClick={handleFinishSession}
              aria-label="End current practice session"
            >
              <Flag className="h-3 w-3" />
              End Session
            </Button>
            <div className="flex items-center space-x-2">
              <Label htmlFor="voice-mode" className="text-sm">AI Voice</Label>
              <Switch
                id="voice-mode"
                checked={voiceEnabled}
                onCheckedChange={toggleVoice}
                aria-label="Toggle voice responses"
                // Disable voice toggle if not premium and no credits
                disabled={!isPremium && creditsRemaining <= 0 || !browserSupportsSpeech}
              />
            </div>
          </div>
        </div>

        <MessageList messages={messages} isAISpeaking={isAISpeaking} />

        {isProcessing && (
          <div className="p-4 bg-white border-t" aria-live="polite">
            <LoadingIndicator size="small" />
          </div>
        )}

        {showSuggestions && !sessionComplete && !isProcessing && (
          <div className="bg-blue-50 p-3 border-t">
            <p className="text-xs text-brand-dark/70 mb-2">Need help with your response? Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {getRelevantSuggestions().map((suggestion, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleUseSuggestion(suggestion)}
                  className="text-xs py-1 h-auto group"
                  aria-label={`Use suggested response: ${suggestion}`}
                >
                  {suggestion.length > 40 ? suggestion.substring(0, 37) + '...' : suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {sessionComplete && !showFeedback ? (
          <div className="bg-brand-green/10 p-4 flex flex-col items-center justify-center">
            <p className="text-brand-dark mb-2">Session complete! Ready to see your feedback?</p>
            <Button 
              onClick={handleShowFeedback}
              className="bg-brand-green hover:bg-brand-green/90 flex items-center gap-2 group"
              size="lg"
              aria-label="View session feedback and performance summary"
            >
              <CheckCircle size={16} />
              View Session Feedback
            </Button>
          </div>
        ) : !showFeedback && !isProcessing && (
          <>
            {renderSpeechSupportWarning()}
            <MicrophonePermissionCheck onPermissionChange={handleMicPermissionChange}>
              <ChatInput 
                mode={actualMode} 
                onSendMessage={handleSendMessage}
                disabled={isProcessing}
              />
            </MicrophonePermissionCheck>
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Session Feedback */}
      {showFeedback && (
        <div className="mt-4">
          <div className="bg-blue-50 border-l-4 border-blue-300 rounded-lg p-4 mb-4">
            <FeedbackPrompt 
              feedbackType="roleplay"
              sessionId={messages[0]?.id} 
            />
          </div>
          <ProgressSummary
            sessionName={`${scenario.industry} - ${scenario.objection} Objection Handling`}
            stats={[
              { label: "Response Time", value: sessionStats.responseTime },
              { label: "Clarity", value: sessionStats.clarity },
              { label: "Relevance", value: sessionStats.relevance },
              { label: "Effectiveness", value: sessionStats.effectiveness },
            ]}
            feedback={[
              { 
                text: "Excellent handling of price comparison questions", 
                type: "strength" 
              },
              { 
                text: "Good use of benefit-focused language", 
                type: "strength" 
              },
              { 
                text: "Try using more concrete examples with numbers", 
                type: "improvement" 
              },
              { 
                text: "Consider addressing ROI concerns more directly", 
                type: "improvement" 
              },
            ]}
            earnedBadges={[
              { 
                id: "quick-response",
                name: "Quick Responder", 
                description: "Respond to objections quickly and confidently",
                icon: "bolt", 
                progress: 100,
                unlocked: true,
                colorClass: "amber"
              }
            ]}
            nextMilestone={{
              name: "Objection Master",
              progress: 4,
              total: 10
            }}
            onClose={handleCloseFeedback}
          />
        </div>
      )}

      {/* Premium Modal - Updated to be credit-aware */}
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        feature={
          user && creditsRemaining === 0 ?
          "voice roleplay (no credits remaining)" :
          "voice roleplay"
        }
      />
    </>
  );
};

export default ConversationInterface;
