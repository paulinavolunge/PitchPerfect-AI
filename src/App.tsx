import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { GuestModeProvider } from '@/context/GuestModeContext';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { PrivacyCompliantAnalytics } from '@/components/consent/PrivacyCompliantAnalytics';
import { ConsentBanner } from '@/components/consent/ConsentBanner';
import { usePageTracking } from '@/hooks/usePageTracking';
import { initializeSecurity } from '@/utils/securityHeaders';
import { isPricingEnabled, isSubscriptionEnabled } from '@/config/features';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy page imports
const Index = React.lazy(() => import('@/pages/Index'));
const About = React.lazy(() => import('@/pages/About'));
const Compare = React.lazy(() => import('@/pages/Compare'));
const Pricing = React.lazy(() => import('@/pages/Pricing'));
const Demo = React.lazy(() => import('@/pages/Demo'));
const FreeTrial = React.lazy(() => import('@/pages/FreeTrial'));
const Login = React.lazy(() => import('@/pages/Login'));
const Signup = React.lazy(() => import('@/pages/Signup'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const RolePlay = React.lazy(() => import('@/pages/RolePlay'));
const Progress = React.lazy(() => import('@/pages/Progress'));
const Tips = React.lazy(() => import('@/pages/Tips'));
const CallRecordings = React.lazy(() => import('@/pages/CallRecordings'));
const PasswordReset = React.lazy(() => import('@/pages/PasswordReset'));
const UpdatePassword = React.lazy(() => import('@/pages/UpdatePassword'));
const EmailConfirmed = React.lazy(() => import('@/pages/EmailConfirmed'));
const Terms = React.lazy(() => import('@/pages/Terms'));
const Privacy = React.lazy(() => import('@/pages/Privacy'));
const DataSafety = React.lazy(() => import('@/pages/DataSafety'));
const AccountDelete = React.lazy(() => import('@/pages/AccountDelete'));
const Subscription = React.lazy(() => import('@/pages/Subscription'));
const SubscriptionManagement = React.lazy(() => import('@/pages/SubscriptionManagement'));
const Success = React.lazy(() => import('@/pages/Success'));
const Cancel = React.lazy(() => import('@/pages/Cancel'));
const TeamDashboard = React.lazy(() => import('@/pages/TeamDashboard'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const SessionDetail = React.lazy(() => import('@/pages/SessionDetail'));
const Practice = React.lazy(() => import('@/pages/Practice'));
const VoiceTraining = React.lazy(() => import('@/pages/VoiceTraining'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const AIRoleplay = React.lazy(() => import('@/pages/AIRoleplay'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 403) return false;
        return failureCount < 3;
      },
    },
  },
});

const PageTrackingProvider = ({ children }: { children: React.ReactNode }) => {
  usePageTracking();
  React.useEffect(() => { initializeSecurity(); }, []);
  return <>{children}</>;
};

// AuthLoadingBoundary removed — was adding 100ms artificial delay

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <TooltipProvider>
              <AccessibilityProvider>
                <Router>
                  <AuthProvider>
                    <OnboardingProvider>
                        <GuestModeProvider>
                        <PageTrackingProvider>
                          <PrivacyCompliantAnalytics />
                          <ConsentBanner />
                          
                          <div className="min-h-screen bg-background font-sans antialiased">
                            <Suspense fallback={<PageLoader />}>
                              <Routes>
                                {/* Public routes */}
                                <Route path="/" element={<Index />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/compare" element={<Compare />} />
                                {isPricingEnabled() && <Route path="/pricing" element={<Pricing />} />}
                                <Route path="/demo" element={<Demo />} />
                                <Route path="/free-trial" element={<FreeTrial />} />
                                
                                {/* New functional routes */}
                                <Route path="/voice-training" element={<VoiceTraining />} />
                                <Route path="/analytics" element={<Analytics />} />
                                <Route path="/ai-roleplay" element={<AIRoleplay />} />
                                
                                {/* Authentication routes */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/signup" element={<Signup />} />
                                <Route path="/password-reset" element={<PasswordReset />} />
                                <Route path="/update-password" element={<UpdatePassword />} />
                                <Route path="/email-confirmed" element={<EmailConfirmed />} />
                                
                                {/* Protected routes */}
                                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                <Route path="/practice/:sessionId" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
                                <Route path="/practice" element={<Practice />} />
                                <Route path="/roleplay" element={<ProtectedRoute><RolePlay /></ProtectedRoute>} />
                                <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                                <Route path="/tips" element={<ProtectedRoute><Tips /></ProtectedRoute>} />
                                <Route path="/call-recordings" element={<ProtectedRoute><CallRecordings /></ProtectedRoute>} />
                                <Route path="/recordings" element={<ProtectedRoute><CallRecordings /></ProtectedRoute>} />
                                <Route path="/team" element={<ProtectedRoute><TeamDashboard /></ProtectedRoute>} />
                                
                                {/* Subscription routes */}
                                {isSubscriptionEnabled() && <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />}
                                {isSubscriptionEnabled() && <Route path="/subscription-management" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />}
                                <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
                                <Route path="/cancel" element={<ProtectedRoute><Cancel /></ProtectedRoute>} />
                                
                                {/* Legal routes */}
                                <Route path="/terms" element={<Terms />} />
                                <Route path="/privacy" element={<Privacy />} />
                                <Route path="/data-safety" element={<DataSafety />} />
                                <Route path="/account-delete" element={<ProtectedRoute><AccountDelete /></ProtectedRoute>} />
                                
                                {/* Fallback route */}
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </Suspense>
                            
                            <Toaster 
                              position="top-right"
                              expand={false}
                              richColors
                              closeButton
                            />
                          </div>
                        </PageTrackingProvider>
                      </GuestModeProvider>
                   </OnboardingProvider>
                </AuthProvider>
                </Router>
              </AccessibilityProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
