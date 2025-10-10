
import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedLoadingProps {
  timeout?: number;
  onTimeout?: () => void;
  showLogo?: boolean;
}

const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({ 
  timeout = 10000, 
  onTimeout,
  showLogo = true 
}) => {
  const [isTimeout, setIsTimeout] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 10, 90));
    }, 200);

    // Timeout handler
    const timeoutHandler = setTimeout(() => {
      setIsTimeout(true);
      onTimeout?.();
    }, timeout);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeoutHandler);
    };
  }, [timeout, onTimeout]);

  const handleRetry = () => {
    setIsTimeout(false);
    setProgress(0);
    window.location.reload();
  };

  if (isTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-50">
        <div className="text-center p-8 max-w-md mx-4">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy-900 mb-4">Loading Timeout</h2>
          <p className="text-navy-600 mb-6">
            The application is taking longer than expected to load. This might be due to a slow network connection.
          </p>
          <Button onClick={handleRetry} className="bg-electric-blue-600 hover:bg-electric-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-navy-50 to-electric-blue-50">
      <div className="text-center p-8">
        {showLogo && (
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-electric-blue-600 to-navy-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
            <h1 className="text-2xl font-bold text-navy-900 mb-2">PitchPerfect AI</h1>
          </div>
        )}
        
        {/* Enhanced loading spinner */}
        <div className="relative mb-6">
          <div className="w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-4 border-electric-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-electric-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto mb-4">
          <div className="bg-navy-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-navy-600 font-medium animate-pulse">
          Preparing your sales training experience...
        </p>
        
        <div className="mt-4 text-sm text-navy-400">
          <div className="flex items-center justify-center space-x-4">
            <span>✓ Loading AI models</span>
            <span>✓ Initializing voice recognition</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoading;
