import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import { Step } from 'react-joyride';

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
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import TeamDashboard from './pages/TeamDashboard';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showDashboardTour, setShowDashboardTour] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  // Check if we should show onboarding or dashboard tour
  useEffect(() => {
    if (user) {
      const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
      const hasSeenDashboardTour = localStorage.getItem('hasSeenDashboardTour');
      
      if (!hasCompletedOnboarding) {
        setShowOnboardingWizard(true);
      } else if (location.pathname === '/dashboard' && !hasSeenDashboardTour) {
        setShowDashboardTour(true);
      }
    }
  }, [user, location.pathname]);
  
  // Define tour steps for Dashboard
  const dashboardTourSteps: Step[] = [
    {
      target: '.dashboard-overview',
      content: 'Welcome to your dashboard! Here you can see your overall performance and track your progress.',
      disableBeacon: true,
    },
    {
      target: '.practice-section',
      content: 'Start practicing your sales pitches here.',
      placement: 'bottom' as const,
    },
    {
      target: '.progress-section',
      content: 'Track your improvement over time with detailed analytics.',
      placement: 'bottom' as const,
    },
    {
      target: '.ai-suggestions',
      content: 'Get personalized tips and suggestions to improve your sales skills.',
      placement: 'left' as const,
    }
  ];
  
  const handleDashboardTourComplete = () => {
    localStorage.setItem('hasSeenDashboardTour', 'true');
  };
  
  const handleOnboardingComplete = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    if (location.pathname === '/dashboard') {
      setShowDashboardTour(true);
    }
  };
  
  const handleStartTour = () => {
    setShowOnboardingWizard(false);
    if (location.pathname === '/dashboard') {
      setShowDashboardTour(true);
    } else if (location.pathname === '/roleplay') {
      // Let the roleplay tour handle itself
      localStorage.setItem('hasCompletedOnboarding', 'true');
    }
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <main className="min-h-screen bg-background">
          <Toaster />
          
          {/* Onboarding Wizard */}
          <OnboardingWizard 
            open={showOnboardingWizard} 
            onOpenChange={setShowOnboardingWizard}
            onStartTour={handleStartTour}
          />
          
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
            <Route path="/team" element={<TeamDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Dashboard Tour */}
          {showDashboardTour && 
            <GuidedTour 
              steps={dashboardTourSteps} 
              run={showDashboardTour} 
              onComplete={handleDashboardTourComplete}
            />
          }
        </main>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
