import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  showHomeButton?: boolean;
}

interface ErrorState {
  hasError: boolean;
  error?: Error;
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ 
  children, 
  fallbackMessage,
  showHomeButton = true 
}) => {
  const [errorState, setErrorState] = React.useState<ErrorState>({ hasError: false });
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleError = (error: Error) => {
      console.error('Page Error:', error);
      setErrorState({ hasError: true, error });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Page Promise Rejection:', event.reason);
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

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (errorState.hasError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-full mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </h3>
            
            <p className="text-sm text-muted-foreground mb-6">
              {fallbackMessage || 
                "We encountered an error loading this section. Please try again."}
            </p>
            
            <div className="space-y-2">
              <Button 
                onClick={handleRetry}
                variant="default"
                className="w-full"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                {showHomeButton && (
                  <Button 
                    onClick={handleGoHome}
                    variant="outline"
                    size="sm"
                  >
                    <Home className="h-4 w-4 mr-1" />
                    Home
                  </Button>
                )}
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                >
                  Refresh
                </Button>
              </div>
            </div>
            
            {process.env.NODE_ENV === 'development' && errorState.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Debug Info
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {errorState.error.toString()}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default PageErrorBoundary;