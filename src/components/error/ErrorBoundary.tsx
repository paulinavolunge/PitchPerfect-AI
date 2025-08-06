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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md w-full mx-4">
          <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              {fallbackMessage || 
                "We encountered an unexpected error. This has been logged and our team will investigate."}
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 flex gap-3">
            <Button 
              onClick={handleRetry}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="flex-1"
            >
              Refresh Page
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && errorState.error && (
            <details className="mt-4 p-4 bg-gray-100 rounded-lg">
              <summary className="cursor-pointer font-medium">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {errorState.error.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ErrorBoundary;