
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileAudio, Mic, Users, Bot, Check, Crown, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Step } from 'react-joyride';
import GuidedTour from '@/components/GuidedTour';
import NewUserOnboarding from '@/components/onboarding/NewUserOnboarding';
import MicrophoneTestModal from '@/components/dashboard/MicrophoneTestModal';
import AIDisclosure from '@/components/AIDisclosure';
import AISettingsModal from '@/components/AISettingsModal';
import { motion } from 'framer-motion';
import ParallaxSection from '@/components/animations/ParallaxSection';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import { toast } from 'sonner';
import { useGuestMode } from '@/context/GuestModeContext';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import CreditsBar from '@/components/dashboard/CreditsBar';
import RecentSessions from '@/components/dashboard/RecentSessions';
import QuickPractice from '@/components/dashboard/QuickPractice';
import AiSuggestions from '@/components/dashboard/AiSuggestions';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TOUR_STORAGE_KEY = 'pitchperfect_tour_completed';
const TOUR_COOLDOWN_KEY = 'pitchperfect_tour_cooldown';
const TOUR_COOLDOWN_HOURS = 24;

const Dashboard = () => {
  const navigate = useNavigate();
  const { isGuestMode } = useGuestMode();
  
  // Get auth data
  const { 
    user, 
    isPremium, 
    creditsRemaining, 
    isNewUser, 
    markOnboardingComplete,
    refreshSubscription,
  } = useAuth();

  // Load dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData();

  // Local state
  const [showTour, setShowTour] = useState(false);
  const [showMicTest, setShowMicTest] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const tourSteps: Step[] = [
    {
      target: '.tour-step-1',
      content: 'Start by selecting a scenario that you want to practice.',
      disableBeacon: true,
      placement: 'bottom' as const,
      spotlightPadding: 10,
      title: 'Step 1: Select a Scenario',
    },
    {
      target: '.tour-step-2',
      content: 'Press the record button to start your practice session.',
      placement: 'bottom' as const,
      spotlightPadding: 10,
      title: 'Step 2: Start Recording',
    },
    {
      target: '.tour-step-3',
      content: (
        <div className="text-center" role="dialog" aria-live="assertive">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <Check className="h-8 w-8 text-brand-green" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">You're all set!</h2>
          <p className="mb-4">After your session, you'll see feedback and suggestions to improve your pitch.</p>
          <Button 
            onClick={() => {
              localStorage.setItem(TOUR_STORAGE_KEY, 'true');
              localStorage.setItem(TOUR_COOLDOWN_KEY, Date.now().toString());
              setTourCompleted(true);
              setShowTour(false);
              toast.success('Tour completed! You\'re ready to start practicing.');
            }} 
            className="bg-brand-green hover:bg-brand-green/90"
            aria-label="Complete tour and start practicing"
          >
            Finish
          </Button>
        </div>
      ),
      placement: 'top' as const,
      spotlightPadding: 10,
      hideBackButton: false,
      disableBeacon: true,
    }
  ];

  const micCheckRequired = () => {
    const lastMicCheck = localStorage.getItem('lastMicCheck');
    if (!lastMicCheck) return true;

    const daysSinceCheck = (Date.now() - parseInt(lastMicCheck)) / (1000 * 60 * 60 * 24);
    return daysSinceCheck > 7;
  };

  const canShowTour = () => {
    const cooldownTime = localStorage.getItem(TOUR_COOLDOWN_KEY);
    if (!cooldownTime) return true;

    const hoursSinceCooldown = (Date.now() - parseInt(cooldownTime)) / (1000 * 60 * 60);
    return hoursSinceCooldown > TOUR_COOLDOWN_HOURS;
  };

  // Initialize on mount
  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);

  useEffect(() => {
    const hasTourBeenCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    const isNewSession = sessionStorage.getItem('newSessionLogin') === 'true';

    if (user && isNewUser) {
      setShowOnboarding(true);
      
      // Auto-close onboarding after 60 seconds if stuck
      const onboardingTimeout = setTimeout(() => {
        if (showOnboarding) {
          console.warn('Onboarding timeout - auto-closing');
          handleOnboardingComplete();
        }
      }, 60000);
      
      return () => clearTimeout(onboardingTimeout);
    } else if (user && (!hasTourBeenCompleted || isNewSession) && canShowTour()) {
      setShowTour(true);
      sessionStorage.removeItem('newSessionLogin');
    } else {
      setTourCompleted(!!hasTourBeenCompleted);
    }

    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription, isNewUser, showOnboarding]);

  const handleOnboardingComplete = () => {
    markOnboardingComplete();
    setShowOnboarding(false);
    
    toast.success("Welcome to PitchPerfect AI! 🎉 Ready to improve your sales skills?");
    
    setTimeout(() => {
      setShowTour(true);
    }, 1000);
  };

  const handleTourComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    localStorage.setItem(TOUR_COOLDOWN_KEY, Date.now().toString());
    setTourCompleted(true);
    setShowTour(false);
    toast.success('Tour completed! You\'re ready to start practicing.');
  };

  const handleRestartTour = () => {
    if (!canShowTour()) {
      toast.info('Tour can be restarted once every 24 hours to prevent spam.');
      return;
    }

    localStorage.removeItem(TOUR_STORAGE_KEY);
    localStorage.removeItem(TOUR_COOLDOWN_KEY);
    setShowTour(true);
    setTourCompleted(false);
  };

  const handleStartPractice = () => {
    sessionStorage.setItem('startingPractice', 'true');

    if (micCheckRequired()) {
      setShowMicTest(true);
    } else {
      navigate('/practice');
    }
  };

  const handleMicTestComplete = () => {
    localStorage.setItem('lastMicCheck', Date.now().toString());
    setShowMicTest(false);
    navigate('/practice');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Dashboard | PitchPerfect AI</title>
        <meta name="description" content="Track your pitch practice progress and improve your sales skills with AI-powered feedback." />
      </Helmet>

      <Navbar />

      {user && (
        <>
          <GuidedTour
            steps={tourSteps}
            run={showTour}
            onComplete={handleTourComplete}
            continuous={true}
            scrollToSteps={true}
            spotlightClicks={true}
          />
          
          <NewUserOnboarding
            open={showOnboarding}
            onOpenChange={setShowOnboarding}
            onComplete={handleOnboardingComplete}
          />
        </>
      )}

      <MicrophoneTestModal
        open={showMicTest}
        onOpenChange={setShowMicTest}
        onComplete={handleMicTestComplete}
      />

      <ParallaxSection className="flex-grow pt-24 pb-12" depth={0.1}>
        <div className="container mx-auto px-4 overflow-x-hidden">
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-brand-dark mb-1">Dashboard</h1>
              {!isLoading && (
                <button
                  onClick={refetch}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Refresh dashboard data"
                >
                  <RefreshCw className="h-4 w-4 text-brand-blue" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:scale-105 transition-transform"
                onClick={() => navigate('/call-recordings')}
              >
                <FileAudio size={16} />
                Call Recordings
              </Button>

              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:scale-105 transition-transform"
                onClick={() => navigate('/practice')}
              >
                <Mic size={16} />
                Practice Session
              </Button>

              <Button 
                className="flex items-center gap-2 bg-gradient-to-r from-brand-blue to-[#6d8fca] hover:from-[#4580dc] hover:to-[#5c7eb9] text-white hover:scale-105 transition-transform shadow-sm"
                onClick={() => navigate('/roleplay')}
              >
                <Users size={16} />
                Role Play
              </Button>

              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:scale-105 transition-transform border border-purple-200 hover:bg-purple-50"
                onClick={() => setShowAISettings(true)}
              >
                <Bot size={16} className="text-purple-600" />
                AI Settings
              </Button>
            </div>
          </motion.div>

          {user && !isPremium && (
            <motion.div 
              className="flex justify-end mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button 
                onClick={() => navigate('/pricing')}
                className="bg-gradient-to-r from-brand-blue to-brand-green text-white hover:from-brand-blue/90 hover:to-brand-green/90 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Crown size={16} />
                Upgrade Plan
              </Button>
            </motion.div>
          )}

          {/* Credits warning bar */}
          {user && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
              <CreditsBar credits={dashboardData.profile.credits} />
            </motion.div>
          )}

          {/* Error handling */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-red-800">{error}</span>
                <Button onClick={refetch} variant="outline" size="sm" className="ml-4">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="mb-8">
              <DashboardSkeleton />
            </div>
          ) : (
            <>
              {/* Stats summary - only show if there's data */}
              {dashboardData.stats.hasData && (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
                    <p className="text-3xl font-bold text-brand-dark">
                      {dashboardData.stats.totalSessions}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Average Score</p>
                    <p className="text-3xl font-bold text-brand-dark">
                      {dashboardData.stats.averageScore !== null 
                        ? `${dashboardData.stats.averageScore}%` 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Credits Remaining</p>
                    <p className="text-3xl font-bold text-brand-dark">
                      {dashboardData.profile.credits}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Main content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Left column - Recent Sessions */}
                <motion.div 
                  className="lg:col-span-2 space-y-8"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <RecentSessions 
                    sessions={dashboardData.recentSessions}
                    onStartPractice={handleStartPractice}
                  />
                </motion.div>

                {/* Right column - Quick Practice & AI Tips */}
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="tour-step-1 tour-step-2">
                    <QuickPractice 
                      credits={dashboardData.profile.credits}
                      onStartPractice={handleStartPractice}
                    />
                  </div>

                  <div className="tour-step-3">
                    <AiSuggestions tips={dashboardData.tips} />
                  </div>
                </motion.div>
              </div>

              {/* AI Disclosure */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8"
              >
                <AIDisclosure 
                  variant="compact"
                  description="Your dashboard contains AI-generated insights and suggestions based on your practice sessions."
                />
              </motion.div>
            </>
          )}
        </div>
      </ParallaxSection>

      <Footer />

      <AISettingsModal
        open={showAISettings}
        onOpenChange={setShowAISettings}
      />
    </div>
  );
};

export default Dashboard;
