import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Send, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { trackModeToggle } from '@/utils/posthog';

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
    console.log("PracticeObjection component mounted");
    console.log("Scenario loaded:", scenario);
    
    // Check for speech recognition support
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      console.log("Speech recognition supported");
      initializeSpeechRecognition();
    } else {
      console.log("Speech recognition not supported, falling back to text input");
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
    console.log("Requesting microphone permission");
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
        console.log("Speech recognition result:", event);
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
          console.log("Updated transcript:", newTranscript);
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
        console.log("Speech recognition ended");
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
    console.log("Starting voice recording");
    
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
    console.log("Stopping voice recording");
    
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

  const handleSubmit = async () => {
    console.log("Submitting objection response");
    console.log("Input mode:", inputMode);
    console.log("Transcript:", transcript);
    console.log("Text input:", textInput);
    
    const response = inputMode === 'voice' ? transcript.trim() : textInput.trim();
    
    if (!response) {
      setError("Please provide a response before submitting.");
      return;
    }

    if (response.length < 10) {
      setError("Please provide a more detailed response (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log(`Submitting ${inputMode} response:`, response);
      
      // Call the onSubmit prop with the response data
      await onSubmit({
        type: inputMode,
        data: response
      });
      
      console.log("Response submitted successfully");
      
      // Reset form after successful submission
      setTranscript('');
      setTextInput('');
      
    } catch (err) {
      console.error("Submission error:", err);
      setError("Failed to submit response. Please try again.");
      
      toast({
        title: "Submission Error",
        description: "There was an error submitting your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchToTextMode = () => {
    console.log("Switching to text input mode");
    setInputMode('text');
    trackModeToggle('text', 'demo');
    setError(null);
    if (isListening) {
      stopListening();
    }
  };

  const retryVoiceMode = () => {
    console.log("Retrying voice mode");
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

      {/* Enhanced Input Mode Selector */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={inputMode === 'voice' ? 'default' : 'outline'}
          onClick={() => {
            setInputMode('voice');
            trackModeToggle('voice', 'demo');
          }}
          disabled={!hasPermission}
          className={inputMode === 'voice' ? 'vibrant-button' : 'outline-button'}
          data-testid="voice-mode-button"
        >
          <Mic className="h-4 w-4 mr-2" />
          Voice Input
        </Button>
        <Button
          variant={inputMode === 'text' ? 'default' : 'outline'}
          onClick={switchToTextMode}
          className={inputMode === 'text' ? 'vibrant-button' : 'outline-button'}
          data-testid="text-mode-button"
        >
          <Send className="h-4 w-4 mr-2" />
          Text Input
        </Button>
      </div>

      {/* Enhanced Voice Input Mode */}
      {inputMode === 'voice' && (
        <Card className="vibrant-card">
          <CardHeader>
            <CardTitle className="text-deep-navy font-bold">Voice Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                disabled={!hasPermission || isSubmitting}
                className={`h-20 w-20 rounded-full font-bold ${isListening ? 'bg-red-500 hover:bg-red-600 animate-strong-pulse' : 'vibrant-button animate-vibrant-glow'}`}
                data-testid="voice-record-button"
                aria-label={isListening ? "Stop recording" : "Start recording"}
              >
                {isListening ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
              
              <div className="mt-6">
                {isListening && (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-strong-pulse"></div>
                    <span className="text-red-600 font-bold">Listening...</span>
                  </div>
                )}
                {!isListening && hasPermission && (
                  <p className="text-vibrant-blue-600 font-bold">Click to start recording</p>
                )}
              </div>
            </div>

            {transcript && (
              <div className="vibrant-card p-4 bg-vibrant-blue-50 border-vibrant-blue-300">
                <label className="text-sm font-bold text-deep-navy">Your Response:</label>
                <p className="text-deep-navy mt-2 whitespace-pre-wrap leading-relaxed font-medium">"{transcript}"</p>
                <p className="text-xs text-deep-navy/60 mt-2 font-medium">{transcript.length} characters</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Text Input Mode */}
      {inputMode === 'text' && (
        <Card className="vibrant-card">
          <CardHeader>
            <CardTitle className="text-deep-navy font-bold">Text Response</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response to the pricing objection here..."
              className="min-h-[120px] border-vibrant-blue-300 focus:border-vibrant-blue-500 resize-none font-medium"
              maxLength={500}
              disabled={isSubmitting}
              data-testid="objection-text-input"
            />
            <div className="text-xs text-deep-navy/60 mt-2 font-medium">
              {textInput.length}/500 characters
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Submit Button */}
      {!isSubmitting ? (
        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full strong-cta text-lg py-4"
          size="lg"
          data-testid="objection-submit-button"
        >
          Get Feedback
        </Button>
      ) : (
        <div className="w-full py-4 text-lg text-center text-vibrant-blue-600 font-semibold">
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

      {/* Enhanced Help Text */}
      <div className="text-center p-4 bg-white/70 rounded-lg shadow-vibrant">
        <p className="text-deep-navy/70 font-medium">
          Speak naturally or type your response to the customer's pricing objection. 
          Our AI will analyze your approach and provide feedback.
        </p>
      </div>
    </div>
  );
};

export default PracticeObjection;
