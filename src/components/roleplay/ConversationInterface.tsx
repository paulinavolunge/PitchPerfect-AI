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
import { processVoiceInput } from '@/utils/voiceInput';
import { markPracticeComplete } from '@/utils/practiceCompletionHandler';
import { supabase } from '@/integrations/supabase/client';

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
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [hasProcessedInput, setHasProcessedInput] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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
  }, [isInitialized, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeVoiceServices();
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeVoiceServices, sessionStartTime]);

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting voice recording...');
      setVoiceStatus('listening');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        setVoiceStatus('processing');
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('Created audio blob, size:', audioBlob.size);
          
          const transcript = await processVoiceInput(audioBlob);
          console.log('Voice transcription result:', transcript);
          
          if (transcript && transcript.trim()) {
            setInputText(transcript);
            setVoiceStatus('complete');
            toast({
              title: "Voice Captured",
              description: `Transcribed: "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
            });
            
            // Auto-send the transcribed message
            setTimeout(() => {
              handleSendMessage(transcript);
            }, 500);
          } else {
            throw new Error('No speech detected');
          }
        } catch (error) {
          console.error('Voice processing error:', error);
          setVoiceStatus('idle');
          toast({
            title: "Voice Processing Error",
            description: error instanceof Error ? error.message : "Failed to process voice input",
            variant: "destructive",
          });
        }
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      
      toast({
        title: "Recording Started",
        description: "Speak now, click again to stop",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setVoiceStatus('idle');
      toast({
        title: "Recording Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speakText = useCallback((text: string) => {
    if (synthRef.current && speechEnabled) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = volume / 100;
      synthRef.current.speak(utterance);
    }
  }, [speechEnabled, volume]);

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

  const saveSessionToDatabase = useCallback(async (finalMessages: Message[], feedback: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const duration = sessionStartTime ? 
        Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000) : 0;

      // Convert messages to JSON-compatible format
      const serializedMessages = finalMessages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp.toISOString()
      }));

      const sessionData = {
        user_id: user.id,
        scenario_type: scenario?.objection || 'General',
        difficulty: scenario?.difficulty || 'Beginner',
        industry: scenario?.industry || 'Technology',
        duration_seconds: duration,
        score: feedback?.score || 0,
        transcript: serializedMessages,
        feedback_data: feedback,
        completed_at: new Date().toISOString()
      };

      console.log('Saving session data:', sessionData);

      const { data, error } = await supabase
        .from('practice_sessions')
        .insert(sessionData)
        .select();

      if (error) {
        console.error('Error saving session:', error);
        toast({
          title: "Session Save Error",
          description: "Failed to save practice session",
          variant: "destructive",
        });
      } else {
        console.log('Session saved successfully:', data);
        markPracticeComplete();
        toast({
          title: "Session Saved",
          description: "Your practice session has been recorded",
        });
      }
    } catch (error) {
      console.error('Error saving session to database:', error);
      toast({
        title: "Database Error",
        description: "Failed to connect to database",
        variant: "destructive",
      });
    }
  }, [scenario, sessionStartTime, toast]);

  useEffect(() => {
    if (scenario && messages.length === 0) {
      const introMessage: Message = {
        id: Date.now().toString(),
        text: getScenarioIntro(scenario, getAIPersona),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages([introMessage]);
      setWaitingForUserResponse(true);
      
      if (speechEnabled) {
        speakText(introMessage.text);
      }
    }
  }, [scenario, speechEnabled, getAIPersona, speakText]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setHasProcessedInput(true);
    
    // Hide any existing feedback
    setShowFeedback(false);
    
    // Update voice status if this was triggered by voice input
    if (voiceStatus === 'complete') {
      setTimeout(() => setVoiceStatus('idle'), 2000);
    }

    try {
      console.log('Sending message to AI:', textToSend);
      
      // Convert messages to the expected format for ChatLogic
      const chatMessages = messages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp
      }));
      
      const aiResponse = await generateAIResponse(
        textToSend, 
        scenario || { difficulty: 'Beginner', objection: 'General', industry: 'Technology' }, 
        userScript, 
        getAIPersona,
        [...chatMessages, userMessage]
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage, aiMessage];
      setMessages(updatedMessages);

      // Generate feedback if user was responding to an objection
      if (waitingForUserResponse && scenario && hasProcessedInput) {
        console.log('Generating feedback for user response:', textToSend);
        const feedback = generateStructuredFeedback(
          textToSend,
          scenario.objection,
          [...chatMessages, userMessage]
        );
        
        setCurrentFeedback(feedback);
        
        // Save session with feedback
        await saveSessionToDatabase(updatedMessages, feedback);
        
        // Show feedback after a brief delay
        setTimeout(() => {
          setShowFeedback(true);
        }, 1000);
        
        setWaitingForUserResponse(false);
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
            🎙 Listening... (click mic to stop)
          </div>
        );
      case 'processing':
        return (
          <div className="text-center py-2 text-orange-600 font-medium flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            Processing audio...
          </div>
        );
      case 'complete':
        return (
          <div className="text-center py-2 text-green-600 font-medium">
            ✅ Audio processed successfully
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

        {/* Example Prompts */}
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
          
          {(mode === 'voice' || mode === 'hybrid') && (
            <Button
              onClick={isListening ? stopRecording : startRecording}
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              disabled={isLoading}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          
          <Button
            onClick={toggleSpeech}
            variant={speechEnabled ? "default" : "outline"}
            size="icon"
          >
            {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={() => handleSendMessage()}
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
