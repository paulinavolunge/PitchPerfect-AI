
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import './styles/accessibility.css'

// Simple Error Boundary Component
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.log('Error Boundary: Error caught in getDerivedStateFromError:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('Error Boundary: componentDidCatch called');
    console.log('Error:', error);
    console.log('Error Info:', errorInfo);
    console.log('Component Stack:', errorInfo.componentStack);
    console.log('Error Stack:', error.stack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      console.log('Error Boundary: Rendering fallback UI');
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
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h1 style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              The application encountered an error and couldn't load properly.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                marginRight: '1rem'
              }}
            >
              Reload Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Try Again
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Error Details (Development)
                </summary>
                <pre style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
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

// Simple error boundary for critical errors
const renderApp = () => {
  console.log('Main: Starting app render process');
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('Main: Root element not found');
    throw new Error('Root element not found');
  }

  console.log('Main: Root element found, creating React root');
  
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <AppErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AppErrorBoundary>
      </React.StrictMode>
    );
    console.log('Main: React app rendered successfully');
  } catch (error) {
    console.error('Main: Failed to render React app:', error);
    throw error;
  }
};

// Initialize app with error handling
try {
  console.log('Main: Initializing application');
  renderApp();
} catch (error) {
  console.error('Main: Failed to initialize app:', error);
  
  // Fallback error display
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">App Failed to Load</h1>
          <p style="color: #6b7280; margin-bottom: 1rem;">Please refresh the page or try again later.</p>
          <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}
