
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { initGA, checkAnalyticsConnection } from './utils/analytics';

// Supabase configuration for production
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

// Determine environment - be explicit about production detection
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production' || window.location.hostname === 'pitchperfectai.ai';
const isDevelopment = !isProduction && (import.meta.env.DEV || import.meta.env.MODE === 'development');

console.log('Environment detected:', { 
  isProduction, 
  isDevelopment, 
  mode: import.meta.env.MODE,
  hostname: window.location.hostname 
});

// Initialize GA for production
if (isProduction) {
  initGA();
  console.log('Production mode - Analytics initialized');
} else if (isDevelopment) {
  initGA();
  setTimeout(() => {
    const status = checkAnalyticsConnection();
    console.log('Development Analytics Status:', status);
  }, 1000);
}

// CRITICAL: Completely prevent Lovable tools in production
if (isProduction) {
  console.log('Production mode - All development tools disabled');
  // Ensure no development scripts are loaded
  window.gptEng = undefined;
  
  // Remove any existing development scripts
  const existingScripts = document.querySelectorAll('script[src*="gpteng"], script[src*="lovable"]');
  existingScripts.forEach(script => script.remove());
} else if (isDevelopment && typeof window !== 'undefined') {
  console.log('Development mode - Lovable tools may be available');
  
  // Only in development, attempt to load Lovable script
  if (!window.gptEng) {
    const script = document.createElement('script');
    script.src = 'https://cdn.gpteng.co/gptengineer.js';
    script.type = 'module';
    script.onerror = () => console.warn('Lovable script failed to load (development only)');
    script.onload = () => console.log('Lovable development tools loaded');
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

// Create and mount the React application
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  console.log('React application mounted successfully');
} catch (error) {
  console.error('Failed to mount React application:', error);
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
      <div style="text-align: center; padding: 2rem;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">Application Error</h1>
        <p>Failed to load the application. Please refresh the page or contact support.</p>
        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    </div>
  `;
}
