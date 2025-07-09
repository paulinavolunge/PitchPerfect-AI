import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import { GuestModeProvider } from '@/context/GuestModeContext';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import SecurityHeaders from '@/components/security/SecurityHeaders';

// Critical components loaded immediately (only homepage)
import Index from '@/pages/Index';

// Lazy load other pages
const Demo = lazy(() => import('@/pages/Demo'));
const Practice = lazy(() => import('@/pages/Practice'));
const RolePlay = lazy(() => import('@/pages/RolePlay'));
const Progress = lazy(() => import('@/pages/Progress'));
const Signup = lazy(() => import('@/pages/Signup'));
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const About = lazy(() => import('@/pages/About'));
const Compare = lazy(() => import('@/pages/Compare'));
const Tips = lazy(() => import('@/pages/Tips'));
const CallRecordings = lazy(() => import('@/pages/CallRecordings'));

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
      <SecurityHeaders>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <GuestModeProvider>
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
                        <Route path="/demo" element={<Demo />} />
                        <Route path="/practice" element={<Practice />} />
                        <Route path="/roleplay" element={<RolePlay />} />
                        <Route path="/progress" element={<Progress />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/compare" element={<Compare />} />
                        <Route path="/tips" element={<Tips />} />
                        <Route path="/call-recordings" element={<CallRecordings />} />
                        <Route path="*" element={<div className="flex items-center justify-center min-h-screen"><div className="text-center"><h1 className="text-2xl font-bold mb-4">Page Not Found</h1><p>The page you're looking for doesn't exist.</p></div></div>} />
                      </Routes>
                      <Toaster />
                    </Suspense>
                  </div>
                </Router>
              </TooltipProvider>
            </ThemeProvider>
              </GuestModeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </HelmetProvider>
      </SecurityHeaders>
    </ErrorBoundary>
  );
}

export default App;
