
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AccessibleButton } from '@/components/ui/accessible-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { voiceService } from '@/services/VoiceService';
import { cn } from '@/lib/utils';
import { MicrophonePermissionHandler } from '@/components/permissions/MicrophonePermissionHandler';
import { announceToScreenReader, generateUniqueId } from '@/utils/accessibility';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';

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
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  
  const audioLevelRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  
  const micButtonId = useRef(generateUniqueId('mic-button')).current;
  const speakButtonId = useRef(generateUniqueId('speak-button')).current;
  const transcriptId = useRef(generateUniqueId('transcript')).current;
  const errorId = useRef(generateUniqueId('voice-error')).current;

  useEffect(() => {
    setIsSupported(voiceService.isVoiceSupported());
    
    return () => {
      console.log('🧹 VoiceInput cleanup...');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up voice service
      voiceService.dispose();
      
      // Force cleanup of any remaining resources
      setTimeout(() => {
        if (typeof global !== 'undefined' && global.gc) {
          global.gc();
        }
      }, 100);
    };
  }, []);

  const updateAudioLevel = useCallback((): void => {
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

  const handleStartRecording = async (): Promise<void> => {
    if (!isSupported) {
      const errorMsg = 'Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.';
      setError(errorMsg);
      announceToScreenReader(errorMsg, 'assertive');
      return;
    }

    setError(null);
    announceToScreenReader('Starting voice recording...');
    
    try {
      await voiceService.startRecording(
        {
          continuous: true,
          interimResults: true,
          language: 'en-US'
        },
        {
          onResult: (result) => {
            setCurrentTranscript(result.transcript);
            onTranscript(result.transcript, result.isFinal);
            if (result.isFinal) {
              announceToScreenReader(`Recorded: ${result.transcript}`);
            }
          },
          onError: (error) => {
            setError(error.message);
            setIsRecording(false);
            announceToScreenReader(`Recording error: ${error.message}`, 'assertive');
          }
        }
      );
      
      setIsRecording(true);
      setHasPermission(true);
      announceToScreenReader('Recording started. Speak now.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice recording';
      setError(errorMessage);
      announceToScreenReader(`Failed to start recording: ${errorMessage}`, 'assertive');
      
      if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        setHasPermission(false);
      }
    }
  };

  const handleStopRecording = (): void => {
    voiceService.stopRecording();
    setIsRecording(false);
    setCurrentTranscript('');
    announceToScreenReader('Recording stopped.');
  };

  const handleSpeakText = async (text: string): Promise<void> => {
    if (!onSpeakText || !text.trim()) return;
    
    try {
      setIsSpeaking(true);
      announceToScreenReader('Starting text-to-speech...');
      
      await voiceService.speak(
        text,
        { rate: 1, pitch: 1, volume: 0.8 },
        {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false);
            announceToScreenReader('Text-to-speech completed.');
          },
          onError: (error) => {
            const errorMsg = `Speech output error: ${error.message}`;
            setError(errorMsg);
            setIsSpeaking(false);
            announceToScreenReader(errorMsg, 'assertive');
          }
        }
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to speak text';
      setError(errorMsg);
      setIsSpeaking(false);
      announceToScreenReader(errorMsg, 'assertive');
    }
  };

  const handleStopSpeaking = (): void => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    announceToScreenReader('Text-to-speech stopped.');
  };

  const handlePermissionGranted = (): void => {
    setHasPermission(true);
    setError(null);
    announceToScreenReader('Microphone permission granted.');
  };

  const handlePermissionDenied = (): void => {
    setHasPermission(false);
    const errorMsg = 'Microphone access is required for voice features';
    setError(errorMsg);
    announceToScreenReader(errorMsg, 'assertive');
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive" className={className} role="alert">
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
      <section className={cn("space-y-4", className)} role="region" aria-labelledby="voice-input-heading">
        <ScreenReaderOnly>
          <h2 id="voice-input-heading">Voice Input Controls</h2>
        </ScreenReaderOnly>
        
        {error && (
          <Alert variant="destructive" role="alert" id={errorId}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <AccessibleButton
              id={micButtonId}
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={disabled}
              className={cn(
                "h-12 w-12 rounded-full transition-all duration-200",
                isRecording && "animate-pulse shadow-lg shadow-red-300"
              )}
              ariaLabel={isRecording ? "Stop recording" : "Start recording"}
              ariaDescribedBy={error ? errorId : undefined}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </AccessibleButton>
            
            {isRecording && (
              <div 
                className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping pointer-events-none"
                style={{
                  transform: `scale(${1 + audioLevel * 0.5})`,
                  opacity: 0.3 + audioLevel * 0.7
                }}
                aria-hidden="true"
              />
            )}
          </div>
          
          {showSpeechOutput && onSpeakText && (
            <AccessibleButton
              id={speakButtonId}
              size="icon"
              variant={isSpeaking ? "default" : "outline"}
              onClick={isSpeaking ? handleStopSpeaking : () => handleSpeakText(currentTranscript)}
              disabled={disabled || !currentTranscript.trim()}
              className="h-12 w-12 rounded-full"
              ariaLabel={isSpeaking ? "Stop speaking" : "Speak text"}
              ariaDescribedBy={transcriptId}
            >
              {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </AccessibleButton>
          )}
          
          <div className="flex-1">
            {isRecording ? (
              <div className="flex flex-col space-y-2" role="status" aria-live="polite">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
                  <span className="text-sm font-medium text-red-600">Recording...</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-label="Audio level">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${audioLevel * 100}%` }}
                    aria-hidden="true"
                  />
                  <ScreenReaderOnly>Audio level: {Math.round(audioLevel * 100)}%</ScreenReaderOnly>
                </div>
                
                {currentTranscript && (
                  <p 
                    id={transcriptId}
                    className="text-sm text-gray-600 italic"
                    aria-live="polite"
                    aria-label="Current transcript"
                  >
                    "{currentTranscript}"
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500" role="status">
                {placeholder}
              </p>
            )}
          </div>
        </div>
        
        <ScreenReaderOnly>
          <div aria-live="polite" aria-atomic="true">
            {isRecording && `Recording in progress. Audio level: ${Math.round(audioLevel * 100)}%`}
            {isSpeaking && 'Text-to-speech in progress'}
          </div>
        </ScreenReaderOnly>
      </section>
    </MicrophonePermissionHandler>
  );
};

export default VoiceInput;
