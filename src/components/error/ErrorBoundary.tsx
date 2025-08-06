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

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-md w-full mx-4">
            <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                {this.props.fallbackMessage || 
                  "We encountered an unexpected error. This has been logged and our team will investigate."}
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 flex gap-3">
              <Button 
                onClick={this.handleRetry}
                variant="default"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={this.handleRefresh}
                variant="outline"
                className="flex-1"
              >
                Refresh Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
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