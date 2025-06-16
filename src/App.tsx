
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import { GuestModeProvider } from '@/context/GuestModeContext';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import MobileNavBar from '@/components/MobileNavBar';

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

// Add new page imports
import VoiceTraining from '@/pages/VoiceTraining';
import Analytics from '@/pages/Analytics';
import AIRoleplay from '@/pages/AIRoleplay';

// Placeholder page imports
import { VoiceTrainingPage, AnalyticsPage, RoleplayPage } from '@/components/PlaceholderPages';

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

function App() {
  console.log('App component rendering - routes should be available');
  
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <TooltipProvider>
              <Router>
                <AuthProvider>
                  <GuestModeProvider>
                    <div className="min-h-screen bg-background font-sans antialiased">
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Index />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/compare" element={<Compare />} />
                        <Route path="/pricing" element={<Pricing />} />
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
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/practice" element={<Practice />} />
                        <Route path="/roleplay" element={<RolePlay />} />
                        <Route path="/progress" element={<Progress />} />
                        <Route path="/tips" element={<Tips />} />
                        <Route path="/call-recordings" element={<CallRecordings />} />
                        <Route path="/recordings" element={<CallRecordings />} />
                        <Route path="/team" element={<TeamDashboard />} />
                        
                        {/* Subscription routes */}
                        <Route path="/subscription" element={<Subscription />} />
                        <Route path="/subscription-management" element={<SubscriptionManagement />} />
                        <Route path="/success" element={<Success />} />
                        <Route path="/cancel" element={<Cancel />} />
                        
                        {/* Legal routes */}
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/data-safety" element={<DataSafety />} />
                        <Route path="/account-delete" element={<AccountDelete />} />
                        
                        {/* Fallback route - IMPORTANT: This catches all unmatched routes */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      
                      {/* Mobile navigation bar */}
                      <MobileNavBar />
                      
                      {/* Global toast notifications */}
                      <Toaster 
                        position="top-right"
                        expand={false}
                        richColors
                        closeButton
                      />
                    </div>
                  </GuestModeProvider>
                </AuthProvider>
              </Router>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
