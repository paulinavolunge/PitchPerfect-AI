import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Send, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PracticeObjectionProps {
  scenario: string;
  onSubmit: (input: { type: 'voice' | 'text'; data: Blob | string }) => void;
}

const PracticeObjection: React.FC<PracticeObjectionProps> = ({ scenario, onSubmit }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("PracticeObjection component mounted");
      console.log("Scenario loaded:", scenario);
    }

    // Check for speech recognition support
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      if (import.meta.env.DEV) {
        console.log("Speech recognition supported");
      }
      initializeSpeechRecognition();
    } else {
      if (import.meta.env.DEV) {
        console.log("Speech recognition not supported, falling back to text input");
      }
      setInputMode('text');
      setError("Voice input not supported in this browser. Using text input instead.");
    }

    // Request microphone permission
    requestMicrophonePermission();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    if (import.meta.env.DEV) {
      console.log("Requesting microphone permission");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone permission granted");
      setHasPermission(true);
      setError(null);
      mediaStreamRef.current = stream;
      // Stop the stream immediately after permission check
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setHasPermission(false);
      setError("Microphone access denied. Please allow microphone access or use text input.");
      setInputMode('text');
    }
  };

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition() as any;
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        if (import.meta.env.DEV) {
          console.log("Speech recognition result:", event);
        }
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        // Update transcript with both final and interim results
        setTranscript(prev => {
          const newTranscript = prev + finalTranscript;
          if (import.meta.env.DEV) {
            console.log("Updated transcript:", newTranscript);
          }
          return newTranscript;
        });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);

        if (event.error === 'not-allowed') {
          setHasPermission(false);
          setInputMode('text');
        }
      };

      recognitionRef.current.onend = () => {
        if (import.meta.env.DEV) {
          console.log("Speech recognition ended");
        }
        setIsListening(false);

        // Show feedback to user that recording stopped
        if (transcript.trim()) {
          toast({
            title: "Recording Stopped",
            description: "Click the microphone again to continue recording or submit your response.",
          });
        } else {
          toast({
            title: "Recording Stopped",
            description: "No speech detected. Click the microphone to try again.",
          });
        }
      };
    }
  };

  const startListening = async () => {
    if (import.meta.env.DEV) {
      console.log("Starting voice recording");
    }

    if (!hasPermission) {
      await requestMicrophonePermission();
      return;
    }

    if (recognitionRef.current) {
      setError(null);
      setTranscript(''); // Clear previous transcript

      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: "Listening",
          description: "Speak your response to the objection. Click stop when finished.",
        });
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setError("Failed to start voice recording. Please try again.");
      }
    }
  };

  const stopListening = () => {
    if (import.meta.env.DEV) {
      console.log("Stopping voice recording");
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);

      if (transcript.trim()) {
        toast({
          title: "Recording Complete",
          description: "Your response has been captured. Review and submit when ready.",
        });
      }
    }
  };

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (import.meta.env.DEV) {
      console.log("🎯 GET FEEDBACK BUTTON CLICKED");
      console.log("Event:", e);
      console.log("Input mode:", inputMode);
      console.log("Transcript:", transcript);
      console.log("Text input:", textInput);
      console.log("Is submitting:", isSubmitting);
    }

    // Prevent double submission
    if (isSubmitting) {
      if (import.meta.env.DEV) {
        console.log("❌ Already submitting, ignoring click");
      }
      return;
    }

    const response = inputMode === 'voice' ? transcript.trim() : textInput.trim();
    if (import.meta.env.DEV) {
      console.log("Response to submit:", response);
      console.log("Response length:", response.length);
    }

    if (!response) {
      if (import.meta.env.DEV) {
        console.log("❌ No response provided");
      }
      setError("Please provide a response before submitting.");
      toast({
        title: "Response Required",
        description: "Please record or type your response first.",
        variant: "destructive",
      });
      return;
    }

    if (response.length < 10) {
      if (import.meta.env.DEV) {
        console.log("❌ Response too short");
      }
      setError("Please provide a more detailed response (at least 10 characters).");
      toast({
        title: "Response Too Short",
        description: "Please provide a more detailed response (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }

    if (import.meta.env.DEV) {
      console.log("✅ Validation passed, setting submitting state");
    }
    setIsSubmitting(true);
    setError(null);

    try {
      if (import.meta.env.DEV) {
        console.log(`📤 Submitting ${inputMode} response:`, response);
      }

      // Call the onSubmit prop with the response data
      await onSubmit({
        type: inputMode,
        data: response
      });

      if (import.meta.env.DEV) {
        console.log("✅ Response submitted successfully");
      }

      // Reset form after successful submission
      setTranscript('');
      setTextInput('');

    } catch (err) {
      console.error("❌ Submission error:", err);
      setError("Failed to submit response. Please try again.");

      toast({
        title: "Submission Error",
        description: "There was an error submitting your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (import.meta.env.DEV) {
        console.log("🏁 Submission complete, resetting state");
      }
      setIsSubmitting(false);
    }
  };

  const switchToTextMode = () => {
    if (import.meta.env.DEV) {
      console.log("Switching to text input mode");
    }
    setInputMode('text');
    setError(null);
    if (isListening) {
      stopListening();
    }
  };

  const retryVoiceMode = () => {
    if (import.meta.env.DEV) {
      console.log("Retrying voice mode");
    }
    setInputMode('voice');
    setError(null);
    requestMicrophonePermission();
  };

  // Get the current response for validation
  const currentResponse = inputMode === 'voice' ? transcript.trim() : textInput.trim();
  const canSubmit = currentResponse.length >= 10 && !isSubmitting;

  return (
    <div className="space-y-6">
      {/* Enhanced Scenario Display */}
      <Card className="vibrant-card border-l-4 border-l-vibrant-blue-500 bg-gradient-to-r from-vibrant-blue-50 to-white">
        <CardHeader>
          <CardTitle className="text-deep-navy flex items-center gap-2 font-bold">
            <Sparkles className="h-5 w-5 text-vibrant-blue-500" />
            Customer Objection Scenario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-deep-navy font-semibold italic text-lg leading-relaxed">"{scenario}"</p>
          <p className="text-deep-navy/70 mt-4 font-medium">
            How would you respond to this pricing objection? Practice your response below.
          </p>
        </CardContent>
      </Card>

      {/* Enhanced Error Display */}
      {error && (
        <Alert variant="destructive" className="border-red-300 bg-red-50/90 shadow-vibrant">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span className="font-medium">{error}</span>
            {hasPermission === false && (
              <Button
                variant="outline"
                size="sm"
                onClick={retryVoiceMode}
                className="ml-2 border-red-400 text-red-600 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry Voice
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Input Mode Selector - Mobile Optimized */}
      <div className="flex gap-2 sm:gap-3 mb-6">
        <Button
          variant={inputMode === 'voice' ? 'default' : 'outline'}
          onClick={() => setInputMode('voice')}
          disabled={!hasPermission}
          className={`flex-1 min-h-[44px] sm:min-h-[48px] ${inputMode === 'voice' ? 'vibrant-button' : 'outline-button'}`}
        >
          <Mic className="h-4 w-4 mr-2" />
          <span className="text-sm sm:text-base">Voice Input</span>
        </Button>
        <Button
          variant={inputMode === 'text' ? 'default' : 'outline'}
          onClick={switchToTextMode}
          className={`flex-1 min-h-[44px] sm:min-h-[48px] ${inputMode === 'text' ? 'vibrant-button' : 'outline-button'}`}
        >
          <Send className="h-4 w-4 mr-2" />
          <span className="text-sm sm:text-base">Text Input</span>
        </Button>
      </div>

      {/* Enhanced Voice Input Mode - Mobile Optimized */}
      {inputMode === 'voice' && (
        <Card className="vibrant-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-deep-navy font-bold text-lg sm:text-xl">Voice Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="text-center py-4">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                disabled={!hasPermission || isSubmitting}
                className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full font-bold touch-manipulation ${isListening ? 'bg-red-500 hover:bg-red-600 animate-strong-pulse' : 'vibrant-button animate-vibrant-glow'}`}
                aria-label={isListening ? "Stop recording" : "Start recording"}
              >
                {isListening ? (
                  <MicOff className="h-8 w-8 sm:h-10 sm:w-10" />
                ) : (
                  <Mic className="h-8 w-8 sm:h-10 sm:w-10" />
                )}
              </Button>

              <div className="mt-4 sm:mt-6">
                {isListening && (
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-strong-pulse"></div>
                    <span className="text-red-600 font-bold text-sm sm:text-base">Listening...</span>
                  </div>
                )}
                {!isListening && hasPermission && (
                  <p className="text-vibrant-blue-600 font-bold text-sm sm:text-base">Click to start recording</p>
                )}
              </div>
            </div>

            {transcript && (
              <div className="vibrant-card p-3 sm:p-4 bg-vibrant-blue-50 border-vibrant-blue-300">
                <label className="text-xs sm:text-sm font-bold text-deep-navy">Your Response:</label>
                <p className="text-deep-navy mt-2 whitespace-pre-wrap leading-relaxed font-medium text-sm sm:text-base">"{transcript}"</p>
                <p className="text-xs text-deep-navy/60 mt-2 font-medium">{transcript.length} characters</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Text Input Mode - Mobile Optimized */}
      {inputMode === 'text' && (
        <Card className="vibrant-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-deep-navy font-bold text-lg sm:text-xl">Text Response</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response to the pricing objection here..."
              className="min-h-[120px] sm:min-h-[140px] border-vibrant-blue-300 focus:border-vibrant-blue-500 resize-none font-medium text-sm sm:text-base"
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="text-xs sm:text-sm text-deep-navy/60 mt-2 font-medium">
              {textInput.length}/500 characters
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Submit Button - Mobile Optimized */}
      {!isSubmitting ? (
        <div className="space-y-2">
          <Button
            onClick={(e) => {
              if (import.meta.env.DEV) {
                console.log("🖘️ Button click event fired");
              }
              handleSubmit(e);
            }}
            disabled={!canSubmit}
            className="w-full strong-cta min-h-[48px] text-base sm:text-lg py-4 sm:py-6 touch-manipulation"
            size="lg"
            type="button"
          >
            Get Feedback
          </Button>
          {!canSubmit && currentResponse.length < 10 && (
            <p className="text-xs sm:text-sm text-amber-600 text-center font-medium">
              Please provide at least 10 characters ({currentResponse.length}/10)
            </p>
          )}
        </div>
      ) : (
        <div className="w-full min-h-[48px] py-4 sm:py-6 text-base sm:text-lg text-center text-vibrant-blue-600 font-semibold">
          <div className="flex items-center justify-center gap-2">
            <span className="animate-pulse">Analyzing your pitch</span>
            <span className="animate-pulse delay-75">.</span>
            <span className="animate-pulse delay-150">.</span>
            <span className="animate-pulse delay-300">.</span>
          </div>
        </div>
      )}

      {/* Enhanced Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
          <p>Debug: Mode={inputMode}, Response length={currentResponse.length}, Can submit={canSubmit}</p>
        </div>
      )}

      {/* Enhanced Help Text - Mobile Optimized */}
      <div className="text-center p-3 sm:p-4 bg-white/70 rounded-lg shadow-vibrant">
        <p className="text-deep-navy/70 font-medium text-xs sm:text-sm leading-relaxed">
          Speak naturally or type your response to the customer's pricing objection.
          Our AI will analyze your approach and provide feedback.
        </p>
      </div>
    </div>
  );
};

export default PracticeObjection;
