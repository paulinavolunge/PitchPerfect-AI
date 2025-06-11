
console.log('main.tsx loaded - starting execution');

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

console.log('main.tsx: All imports loaded successfully');

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Simple error boundary component
class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    console.error('Error Boundary: Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary: componentDidCatch');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#fff'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            React App Failed
          </h1>
          <p style={{ marginBottom: '1rem' }}>
            The React application encountered an error and could not render.
          </p>
          <details style={{ marginBottom: '1rem', maxWidth: '600px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Error Details</summary>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '1rem', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error ? this.state.error.toString() : 'No error details available'}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Reload Page
          </button>
          <a 
            href="/test.html"
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              textDecoration: 'none',
              borderRadius: '6px'
            }}
          >
            Test Basic HTML
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize app with timeout fallback
const initializeApp = () => {
  console.log('main.tsx: Starting app initialization');
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('main.tsx: Root element not found');
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <h1 style="color: red;">Root element not found</h1>
          <p>The DOM element with id="root" is missing.</p>
          <a href="/test.html" style="color: blue;">Test Basic HTML</a>
        </div>
      </div>
    `;
    return;
  }

  console.log('main.tsx: Root element found, creating React root');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('main.tsx: React root created, rendering app');
    
    root.render(
      <React.StrictMode>
        <SimpleErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SimpleErrorBoundary>
      </React.StrictMode>
    );
    
    console.log('main.tsx: App render call completed');
  } catch (error) {
    console.error('main.tsx: Failed to render app:', error);
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem; font-family: Arial, sans-serif;">
        <h1 style="color: #ef4444; margin-bottom: 1rem;">Render Failed</h1>
        <p style="margin-bottom: 1rem;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; max-width: 600px; overflow: auto; font-size: 12px;">${error instanceof Error ? error.stack : 'No stack trace available'}</pre>
        <div style="margin-top: 1rem;">
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer; margin-right: 10px;">
            Refresh Page
          </button>
          <a href="/test.html" style="background: #10b981; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.375rem;">
            Test Basic HTML
          </a>
        </div>
      </div>
    `;
  }
};

console.log('main.tsx: Calling initializeApp');
initializeApp();
