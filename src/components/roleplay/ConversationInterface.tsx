import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import MessageList from './chat/MessageList';
import { generateAIResponse, getScenarioIntro } from './chat/ChatLogic';
import { generateStructuredFeedback } from './chat/FeedbackGenerator';
import { generateEnhancedFeedback } from './chat/EnhancedFeedbackGenerator';
import FeedbackPanel from './FeedbackPanel';
import EnhancedFeedbackDisplay from './EnhancedFeedbackDisplay';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { VoiceRecordingManager, startRealTimeSpeechRecognition, processVoiceInput } from '@/utils/voiceInput';
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
  const [enhancedFeedback, setEnhancedFeedback] = useState<any>(null);
  const [showEnhancedFeedback, setShowEnhancedFeedback] = useState(false);
  const [currentObjectionText, setCurrentObjectionText] = useState('');
  const [waitingForUserResponse, setWaitingForUserResponse] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [hasProcessedInput, setHasProcessedInput] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  const [userResponseCount, setUserResponseCount] = useState(0);
  
  const voiceManagerRef = useRef<VoiceRecordingManager | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const realtimeRecognitionRef = useRef<(() => void) | null>(null);
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
      
      voiceManagerRef.current = new VoiceRecordingManager();
      
      setIsInitialized(true);
      console.log('🎤 Voice services initialized');
    } catch (error) {
      console.error('❌ Error initializing voice services:', error);
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
    if (!voiceManagerRef.current) {
      console.error('❌ Voice manager not initialized');
      return;
    }

    try {
      console.log('🎤 Starting voice recording...');
      setVoiceStatus('listening');
      setRealtimeTranscript('');
      setIsListening(true);

      if (mode === 'voice' || mode === 'hybrid') {
        const stopRealtime = startRealTimeSpeechRecognition(
          (transcript, isFinal) => {
            console.log('🗣️ Real-time transcript:', transcript, 'Final:', isFinal);
            setRealtimeTranscript(transcript);
            if (isFinal && transcript.trim()) {
              setInputText(transcript);
              toast({
                title: "Speech Captured",
                description: `"${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
              });
            }
          },
          (error) => {
            console.warn('⚠️ Real-time recognition error:', error);
          }
        );
        realtimeRecognitionRef.current = stopRealtime;
      }

      await voiceManagerRef.current.startRecording();
      
      toast({
        title: "Recording Started",
        description: "Speak now, click the microphone again to stop",
      });
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setVoiceStatus('idle');
      setIsListening(false);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [mode, toast]);

  const stopRecording = useCallback(async () => {
    if (!voiceManagerRef.current) {
      console.error('❌ Voice manager not initialized');
      return;
    }

    console.log('🛑 Stopping recording...');
    
    if (realtimeRecognitionRef.current) {
      realtimeRecognitionRef.current();
      realtimeRecognitionRef.current = null;
    }

    setIsListening(false);
    setVoiceStatus('processing');

    try {
      const audioBlob = await voiceManagerRef.current.stopRecording();
      console.log('🎵 Audio blob received, size:', audioBlob.size);

      if (realtimeTranscript.trim()) {
        console.log('✅ Using real-time transcript:', realtimeTranscript);
        setInputText(realtimeTranscript);
        setVoiceStatus('complete');
        toast({
          title: "Voice Captured",
          description: `"${realtimeTranscript.substring(0, 50)}${realtimeTranscript.length > 50 ? '...' : ''}"`,
        });
      } else {
        console.log('🤖 Processing audio with Whisper...');
        const transcript = await processVoiceInput(audioBlob);
        
        if (transcript && transcript.trim()) {
          setInputText(transcript);
          setVoiceStatus('complete');
          toast({
            title: "Voice Processed",
            description: `"${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
          });
        } else {
          throw new Error('No speech detected in recording');
        }
      }
    } catch (error) {
      console.error('❌ Voice processing error:', error);
      setVoiceStatus('idle');
      toast({
        title: "Voice Processing Error",
        description: error instanceof Error ? error.message : "Failed to process voice input",
        variant: "destructive",
      });
    }
  }, [realtimeTranscript, toast]);

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
    setRealtimeTranscript('');
    setIsLoading(true);
    setHasProcessedInput(true);
    setUserResponseCount(prev => prev + 1);
    
    setShowEnhancedFeedback(false);
    
    if (voiceStatus === 'complete') {
      setTimeout(() => setVoiceStatus('idle'), 2000);
    }

    try {
      console.log('Sending message to AI:', textToSend);
      
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

      // Store the objection for enhanced feedback analysis
      setCurrentObjectionText(aiResponse);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage, aiMessage];
      setMessages(updatedMessages);

      // Generate enhanced feedback for every user response after the first exchange
      if (scenario && userResponseCount >= 1) {
        console.log('🎯 Generating enhanced feedback for user response:', textToSend);
        
        const enhancedFeedbackData = generateEnhancedFeedback(
          textToSend,
          currentObjectionText || scenario.objection,
          [...chatMessages, userMessage],
          userResponseCount
        );
        
        console.log('📊 Generated enhanced feedback:', enhancedFeedbackData);
        setEnhancedFeedback(enhancedFeedbackData);
        
        // Save session with enhanced feedback
        await saveSessionToDatabase(updatedMessages, enhancedFeedbackData);
        
        // Show enhanced feedback after a brief delay
        setTimeout(() => {
          console.log('🚀 Showing enhanced feedback display');
          setShowEnhancedFeedback(true);
        }, 1500);
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

  const closeEnhancedFeedback = () => {
    setShowEnhancedFeedback(false);
  };

  useEffect(() => {
    return () => {
      if (realtimeRecognitionRef.current) {
        realtimeRecognitionRef.current();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const getVoiceStatusDisplay = () => {
    switch (voiceStatus) {
      case 'listening':
        return (
          <div className="text-center py-2 text-blue-600 font-medium">
            🎙 Listening... (click mic to stop)
            {realtimeTranscript && (
              <div className="text-sm text-gray-600 mt-1 italic">
                "{realtimeTranscript}"
              </div>
            )}
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

      {/* Enhanced Feedback Display */}
      {enhancedFeedback && showEnhancedFeedback && (
        <EnhancedFeedbackDisplay
          feedback={enhancedFeedback}
          objectionText={currentObjectionText}
          userResponse={messages.filter(m => m.sender === 'user').slice(-1)[0]?.text || ''}
          isVisible={showEnhancedFeedback}
          onClose={closeEnhancedFeedback}
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
              placeholder={
                realtimeTranscript ? realtimeTranscript : 
                "Respond to overcome the objection..."
              }
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
              className={isListening ? "animate-pulse" : ""}
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
