import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import { GuestModeProvider } from '@/context/GuestModeContext';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import AccessibilityButton from '@/components/accessibility/AccessibilityButton';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import MobileNavBar from '@/components/MobileNavBar';

import { LazyAnalytics } from '@/components/lazy/LazyAnalytics';
import { usePageTracking } from '@/hooks/usePageTracking';

// Critical components loaded immediately (only homepage)
import Index from '@/pages/Index';

// Lazy load ALL other pages to reduce initial bundle size
const About = lazy(() => import('@/pages/About'));
const Compare = lazy(() => import('@/pages/Compare'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const Demo = lazy(() => import('@/pages/Demo'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Practice = lazy(() => import('@/pages/Practice'));
const RolePlay = lazy(() => import('@/pages/RolePlay'));
const Progress = lazy(() => import('@/pages/Progress'));
const Tips = lazy(() => import('@/pages/Tips'));
const CallRecordings = lazy(() => import('@/pages/CallRecordings'));
const PasswordReset = lazy(() => import('@/pages/PasswordReset'));
const UpdatePassword = lazy(() => import('@/pages/UpdatePassword'));
const EmailConfirmed = lazy(() => import('@/pages/EmailConfirmed'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const DataSafety = lazy(() => import('@/pages/DataSafety'));
const AccountDelete = lazy(() => import('@/pages/AccountDelete'));
const Subscription = lazy(() => import('@/pages/Subscription'));
const SubscriptionManagement = lazy(() => import('@/pages/SubscriptionManagement'));
const Success = lazy(() => import('@/pages/Success'));
const Cancel = lazy(() => import('@/pages/Cancel'));
const TeamDashboard = lazy(() => import('@/pages/TeamDashboard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Lazy load analytics and heavy feature pages
const VoiceTraining = lazy(() => import('@/pages/VoiceTraining'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const AIRoleplay = lazy(() => import('@/pages/AIRoleplay'));

// Lazy load placeholder page components
const VoiceTrainingPage = lazy(() => import('@/components/PlaceholderPages').then(m => ({ default: m.VoiceTrainingPage })));
const AnalyticsPage = lazy(() => import('@/components/PlaceholderPages').then(m => ({ default: m.AnalyticsPage })));
const RoleplayPage = lazy(() => import('@/components/PlaceholderPages').then(m => ({ default: m.RoleplayPage })));

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Component to handle page tracking
const PageTrackingProvider = ({ children }: { children: React.ReactNode }) => {
  usePageTracking();
  return <>{children}</>;
};

function App() {
  console.log('App component rendering - routes should be available');
  
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <TooltipProvider>
              <Router>
                <div className="min-h-screen bg-background font-sans antialiased">
                  <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  }>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="*" element={<div>Page Not Found</div>} />
                    </Routes>
                  </Suspense>
                </div>
              </Router>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
