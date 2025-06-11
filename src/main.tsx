
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import './styles/accessibility.css'

// Simple error boundary for critical errors
const renderApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
};

// Initialize app with error handling
try {
  renderApp();
} catch (error) {
  console.error('Failed to initialize app:', error);
  
  // Fallback error display
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">App Failed to Load</h1>
          <p style="color: #6b7280; margin-bottom: 1rem;">Please refresh the page or try again later.</p>
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}
