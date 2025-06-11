
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/accessibility.css'
import { initializePolyfills } from './utils/polyfills'

// Initialize polyfills for cross-browser compatibility
initializePolyfills();

// Add additional voice debugging on startup
console.log('🔧 Voice Feature Debug Mode Enabled');
console.log('🔧 To run full voice diagnostics, use: VoiceDebugger.runFullDiagnostics()');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
