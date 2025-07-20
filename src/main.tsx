
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/mobile-optimizations.css';

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
    <div className="min-h-screen flex flex-col justify-center items-center bg-red-50">
      <h2 className="text-2xl font-bold text-red-700 mb-2">App failed to load</h2>
      <div className="text-red-500 bg-red-100 border border-red-300 rounded p-4 max-w-lg">
        {error.message}
      </div>
      <p className="text-xs text-gray-400 mt-4">Check the browser console for more error details.</p>
    </div>
  );
}

class RootErrorBoundary extends React.Component<{
  children: React.ReactNode
}, { hasError: boolean, error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error('[RootErrorBoundary] App failed to load:', error, info);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return <RootErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
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
