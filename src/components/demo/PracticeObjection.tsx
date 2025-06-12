
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Send, AlertTriangle, RefreshCw } from 'lucide-react';
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
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
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
      setTranscript('');
      
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
      await onSubmit({
        type: inputMode,
        data: response
      });
      
      // Reset form
      setTranscript('');
      setTextInput('');
      
      toast({
        title: "Response Submitted",
        description: "Your objection handling response is being analyzed...",
      });
    } catch (err) {
      console.error("Submission error:", err);
      setError("Failed to submit response. Please try again.");
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

  return (
    <div className="space-y-6">
      {/* Scenario Display */}
      <Card className="border-l-4 border-l-amber-400 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800">Customer Objection Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-900 font-medium italic">"{scenario}"</p>
          <p className="text-sm text-amber-700 mt-2">
            How would you respond to this pricing objection? Practice your response below.
          </p>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            {hasPermission === false && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryVoiceMode}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry Voice
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Input Mode Selector */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={inputMode === 'voice' ? 'default' : 'outline'}
          onClick={() => setInputMode('voice')}
          disabled={!hasPermission}
          className="flex items-center gap-2"
        >
          <Mic className="h-4 w-4" />
          Voice Input
        </Button>
        <Button
          variant={inputMode === 'text' ? 'default' : 'outline'}
          onClick={switchToTextMode}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Text Input
        </Button>
      </div>

      {/* Voice Input Mode */}
      {inputMode === 'voice' && (
        <Card>
          <CardHeader>
            <CardTitle>Voice Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                disabled={!hasPermission}
                className="h-16 w-16 rounded-full"
              >
                {isListening ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
              
              <div className="mt-4">
                {isListening && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-600 font-medium">Listening...</span>
                  </div>
                )}
                {!isListening && hasPermission && (
                  <p className="text-sm text-green-600">Click to start recording</p>
                )}
              </div>
            </div>

            {transcript && (
              <div className="p-3 bg-gray-50 rounded-md">
                <label className="text-sm font-medium text-gray-700">Your Response:</label>
                <p className="text-sm text-gray-800 mt-1">"{transcript}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Text Input Mode */}
      {inputMode === 'text' && (
        <Card>
          <CardHeader>
            <CardTitle>Text Response</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response to the pricing objection here..."
              className="min-h-[120px]"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {textInput.length}/500 characters
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit}
        disabled={isSubmitting || (inputMode === 'voice' ? !transcript.trim() : !textInput.trim())}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? "Analyzing..." : "Submit Response for Analysis"}
      </Button>

      {/* Help Text */}
      <div className="text-sm text-gray-600 text-center">
        <p>
          Speak naturally or type your response to the customer's pricing objection. 
          Our AI will analyze your approach and provide feedback.
        </p>
      </div>
    </div>
  );
};

export default PracticeObjection;
