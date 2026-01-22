
import React from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface AIErrorToastOptions {
  title: string;
  description: string;
  errorCode?: string;
  showRetryButton?: boolean;
  onRetry?: () => void;
  duration?: number;
}

export const showAIErrorToast = ({
  title,
  description,
  errorCode,
  showRetryButton = false,
  onRetry,
  duration = 6000,
}: AIErrorToastOptions) => {
  const getErrorIcon = () => {
    switch (errorCode) {
      case 'NETWORK_ERROR':
        return <WifiOff className="h-4 w-4" />;
      case 'RATE_LIMITED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  toast({
    title,
    description,
    duration,
    variant: "destructive",
    action: showRetryButton && onRetry ? (
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    ) : undefined,
  });
};

export const showNetworkErrorToast = (onRetry?: () => void) => {
  showAIErrorToast({
    title: "Connection Issue",
    description: "Unable to connect to AI services. Please check your internet connection.",
    errorCode: "NETWORK_ERROR",
    showRetryButton: true,
    onRetry,
    duration: 8000,
  });
};

export const showRateLimitToast = (waitTime?: number) => {
  showAIErrorToast({
    title: "Too Many Requests",
    description: waitTime
      ? `Please wait ${waitTime} seconds before trying again.`
      : "You're making requests too quickly. Please slow down.",
    errorCode: "RATE_LIMITED",
    duration: 6000,
  });
};

export const showServiceUnavailableToast = (onRetry?: () => void) => {
  showAIErrorToast({
    title: "Service Temporarily Unavailable",
    description: "AI services are experiencing issues. We're working to resolve this.",
    errorCode: "SERVICE_UNAVAILABLE",
    showRetryButton: true,
    onRetry,
    duration: 8000,
  });
};
