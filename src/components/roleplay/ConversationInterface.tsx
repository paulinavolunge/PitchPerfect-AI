import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import MessageList from './chat/MessageList';
import { generateAIResponse, getScenarioIntro } from './chat/ChatLogic';
import { generateStructuredFeedback } from './chat/FeedbackGenerator';
import FeedbackPanel from './FeedbackPanel';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ConversationInterfaceProps {
  mode?: 'voice' | 'text' | 'hybrid';
  scenario?: {
    difficulty: string;
    objection: string;
    industry: string;
    custom?: string;
  };
  voiceStyle?: 'friendly' | 'assertive' | 'skeptical' | 'rushed';
  volume?: number;
  userScript?: string | null;
}

const ConversationInterface = ({ 
  mode = 'text',
  scenario,
  voiceStyle = 'friendly',
  volume = 75,
  userScript
}: ConversationInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'complete'>('idle');
  const [currentFeedback, setCurrentFeedback] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [waitingForUserResponse, setWaitingForUserResponse] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  const examplePrompts = [
    "I understand your concern about the budget. Let me show you the ROI...",
    "That's a valid point about timing. Many of our clients felt the same way initially...",
    "I appreciate you being upfront about that. Can you tell me more about your current situation?"
  ];

  const initializeVoiceServices = useCallback(() => {
    if (isInitialized) return;
    
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        if (recognitionRef.current) {
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0]?.transcript || '';
            if (transcript.trim()) {
              setInputText(transcript);
              setVoiceStatus('complete');
              setTimeout(() => {
                if (transcript.trim()) {
                  // Auto-send after voice input
                }
              }, 500);
            }
            setIsListening(false);
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            setVoiceStatus('idle');
            toast({
              title: "Voice Recognition Error",
              description: `Failed to recognize speech: ${event.error}`,
              variant: "destructive",
            });
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
            if (voiceStatus === 'listening') {
              setVoiceStatus('processing');
            }
          };
        }
      }

      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
        setSpeechEnabled(true);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing voice services:', error);
      toast({
        title: "Voice Services Error",
        description: "Failed to initialize voice services",
        variant: "destructive",
      });
    }
  }, [isInitialized, toast, voiceStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeVoiceServices();
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeVoiceServices]);

  const startListening = useCallback(() => {
    if (!isInitialized) {
      initializeVoiceServices();
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setVoiceStatus('listening');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: "Voice Recognition Error",
          description: "Failed to start voice recognition",
          variant: "destructive",
        });
        setVoiceStatus('idle');
      }
    }
  }, [isListening, isInitialized, initializeVoiceServices, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setVoiceStatus('processing');
    }
  }, [isListening]);

  const speakText = useCallback((text: string) => {
    if (synthRef.current && speechEnabled) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      synthRef.current.speak(utterance);
    }
  }, [speechEnabled]);

  const toggleSpeech = useCallback(() => {
    setSpeechEnabled(prev => !prev);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  const getAIPersona = useCallback(() => {
    const personas = {
      'friendly': 'Alex',
      'assertive': 'Jordan',
      'skeptical': 'Morgan',
      'rushed': 'Taylor'
    };
    return personas[voiceStyle] || 'Alex';
  }, [voiceStyle]);

  useEffect(() => {
    if (scenario && messages.length === 0) {
      const introMessage: Message = {
        id: Date.now().toString(),
        text: getScenarioIntro(scenario, getAIPersona),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages([introMessage]);
      setWaitingForUserResponse(true); // AI has presented objection, waiting for user
      
      if (speechEnabled) {
        speakText(introMessage.text);
      }
    }
  }, [scenario, speechEnabled, getAIPersona]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);
    
    // Hide any existing feedback
    setShowFeedback(false);
    
    // Update voice status if this was triggered by voice input
    if (voiceStatus === 'complete') {
      setTimeout(() => setVoiceStatus('idle'), 2000);
    }

    try {
      console.log('Sending message to AI:', currentInput);
      console.log('Current scenario:', scenario);
      
      // Convert messages to the expected format for ChatLogic
      const chatMessages = messages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp
      }));
      
      const aiResponse = await generateAIResponse(
        currentInput, 
        scenario || { difficulty: 'Beginner', objection: 'General', industry: 'Technology' }, 
        userScript, 
        getAIPersona,
        [...chatMessages, userMessage]
      );
      
      console.log('AI Response received:', aiResponse);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Generate feedback if user was responding to an objection
      if (waitingForUserResponse && scenario) {
        console.log('Generating feedback for user response:', currentInput);
        const feedback = generateStructuredFeedback(
          currentInput,
          scenario.objection,
          [...chatMessages, userMessage]
        );
        
        setCurrentFeedback(feedback);
        
        // Show feedback after a brief delay
        setTimeout(() => {
          setShowFeedback(true);
        }, 1000);
        
        setWaitingForUserResponse(false); // Reset after feedback
      } else {
        // AI has given a new objection, now waiting for user response
        setWaitingForUserResponse(true);
      }

      if (speechEnabled && aiResponse) {
        speakText(aiResponse);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble responding right now. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "AI Response Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputText(prompt);
  };

  const closeFeedback = () => {
    setShowFeedback(false);
  };

  // Voice status display
  const getVoiceStatusDisplay = () => {
    switch (voiceStatus) {
      case 'listening':
        return (
          <div className="text-center py-2 text-blue-600 font-medium">
            🎙 Listening...
          </div>
        );
      case 'processing':
        return (
          <div className="text-center py-2 text-orange-600 font-medium flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            Analyzing audio...
          </div>
        );
      case 'complete':
        return (
          <div className="text-center py-2 text-green-600 font-medium">
            ✅ Response received. AI is analyzing your objection handling...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      <Card className="flex-1 mb-4">
        <CardContent className="p-4 h-full">
          <MessageList messages={messages} isAISpeaking={isLoading} />
        </CardContent>
      </Card>

      {/* Feedback Panel */}
      {currentFeedback && (
        <FeedbackPanel
          feedback={currentFeedback}
          isVisible={showFeedback}
          onClose={closeFeedback}
        />
      )}

      <div className="space-y-4">
        {/* Voice Status Display */}
        {voiceStatus !== 'idle' && getVoiceStatusDisplay()}

        {/* Example Prompts - Updated for objection handling responses */}
        {messages.length <= 1 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">Try these objection handling examples:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {examplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromptClick(prompt)}
                  className="text-xs px-3 py-1 h-auto whitespace-normal text-left max-w-xs"
                >
                  "{prompt}"
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Respond to overcome the objection..."
              disabled={isLoading}
              className="pr-4"
            />
          </div>
          
          <Button
            onClick={isListening ? stopListening : startListening}
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            disabled={isLoading}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={toggleSpeech}
            variant={speechEnabled ? "default" : "outline"}
            size="icon"
          >
            {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationInterface;
