
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { initGA, checkAnalyticsConnection } from './utils/analytics';

// Supabase configuration for Lovable integration
const SUPABASE_URL = 'https://ggpodadyycvmmxifqwlp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY';

// Validate Supabase configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase configuration');
  if (typeof window !== 'undefined') {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Configuration Error</h1>
          <p>The application is missing required configuration. Please contact support.</p>
        </div>
      </div>
    `;
  }
  throw new Error('Missing Supabase configuration');
}

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
