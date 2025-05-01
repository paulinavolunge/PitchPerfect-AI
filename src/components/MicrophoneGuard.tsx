
import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Import the Plugins directly
import { Permissions } from '@capacitor/core';

interface MicrophoneGuardProps {
  children: React.ReactNode;
}

const MicrophoneGuard: React.FC<MicrophoneGuardProps> = ({ children }) => {
  const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'denied' | 'prompt' | 'not-needed'>('checking');
  
  // Check if we're on native platform
  const isNativePlatform = Capacitor.isNativePlatform();
  
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      // Only check permissions on native platforms
      if (!isNativePlatform) {
        setPermissionState('not-needed');
        return;
      }
      
      try {
        const result = await Permissions.query({ name: 'microphone' });
        
        switch (result.state) {
          case 'granted':
            setPermissionState('granted');
            break;
          case 'denied':
            setPermissionState('denied');
            break;
          default:
            setPermissionState('prompt');
            break;
        }
      } catch (error) {
        console.error('Error checking microphone permission:', error);
        setPermissionState('prompt'); // Fallback to prompt if there's an error
      }
    };
    
    checkMicrophonePermission();
  }, [isNativePlatform]);
  
  const requestMicrophonePermission = async () => {
    if (!isNativePlatform) {
      setPermissionState('not-needed');
      return;
    }
    
    try {
      const result = await Permissions.request({ name: 'microphone' });
      
      if (result.state === 'granted') {
        setPermissionState('granted');
      } else {
        setPermissionState('denied');
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setPermissionState('denied');
    }
  };
  
  if (permissionState === 'checking') {
    return <div className="flex justify-center items-center min-h-[200px]">Checking microphone access...</div>;
  }
  
  if (permissionState === 'not-needed') {
    return <>{children}</>;
  }
  
  if (permissionState === 'denied') {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Microphone Access Denied</AlertTitle>
        <AlertDescription>
          <p className="mb-4">
            This app requires microphone access to analyze your voice. Please enable microphone
            permissions in your device settings.
          </p>
          <Button onClick={() => requestMicrophonePermission()}>
            Request Permission Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (permissionState === 'prompt') {
    return (
      <Alert className="mb-6">
        <AlertTitle>Microphone Access Required</AlertTitle>
        <AlertDescription>
          <p className="mb-4">
            This app needs access to your microphone to analyze your voice and provide feedback.
          </p>
          <Button onClick={() => requestMicrophonePermission()}>
            Grant Microphone Access
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return <>{children}</>;
};

export default MicrophoneGuard;
