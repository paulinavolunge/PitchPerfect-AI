import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import ErrorBoundary from '@/components/error/ErrorBoundary';

// Critical components loaded immediately (only homepage)
import Index from '@/pages/Index';

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
