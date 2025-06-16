import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, FileAudio, Mic, Users, Bot, Check, BarChart3, Crown, Diamond } from 'lucide-react';
import AISuggestionCard from '@/components/AISuggestionCard';
import DashboardStats from '@/components/DashboardStats';
import UserSubscriptionStatus from '@/components/dashboard/UserSubscriptionStatus';
import StreakBadge from '@/components/dashboard/StreakBadge';
import LeaderboardTable from '@/components/dashboard/LeaderboardTable';
import ReferralProgram from '@/components/dashboard/ReferralProgram';
import CreditBalanceTracker from '@/components/dashboard/CreditBalanceTracker';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Step } from 'react-joyride';
import GuidedTour from '@/components/GuidedTour';
import MicrophoneTestModal from '@/components/dashboard/MicrophoneTestModal';
import VoiceSynthesis from '@/utils/VoiceSynthesis';
import AIDisclosure from '@/components/AIDisclosure';
import AISettingsModal from '@/components/AISettingsModal';
import TiltCard from '@/components/animations/TiltCard';
import { motion, AnimatePresence } from 'framer-motion';
import ParallaxSection from '@/components/animations/ParallaxSection';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import RefreshAnimation from '@/components/dashboard/RefreshAnimation';
import FadeTransition from '@/components/animations/FadeTransition';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import EmptyState from '@/components/dashboard/EmptyState';
import { useGuestMode } from '@/context/GuestModeContext';

const TOUR_STORAGE_KEY = 'pitchperfect_tour_completed';
const TOUR_COOLDOWN_KEY = 'pitchperfect_tour_cooldown';
const TOUR_COOLDOWN_HOURS = 24;

const Dashboard = () => {
  const { user, refreshSubscription, isPremium, creditsRemaining, trialUsed, loading } = useAuth();
  const { isGuestMode } = useGuestMode();
  const navigate = useNavigate();

  // Show loading state while auth context loads
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-brand-dark">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not in guest mode, redirect to login
  if (!user && !isGuestMode) {
    navigate('/login', { replace: true });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-dark">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const [showTour, setShowTour] = useState(false);
  const [showMicTest, setShowMicTest] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);

  const {
    isLoading,
    isRefreshing,
    streakCount,
    settings,
    dashboardData,
    updateSettings,
    refreshDashboardData
  } = useDashboardData();

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

  useEffect(() => {
    if (user && !isLoading) {
      // Track dashboard load if needed
    }
  }, [user, isLoading, dashboardData.hasData, streakCount]);

  useEffect(() => {
    const hasTourBeenCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    const isNewSession = sessionStorage.getItem('newSessionLogin') === 'true';

    if (user && (!hasTourBeenCompleted || isNewSession) && canShowTour()) {
      setShowTour(true);
      sessionStorage.removeItem('newSessionLogin');
    } else {
      setTourCompleted(!!hasTourBeenCompleted);
    }

    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);

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

  const handleTabChange = (value: string) => {
    updateSettings({ activeTab: value });
  };

  const getContextualCTA = () => {
    if (isGuestMode) {
      return {
        label: "Start Demo (Guest)",
        route: "/demo"
      };
    }

    if (!user) {
      return {
        label: "Sign Up for Free",
        route: "/signup"
      };
    }

    if (!trialUsed) {
      return {
        label: "Get 1 Free Pitch Analysis",
        route: "/demo"
      };
    }

    if (creditsRemaining > 0) {
      return {
        label: `Start New Practice (${creditsRemaining} credits)`,
        route: "/practice"
      };
    }

    return {
      label: "Top Up Credits / Upgrade Plan",
      route: "/pricing"
    };
  };

  const contextualCTA = getContextualCTA();

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Dashboard | PitchPerfect AI</title>
        <meta name="description" content="Track your pitch practice progress and improve your sales skills with AI-powered feedback." />
      </Helmet>

      <Navbar />

      {user && (
        <GuidedTour
          steps={tourSteps}
          run={showTour}
          onComplete={handleTourComplete}
          continuous={true}
          scrollToSteps={true}
          spotlightClicks={true}
        />
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
              <RefreshAnimation isRefreshing={isRefreshing} />
              <div className="text-sm text-muted-foreground">
                {!isLoading && (
                  <button
                    onClick={() => refreshDashboardData(true)}
                    className="text-brand-blue hover:underline focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded"
                    aria-label="Refresh dashboard data"
                  >
                    Refresh
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="group">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 hover:scale-105 transition-transform group-hover:shadow-md"
                  onClick={() => navigate('/call-recordings')}
                >
                  <FileAudio size={16} />
                  Call Recordings
                </Button>
              </div>

              <div className="group">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 hover:scale-105 transition-transform group-hover:shadow-md"
                  onClick={() => navigate('/practice')}
                >
                  <Mic size={16} />
                  Practice Session
                </Button>
              </div>

              <div className="group">
                <Button 
                  className="flex items-center gap-2 bg-gradient-to-r from-brand-blue to-[#6d8fca] hover:from-[#4580dc] hover:to-[#5c7eb9] text-white hover:scale-105 transition-transform shadow-sm group-hover:shadow-md"
                  onClick={() => navigate('/roleplay')}
                >
                  <Users size={16} />
                  Role Play
                </Button>
              </div>

              <div className="group">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 hover:scale-105 transition-transform border border-purple-200 hover:bg-purple-50 group-hover:shadow-md"
                  onClick={() => setShowAISettings(true)}
                >
                  <Bot size={16} className="text-purple-600" />
                  AI Settings
                </Button>
              </div>
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
                onClick={() => {
                  navigate('/pricing');
                }}
                className="bg-gradient-to-r from-brand-blue to-brand-green text-white hover:from-brand-blue/90 hover:to-brand-green/90 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Crown size={16} />
                Upgrade Plan
              </Button>
            </motion.div>
          )}

          {user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <CreditBalanceTracker />
            </motion.div>
          )}

          <Tabs 
            value={settings.activeTab}
            onValueChange={handleTabChange}
            className="mb-6"
          >
            <TabsList className="mb-4" role="tablist">
              <TabsTrigger value="overview" role="tab" aria-selected={settings.activeTab === 'overview'}>Overview</TabsTrigger>
              <TabsTrigger value="history" role="tab" aria-selected={settings.activeTab === 'history'}>Session History</TabsTrigger>
              <TabsTrigger value="analysis" role="tab" aria-selected={settings.activeTab === 'analysis'}>Detailed Analysis</TabsTrigger>
            </TabsList>

            <FadeTransition show={true} duration={300}>
              <div style={{ minHeight: isLoading ? '600px' : 'auto' }}>
                {isLoading ? (
                  <DashboardSkeleton />
                ) : (
                  <>
                    <TabsContent value="overview" className="mt-0" role="tabpanel">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div 
                          className="mb-8"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <UserSubscriptionStatus />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                        >
                          {dashboardData.hasData ? (
                            <DashboardStats 
                              streakCount={streakCount} 
                              pitchCount={dashboardData.pitchCount ?? 0}
                              winRate={dashboardData.winRate ?? 0}
                              recentPitches={dashboardData.recentPitches ?? []}
                              objectionCategories={dashboardData.objectionCategories ?? []}
                            />
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <EmptyState 
                                title="No pitch data yet"
                                description="Complete your first practice session to see your performance stats here."
                                actionLabel={contextualCTA.label}
                                actionRoute={contextualCTA.route}
                                icon={<BarChart3 className="h-12 w-12 text-gray-300 mb-4" />}
                              />
                            </motion.div>
                          )}
                        </motion.div>
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0" role="tabpanel">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {dashboardData.hasData ? (
                          <Card className="overflow-hidden shadow-md mb-8">
                            <CardHeader className="bg-gradient-to-r from-brand-blue/10 to-brand-blue/5 pb-4">
                              <CardTitle className="text-xl text-brand-dark">All Practice Sessions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              <div className="space-y-4" role="list" aria-live="polite">
                                {Array.from({ length: Math.min(dashboardData.pitchCount ?? 0, 3) }, (_, i) => (
                                  <motion.div 
                                    key={i}
                                    className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    role="listitem"
                                  >
                                    <div>
                                      <h3 className="font-medium">Session #{i + 1}</h3>
                                      <p className="text-sm text-brand-dark/70">
                                        {i + 1} {i === 0 ? 'hour' : 'days'} ago • {Math.floor(Math.random() * 5) + 1}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')} min
                                      </p>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      className="text-brand-green hover:bg-brand-green/10 hover:scale-105 transition-transform group-hover:shadow-sm"
                                      aria-label={`View feedback for session ${i + 1}`}
                                    >
                                      View Feedback
                                    </Button>
                                  </motion.div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <EmptyState 
                              title="No practice sessions yet"
                              description="Start your first practice session to see your history here."
                              actionLabel={contextualCTA.label}
                              actionRoute={contextualCTA.route}
                              icon={<FileAudio className="h-12 w-12 text-gray-300 mb-4" />}
                              secondaryAction={{
                                label: "Try Roleplay Instead",
                                route: "/roleplay"
                              }}
                            />
                          </motion.div>
                        )}
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-0" role="tabpanel">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div 
                          className="mt-8 mb-8"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          {dashboardData.hasData ? (
                            <LeaderboardTable />
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <EmptyState 
                                title="Analysis not available yet"
                                description="Complete more practice sessions to unlock detailed performance analysis."
                                actionLabel={contextualCTA.label}
                                actionRoute={contextualCTA.route}
                                icon={<BarChart3 className="h-12 w-12 text-gray-300 mb-4" />}
                              />
                            </motion.div>
                          )}
                        </motion.div>
                      </motion.div>
                    </TabsContent>
                  </>
                )}
              </div>
            </FadeTransition>
          </Tabs>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AIDisclosure 
              variant="compact"
              description="Your dashboard contains AI-generated insights and suggestions based on your practice sessions."
              className="mb-6"
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <motion.div 
              className="lg:col-span-2 space-y-8"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="overflow-hidden shadow-md">
                <CardHeader className="bg-gradient-to-r from-brand-blue/10 to-brand-blue/5 pb-4">
                  <CardTitle className="text-xl text-brand-dark">Recent Practice Sessions</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {dashboardData.hasData ? (
                    <div className="space-y-4" role="list">
                      {Array.from({ length: Math.min(dashboardData.pitchCount ?? 0, 2) }, (_, i) => (
                        <motion.div 
                          key={i}
                          className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          role="listitem"
                        >
                          <div>
                            <h3 className="font-medium">
                              {i === 0 ? 'Product Demo Pitch' : 'Cold Call Introduction'}
                            </h3>
                            <p className="text-sm text-brand-dark/70">
                              {i === 0 ? '2 hours ago • 3:45 min' : 'Yesterday • 2:12 min'}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            className="text-brand-green hover:bg-brand-green/10 hover:scale-105 transition-transform group-hover:shadow-sm"
                            aria-label={`View feedback for session ${i === 0 ? 'product demo pitch' : 'cold call introduction'}`}
                          >
                            View Feedback
                          </Button>
                        </motion.div>
                      ))}

                      <div className="group">
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-center gap-2 hover:scale-102 transition-transform group-hover:shadow-sm"
                          aria-label="View all practice sessions"
                        >
                          View All Sessions
                          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6" role="region" aria-live="polite">
                      <p className="text-gray-500 mb-4">No practice sessions yet. Start your first practice to see your progress here.</p>
                      <div className="group">
                        <Button 
                          onClick={() => navigate(contextualCTA.route)}
                          className="bg-brand-green hover:bg-brand-green/90 group-hover:shadow-sm transition-all"
                          aria-label="Start your first practice session"
                        >
                          {contextualCTA.label}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <ReferralProgram />
            </motion.div>

            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <TiltCard tiltFactor={3} glareOpacity={0.1} className="bg-gradient-to-br from-brand-green/5 to-teal-100/20 border-brand-green/30 rounded-lg shadow-sm">
                <div className="p-6 tour-step-1">
                  <h3 className="text-xl font-medium mb-4 text-brand-dark">Quick Practice</h3>
                  <p className="text-brand-dark/70 mb-6">
                    Ready to improve your pitch skills? Start a new practice session now.
                  </p>
                  <div className="tour-step-2 space-y-3">
                    <div className="group">
                      <Button 
                        className="w-full mb-4 bg-gradient-to-r from-[#008D95] to-[#33C3F0] hover:from-[#007a82] hover:to-[#22b2df] text-white hover:scale-105 transition-all group-hover:shadow-md" 
                        onClick={() => navigate(contextualCTA.route)}
                        aria-label="Start new practice session"
                      >
                        {contextualCTA.label}
                      </Button>
                    </div>
                    <div className="group">
                      <Link to="/roleplay">
                        <Button 
                          variant="outline" 
                          className="w-full hover:scale-105 transition-transform group-hover:shadow-sm"
                          aria-label="Try roleplay scenarios"
                        >
                          Try Roleplay Scenarios
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </TiltCard>

              <div className="space-y-4 tour-step-3">
                <h3 className="font-medium text-xl text-brand-dark">AI Suggestions</h3>

                <TiltCard tiltFactor={2} className="bg-white rounded-lg shadow-sm border border-gray-100">
                  <AISuggestionCard
                    title="Use Benefit-Focused Language"
                    description="Try framing features in terms of customer benefits using phrases like 'which means that you can...'"
                    type="tip"
                  />
                </TiltCard>

                <TiltCard tiltFactor={2} className="bg-white rounded-lg shadow-sm border border-gray-100">
                  <AISuggestionCard
                    title="Elevator Pitch Template"
                    description="Our [product] helps [target audience] to [solve problem] by [unique approach] unlike [alternative]."
                    type="script"
                  />
                </TiltCard>

                <div className="group">
                  <Link to="/tips">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2 hover:scale-105 transition-transform group-hover:shadow-sm"
                      aria-label="View all practice tips"
                    >
                      View All Tips
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
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
