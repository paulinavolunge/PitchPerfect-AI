
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize polyfills
import { initializePolyfills } from './utils/polyfills';
initializePolyfills();

// Import performance optimizer
import PerformanceOptimizer from './utils/performanceOptimizations';

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
    // eslint-disable-next-line no-console
    console.error('[RootErrorBoundary] App failed to load:', error, info);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return <RootErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Performance optimizations
function initializePerformanceOptimizations() {
  // Load non-critical CSS after page load
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      // Defer non-critical styles
      PerformanceOptimizer.loadNonCriticalCSS('/src/styles/non-critical.css');
      
      // Setup lazy loading for images
      PerformanceOptimizer.setupLazyImages();
      
      // Preload critical resources
      PerformanceOptimizer.preloadCriticalResources();
    });

    // Load additional resources on interaction
    let interactionLoaded = false;
    const loadOnInteraction = () => {
      if (!interactionLoaded) {
        interactionLoaded = true;
        
        // Load heavy dependencies after interaction
        import('@tanstack/react-query').catch(console.error);
        import('recharts').catch(console.error);
        import('framer-motion').catch(console.error);
      }
    };

    ['click', 'scroll', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, loadOnInteraction, { once: true, passive: true });
    });

    // Fallback: load after 2 seconds
    setTimeout(loadOnInteraction, 2000);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      PerformanceOptimizer.cleanup();
    });
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Initialize performance optimizations
initializePerformanceOptimizations();

root.render(
  <RootErrorBoundary>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </RootErrorBoundary>
);
