
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mic, Shield } from 'lucide-react';

interface MicrophonePermissionCheckProps {
  children: React.ReactNode;
  onPermissionChange?: (hasPermission: boolean) => void;
}

const MicrophonePermissionCheck: React.FC<MicrophonePermissionCheckProps> = ({ 
  children,
  onPermissionChange
}) => {
  const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking');
  const [showExplanation, setShowExplanation] = useState(false);

  // Check initial permission state
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  // Notify parent component when permission changes
  useEffect(() => {
    if (onPermissionChange) {
      onPermissionChange(permissionState === 'granted');
    }
  }, [permissionState, onPermissionChange]);

  const checkMicrophonePermission = async () => {
    // Check if the Permissions API is available
    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        setPermissionState(permissionStatus.state as 'granted' | 'denied' | 'prompt');
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          setPermissionState(permissionStatus.state as 'granted' | 'denied' | 'prompt');
        };
      } catch (error) {
        // Fallback if permissions query fails
        await checkMicrophoneAccess();
      }
    } else {
      // Fallback for browsers without Permissions API
      await checkMicrophoneAccess();
    }
  };

  // Fallback method to check microphone access
  const checkMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Permission granted, cleanup
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState('granted');
    } catch (error) {
      // Unable to get permission
      setPermissionState('denied');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Permission granted, cleanup
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState('granted');
    } catch (error) {
      setPermissionState('denied');
    }
  };

  if (permissionState === 'checking') {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (permissionState === 'granted') {
    return <>{children}</>;
  }

  if (permissionState === 'denied') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Microphone Access Denied</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>
            To use voice features, please enable microphone access in your browser settings and reload the page:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click the padlock/info icon in your browser's address bar</li>
            <li>Find "Microphone" permissions and change to "Allow"</li>
            <li>Refresh this page</li>
          </ol>
          <Button onClick={checkMicrophonePermission} variant="outline" size="sm">
            I've enabled access, check again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Prompt state - need to request permission
  return (
    <Alert className="mb-4 border-blue-300 bg-blue-50">
      <Mic className="h-4 w-4 text-blue-700" />
      <AlertTitle className="text-blue-800">Microphone Access Required</AlertTitle>
      <AlertDescription className="space-y-4">
        <p className="text-blue-700">
          Voice features require microphone access. Your audio is processed securely and never stored.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={requestMicrophonePermission} variant="default" size="sm">
            Allow Microphone Access
          </Button>
          <Button onClick={() => setShowExplanation(!showExplanation)} variant="outline" size="sm">
            {showExplanation ? 'Hide Details' : 'Why is this needed?'}
          </Button>
        </div>
        
        {showExplanation && (
          <div className="mt-2 p-3 bg-white rounded-md border border-blue-200">
            <div className="flex gap-2 items-start">
              <Shield className="h-4 w-4 text-blue-700 mt-1" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Privacy Information:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Your audio is processed locally on your device</li>
                  <li>We do not store or transmit raw audio data</li>
                  <li>Voice data is only used during active practice sessions</li>
                  <li>You can revoke permission at any time</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default MicrophonePermissionCheck;
