
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { browserInfo } from '@/utils/browserDetection';
import { crossBrowserVoiceService } from '@/services/CrossBrowserVoiceService';

interface BrowserCompatibilityCheckerProps {
  onCompatibilityChecked?: (isCompatible: boolean) => void;
  showDetails?: boolean;
}

const BrowserCompatibilityChecker: React.FC<BrowserCompatibilityCheckerProps> = ({
  onCompatibilityChecked,
  showDetails = true
}) => {
  const [capabilities, setCcapabilities] = useState<any>(null);
  const [showFullReport, setShowFullReport] = useState(false);

  useEffect(() => {
    const caps = crossBrowserVoiceService.getBrowserCapabilities();
    setCaps(caps);
    
    // Determine overall compatibility
    const isCompatible = caps.supportsMediaDevices && 
                        (caps.supportsWebSpeech || caps.fallbackActive);
    
    onCompatibilityChecked?.(isCompatible);
  }, [onCompatibilityChecked]);

  if (!capabilities) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getCompatibilityStatus = (feature: boolean, fallback: boolean = false) => {
    if (feature) return { icon: CheckCircle, color: 'text-green-600', status: 'Supported' };
    if (fallback) return { icon: AlertTriangle, color: 'text-yellow-600', status: 'Fallback Available' };
    return { icon: XCircle, color: 'text-red-600', status: 'Not Supported' };
  };

  const microphoneStatus = getCompatibilityStatus(capabilities.supportsMediaDevices);
  const speechStatus = getCompatibilityStatus(capabilities.supportsWebSpeech, capabilities.fallbackActive);
  const audioStatus = getCompatibilityStatus(capabilities.supportsWebAudio);

  const isOverallCompatible = capabilities.supportsMediaDevices && 
                             (capabilities.supportsWebSpeech || capabilities.fallbackActive);

  return (
    <div className="space-y-4">
      {!isOverallCompatible && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Limited Browser Compatibility</AlertTitle>
          <AlertDescription>
            Your browser has limited support for voice features. Some functionality may be reduced or unavailable.
          </AlertDescription>
        </Alert>
      )}

      {capabilities.fallbackActive && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Fallback Mode Active</AlertTitle>
          <AlertDescription>
            Using compatibility mode for your browser. Some features may work differently than expected.
          </AlertDescription>
        </Alert>
      )}

      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Browser Compatibility Report
              <Badge variant={isOverallCompatible ? "default" : "destructive"}>
                {isOverallCompatible ? "Compatible" : "Limited"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <microphoneStatus.icon className={`h-5 w-5 ${microphoneStatus.color}`} />
                <div>
                  <div className="font-medium">Microphone</div>
                  <div className="text-sm text-gray-600">{microphoneStatus.status}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <speechStatus.icon className={`h-5 w-5 ${speechStatus.color}`} />
                <div>
                  <div className="font-medium">Speech Recognition</div>
                  <div className="text-sm text-gray-600">{speechStatus.status}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <audioStatus.icon className={`h-5 w-5 ${audioStatus.color}`} />
                <div>
                  <div className="font-medium">Audio Analysis</div>
                  <div className="text-sm text-gray-600">{audioStatus.status}</div>
                </div>
              </div>
            </div>

            {capabilities.recommendedFallbacks.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Active Fallbacks:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {capabilities.recommendedFallbacks.map((fallback: string, index: number) => (
                    <li key={index}>• {fallback}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => setShowFullReport(!showFullReport)}
              className="w-full"
            >
              {showFullReport ? 'Hide' : 'Show'} Technical Details
            </Button>

            {showFullReport && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm font-mono">
                <div><strong>Browser:</strong> {capabilities.browserInfo.name} {capabilities.browserInfo.version}</div>
                <div><strong>Platform:</strong> {capabilities.browserInfo.isMobile ? 'Mobile' : 'Desktop'}</div>
                {capabilities.browserInfo.isIOS && <div><strong>iOS:</strong> Yes</div>}
                {capabilities.browserInfo.isAndroid && <div><strong>Android:</strong> Yes</div>}
                <div><strong>Web Speech API:</strong> {capabilities.supportsWebSpeech ? 'Yes' : 'No'}</div>
                <div><strong>Web Audio API:</strong> {capabilities.supportsWebAudio ? 'Yes' : 'No'}</div>
                <div><strong>MediaDevices API:</strong> {capabilities.supportsMediaDevices ? 'Yes' : 'No'}</div>
                <div><strong>Fallback Mode:</strong> {capabilities.fallbackActive ? 'Active' : 'Inactive'}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BrowserCompatibilityChecker;
