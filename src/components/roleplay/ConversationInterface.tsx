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
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isPremium, trialActive } = useAuth();
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
    'Competitor': [
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      voiceSynthRef.current = VoiceSynthesis.getInstance();
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
    // Check if trying to use voice features without premium or trial
    if (mode !== 'text' && !isPremium && !trialActive) {
      setActualMode('text');
      if (mode === 'voice' || mode === 'hybrid') {
        setShowPremiumModal(true);
      }
    } else {
      setActualMode(mode);
      // Default voice to enabled when premium user or trial user selects voice/hybrid mode
      if ((isPremium || trialActive) && (mode === 'voice' || mode === 'hybrid')) {
        setVoiceEnabled(true);
      }
    }
  }, [mode, isPremium, trialActive]);

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
    
    // Speak the initial greeting if voice is enabled
    if (voiceEnabled && (isPremium || trialActive) && volume > 0 && actualMode !== 'text' && voiceSynthRef.current) {
      speakMessage(initialMessage.text);
    }
    
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Reset idle timer
    resetIdleTimer();
  }, [scenario]);

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
    if (!voiceSynthRef.current) return;
    
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

  const handleSendMessage = (text: string) => {
    // Reset idle timer when user sends a message
    resetIdleTimer();
    setShowSuggestions(false);
    
    // Add user message
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
    
    // Check if session should complete after this message
    const shouldCompleteSession = messages.length >= 8; // Complete after 4 exchanges
    
    // Show processing state
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
      if (voiceEnabled && (isPremium || trialActive) && volume > 0 && actualMode !== 'text' && voiceSynthRef.current) {
        speakMessage(aiResponse);
      }
      
      // Set session complete if reached threshold
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
          description: "Great job! You've completed this practice session.",
          duration: 5000,
        });
      }
      
    }, 1500);
  };

  const toggleVoice = () => {
    if (!isPremium && !trialActive && !voiceEnabled) {
      setShowPremiumModal(true);
      return;
    }
    
    setVoiceEnabled(!voiceEnabled);
    
    // Stop speaking if turning off
    if (voiceEnabled && voiceSynthRef.current && isAISpeaking) {
      voiceSynthRef.current.stop();
      setIsAISpeaking(false);
    }
    
    toast({
      title: voiceEnabled ? "Voice responses disabled" : "Voice responses enabled",
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
    if (voiceEnabled && (isPremium || trialActive) && volume > 0 && actualMode !== 'text' && voiceSynthRef.current) {
      speakMessage(initialMessage.text);
    }
  };
  
  const handleUseSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden relative">
        <div className="bg-white p-2 flex justify-between items-center border-b">
          <div className="flex items-center">
            {trialActive && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mr-2">
                Trial
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
                disabled={!isPremium && !trialActive}
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
          <ChatInput mode={actualMode} onSendMessage={handleSendMessage} />
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

      {/* Premium Modal */}
      <PremiumModal 
        open={showPremiumModal} 
        onOpenChange={setShowPremiumModal}
        featureName="voice roleplay"
      />
    </>
  );
};

export default ConversationInterface;
