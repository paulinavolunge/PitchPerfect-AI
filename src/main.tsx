
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/accessibility.css'

// Initialize polyfills asynchronously and non-blocking
setTimeout(() => {
  try {
    import('./utils/polyfills').then(({ initializePolyfills }) => {
      initializePolyfills();
      console.log('🔧 Polyfills initialized successfully');
    }).catch(error => {
      console.warn('🔧 Polyfills failed to initialize, continuing without them:', error);
    });
  } catch (error) {
    console.warn('🔧 Could not load polyfills module:', error);
  }
}, 0);

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
