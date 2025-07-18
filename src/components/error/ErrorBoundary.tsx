
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { SecurityMonitoringService } from '@/services/SecurityMonitoringService';

interface Props {
  children: ReactNode;
  fallback?: (props: { error: Error; retry: () => void }) => ReactNode;
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

    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log error to security monitoring service
    SecurityMonitoringService.logSecurityEvent('error_boundary_triggered', {
      error_message: SecurityMonitoringService.sanitizeErrorMessage(error),
      error_stack: SecurityMonitoringService.sanitizeErrorMessage(errorInfo.componentStack),
      error_id: this.state.errorId,
      timestamp: new Date().toISOString()
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback({ 
          error: this.state.error, 
          retry: this.handleRetry 
        });
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
              <Button 
                onClick={this.handleRetry} 
                className="flex items-center gap-2"
                aria-describedby={this.state.errorId}
                aria-label="Try to recover from the error"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={this.handleRefresh}
                aria-label="Refresh the entire page"
              >
                Refresh Page
              </Button>
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
