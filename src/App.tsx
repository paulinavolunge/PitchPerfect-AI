import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider as NextThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from '@/components/ui/tooltip';
import { HelmetProvider } from 'react-helmet-async';
import MobileNavBar from '@/components/MobileNavBar';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { initGA, trackPageView } from '@/utils/analytics';
import { IntegratedOnboarding } from '@/components/onboarding/IntegratedOnboarding';
import { ConsentBanner } from '@/components/consent/ConsentBanner';
import { PrivacyCompliantAnalytics } from '@/components/consent/PrivacyCompliantAnalytics';
import ErrorBoundary from '@/components/error/ErrorBoundary';

// Import all page components
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import PasswordReset from '@/pages/PasswordReset';
import UpdatePassword from '@/pages/UpdatePassword';
import Dashboard from '@/pages/Dashboard';
import Practice from '@/pages/Practice';
import RolePlay from '@/pages/RolePlay';
import Progress from '@/pages/Progress';
import CallRecordings from '@/pages/CallRecordings';
import TeamDashboard from '@/pages/TeamDashboard';
import Tips from '@/pages/Tips';
import About from '@/pages/About';
import Pricing from '@/pages/Pricing';
import Success from '@/pages/Success';
import Cancel from '@/pages/Cancel';
import Compare from '@/pages/Compare';
import Demo from '@/pages/Demo';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import NotFound from '@/pages/NotFound';
import AccountDelete from '@/pages/AccountDelete';
import DataSafety from '@/pages/DataSafety';
import EmailConfirmed from '@/pages/EmailConfirmed';
import { AuthProvider } from '@/context/AuthContext';
import { GuestModeProvider } from '@/context/GuestModeContext';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,
    },
  },
});

// Analytics tracking component
const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    const currentPath = location.pathname + location.search;
    trackPageView(currentPath);
    
    // Error tracking for detecting navigation issues
    const handleError = (error: ErrorEvent) => {
      console.error('Navigation error:', error);
      // You can send this to your error tracking service
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [location]);

  return null;
};

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Initialize Google Analytics only if consent given - moved to PrivacyCompliantAnalytics
    
    // Track initial page view only if consent given
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    if (hasConsent) {
      const currentPath = window.location.pathname + window.location.search;
      trackPageView(currentPath);
    }

    // Check if user needs onboarding
    const checkOnboardingStatus = () => {
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      // Simple check for authenticated user - in a real app you'd use your auth context
      const hasUserSession = localStorage.getItem('supabase.auth.token') || 
                            sessionStorage.getItem('supabase.auth.token');
      
      if (hasUserSession && !onboardingComplete) {
        setShowOnboarding(true);
      }
    };

    checkOnboardingStatus();
  }, []);

  return (
    <HelmetProvider>
      <NextThemeProvider forcedTheme="light">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GuestModeProvider>
              <TooltipProvider>
                <ErrorBoundary fallbackMessage="The application encountered an error. Please refresh the page.">
                  <PrivacyCompliantAnalytics />
                  <RouteChangeTracker />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/password-reset" element={<PasswordReset />} />
                    <Route path="/update-password" element={<UpdatePassword />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/practice" element={<Practice />} />
                    <Route path="/roleplay" element={<RolePlay />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/recordings" element={<CallRecordings />} />
                    <Route path="/call-recordings" element={<CallRecordings />} />
                    <Route path="/team-dashboard" element={<TeamDashboard />} />
                    <Route path="/tips" element={<Tips />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/pricing" element={<Pricing />} />
                    {/* Redirect /subscription to /pricing */}
                    <Route path="/subscription" element={<Navigate to="/pricing" replace />} />
                    <Route path="/success" element={<Success />} />
                    <Route path="/cancel" element={<Cancel />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/data-safety" element={<DataSafety />} />
                    <Route path="/account-delete" element={<AccountDelete />} />
                    <Route path="/email-confirmed" element={<EmailConfirmed />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <MobileNavBar />
                  <Toaster />
                  
                  {/* Privacy consent banner */}
                  <ConsentBanner />
                  
                  {/* Integrated onboarding that appears for new users */}
                  {showOnboarding && <IntegratedOnboarding />}
                </ErrorBoundary>
              </TooltipProvider>
            </GuestModeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </NextThemeProvider>
    </HelmetProvider>
  );
}

export default App;
