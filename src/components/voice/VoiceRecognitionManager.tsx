
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mic, MicOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

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

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports Web Speech API
    const speechRecognitionConstructor = window.SpeechRecognition || 
                                        (window as any).webkitSpeechRecognition;
    
    if (!speechRecognitionConstructor) {
      setIsSpeechSupported(false);
      setError('Your browser does not support speech recognition');
      if (onError) onError('Your browser does not support speech recognition');
      return;
    }

    recognitionRef.current = new speechRecognitionConstructor();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ');
      
      const isFinal = event.results[event.results.length - 1].isFinal;
      
      onTranscript(transcript, isFinal);
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = '';
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorMessage = 'Microphone access denied. Please allow microphone permissions.';
          setHasPermission(false);
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone detected. Please check your device.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      setError(errorMessage);
      if (onError) onError(errorMessage);
      
      toast({
        title: "Voice Recognition Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      stopListening();
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    // Check microphone permissions
    checkMicrophonePermission();

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
      
      // Clean up the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone permission error:', error);
      setHasPermission(false);
      setError('Microphone access is required for voice recognition');
      if (onError) onError('Microphone access is required for voice recognition');
    }
  };

  const initializeAudio = async () => {
    try {
      // Request microphone access
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
      setError('Could not access microphone');
      if (onError) onError('Could not access microphone');
      return false;
    }
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current || !isListening) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = average / 255; // Normalize to range 0-1
    
    setAudioLevel(normalizedLevel);
    
    // Continue monitoring
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const startListening = async () => {
    if (!recognitionRef.current || disabled) return;
    
    setError(null);
    
    if (!(await initializeAudio())) {
      return;
    }
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "Voice Recognition Active",
        description: "Speak now. Your voice is being recorded.",
      });
    } catch (error) {
      console.error('Error starting recognition:', error);
      setError('Could not start voice recognition');
      if (onError) onError('Could not start voice recognition');
      toast({
        title: "Voice Recognition Error",
        description: "Could not start voice recognition.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    setIsListening(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    cleanupAudioResources();
  };

  const cleanupAudioResources = () => {
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
      setError('Microphone access is required for voice recognition');
      if (onError) onError('Microphone access is required for voice recognition');
      toast({
        title: "Microphone Access Denied",
        description: "Voice recognition requires microphone access.",
        variant: "destructive",
      });
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
      
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
};

export default VoiceRecognitionManager;
