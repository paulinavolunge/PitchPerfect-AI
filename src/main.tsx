
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider as CustomThemeProvider } from '@/context/ThemeContext';

// Determine if we're in development mode
const isDevelopment = import.meta.env.DEV === true;

// Load development tools only in development mode
if (isDevelopment && window.document) {
  console.log('Development mode active - loading development tools');
  
  // Dynamically load the Lovable script in development mode
  const script = document.createElement('script');
  script.src = 'https://cdn.gpteng.co/gptengineer.js';
  script.type = 'module';
  document.body.appendChild(script);
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <CustomThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </CustomThemeProvider>
  </BrowserRouter>
);
