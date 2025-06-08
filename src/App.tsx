
import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as NextThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from '@/components/ui/tooltip';
import { HelmetProvider } from 'react-helmet-async';
import MobileNavBar from '@/components/MobileNavBar';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { initGA, trackPageView, hasValidConsent } from '@/utils/analytics';
import { IntegratedOnboarding } from '@/components/onboarding/IntegratedOnboarding';
import { ConsentBanner } from '@/components/consent/ConsentBanner';
import { PrivacyCompliantAnalytics } from '@/components/consent/PrivacyCompliantAnalytics';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { GuestModeProvider } from '@/context/GuestModeContext';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useOnboarding } from '@/hooks/useOnboarding';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Practice = lazy(() => import('@/pages/Practice'));
const RolePlay = lazy(() => import('@/pages/RolePlay'));
const Progress = lazy(() => import('@/pages/Progress'));
const CallRecordings = lazy(() => import('@/pages/CallRecordings'));
const TeamDashboard = lazy(() => import('@/pages/TeamDashboard'));
const Tips = lazy(() => import('@/pages/Tips'));
const About = lazy(() => import('@/pages/About'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const Success = lazy(() => import('@/pages/Success'));
const Cancel = lazy(() => import('@/pages/Cancel'));
const Compare = lazy(() => import('@/pages/Compare'));
const Demo = lazy(() => import('@/pages/Demo'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const AccountDelete = lazy(() => import('@/pages/AccountDelete'));
const DataSafety = lazy(() => import('@/pages/DataSafety'));
const EmailConfirmed = lazy(() => import('@/pages/EmailConfirmed'));

// Import non-lazy pages that should load immediately
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import PasswordReset from '@/pages/PasswordReset';
import UpdatePassword from '@/pages/UpdatePassword';

// Optimized React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 403) return false;
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Enhanced loading fallback component
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-green"></div>
  </div>
);

// Mobile viewport optimization hook
const useMobileOptimizations = () => {
  useEffect(() => {
    // Add viewport meta tag if missing
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }

    // Check for iOS devices and optimize viewport
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOSDevice && viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
  }, []);
};

// Secure onboarding check component
const OnboardingChecker = () => {
  const { showOnboarding } = useOnboarding();

  if (showOnboarding) {
    return <IntegratedOnboarding />;
  }

  return null;
};

function AppContent() {
  usePageTracking();
  useMobileOptimizations();

  return (
    <>
      <PrivacyCompliantAnalytics />
      <Suspense fallback={<PageLoading />}>
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
          <Route path="/team-dashboard" element={<TeamDashboard />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
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
      </Suspense>
      <MobileNavBar />
      <Toaster />
      
      <ConsentBanner />
      <OnboardingChecker />
    </>
  );
}

function App() {
  useEffect(() => {
    if (hasValidConsent()) {
      const currentPath = window.location.pathname + window.location.search;
      trackPageView(currentPath);
    }
  }, []);

  return (
    <HelmetProvider>
      <NextThemeProvider forcedTheme="light">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GuestModeProvider>
              <TooltipProvider>
                <ErrorBoundary fallbackMessage="The application encountered an error. Please refresh the page.">
                  <AppContent />
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
