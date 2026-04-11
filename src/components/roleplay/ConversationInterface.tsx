import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, Volume2, VolumeX, Trophy, CheckCircle, AlertTriangle } from 'lucide-react';
import MessageList from './chat/MessageList';
import { generateAIResponse, getScenarioIntro, generateFirstObjection } from './chat/ChatLogic';
import { generateStructuredFeedback } from './chat/FeedbackGenerator';
import { generateEnhancedFeedback } from './chat/EnhancedFeedbackGenerator';
import FeedbackPanel from './FeedbackPanel';
import EnhancedFeedbackDisplay from './EnhancedFeedbackDisplay';
import FeedbackReflectionCard from './FeedbackReflectionCard';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { VoiceRecordingManager, startRealTimeSpeechRecognition, processVoiceInput } from '@/utils/voiceInput';
import { markPracticeComplete } from '@/utils/practiceCompletionHandler';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ErrorBoundary from '@/components/error/ErrorBoundary';

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
  const [activeMode, setActiveMode] = useState<'voice' | 'text' | 'hybrid'>(mode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'complete'>('idle');
  const [enhancedFeedback, setEnhancedFeedback] = useState<any>(null);
  const [showEnhancedFeedback, setShowEnhancedFeedback] = useState(false);
  const [showReflectionCard, setShowReflectionCard] = useState(false);
  const [currentObjectionText, setCurrentObjectionText] = useState('');
  const [waitingForUserResponse, setWaitingForUserResponse] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [hasProcessedInput, setHasProcessedInput] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  const [userResponseCount, setUserResponseCount] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionAnalysis, setSessionAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { user, deductUserCredits } = useAuth();
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

    return () => {
      clearTimeout(timer);
      
      // Cleanup voice services when component unmounts
      console.log('🧹 ConversationInterface cleanup...');
      
      if (realtimeRecognitionRef.current) {
        realtimeRecognitionRef.current();
        realtimeRecognitionRef.current = null;
      }
      
      if (voiceManagerRef.current) {
        try {
          if (voiceManagerRef.current.isCurrentlyRecording()) {
            voiceManagerRef.current.stopRecording();
          }
        } catch (error) {
          console.warn('Warning stopping recording in cleanup:', error);
        }
        voiceManagerRef.current = null;
      }
      
      if (synthRef.current) {
        synthRef.current.cancel();
        synthRef.current = null;
      }
    };
  }, [initializeVoiceServices, sessionStartTime]);

  // Keep local mode in sync with parent prop
  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  const startRecording = useCallback(async () => {
    console.log('🎤 Mic button clicked -> startRecording');

    try {
      // Ensure voice services are ready (fixes “first click does nothing”)
      if (!voiceManagerRef.current) {
        console.warn('🎤 Voice manager missing, creating new instance...');
        voiceManagerRef.current = new VoiceRecordingManager();
      }

      if (!voiceManagerRef.current) {
        const msg = 'Voice services failed to initialize. Please refresh the page.';
        console.error('❌', msg);
        toast({
          title: 'Voice Not Ready',
          description: msg,
          variant: 'destructive',
        });
        return;
      }

      console.log('🎤 Starting voice recording...');
      setVoiceStatus('listening');
      setRealtimeTranscript('');

      const canRecordAudio = typeof MediaRecorder !== 'undefined';

      // Request microphone permission FIRST (required for reliable mobile/desktop behavior)
      if (canRecordAudio) {
        console.log('🎤 Requesting microphone stream via getUserMedia/MediaRecorder...');
        await voiceManagerRef.current.startRecording();
        console.log('🎤 Microphone stream started');
      } else {
        console.warn('🎤 MediaRecorder not supported in this browser. Using SpeechRecognition-only mode.');
      }

      // Start real-time speech recognition (fills the input field live)
      // On mobile browsers without SpeechRecognition, this returns null and we rely on MediaRecorder + Whisper
      if (activeMode === 'voice' || activeMode === 'hybrid') {
        const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
        
        if (hasSpeechRecognition) {
          console.log('🗣️ Initializing SpeechRecognition (real-time transcript)...');

          const stopRealtime = startRealTimeSpeechRecognition(
            (transcript, isFinal) => {
              console.log('🗣️ Real-time transcript:', transcript, 'Final:', isFinal);
              setRealtimeTranscript(transcript);

              if (transcript.trim()) {
                setInputText(transcript);
              }

              if (isFinal && transcript.trim()) {
                toast({
                  title: 'Speech Captured',
                  description: `"${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
                });
              }
            },
            (error) => {
              console.warn('⚠️ Real-time recognition error:', error);
            }
          );

          realtimeRecognitionRef.current = stopRealtime;
        } else {
          console.log('🎤 SpeechRecognition not available (mobile browser). Will use MediaRecorder + Whisper fallback.');
          toast({
            title: 'Recording Mode',
            description: 'Using audio recording. Tap the mic again when done speaking.',
          });
        }
      }

      setIsListening(true);

      toast({
        title: 'Listening...',
        description: 'Speak now. Click the microphone again to stop.',
      });
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setVoiceStatus('idle');
      setIsListening(false);

      toast({
        title: 'Recording Error',
        description: 'Failed to access microphone. Please check permissions and try again.',
        variant: 'destructive',
      });
    }
  }, [activeMode, initializeVoiceServices, toast]);

  const stopRecording = useCallback(async () => {
    console.log('🎤 Mic button clicked -> stopRecording');

    // Stop SpeechRecognition first
    if (realtimeRecognitionRef.current) {
      realtimeRecognitionRef.current();
      realtimeRecognitionRef.current = null;
    }

    setIsListening(false);
    setVoiceStatus('processing');

    try {
      const canRecordAudio = typeof MediaRecorder !== 'undefined';

      // If we recorded audio, stop and (optionally) run Whisper fallback
      if (canRecordAudio && voiceManagerRef.current?.isCurrentlyRecording()) {
        console.log('🛑 Stopping MediaRecorder audio capture...');
        const audioBlob = await voiceManagerRef.current.stopRecording();
        console.log('🎵 Audio blob received, size:', audioBlob.size);

        if (realtimeTranscript.trim()) {
          console.log('✅ Using real-time transcript:', realtimeTranscript);
          setVoiceStatus('complete');
          handleSendMessage(realtimeTranscript);
          return;
        }

        console.log('🤖 Processing audio with Whisper...');
        const result = await processVoiceInput(audioBlob);

        if (result.transcript && result.transcript.trim()) {
          setVoiceStatus('complete');
          handleSendMessage(result.transcript);
          return;
        }

        throw new Error('No speech detected in recording');
      }

      // SpeechRecognition-only mode
      if (realtimeTranscript.trim()) {
        setVoiceStatus('complete');
        handleSendMessage(realtimeTranscript);
        return;
      }

      throw new Error('No speech detected');
    } catch (error) {
      console.error('❌ Voice processing error:', error);
      setVoiceStatus('idle');
      toast({
        title: 'Voice Processing Error',
        description: error instanceof Error ? error.message : 'Failed to process voice input',
        variant: 'destructive',
      });
    }
  }, [realtimeTranscript, toast]);

  const speakText = useCallback(async (text: string) => {
    console.log('🔊 speakText called with:', { text, speechEnabled });
    
    if (!speechEnabled) {
      console.log('🔇 Speech disabled, returning early');
      return;
    }
    
    try {
      // Stop any current speech
      if (synthRef.current) {
        synthRef.current.cancel();
        console.log('🛑 Cancelled existing browser speech');
      }
      
      // Remove persona name prefix (like "Alex:") from speech
      const cleanText = text.replace(/^(Alex|Jordan|Morgan|Taylor):\s*/, '');
      console.log('🧹 Cleaned text:', { original: text, cleaned: cleanText });
      
      if (!cleanText.trim()) {
        console.log('❌ No text to speak after cleaning');
        return;
      }
      
      console.log('🚀 ATTEMPTING ELEVENLABS TTS - Starting API call...');
      console.log('📝 Request details:', {
        text: cleanText,
        voiceId: 'CwhRBWXzGAHq8TQ4Fs17',
        timestamp: new Date().toISOString()
      });
      
      // Call ElevenLabs TTS edge function via raw fetch — the function now
      // streams raw MP3 bytes (Content-Type: audio/mpeg) so we can build the
      // Blob directly from the arrayBuffer with no re-encoding or decoding.
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ggpodadyycvmmxifqwlp.supabase.co';
      const supabaseAnonKey =
        import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        '';
      let authToken = supabaseAnonKey;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          authToken = sessionData.session.access_token;
        }
      } catch (_) {
        /* guest — use anon key */
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          text: cleanText,
          voiceId: 'CwhRBWXzGAHq8TQ4Fs17', // Roger - natural, friendly male voice
        }),
      });

      console.log('📡 ElevenLabs edge function status:', response.status);

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('❌ ELEVENLABS FAILED - Status:', response.status, errBody);
        console.log('🔄 FALLING BACK TO BROWSER TTS');
        fallbackToWebSpeech(cleanText);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer.byteLength) {
        console.error('❌ Empty TTS response body');
        console.log('🔄 FALLING BACK TO BROWSER TTS - no audio content');
        fallbackToWebSpeech(cleanText);
        return;
      }

      console.log('✅ ELEVENLABS SUCCESS - Building audio blob from arrayBuffer');
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      console.log('🎵 Created audio blob:', { size: audioBlob.size, type: audioBlob.type });

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        console.log('🎵 ElevenLabs audio finished playing');
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (audioError) => {
        console.error('❌ Audio playback failed:', audioError);
        console.log('🔄 FALLING BACK TO BROWSER TTS due to audio error');
        URL.revokeObjectURL(audioUrl);
        fallbackToWebSpeech(cleanText);
      };

      await audio.play();
      console.log('🎤 ELEVENLABS AUDIO NOW PLAYING - Should be Roger\'s voice!');
    } catch (error) {
      console.error('❌ ELEVENLABS EXCEPTION:', error);
      console.log('🔄 FALLING BACK TO BROWSER TTS due to exception');
      fallbackToWebSpeech(text.replace(/^(Alex|Jordan|Morgan|Taylor):\s*/, ''));
    }
  }, [speechEnabled]);
  
  // Fallback to web speech synthesis if ElevenLabs fails
  const fallbackToWebSpeech = useCallback((cleanText: string) => {
    console.log('🔄 USING BROWSER TTS FALLBACK');
    console.log('⚠️ This will sound robotic - ElevenLabs failed');
    
    if (synthRef.current && speechEnabled) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      const voices = synthRef.current.getVoices();
      console.log('🎙️ Available browser voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
      
      const maleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('alex') ||
        voice.name.toLowerCase().includes('daniel') ||
        (voice.lang.startsWith('en') && voice.name.toLowerCase().includes('neural'))
      );
      
      if (maleVoice) {
        utterance.voice = maleVoice;
        console.log('🎙️ Using male voice:', maleVoice.name);
      } else {
        console.log('⚠️ No male voice found, using default');
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 0.9;
      utterance.volume = volume / 100;
      
      utterance.onstart = () => console.log('🎙️ Browser TTS started');
      utterance.onend = () => console.log('🎙️ Browser TTS finished');
      utterance.onerror = (error) => console.error('❌ Browser TTS error:', error);
      
      synthRef.current.speak(utterance);
      console.log('🎙️ BROWSER TTS SPEAKING - This is the robotic voice');
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
      
      if (speechEnabled) {
        speakText(introMessage.text);
      }
      
      // Automatically send the first objection after the greeting
      setTimeout(async () => {
        const objectionMessage = await generateFirstObjection(scenario, getAIPersona);
        const objectionMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: objectionMessage,
          sender: 'ai',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, objectionMsg]);
        setWaitingForUserResponse(true);
        
        if (speechEnabled) {
          // Small delay to let the first message finish
          setTimeout(() => speakText(objectionMessage), 2000);
        }
      }, 1000); // 1 second delay after greeting
    }
  }, [scenario, speechEnabled, getAIPersona, speakText]);

  const endSessionAndScore = useCallback(async () => {
    if (isAnalyzing || sessionEnded) return;

    const userMessages = messages.filter(m => m.sender === 'user');
    if (userMessages.length < 2) {
      toast({ title: 'Not enough data', description: 'Send at least 2 responses before ending the session.', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Build transcript from conversation
      const transcript = messages
        .map(m => `${m.sender === 'user' ? 'User' : 'AI Prospect'}: ${m.text}`)
        .join('\n\n');

      const { data, error } = await supabase.functions.invoke('pitch-analysis', {
        body: {
          transcript,
          practiceMode: activeMode,
          scenario: scenario || { industry: 'Technology', objection: 'General', difficulty: 'Beginner' },
          userContext: { userId: user?.id }
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.analysis) throw new Error('No analysis returned');

      const analysis = data.analysis;
      setSessionAnalysis(analysis);
      setSessionEnded(true);

      // Save session with AI score
      await saveSessionToDatabase(messages, { ...analysis, score: analysis.overallScore });

      // Deduct 1 credit for end-of-session analysis
      if (user) {
        await deductUserCredits('roleplay_session_analysis', 1);
      }

      toast({ title: 'Session Scored!', description: `Your overall score: ${analysis.overallScore}/100` });
    } catch (err) {
      console.error('End-session analysis error:', err);
      toast({ title: 'Scoring Failed', description: 'Could not analyze your session. Please try again.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, sessionEnded, messages, activeMode, scenario, user, saveSessionToDatabase, deductUserCredits, toast]);

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
    setShowReflectionCard(false);
    
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

      // Deduct credits for successful AI roleplay interaction
      if (user && !aiResponse.includes('fallback')) {
        const creditsToDeduct = activeMode === 'voice' || activeMode === 'hybrid' ? 2 : 1;
        const featureType = `roleplay_${activeMode}_${scenario?.objection || 'general'}`;
        
        console.log(`Deducting ${creditsToDeduct} credits for successful ${featureType}`);
        
        const deducted = await deductUserCredits(featureType, creditsToDeduct);
        if (!deducted) {
          console.warn('Credit deduction failed after successful roleplay response');
          // Don't stop the flow - user already got the value
        }
      }

      // Generate enhanced feedback for every user response (immediate feedback)
      if (scenario) {
        console.log('🎯 Generating enhanced feedback for user response:', textToSend);
        const enhancedFeedbackData = generateEnhancedFeedback(
          textToSend,
          currentObjectionText || scenario.objection,
          [...chatMessages, userMessage],
          userResponseCount + 1
        );
        console.log('📊 Generated enhanced feedback:', enhancedFeedbackData);
        setEnhancedFeedback(enhancedFeedbackData);
        // Save session with enhanced feedback (non-blocking UX)
        await saveSessionToDatabase(updatedMessages, enhancedFeedbackData);

        // Show reflection card only every 3 responses (3rd, 6th, 9th, etc.)
        const currentResponseNumber = userResponseCount + 1;
        if (currentResponseNumber % 3 === 0) {
          setTimeout(() => {
            console.log(`🤔 Showing reflection card at response #${currentResponseNumber}`);
            setShowReflectionCard(true);
          }, 800);
        } else {
          console.log(`⏭️ Skipping reflection card at response #${currentResponseNumber} (will show at next multiple of 3)`);
        }
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

  const handleRevealFeedback = () => {
    setShowReflectionCard(false);
    setShowEnhancedFeedback(true);
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

      {/* Reflection Card - Shows first */}
      {showReflectionCard && (
        <FeedbackReflectionCard
          isVisible={showReflectionCard}
          onRevealFeedback={handleRevealFeedback}
          userResponse={messages.filter(m => m.sender === 'user').slice(-1)[0]?.text || ''}
        />
      )}

      {/* Enhanced Feedback Display - Shows after reflection */}
      {enhancedFeedback && showEnhancedFeedback && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <EnhancedFeedbackDisplay
              feedback={enhancedFeedback}
              objectionText={currentObjectionText}
              userResponse={messages.filter(m => m.sender === 'user').slice(-1)[0]?.text || ''}
              isVisible={showEnhancedFeedback}
              onClose={closeEnhancedFeedback}
            />
          </div>
        </div>
      )}

      {/* End Session & Score Button */}
      {!sessionEnded && messages.filter(m => m.sender === 'user').length >= 2 && (
        <div className="flex justify-center mb-4">
          <Button
            onClick={endSessionAndScore}
            disabled={isAnalyzing}
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
          >
            {isAnalyzing ? (
              <>
                <div className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Analyzing Session...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                End Session & Get Score
              </>
            )}
          </Button>
        </div>
      )}

      {/* Session Analysis Results */}
      {sessionEnded && sessionAnalysis && (
        <Card className="mb-4 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Session Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Score */}
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-1">{sessionAnalysis.overallScore}/100</div>
              <p className="text-sm text-muted-foreground">
                {sessionAnalysis.overallScore >= 90 ? 'Outstanding!' :
                 sessionAnalysis.overallScore >= 80 ? 'Great job!' :
                 sessionAnalysis.overallScore >= 70 ? 'Good work!' : 'Keep practicing!'}
              </p>
            </div>

            {/* Category Scores */}
            {sessionAnalysis.categories && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(sessionAnalysis.categories).map(([key, cat]: [string, any]) => (
                  <div key={key} className="text-center p-2 bg-background rounded-lg border">
                    <div className="text-lg font-bold text-foreground">{cat.score}/10</div>
                    <div className="text-xs text-muted-foreground capitalize">{key === 'objectionHandling' ? 'Objections' : key}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Strengths */}
            {sessionAnalysis.strengths?.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground flex items-center gap-1 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Strengths
                </h4>
                <ul className="space-y-1">
                  {sessionAnalysis.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {sessionAnalysis.improvements?.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground flex items-center gap-1 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Areas to Improve
                </h4>
                <ul className="space-y-1">
                  {sessionAnalysis.improvements.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            {sessionAnalysis.recommendation && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-foreground italic">💡 {sessionAnalysis.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
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

        {/* Real-time transcript display */}
        {realtimeTranscript && isListening && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Mic className="h-4 w-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-blue-800">Speaking...</span>
            </div>
            <p className="text-sm text-blue-700 italic">"{realtimeTranscript}"</p>
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
                isListening ? "Listening... speak now" :
                realtimeTranscript ? "Voice input captured - edit if needed" :
                "Respond to overcome the objection..."
              }
              disabled={isLoading}
              className="pr-4"
            />
          </div>
          
          {(activeMode === 'voice' || activeMode === 'hybrid') && (
            <Button
              onClick={isListening ? stopRecording : startRecording}
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              disabled={isLoading}
              className={isListening ? "animate-pulse-slow" : ""}
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
