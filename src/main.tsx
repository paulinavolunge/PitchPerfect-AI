
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { initGA, checkAnalyticsConnection } from './utils/analytics';

// Initialize dataLayer for Google Tag Manager
window.dataLayer = window.dataLayer || [];

// Determine if we're in development mode or Lovable mode
const isLovable = import.meta.env.VITE_LOVABLE === 'true';
const isDevelopment = import.meta.env.DEV === true;

// Ensure GA is initialized as early as possible
initGA();

// Check analytics connection and log debug info
if (isDevelopment) {
  setTimeout(() => {
    const status = checkAnalyticsConnection();
    console.log('Analytics Connection Status:', status);
  }, 1000); // Check after 1 second to allow scripts to load
}

// Load development tools only in development mode or Lovable mode
if ((isDevelopment || isLovable) && window.document) {
  console.log('Development or Lovable mode active - loading development tools');
  
  // Dynamically load the Lovable script in development mode
  // This is a backup in case the script in index.html doesn't load
  if (!window.gptEng) {
    const script = document.createElement('script');
    script.src = 'https://cdn.gpteng.co/gptengineer.js';
    script.type = 'module';
    document.body.appendChild(script);
  }
}

// Type declaration for window
declare global {
  interface Window {
    gptEng?: any;
    dataLayer: any[];
  }
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
