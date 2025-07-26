import React from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 text-center mb-6">
          We've encountered an unexpected error. Our team has been notified.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={resetError}
            className="w-full"
          >
            Try again
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to homepage
          </Button>
        </div>
        {import.meta.env.DEV && (
          <details className="mt-6 p-4 bg-gray-100 rounded text-xs">
            <summary className="cursor-pointer font-medium">Error details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export const SentryErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  const FallbackComponent = fallback || DefaultErrorFallback;
  
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <FallbackComponent error={error} resetError={resetError} />
      )}
      showDialog={false}
      onError={(error, errorInfo) => {
        console.error('[SentryErrorBoundary] Caught error:', error, errorInfo);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};