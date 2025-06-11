
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIErrorHandler } from '@/utils/aiErrorHandler';
import { showAIErrorToast } from '@/components/ui/ai-error-toast';

interface VoiceRecognitionManagerProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  disabled?: boolean;
  onError?: (error: string) => void;
}

const VoiceRecognitionManager: React.FC<VoiceRecognitionManagerProps> = ({
  onTranscript,
  disabled = false,
  onError
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Check for browser support
  const isSupported = useCallback(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }, []);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!isSupported()) {
      const errorMsg = 'Speech recognition is not supported in this browser';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        try {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            onTranscript(finalTranscript, true);
          } else if (interimTranscript) {
            onTranscript(interimTranscript, false);
          }
        } catch (error) {
          console.error('Error processing speech results:', error);
          AIErrorHandler.handleError({
            name: 'SpeechProcessingError',
            message: 'Failed to process speech recognition results',
            code: 'SPEECH_PROCESSING_ERROR',
          }, 'voice-recognition');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Speech recognition failed';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'audio-capture':
            errorMessage = 'Audio capture failed. Please check your microphone.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        setError(errorMessage);
        onError?.(errorMessage);
        setIsListening(false);
        setIsRecording(false);
        
        showAIErrorToast({
          title: "Voice Recognition Error",
          description: errorMessage,
          errorCode: event.error.toUpperCase(),
          duration: 5000,
        });
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // Auto-restart if we're still supposed to be recording
        if (isRecording && !error) {
          setTimeout(() => {
            if (isRecording) {
              recognition.start();
            }
          }, 100);
        }
      };

      return recognition;
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      AIErrorHandler.handleError({
        name: 'SpeechInitError',
        message: 'Failed to initialize speech recognition',
        code: 'SPEECH_INIT_ERROR',
      }, 'voice-recognition');
      return null;
    }
  }, [isSupported, onTranscript, onError, isRecording, error]);

  // Initialize audio visualization
  const initializeAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255);
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Failed to initialize audio visualization:', error);
    }
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (disabled) return;

    try {
      setError(null);
      
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recognition = initializeSpeechRecognition();
      if (!recognition) return;
      
      recognitionRef.current = recognition;
      setIsRecording(true);
      
      await AIErrorHandler.withRetry(
        async () => {
          recognition.start();
        },
        'start-voice-recognition',
        { maxRetries: 2 }
      );
      
      await initializeAudioVisualization();
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to start voice recording';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsRecording(false);
      
      AIErrorHandler.handleError({
        name: 'VoiceStartError',
        message: 'Failed to start voice recording',
        code: 'VOICE_START_ERROR',
        retryable: true,
      }, 'voice-recognition');
    }
  }, [disabled, initializeSpeechRecognition, initializeAudioVisualization, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsListening(false);
    setAudioLevel(0);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      recognitionRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported()) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="text-xs text-gray-500 text-center max-w-[150px]">
          Voice input not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={toggleRecording}
        disabled={disabled}
        className={cn(
          "h-11 w-11 sm:h-10 sm:w-10 relative touch-manipulation transition-all duration-200",
          isRecording && "animate-pulse shadow-lg",
          isListening && "ring-2 ring-blue-400 ring-opacity-50"
        )}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <MicOff size={18} className="sm:size-4" />
        ) : (
          <Mic size={18} className="sm:size-4" />
        )}
        
        {/* Audio level indicator */}
        {isRecording && audioLevel > 0 && (
          <div
            className="absolute inset-0 rounded-md border-2 border-blue-400 opacity-50"
            style={{
              transform: `scale(${1 + audioLevel * 0.3})`,
              transition: 'transform 0.1s ease-out'
            }}
          />
        )}
      </Button>
      
      {/* Status indicator */}
      <div className="text-xs text-center min-h-[16px] max-w-[80px]">
        {isListening && (
          <div className="flex items-center gap-1 text-blue-600">
            <Volume2 size={10} />
            <span className="hidden sm:inline">Listening</span>
            <span className="sm:hidden">●</span>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-[10px] break-words">
            {error.substring(0, 20)}...
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecognitionManager;
