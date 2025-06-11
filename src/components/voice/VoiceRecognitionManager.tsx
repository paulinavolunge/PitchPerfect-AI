
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIErrorHandler } from '@/utils/aiErrorHandler';
import { showAIErrorToast } from '@/components/ui/ai-error-toast';
import { crossBrowserVoiceService } from '@/services/CrossBrowserVoiceService';
import { browserInfo } from '@/utils/browserDetection';
import BrowserCompatibilityChecker from '@/components/compatibility/BrowserCompatibilityChecker';

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
  const [isCompatible, setIsCompatible] = useState<boolean | null>(null);
  const [showCompatibilityCheck, setShowCompatibilityCheck] = useState(false);
  
  const lastAnalysisTime = useRef<number>(0);
  const throttleMs = 50;

  // Check browser compatibility on mount
  useEffect(() => {
    const capabilities = crossBrowserVoiceService.getBrowserCapabilities();
    const compatible = capabilities.supportsMediaDevices && 
                      (capabilities.supportsWebSpeech || capabilities.fallbackActive);
    setIsCompatible(compatible);
    
    if (!compatible) {
      setShowCompatibilityCheck(true);
    }
  }, []);

  // Start recording with cross-browser support
  const startRecording = useCallback(async () => {
    if (disabled || !isCompatible) return;

    try {
      setError(null);
      
      // Check microphone permission with browser-specific handling
      const hasPermission = await crossBrowserVoiceService.checkMicrophonePermission();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }
      
      await crossBrowserVoiceService.startRecording(
        {
          continuous: true,
          interimResults: true,
          language: 'en-US'
        },
        {
          onResult: (result) => {
            try {
              onTranscript(result.transcript, result.isFinal);
            } catch (error) {
              console.error('Error processing speech results:', error);
              AIErrorHandler.handleError({
                name: 'SpeechProcessingError',
                message: 'Failed to process speech recognition results',
                code: 'SPEECH_PROCESSING_ERROR',
              }, 'voice-recognition');
            }
          },
          onError: (error) => {
            console.error('Speech recognition error:', error);
            
            let errorMessage = 'Speech recognition failed';
            switch (error.code) {
              case 'PERMISSION_DENIED':
                errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
                break;
              case 'NO_SPEECH':
                errorMessage = 'No speech detected. Please speak clearly.';
                break;
              case 'NETWORK':
                errorMessage = 'Network error. Please check your connection.';
                break;
              case 'AUDIO_CAPTURE':
                errorMessage = 'Audio capture failed. Please check your microphone.';
                break;
              default:
                errorMessage = error.message || 'Speech recognition error occurred';
            }
            
            setError(errorMessage);
            onError?.(errorMessage);
            setIsListening(false);
            setIsRecording(false);
            
            showAIErrorToast({
              title: "Voice Recognition Error",
              description: errorMessage,
              errorCode: error.code || 'UNKNOWN',
              duration: 5000,
            });
          },
          onStart: () => {
            console.log('Speech recognition started');
            setIsListening(true);
            setError(null);
          },
          onEnd: () => {
            console.log('Speech recognition ended');
            setIsListening(false);
          }
        }
      );
      
      setIsRecording(true);
      
      // Initialize audio visualization if supported
      if (browserInfo.supportsWebAudio) {
        await crossBrowserVoiceService.initializeAudioAnalysis();
        updateAudioLevel();
      }
      
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
  }, [disabled, isCompatible, onTranscript, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsListening(false);
    setAudioLevel(0);
    
    crossBrowserVoiceService.stopRecording();
  }, []);

  // Update audio level with throttling
  const updateAudioLevel = useCallback(() => {
    if (!isRecording || !browserInfo.supportsWebAudio) return;
    
    const now = performance.now();
    if (now - lastAnalysisTime.current < throttleMs) {
      requestAnimationFrame(updateAudioLevel);
      return;
    }
    lastAnalysisTime.current = now;
    
    const level = crossBrowserVoiceService.getAudioLevel();
    setAudioLevel(level);
    
    if (isRecording) {
      requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording, throttleMs]);

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

  // Show compatibility checker if not compatible
  if (isCompatible === false) {
    return (
      <div className="space-y-4">
        <BrowserCompatibilityChecker 
          onCompatibilityChecked={setIsCompatible}
          showDetails={true}
        />
        {showCompatibilityCheck && (
          <div className="text-center">
            <Button 
              onClick={() => setShowCompatibilityCheck(false)}
              variant="outline"
            >
              Continue Anyway
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (isCompatible === null) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
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
        {isRecording && audioLevel > 0 && browserInfo.supportsWebAudio && (
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
        {!browserInfo.supportsWebSpeech && !error && (
          <div className="text-yellow-600 text-[10px]">
            Fallback mode
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecognitionManager;
