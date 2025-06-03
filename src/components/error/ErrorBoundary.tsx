
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AccessibleButton } from '@/components/ui/accessible-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { announceToScreenReader } from '@/utils/accessibility';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: `error-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Announce error to screen readers
    announceToScreenReader('An error has occurred in this section of the application', 'assertive');

    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, you would send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
    announceToScreenReader('Attempting to retry...');
  };

  handleRefresh = () => {
    announceToScreenReader('Refreshing page...');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.props.fallbackMessage || 
        'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.';

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4" role="alert">
          <div className="max-w-md w-full">
            <Alert variant="destructive" id={this.state.errorId}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                {errorMessage}
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 flex gap-2" role="group" aria-labelledby="error-actions">
              <span id="error-actions" className="sr-only">Error recovery actions</span>
              <AccessibleButton 
                onClick={this.handleRetry} 
                className="flex items-center gap-2"
                ariaDescribedBy={this.state.errorId}
                ariaLabel="Try to recover from the error"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </AccessibleButton>
              <AccessibleButton 
                variant="outline" 
                onClick={this.handleRefresh}
                ariaLabel="Refresh the entire page"
              >
                Refresh Page
              </AccessibleButton>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded text-sm">
                <summary className="font-medium cursor-pointer">
                  Error Details (Development Mode)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
