
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mic, MicOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AIErrorHandler } from '@/utils/aiErrorHandler';
import { showAIErrorToast, showNetworkErrorToast } from '@/components/ui/ai-error-toast';

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
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  // Initialize speech recognition with error handling
  useEffect(() => {
    const initializeSpeechRecognition = async () => {
      try {
        // Check if browser supports Web Speech API
        const speechRecognitionConstructor = window.SpeechRecognition || 
                                            (window as any).webkitSpeechRecognition;
        
        if (!speechRecognitionConstructor) {
          setIsSpeechSupported(false);
          const errorMsg = 'Your browser does not support speech recognition';
          setError(errorMsg);
          if (onError) onError(errorMsg);
          return;
        }

        recognitionRef.current = new speechRecognitionConstructor();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          try {
            const transcript = Array.from(event.results)
              .map(result => result[0].transcript)
              .join(' ');
            
            const isFinal = event.results[event.results.length - 1].isFinal;
            
            onTranscript(transcript, isFinal);
            
            // Reset retry count on successful transcription
            setRetryCount(0);
          } catch (err) {
            console.error('Error processing speech result:', err);
            AIErrorHandler.handleError({
              name: 'SpeechProcessingError',
              message: 'Failed to process speech recognition result',
              code: 'SPEECH_PROCESSING_ERROR',
            }, 'voice-recognition');
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
          console.error('Speech recognition error:', event.error);
          
          let errorMessage = '';
          let errorCode = '';
          let retryable = false;

          switch (event.error) {
            case 'not-allowed':
            case 'permission-denied':
              errorMessage = 'Microphone access denied. Please allow microphone permissions.';
              errorCode = 'PERMISSION_DENIED';
              setHasPermission(false);
              break;
            case 'no-speech':
              errorMessage = 'No speech detected. Please try speaking again.';
              errorCode = 'NO_SPEECH';
              retryable = true;
              break;
            case 'audio-capture':
              errorMessage = 'No microphone detected. Please check your device.';
              errorCode = 'AUDIO_CAPTURE_ERROR';
              break;
            case 'network':
              errorMessage = 'Network error. Please check your connection.';
              errorCode = 'NETWORK_ERROR';
              retryable = true;
              showNetworkErrorToast(() => handleRetryRecognition());
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service not available.';
              errorCode = 'SERVICE_UNAVAILABLE';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
              errorCode = 'UNKNOWN_ERROR';
              retryable = true;
          }

          setError(errorMessage);
          if (onError) onError(errorMessage);
          
          if (!retryable || errorCode === 'NETWORK_ERROR') {
            AIErrorHandler.handleError({
              name: 'SpeechRecognitionError',
              message: errorMessage,
              code: errorCode,
              retryable,
            }, 'voice-recognition');
          }
          
          stopListening();
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        // Check microphone permissions
        await checkMicrophonePermission();

      } catch (err) {
        console.error('Failed to initialize speech recognition:', err);
        AIErrorHandler.handleError({
          name: 'InitializationError',
          message: 'Failed to initialize speech recognition',
          code: 'INITIALIZATION_ERROR',
        }, 'voice-recognition');
      }
    };

    initializeSpeechRecognition();

    return () => {
      stopListening();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      cleanupAudioResources();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setError(null);
      
      // Clean up the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone permission error:', error);
      setHasPermission(false);
      const errorMsg = 'Microphone access is required for voice recognition';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  const initializeAudio = async () => {
    try {
      // Request microphone access with error handling
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Create analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Connect microphone to analyser
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      
      // Start monitoring audio levels
      updateAudioLevel();
      
      return true;
    } catch (error) {
      console.error('Error initializing audio:', error);
      
      let errorCode = 'AUDIO_INIT_ERROR';
      let errorMessage = 'Could not access microphone';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorCode = 'PERMISSION_DENIED';
          errorMessage = 'Microphone access was denied';
          setHasPermission(false);
        } else if (error.name === 'NotFoundError') {
          errorCode = 'NO_MICROPHONE';
          errorMessage = 'No microphone found on this device';
        } else if (error.name === 'NotReadableError') {
          errorCode = 'MICROPHONE_BUSY';
          errorMessage = 'Microphone is being used by another application';
        }
      }
      
      setError(errorMessage);
      if (onError) onError(errorMessage);
      
      AIErrorHandler.handleError({
        name: 'AudioInitError',
        message: errorMessage,
        code: errorCode,
      }, 'voice-recognition');
      
      return false;
    }
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current || !isListening) return;
    
    try {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average audio level
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = average / 255; // Normalize to range 0-1
      
      setAudioLevel(normalizedLevel);
      
      // Continue monitoring
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    } catch (error) {
      console.error('Error updating audio level:', error);
    }
  };

  const handleRetryRecognition = async () => {
    if (retryCount >= 3) {
      showAIErrorToast({
        title: "Maximum Retries Exceeded",
        description: "Unable to start voice recognition after multiple attempts. Please try refreshing the page.",
        errorCode: "MAX_RETRIES",
      });
      return;
    }

    setRetryCount(prev => prev + 1);
    setError(null);
    
    // Wait a moment before retrying
    setTimeout(() => {
      startListening();
    }, 1000 * retryCount);
  };

  const startListening = async () => {
    if (!recognitionRef.current || disabled) return;
    
    try {
      setError(null);
      
      if (!(await initializeAudio())) {
        return;
      }
      
      await AIErrorHandler.withRetry(
        async () => {
          if (!recognitionRef.current) throw new Error('Recognition not initialized');
          recognitionRef.current.start();
          setIsListening(true);
          
          toast({
            title: "Voice Recognition Active",
            description: "Speak now. Your voice is being recorded.",
          });
        },
        'start-voice-recognition',
        { maxRetries: 2 }
      );

    } catch (error) {
      console.error('Error starting recognition:', error);
      setError('Could not start voice recognition');
      if (onError) onError('Could not start voice recognition');
      
      AIErrorHandler.handleError({
        name: 'StartRecognitionError',
        message: 'Could not start voice recognition',
        code: 'START_ERROR',
        retryable: true,
      }, 'voice-recognition');
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
      
      setIsListening(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      cleanupAudioResources();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  };

  const cleanupAudioResources = () => {
    try {
      // Stop all tracks in the media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      
      // Disconnect and close audio nodes
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
        microphoneRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      
      analyserRef.current = null;
    } catch (error) {
      console.error('Error cleaning up audio resources:', error);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setError(null);
      toast({
        title: "Microphone Access Granted",
        description: "You can now use voice recognition.",
      });
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
      const errorMsg = 'Microphone access is required for voice recognition';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      
      AIErrorHandler.handleError({
        name: 'PermissionError',
        message: errorMsg,
        code: 'PERMISSION_DENIED',
        retryable: false,
      }, 'voice-recognition');
    }
  };

  // Render microphone permission request
  if (hasPermission === false) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <span>Microphone access is required for voice recognition.</span>
          <Button 
            onClick={requestMicrophonePermission} 
            className="w-fit"
            variant="secondary"
          >
            Grant Microphone Access
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Render unsupported browser message
  if (!isSpeechSupported) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your browser does not support voice recognition. Please try using Chrome, Edge, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        className={`relative ${isListening ? "animate-pulse" : ""}`}
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        aria-label={isListening ? "Stop listening" : "Start listening"}
        title={isListening ? "Stop listening" : "Start listening"}
      >
        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        
        {/* Audio level visualization */}
        {isListening && (
          <div 
            className="absolute inset-0 rounded-full border-2 border-destructive animate-ping pointer-events-none"
            style={{
              transform: `scale(${1 + audioLevel})`,
              opacity: 0.3 + audioLevel * 0.7
            }}
            aria-hidden="true"
          />
        )}
      </Button>
      
      {error && retryCount < 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRetryRecognition}
          className="text-xs"
        >
          Retry
        </Button>
      )}
    </div>
  );
};

export default VoiceRecognitionManager;
