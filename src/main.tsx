
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from '@/context/AuthContext';

// Determine if we're in development mode or Lovable mode
const isLovable = import.meta.env.VITE_LOVABLE === 'true';
const isDevelopment = import.meta.env.DEV === true;

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

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
