
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
import EnhancedLoading from '@/components/ui/enhanced-loading';
import AppSkeleton from '@/components/AppSkeleton';

console.log('App: Loading page imports');

// Lazy load all pages for better performance
const Dashboard = lazy(() => {
  console.log('App: Loading Dashboard page');
  return import('@/pages/Dashboard');
});
const Practice = lazy(() => {
  console.log('App: Loading Practice page');
  return import('@/pages/Practice');
});
const RolePlay = lazy(() => {
  console.log('App: Loading RolePlay page');
  return import('@/pages/RolePlay');
});
const Progress = lazy(() => {
  console.log('App: Loading Progress page');
  return import('@/pages/Progress');
});
const CallRecordings = lazy(() => {
  console.log('App: Loading CallRecordings page');
  return import('@/pages/CallRecordings');
});
const TeamDashboard = lazy(() => {
  console.log('App: Loading TeamDashboard page');
  return import('@/pages/TeamDashboard');
});
const Tips = lazy(() => {
  console.log('App: Loading Tips page');
  return import('@/pages/Tips');
});
const About = lazy(() => {
  console.log('App: Loading About page');
  return import('@/pages/About');
});
const Pricing = lazy(() => {
  console.log('App: Loading Pricing page');
  return import('@/pages/Pricing');
});
const Success = lazy(() => {
  console.log('App: Loading Success page');
  return import('@/pages/Success');
});
const Cancel = lazy(() => {
  console.log('App: Loading Cancel page');
  return import('@/pages/Cancel');
});
const Compare = lazy(() => {
  console.log('App: Loading Compare page');
  return import('@/pages/Compare');
});
const Demo = lazy(() => {
  console.log('App: Loading Demo page');
  return import('@/pages/Demo');
});
const Privacy = lazy(() => {
  console.log('App: Loading Privacy page');
  return import('@/pages/Privacy');
});
const Terms = lazy(() => {
  console.log('App: Loading Terms page');
  return import('@/pages/Terms');
});
const NotFound = lazy(() => {
  console.log('App: Loading NotFound page');
  return import('@/pages/NotFound');
});
const AccountDelete = lazy(() => {
  console.log('App: Loading AccountDelete page');
  return import('@/pages/AccountDelete');
});
const DataSafety = lazy(() => {
  console.log('App: Loading DataSafety page');
  return import('@/pages/DataSafety');
});
const EmailConfirmed = lazy(() => {
  console.log('App: Loading EmailConfirmed page');
  return import('@/pages/EmailConfirmed');
});

// Import critical pages that should load immediately
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import PasswordReset from '@/pages/PasswordReset';
import UpdatePassword from '@/pages/UpdatePassword';

console.log('App: All imports loaded');

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

console.log('App: Query client created');

// Enhanced loading fallback with timeout handling
const PageLoading = ({ timeout = 10000 }: { timeout?: number }) => {
  console.log('App: PageLoading component rendering');
  const [showError, setShowError] = React.useState(false);

  React.useEffect(() => {
    console.log('App: PageLoading timeout effect started');
    const timer = setTimeout(() => {
      console.log('App: PageLoading timeout reached');
      setShowError(true);
    }, timeout);

    return () => {
      console.log('App: PageLoading timeout cleared');
      clearTimeout(timer);
    };
  }, [timeout]);

  if (showError) {
    console.log('App: PageLoading showing error state');
    return (
      <EnhancedLoading 
        timeout={timeout}
        onTimeout={() => console.error('App: Page loading timeout')}
        showLogo={false}
      />
    );
  }

  console.log('App: PageLoading showing skeleton');
  return <AppSkeleton />;
};

// Mobile viewport optimization hook
const useMobileOptimizations = () => {
  useEffect(() => {
    console.log('App: Applying mobile optimizations');
    // Add viewport meta tag if missing
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      console.log('App: Adding viewport meta tag');
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }

    // Check for iOS devices and optimize viewport
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOSDevice && viewport) {
      console.log('App: Applying iOS viewport optimizations');
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
  }, []);
};

// Secure onboarding check component
const OnboardingChecker = () => {
  console.log('App: OnboardingChecker rendering');
  const { showOnboarding } = useOnboarding();

  if (showOnboarding) {
    console.log('App: Showing onboarding');
    return <IntegratedOnboarding />;
  }

  console.log('App: Not showing onboarding');
  return null;
};

function AppContent() {
  console.log('App: AppContent component rendering');
  usePageTracking();
  useMobileOptimizations();

  console.log('App: AppContent returning JSX');
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
  console.log('App: Main App component rendering');
  
  useEffect(() => {
    console.log('App: Main App useEffect running');
    if (hasValidConsent()) {
      const currentPath = window.location.pathname + window.location.search;
      console.log('App: Tracking page view for:', currentPath);
      trackPageView(currentPath);
    }
  }, []);

  console.log('App: Returning main App JSX');
  return (
    <HelmetProvider>
      <NextThemeProvider forcedTheme="light">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GuestModeProvider>
              <TooltipProvider>
                <ErrorBoundary fallbackMessage="The application encountered an error. Please refresh the page.">
                  <Suspense fallback={<EnhancedLoading />}>
                    <AppContent />
                  </Suspense>
                </ErrorBoundary>
              </TooltipProvider>
            </GuestModeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </NextThemeProvider>
    </HelmetProvider>
  );
}

console.log('App: App component defined, exporting');
export default App;
