import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Send, AlertTriangle, RefreshCw, Sparkles, Volume2, Users } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Enhanced Scenario Display */}
      <Card className="premium-card border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-50 to-white">
        <CardHeader>
          <CardTitle className="text-headline flex items-center gap-3 font-bold text-xl">
            <div className="p-2 bg-primary-500 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            Customer Objection Scenario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 rounded-full">
                <Volume2 className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-headline font-semibold italic text-lg leading-relaxed mb-3">"{scenario}"</p>
                <p className="text-premium font-medium">
                  How would you respond to this pricing objection? Practice your response below using voice or text input.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Error Display */}
      {error && (
        <Alert variant="destructive" className="border-danger-300 bg-danger-50/90 shadow-soft">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="flex justify-between items-center">
            <span className="font-medium">{error}</span>
            {hasPermission === false && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryVoiceMode}
                className="ml-4 border-danger-400 text-danger-600 hover:bg-danger-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Voice
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Input Mode Selector */}
      <div className="flex gap-4 mb-8">
        <Button
          variant={inputMode === 'voice' ? 'default' : 'outline'}
          onClick={() => setInputMode('voice')}
          disabled={!hasPermission}
          className={inputMode === 'voice' ? 'premium-button' : 'outline-button'}
          size="lg"
        >
          <Mic className="h-5 w-5 mr-3" />
          Voice Response
        </Button>
        <Button
          variant={inputMode === 'text' ? 'default' : 'outline'}
          onClick={switchToTextMode}
          className={inputMode === 'text' ? 'premium-button' : 'outline-button'}
          size="lg"
        >
          <Send className="h-5 w-5 mr-3" />
          Text Response
        </Button>
      </div>

      {/* Enhanced Voice Input Mode */}
      {inputMode === 'voice' && (
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-headline font-bold text-xl">Voice Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                disabled={!hasPermission || isSubmitting}
                className={`h-24 w-24 rounded-full font-bold text-lg ${isListening ? 'bg-danger-500 hover:bg-danger-600 animate-pulse-strong' : 'premium-button animate-glow'}`}
              >
                {isListening ? (
                  <MicOff className="h-10 w-10" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </Button>
              
              <div className="mt-8">
                {isListening && (
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-4 w-4 bg-danger-500 rounded-full animate-pulse-strong"></div>
                    <span className="text-danger-600 font-bold text-lg">Listening...</span>
                  </div>
                )}
                {!isListening && hasPermission && (
                  <p className="text-primary-600 font-bold text-lg">Click to start recording your response</p>
                )}
              </div>
            </div>

            {transcript && (
              <div className="premium-card p-6 bg-primary-50 border-primary-300">
                <label className="text-sm font-bold text-headline mb-3 block">Your Response:</label>
                <p className="text-premium mt-2 whitespace-pre-wrap leading-relaxed font-medium text-lg">"{transcript}"</p>
                <p className="text-xs text-neutral-500 mt-3 font-medium">{transcript.length} characters</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Text Input Mode */}
      {inputMode === 'text' && (
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-headline font-bold text-xl">Text Response</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response to the pricing objection here..."
              className="min-h-[140px] border-primary-300 focus:border-primary-500 resize-none font-medium text-lg"
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="text-xs text-neutral-500 mt-3 font-medium">
              {textInput.length}/500 characters
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Submit Button */}
      <Button 
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full premium-button text-xl py-6"
        size="lg"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            Analyzing Your Response...
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            Submit Response for AI Analysis
          </div>
        )}
      </Button>

      {/* Enhanced Help Text */}
      <div className="text-center p-6 bg-white/80 rounded-2xl shadow-soft border border-neutral-200">
        <p className="text-premium font-medium text-lg">
          💡 <strong>Tip:</strong> Speak naturally and confidently. Our AI will analyze your tone, 
          pacing, and content to provide personalized feedback for improvement.
        </p>
      </div>
    </div>
  );
};

export default PracticeObjection;
