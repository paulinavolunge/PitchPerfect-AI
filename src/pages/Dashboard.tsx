import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileAudio, Mic, Users, Bot, Check, Crown, RefreshCw, AlertCircle, Play, Target, CheckCircle, Sparkles } from 'lucide-react';
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
import EnhancedCreditsBar from '@/components/dashboard/EnhancedCreditsBar';
import RecentSessions from '@/components/dashboard/RecentSessions';
import QuickPractice from '@/components/dashboard/QuickPractice';
import AiSuggestions from '@/components/dashboard/AiSuggestions';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TOUR_STORAGE_KEY = 'pitchperfect_tour_completed';
const TOUR_COOLDOWN_KEY = 'pitchperfect_tour_cooldown';
const TOUR_COOLDOWN_HOURS = 24;
const FOCUS_MODE_SKIP_KEY = 'pitchperfect_skip_focus_mode';

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
  const [skipFocusMode, setSkipFocusMode] = useState(false);

  // NEW: Check if user should see focus mode (less than 3 sessions)
  const isNewUserForFocusMode = () => {
    const sessionCount = dashboardData?.recentSessions?.length || 0;
    const hasSkippedFocusMode = localStorage.getItem(FOCUS_MODE_SKIP_KEY) === 'true';
    return sessionCount < 3 && !hasSkippedFocusMode && !skipFocusMode;
  };

  const handleSkipFocusMode = () => {
    localStorage.setItem(FOCUS_MODE_SKIP_KEY, 'true');
    setSkipFocusMode(true);
  };

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

  // Check for skip focus mode on mount
  useEffect(() => {
    const hasSkipped = localStorage.getItem(FOCUS_MODE_SKIP_KEY) === 'true';
    setSkipFocusMode(hasSkipped);
  }, []);

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

  // Calculate session count for progress indicator
  const sessionCount = dashboardData?.recentSessions?.length || 0;

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
          {/* Header - shown for all users */}
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

            {/* Only show full nav buttons for experienced users */}
            {!isNewUserForFocusMode() && (
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
            )}
          </motion.div>

          {/* Upgrade button for non-premium users (experienced) */}
          {user && !isPremium && !isNewUserForFocusMode() && (
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
              {/* NEW USER FOCUS MODE DASHBOARD */}
              {isNewUserForFocusMode() ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-2xl mx-auto"
                >
                  <Card className="border-2 border-primary-500 shadow-lg">
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-4">
                        <div className="bg-primary-100 rounded-full p-4">
                          <Target className="h-12 w-12 text-primary-600" />
                        </div>
                      </div>
                      <CardTitle className="text-2xl">Welcome! Let's Get Started</CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Complete your first practice session to unlock all features
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Progress Indicator */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-sm text-muted-foreground">
                          Sessions completed: {sessionCount} / 3
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3].map((step) => (
                            <div
                              key={step}
                              className={`w-3 h-3 rounded-full transition-colors ${
                                sessionCount >= step
                                  ? 'bg-primary-600'
                                  : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Main CTA */}
                      <Button
                        size="lg"
                        className="w-full h-16 text-lg font-semibold bg-primary-600 hover:bg-primary-700"
                        onClick={handleStartPractice}
                      >
                        <Play className="h-6 w-6 mr-2" />
                        Start Your First Practice Session
                      </Button>

                      {/* Benefits List */}
                      <div className="space-y-3 pt-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">5-minute quick session</p>
                            <p className="text-sm text-muted-foreground">
                              Practice a common objection scenario
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Instant AI feedback</p>
                            <p className="text-sm text-muted-foreground">
                              Get specific tips to improve your delivery
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">No setup required</p>
                            <p className="text-sm text-muted-foreground">
                              Start with text mode - no microphone needed
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Skip Option */}
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={handleSkipFocusMode}
                      >
                        Show me the full dashboard
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Quick Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary-600" />
                          Your Credits
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.profile.credits}</div>
                        <p className="text-sm text-muted-foreground">
                          1 credit = 1 practice session
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary-600" />
                          Your Goal
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          Complete 3 practice sessions to unlock advanced features and detailed analytics
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ) : (
                /* EXPERIENCED USER DASHBOARD (original) */
                <>
                  {/* Enhanced Credits Bar */}
                  {user && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="mb-6"
                    >
                      <EnhancedCreditsBar 
                        credits={dashboardData.profile.credits} 
                        isPremium={isPremium}
                      />
                    </motion.div>
                  )}

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
