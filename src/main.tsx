
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider as CustomThemeProvider } from '@/context/ThemeContext';

// Check if we're in development mode or Lovable mode for Lovable-specific features
const isLovableMode = import.meta.env.DEV || import.meta.env.VITE_LOVABLE === 'true';

// Initialize any Lovable-specific features in dev mode
if (isLovableMode && window.document) {
  console.log('Lovable development mode active');
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
