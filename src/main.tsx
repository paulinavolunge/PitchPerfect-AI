
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

console.log('Main: Starting application initialization');

// Simple error boundary for critical errors
class CriticalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Critical Error Boundary: Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Critical Error Boundary: componentDidCatch');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.log('Critical Error Boundary: Rendering fallback UI');
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f9fafb'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            App Failed to Load
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            The application encountered a critical error.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          {this.state.error && (
            <details style={{ marginTop: '1rem', maxWidth: '500px' }}>
              <summary>Error Details</summary>
              <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize app with comprehensive error handling
const initializeApp = () => {
  console.log('Main: Getting root element');
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('Main: Root element not found');
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
        <h1>Root element not found</h1>
      </div>
    `;
    return;
  }

  console.log('Main: Creating React root');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('Main: Rendering app');
    
    root.render(
      <React.StrictMode>
        <CriticalErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CriticalErrorBoundary>
      </React.StrictMode>
    );
    
    console.log('Main: App rendered successfully');
  } catch (error) {
    console.error('Main: Failed to render app:', error);
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem;">
        <h1 style="color: #ef4444; margin-bottom: 1rem;">Render Failed</h1>
        <p style="margin-bottom: 1rem;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    `;
  }
};

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Initialize
console.log('Main: Starting initialization');
initializeApp();
