import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (props: { error: Error; retry: () => void }) => React.ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

function ErrorBoundary({ children, fallback, fallbackMessage }: ErrorBoundaryProps) {
  const [errorState, setErrorState] = React.useState<ErrorBoundaryState>({ hasError: false });

  React.useEffect(() => {
    const handleError = (error: Error) => {
      console.error('Error caught by boundary:', error);
      setErrorState({ hasError: true, error });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setErrorState({ hasError: true, error: new Error(event.reason) });
    };

    window.addEventListener('error', (event) => handleError(event.error));
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', (event) => handleError(event.error));
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleRetry = () => {
    setErrorState({ hasError: false });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (errorState.hasError) {
    if (fallback && errorState.error) {
      return fallback({ error: errorState.error, retry: handleRetry });
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <div className="max-w-lg w-full">
          {/* Error Icon with Animation */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground">
              {fallbackMessage || 
                "We've encountered an unexpected error. Don't worry - your data is safe and our team has been notified."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              variant="default"
              className="w-full h-11"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="h-11"
              >
                Go Home
              </Button>
              <Button 
                onClick={handleRefresh}
                variant="outline"
                className="h-11"
              >
                Refresh Page
              </Button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-medium text-sm text-foreground mb-2">Need help?</h3>
            <p className="text-xs text-muted-foreground mb-3">
              If this problem persists, try these steps:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Clear your browser cache and reload</li>
              <li>• Check your internet connection</li>
              <li>• Try using a different browser</li>
            </ul>
          </div>

          {/* Development Details */}
          {process.env.NODE_ENV === 'development' && errorState.error && (
            <details className="mt-4 p-4 bg-muted rounded-lg border">
              <summary className="cursor-pointer font-medium text-sm text-foreground">
                🔧 Error Details (Development Mode)
              </summary>
              <div className="mt-3 p-3 bg-background rounded border">
                <pre className="text-xs overflow-auto text-muted-foreground whitespace-pre-wrap">
                  {errorState.error.stack || errorState.error.toString()}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ErrorBoundary;