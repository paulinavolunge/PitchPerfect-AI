import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { voiceService } from '@/services/VoiceService';
import { cn } from '@/lib/utils';
import { MicrophonePermissionHandler } from '@/components/permissions/MicrophonePermissionHandler';

interface VoiceInputProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onSpeakText?: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showSpeechOutput?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onSpeakText,
  disabled = false,
  placeholder = "Click the microphone to start speaking...",
  className,
  showSpeechOutput = true
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const audioLevelRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    setIsSupported(voiceService.isVoiceSupported());
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      voiceService.dispose();
    };
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (isRecording) {
      const level = voiceService.getAudioLevel();
      setAudioLevel(level);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      updateAudioLevel();
    } else {
      setAudioLevel(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isRecording, updateAudioLevel]);

  const handleStartRecording = async () => {
    if (!isSupported) {
      setError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    setError(null);
    
    try {
      await voiceService.startRecording(
        {
          continuous: true,
          interimResults: true,
          language: 'en-US'
        },
        (text, isFinal) => {
          setCurrentTranscript(text);
          onTranscript(text, isFinal);
        },
        (errorMessage) => {
          setError(errorMessage);
          setIsRecording(false);
        }
      );
      
      setIsRecording(true);
      setHasPermission(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice recording';
      setError(errorMessage);
      
      if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        setHasPermission(false);
      }
    }
  };

  const handleStopRecording = () => {
    voiceService.stopRecording();
    setIsRecording(false);
    setCurrentTranscript('');
  };

  const handleSpeakText = async (text: string) => {
    if (!onSpeakText || !text.trim()) return;
    
    try {
      setIsSpeaking(true);
      await voiceService.speak(
        text,
        { rate: 1, pitch: 1, volume: 0.8 },
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        (error) => {
          setError(`Speech output error: ${error}`);
          setIsSpeaking(false);
        }
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to speak text');
      setIsSpeaking(false);
    }
  };

  const handleStopSpeaking = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  const handlePermissionGranted = () => {
    setHasPermission(true);
    setError(null);
  };

  const handlePermissionDenied = () => {
    setHasPermission(false);
    setError('Microphone access is required for voice features');
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Voice features are not supported in this browser. Please use Chrome, Edge, or Safari for the best experience.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <MicrophonePermissionHandler
      onPermissionGranted={handlePermissionGranted}
      onPermissionDenied={handlePermissionDenied}
    >
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
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={disabled}
              className={cn(
                "h-12 w-12 rounded-full transition-all duration-200",
                isRecording && "animate-pulse shadow-lg shadow-red-300"
              )}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </Button>
            
            {isRecording && (
              <div 
                className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping"
                style={{
                  transform: `scale(${1 + audioLevel * 0.5})`,
                  opacity: 0.3 + audioLevel * 0.7
                }}
              />
            )}
          </div>
          
          {showSpeechOutput && onSpeakText && (
            <Button
              type="button"
              size="icon"
              variant={isSpeaking ? "default" : "outline"}
              onClick={isSpeaking ? handleStopSpeaking : () => handleSpeakText(currentTranscript)}
              disabled={disabled || !currentTranscript.trim()}
              className="h-12 w-12 rounded-full"
              aria-label={isSpeaking ? "Stop speaking" : "Speak text"}
            >
              {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
          )}
          
          <div className="flex-1">
            {isRecording ? (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-red-600">Recording...</span>
                </div>
                
                {/* Audio level indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${audioLevel * 100}%` }}
                  />
                </div>
                
                {currentTranscript && (
                  <p className="text-sm text-gray-600 italic">"{currentTranscript}"</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{placeholder}</p>
            )}
          </div>
        </div>
      </div>
    </MicrophonePermissionHandler>
  );
};

export default VoiceInput;
