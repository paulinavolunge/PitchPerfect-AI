import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Get the SpeechRecognition constructor
const getSpeechRecognition = (): any => {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
};

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  disabled = false,
  placeholder = "Click the microphone to start speaking...",
  className,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
    
    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      console.log('🎤 Microphone permission granted');
      return true;
    } catch (err) {
      console.error('🎤 Microphone permission denied:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access in your browser settings and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      }
      return false;
    }
  };

  const startRecording = async () => {
    if (disabled || !isSupported) return;
    
    setError(null);
    setCurrentTranscript('');
    setIsRequesting(true);
    
    try {
      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        setIsRequesting(false);
        return;
      }
      
      // Initialize speech recognition
      const SpeechRecognitionAPI = getSpeechRecognition();
      if (!SpeechRecognitionAPI) {
        throw new Error('Speech recognition not supported');
      }
      
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsRecording(true);
        setIsRequesting(false);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const fullTranscript = finalTranscript || interimTranscript;
        setCurrentTranscript(fullTranscript);
        onTranscript(fullTranscript, !!finalTranscript);
        
        console.log('🗣️ Transcript:', fullTranscript, 'Final:', !!finalTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('🎤 Speech recognition error:', event.error);
        
        let errorMessage = 'Speech recognition error';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly and try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Audio capture failed. Please check your microphone.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        setError(errorMessage);
        setIsRecording(false);
        setIsRequesting(false);
      };
      
      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        setIsRecording(false);
        
        // Clean up microphone stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      recognition.start();
      console.log('🎤 Speech recognition starting...');
      
    } catch (err) {
      console.error('🎤 Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecording(false);
      setIsRequesting(false);
    }
  };

  const stopRecording = () => {
    console.log('🎤 Stopping recording...');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={toggleRecording}
            disabled={disabled || isRequesting}
            className={cn(
              "h-12 w-12 rounded-full transition-all duration-200",
              isRecording && "animate-pulse shadow-lg shadow-destructive/30"
            )}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRequesting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          
          {isRecording && (
            <div 
              className="absolute inset-0 rounded-full border-4 border-destructive animate-ping pointer-events-none opacity-30"
              aria-hidden="true"
            />
          )}
        </div>
        
        <div className="flex-1">
          {isRequesting ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Requesting microphone access...</span>
            </div>
          ) : isRecording ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                <span className="text-sm font-medium text-destructive">Recording... Speak now</span>
              </div>
              
              {currentTranscript && (
                <p className="text-sm text-muted-foreground italic">
                  "{currentTranscript}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {placeholder}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceInput;
