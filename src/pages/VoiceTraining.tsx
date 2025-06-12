
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

const VoiceTraining = () => {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  useEffect(() => {
    console.log('VoiceTraining page loaded');
    checkMicrophoneSupport();
  }, []);

  const checkMicrophoneSupport = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setError('Microphone not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      setHasPermission(true);
      setError(null);
      // Stop the stream immediately, we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Microphone permission denied or error:', err);
      setHasPermission(false);
      setError('Microphone access denied or not available');
    }
  };

  const toggleListening = async () => {
    if (!hasPermission) {
      await checkMicrophoneSupport();
      return;
    }

    if (isListening) {
      console.log('Stopping microphone');
      setIsListening(false);
    } else {
      console.log('Starting microphone');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsListening(true);
        setError(null);
        
        // Simulate listening for demo purposes
        setTimeout(() => {
          setIsListening(false);
          stream.getTracks().forEach(track => track.stop());
          console.log('Stopped listening (demo timeout)');
        }, 5000);
      } catch (err) {
        console.error('Failed to start microphone:', err);
        setError('Failed to start microphone');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-brand-blue hover:text-brand-blue-dark">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brand-dark mb-4">
            🎤 Voice Training Page
          </h1>
          <p className="text-xl text-brand-dark/70">
            Practice your sales pitch with AI-powered voice analysis
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Voice Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={toggleListening}
                className="h-20 w-20 rounded-full"
                disabled={hasPermission === false}
              >
                {isListening ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
              
              <div className="mt-4">
                {isListening && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-600 font-medium">Listening...</span>
                  </div>
                )}
                {hasPermission === false && (
                  <p className="text-sm text-red-600">Microphone not available</p>
                )}
                {hasPermission === true && !isListening && (
                  <p className="text-sm text-green-600">Click to start recording</p>
                )}
              </div>
            </div>

            {/* Fallback text input */}
            {hasPermission === false && (
              <div className="space-y-2">
                <label htmlFor="text-input" className="block text-sm font-medium text-brand-dark">
                  Practice Text (Fallback)
                </label>
                <textarea
                  id="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your sales pitch here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <Button 
                  onClick={() => console.log('Text input submitted:', textInput)}
                  disabled={!textInput.trim()}
                >
                  Analyze Text
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-brand-dark/70">
              <li>Click the microphone button to start recording</li>
              <li>Speak your sales pitch naturally</li>
              <li>Get instant AI feedback on your delivery</li>
              <li>Practice objection handling scenarios</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceTraining;
