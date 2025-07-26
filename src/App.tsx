import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { GuestModeProvider } from '@/context/GuestModeContext';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import AccessibilityButton from '@/components/accessibility/AccessibilityButton';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { SentryErrorBoundary } from '@/components/error/SentryErrorBoundary';
import MobileNavBar from '@/components/MobileNavBar';
import { PrivacyCompliantAnalytics } from '@/components/consent/PrivacyCompliantAnalytics';
import { ConsentBanner } from '@/components/consent/ConsentBanner';
import { usePageTracking } from '@/hooks/usePageTracking';
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';
import { initializeSecurity } from '@/utils/securityHeaders';
import * as Sentry from '@sentry/react';

// Page imports
import Index from '@/pages/Index';
import About from '@/pages/About';
import Compare from '@/pages/Compare';
import Pricing from '@/pages/Pricing';
import Demo from '@/pages/Demo';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Practice from '@/pages/Practice';
import RolePlay from '@/pages/RolePlay';
import Progress from '@/pages/Progress';
import Tips from '@/pages/Tips';
import CallRecordings from '@/pages/CallRecordings';
import PasswordReset from '@/pages/PasswordReset';
import UpdatePassword from '@/pages/UpdatePassword';
import EmailConfirmed from '@/pages/EmailConfirmed';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import DataSafety from '@/pages/DataSafety';
import AccountDelete from '@/pages/AccountDelete';
import Subscription from '@/pages/Subscription';
import SubscriptionManagement from '@/pages/SubscriptionManagement';
import Success from '@/pages/Success';
import Cancel from '@/pages/Cancel';
import TeamDashboard from '@/pages/TeamDashboard';
import NotFound from '@/pages/NotFound';
import TestError from '@/pages/TestError';
import { isPricingEnabled, isSubscriptionEnabled } from '@/config/features';

// Add new page imports
import VoiceTraining from '@/pages/VoiceTraining';
import Analytics from '@/pages/Analytics';
import AIRoleplay from '@/pages/AIRoleplay';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';

// Placeholder page imports
import { VoiceTrainingPage, AnalyticsPage, RoleplayPage } from '@/components/PlaceholderPages';

// Import ProtectedRoute
import ProtectedRoute from '@/components/auth/ProtectedRoute';



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

// Component to handle page tracking and security initialization
const PageTrackingProvider = ({ children }: { children: React.ReactNode }) => {
  usePageTracking();
  
  // Initialize security measures on app start
  React.useEffect(() => {
    initializeSecurity();
  }, []);
  
  return <>{children}</>;
};

// Loading boundary to ensure auth context is initialized
const AuthLoadingBoundary = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    // Give auth context time to initialize
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb] mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

function App() {
  
  return (
    <SentryErrorBoundary>
      <ErrorBoundary>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
              <TooltipProvider>
                <AccessibilityProvider>
                  <Router>
                    <AuthProvider>
                      <OnboardingProvider>
                        <AuthLoadingBoundary>
                          <GuestModeProvider>
                          <PageTrackingProvider>
                            {/* Initialize analytics */}
                            <PrivacyCompliantAnalytics />
                            
                            {/* Consent banner for analytics */}
                            <ConsentBanner />
                            
                            <div className="min-h-screen bg-background font-sans antialiased">
                              <Routes>
                              {/* Public routes */}
                              <Route path="/" element={<Index />} />
                              <Route path="/about" element={<About />} />
                              <Route path="/compare" element={<Compare />} />
                              {isPricingEnabled() && <Route path="/pricing" element={<Pricing />} />}
                              <Route path="/demo" element={<Demo />} />
                              
                              {/* New functional routes */}
                              <Route path="/voice-training" element={<VoiceTraining />} />
                              <Route path="/analytics" element={<Analytics />} />
                              <Route path="/ai-roleplay" element={<AIRoleplay />} />
                              
                              {/* Placeholder routes for testing (keeping as backup) */}
                              <Route path="/voice-training-old" element={<VoiceTrainingPage />} />
                              <Route path="/analytics-old" element={<AnalyticsPage />} />
                              <Route path="/ai-roleplay-old" element={<RoleplayPage />} />
                              
                              {/* Authentication routes */}
                              <Route path="/login" element={<Login />} />
                              <Route path="/signup" element={<Signup />} />
                              <Route path="/password-reset" element={<PasswordReset />} />
                              <Route path="/update-password" element={<UpdatePassword />} />
                              <Route path="/email-confirmed" element={<EmailConfirmed />} />
                              
                              {/* Protected routes - IMPORTANT: Dashboard route is correctly configured */}
                              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                              <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
                              <Route path="/roleplay" element={<ProtectedRoute><RolePlay /></ProtectedRoute>} />
                              <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                              <Route path="/tips" element={<ProtectedRoute><Tips /></ProtectedRoute>} />
                              <Route path="/call-recordings" element={<ProtectedRoute><CallRecordings /></ProtectedRoute>} />
                              <Route path="/recordings" element={<ProtectedRoute><CallRecordings /></ProtectedRoute>} />
                              <Route path="/team" element={<ProtectedRoute><TeamDashboard /></ProtectedRoute>} />
                              <Route path="/security" element={<ProtectedRoute><SecurityDashboard /></ProtectedRoute>} />
                              
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
                              
                              {/* Test route for Sentry (remove in production) */}
                              <Route path="/test-error" element={<TestError />} />
                              
                              {/* Fallback route - IMPORTANT: This catches all unmatched routes */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                            
                            {/* Mobile navigation bar */}
                            <MobileNavBar />
                            
                            {/* Accessibility floating button */}
                            <AccessibilityButton />
                            
                            {/* Global toast notifications */}
                            <Toaster 
                              position="top-right"
                              expand={false}
                              richColors
                              closeButton
                            />
                            
                            {/* Onboarding overlay */}
                            <OnboardingOverlay />
                          </div>
                        </PageTrackingProvider>
                      </GuestModeProvider>
                    </AuthLoadingBoundary>
                  </OnboardingProvider>
                </AuthProvider>
                </Router>
              </AccessibilityProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </SentryErrorBoundary>
  );
}

export default App;
