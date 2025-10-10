
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, Shield, AlertTriangle } from 'lucide-react';

interface MicrophonePermissionHandlerProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
  children?: React.ReactNode;
}

export const MicrophonePermissionHandler: React.FC<MicrophonePermissionHandlerProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  children
}) => {
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      // Check if navigator.permissions is available
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionState(result.state);
        
        if (result.state === 'granted') {
          onPermissionGranted();
        } else if (result.state === 'denied') {
          onPermissionDenied();
        }
      } else {
        // Fallback for browsers without Permissions API
        setPermissionState('prompt');
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setPermissionState('prompt');
    }
  };

  const requestMicrophonePermission = async () => {
    setIsRequesting(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Permission granted
      setPermissionState('granted');
      onPermissionGranted();
      
      // Clean up the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissionState('denied');
      onPermissionDenied();
    } finally {
      setIsRequesting(false);
    }
  };

  const renderPermissionPrompt = () => (
    <div className="space-y-4">
      <Alert>
        <Mic className="h-4 w-4" />
        <AlertTitle>Microphone Access Required</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            PitchPerfect AI needs microphone access to analyze your voice and provide feedback on your sales pitches.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={requestMicrophonePermission}
              disabled={isRequesting}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              {isRequesting ? 'Requesting...' : 'Grant Access'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowExplanation(true)}
            >
              Why is this needed?
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderPermissionDenied = () => (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Microphone Access Denied</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          To use voice features, please enable microphone access in your browser settings:
        </p>
        <ol className="list-decimal list-inside space-y-1 mb-3 text-sm">
          <li>Click the microphone icon in your browser's address bar</li>
          <li>Select "Always allow" for this site</li>
          <li>Refresh the page</li>
        </ol>
        <Button onClick={checkPermissionStatus} variant="outline" size="sm">
          Check Again
        </Button>
      </AlertDescription>
    </Alert>
  );

  return (
    <>
      {permissionState === 'prompt' && renderPermissionPrompt()}
      {permissionState === 'denied' && renderPermissionDenied()}
      {permissionState === 'granted' && children}
      
      <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="font-medium">Why we need microphone access:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  Analyze your voice tone and pace during pitch practice
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  Provide real-time feedback on your speaking patterns
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  Enable voice-to-text transcription for your sessions
                </li>
              </ul>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h5 className="font-medium text-green-800 mb-1">Your Privacy is Protected</h5>
              <p className="text-sm text-green-700">
                Audio is processed locally on your device. We never store or transmit your voice recordings.
              </p>
            </div>
            
            <Button onClick={() => setShowExplanation(false)} className="w-full">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
