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
      recognitionRef.current = new SpeechRecognition();
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
      {/* Scenario Display */}
      <Card className="modern-card border-l-4 border-l-sky-blue bg-gradient-to-r from-soft-blue-50 to-white">
        <CardHeader>
          <CardTitle className="text-navy flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-blue" />
            Customer Objection Scenario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-navy font-medium italic text-lg leading-relaxed">"{scenario}"</p>
          <p className="text-navy/70 mt-4">
            How would you respond to this pricing objection? Practice your response below.
          </p>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            {hasPermission === false && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryVoiceMode}
                className="ml-2 border-red-300"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry Voice
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Input Mode Selector */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={inputMode === 'voice' ? 'default' : 'outline'}
          onClick={() => setInputMode('voice')}
          disabled={!hasPermission}
          className={inputMode === 'voice' ? 'soft-button' : 'outline-button'}
        >
          <Mic className="h-4 w-4 mr-2" />
          Voice Input
        </Button>
        <Button
          variant={inputMode === 'text' ? 'default' : 'outline'}
          onClick={switchToTextMode}
          className={inputMode === 'text' ? 'soft-button' : 'outline-button'}
        >
          <Send className="h-4 w-4 mr-2" />
          Text Input
        </Button>
      </div>

      {/* Voice Input Mode */}
      {inputMode === 'voice' && (
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="text-navy">Voice Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                disabled={!hasPermission || isSubmitting}
                className={`h-20 w-20 rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600 animate-soft-pulse' : 'soft-button animate-soft-glow'}`}
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
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-soft-pulse"></div>
                    <span className="text-red-600 font-medium">Listening...</span>
                  </div>
                )}
                {!isListening && hasPermission && (
                  <p className="text-primary font-medium">Click to start recording</p>
                )}
              </div>
            </div>

            {transcript && (
              <div className="modern-card p-4 bg-soft-blue-50 border-soft-blue-200">
                <label className="text-sm font-semibold text-navy">Your Response:</label>
                <p className="text-navy mt-2 whitespace-pre-wrap leading-relaxed">"{transcript}"</p>
                <p className="text-xs text-navy/60 mt-2">{transcript.length} characters</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Text Input Mode */}
      {inputMode === 'text' && (
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="text-navy">Text Response</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response to the pricing objection here..."
              className="min-h-[120px] border-soft-blue-200 focus:border-primary resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="text-xs text-navy/60 mt-2">
              {textInput.length}/500 characters
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full soft-button text-lg py-4"
        size="lg"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Analyzing...
          </div>
        ) : (
          "Submit Response for Analysis"
        )}
      </Button>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
          <p>Debug: Mode={inputMode}, Response length={currentResponse.length}, Can submit={canSubmit}</p>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center p-4 bg-white/50 rounded-lg">
        <p className="text-navy/70">
          Speak naturally or type your response to the customer's pricing objection. 
          Our AI will analyze your approach and provide feedback.
        </p>
      </div>
    </div>
  );
};

export default PracticeObjection;
