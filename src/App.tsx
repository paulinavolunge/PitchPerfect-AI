
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";

import Index from './pages/Index';
import About from './pages/About';
import Compare from './pages/Compare';
import Pricing from './pages/Pricing';
import Demo from './pages/Demo';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import Practice from './pages/Practice';
import RolePlay from './pages/RolePlay';
import Subscription from './pages/Subscription';
import PasswordReset from './pages/PasswordReset';
import UpdatePassword from './pages/UpdatePassword';
import Tips from './pages/Tips';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import NotFound from './pages/NotFound';
import GuidedTour from './components/GuidedTour';
import CallRecordings from './pages/CallRecordings';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AccountDelete from './pages/AccountDelete';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Only show the tour on the dashboard and only if the user is logged in
  const showTour = location.pathname === '/dashboard' && !!user;
  
  // Define tour steps for GuidedTour
  const tourSteps = [
    {
      target: '.dashboard-overview',
      content: 'Welcome to your dashboard! Here you can see your overall performance.',
      disableBeacon: true,
    },
    {
      target: '.practice-section',
      content: 'Start practicing your sales pitches here.',
    },
    {
      target: '.progress-section',
      content: 'Track your improvement over time.',
    },
  ];
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <main className="min-h-screen bg-background">
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/roleplay" element={<RolePlay />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/tips" element={<Tips />} />
            <Route path="/success" element={<Success />} />
            <Route path="/cancel" element={<Cancel />} />
            <Route path="/call-recordings" element={<CallRecordings />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/account-delete" element={<AccountDelete />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {showTour && 
            <GuidedTour 
              steps={tourSteps} 
              run={showTour} 
              onComplete={() => console.log('Tour completed')}
            />
          }
        </main>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
