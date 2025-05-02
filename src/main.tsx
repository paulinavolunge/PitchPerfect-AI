
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider as CustomThemeProvider } from '@/context/ThemeContext';

// Check if we're in development mode for any Lovable-specific imports
const isDev = import.meta.env.DEV || import.meta.env.VITE_LOVABLE !== 'false';

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <CustomThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </CustomThemeProvider>
  </BrowserRouter>
);
