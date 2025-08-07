import * as React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[Global Error Handler]', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
});

// Initialize polyfills
import { initializePolyfills } from './utils/polyfills';
import { preloadCriticalResources, measureWebVitals } from './utils/performance';

console.log('[main.tsx] Starting application initialization...');

try {
  initializePolyfills();
  console.log('[main.tsx] Polyfills initialized');
} catch (error) {
  console.error('[main.tsx] Failed to initialize polyfills:', error);
}

try {
  preloadCriticalResources();
  console.log('[main.tsx] Critical resources preloaded');
} catch (error) {
  console.error('[main.tsx] Failed to preload critical resources:', error);
}

// Measure Web Vitals in development
if (process.env.NODE_ENV === 'development') {
  measureWebVitals();
}

// Global error boundary for root
function RootErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-6">
          <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">PitchPerfect AI</h1>
        <h2 className="text-xl font-semibold text-destructive mb-4">Failed to Start</h2>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-foreground font-medium mb-2">Error Details:</p>
          <p className="text-sm text-muted-foreground break-words">{error.message}</p>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Reload Application
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-6">
          If this problem persists, please check the browser console or contact support.
        </p>
      </div>
    </div>
  );
}

function RootErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (error) {
    return <RootErrorFallback error={error} />;
  }

  return <>{children}</>;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <RootErrorBoundary>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </RootErrorBoundary>
);