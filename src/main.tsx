
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize polyfills synchronously to avoid timing issues
import { initializePolyfills } from './utils/polyfills';
initializePolyfills();

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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Service worker disabled temporarily to avoid loading issues
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }

root.render(
  <RootErrorBoundary>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </RootErrorBoundary>
);

