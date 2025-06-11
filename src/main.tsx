
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/accessibility.css'

// Safely initialize polyfills with error handling
try {
  const { initializePolyfills } = await import('./utils/polyfills');
  initializePolyfills();
} catch (error) {
  console.error('Failed to initialize polyfills:', error);
  // Continue without polyfills - app should still work
}

// Add additional voice debugging on startup
console.log('🔧 Voice Feature Debug Mode Enabled');
console.log('🔧 To run full voice diagnostics, use: VoiceDebugger.runFullDiagnostics()');

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
