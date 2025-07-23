
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/mobile-optimizations.css';

// Ensure React is available globally for better compatibility
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

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

// Ensure DOM is ready before rendering
const initializeApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[main.tsx] Root element not found');
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <RootErrorBoundary>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </RootErrorBoundary>
    );
    
    console.log('[main.tsx] App rendered successfully');
  } catch (error) {
    console.error('[main.tsx] Failed to render app:', error);
    // Fallback rendering without StrictMode
    try {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      );
    } catch (fallbackError) {
      console.error('[main.tsx] Fallback rendering also failed:', fallbackError);
      rootElement.innerHTML = `
        <div style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: #fef2f2;">
          <h2 style="font-size: 1.5rem; font-weight: bold; color: #b91c1c; margin-bottom: 0.5rem;">App failed to load</h2>
          <div style="color: #ef4444; background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 0.375rem; padding: 1rem; max-width: 32rem;">
            Please refresh the page or try again later.
          </div>
        </div>
      `;
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
