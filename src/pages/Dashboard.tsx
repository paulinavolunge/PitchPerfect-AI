import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, FileAudio, Mic, Users, Bot, Check } from 'lucide-react';
import AISuggestionCard from '@/components/AISuggestionCard';
import DashboardStats from '@/components/DashboardStats';
import UserSubscriptionStatus from '@/components/dashboard/UserSubscriptionStatus';
import StreakBadge from '@/components/dashboard/StreakBadge';
import LeaderboardTable from '@/components/dashboard/LeaderboardTable';
import ReferralProgram from '@/components/dashboard/ReferralProgram';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Step } from 'react-joyride';
import GuidedTour from '@/components/GuidedTour';
import MicrophoneTest from '@/components/MicrophoneTest';
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

const TOUR_STORAGE_KEY = 'pitchperfect_tour_completed';

const Dashboard = () => {
  const { user, refreshSubscription } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [showMicTest, setShowMicTest] = useState(false);
  const [micTestPassed, setMicTestPassed] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const navigate = useNavigate();
  const [showAISettings, setShowAISettings] = useState(false);
  
  // Use our new hook for dashboard data and settings
  const {
    isLoading,
    isRefreshing,
    streakCount,
    settings,
    updateSettings,
    refreshDashboardData
  } = useDashboardData();
  
  // Define tour steps with clear IDs and better targeting
  const tourSteps: Step[] = [
    {
      target: '.tour-step-1',
      content: 'Start by selecting a scenario that you want to practice.',
      disableBeacon: true,
      placement: 'bottom' as const,
      spotlightPadding: 10,
      title: 'Select a Scenario',
    },
    {
      target: '.tour-step-2',
      content: 'Press the record button to start your practice session.',
      placement: 'bottom' as const,
      spotlightPadding: 10,
      title: 'Start Recording',
    },
    {
      target: '.tour-step-3',
      content: 'After your session, you\'ll see feedback and suggestions to improve your pitch.',
      placement: 'top' as const,
      spotlightPadding: 10,
      title: 'Review Feedback',
    },
    {
      target: 'body',
      content: (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <Check className="h-8 w-8 text-brand-green" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">You're all set!</h2>
          <p className="mb-4">You've completed the tour and you're ready to start using PitchPerfect AI.</p>
          <Button 
            onClick={() => setShowTour(false)} 
            className="bg-brand-green hover:bg-brand-green/90"
          >
            Close
          </Button>
        </div>
      ),
      placement: 'center' as const,
      disableBeacon: true,
      hideBackButton: true,
      hideCloseButton: true,
      spotlightClicks: false,
      disableOverlayClose: true,
    }
  ];
  
  useEffect(() => {
    // Check if user has completed the tour before
    const hasTourBeenCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    const isNewSession = sessionStorage.getItem('newSessionLogin') === 'true';
    
    if (user && (!hasTourBeenCompleted || isNewSession)) {
      // Show the tour if user is logged in and hasn't seen it before or explicitly requested it
      setShowTour(true);
      
      // Clear the new session flag
      sessionStorage.removeItem('newSessionLogin');
    } else {
      setTourCompleted(!!hasTourBeenCompleted);
    }
    
    // Refresh subscription status when dashboard loads
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);
  
  const handleTourComplete = () => {
    // Save tour completion in localStorage
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setTourCompleted(true);
    setShowTour(false);
    
    // Show a toast message when the tour is completed
    toast.success('Tour completed! You\'re ready to start practicing.');
  };
  
  const handleRestartTour = () => {
    // Remove tour completion flag and restart tour
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setShowTour(true);
    setTourCompleted(false);
  };
  
  const handleStartPractice = () => {
    // Flag that will be checked when returning from practice
    sessionStorage.setItem('startingPractice', 'true');
    
    // Show microphone test before starting practice
    setShowMicTest(true);
  };
  
  const handleMicTestComplete = (passed: boolean) => {
    setMicTestPassed(passed);
    
    // Speak success or error message
    const voice = VoiceSynthesis.getInstance();
    if (passed) {
      voice.speak({
        text: "Great! Your microphone is working. You're ready to start practicing.",
        voice: "Google US English Female",
      });
    } else {
      voice.speak({
        text: "We couldn't detect any input from your microphone. Please check your settings and try again.",
        voice: "Google US English Female",
      });
    }
  };
  
  const handleTabChange = (value: string) => {
    updateSettings({ activeTab: value });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        run={showTour}
        onComplete={handleTourComplete}
        continuous={true}
        scrollToSteps={true}
        spotlightClicks={false}
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
                    className="text-brand-blue hover:underline focus:outline-none"
                    aria-label="Refresh dashboard data"
                  >
                    Refresh
                  </button>
                )}
              </div>
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
                className="flex items-center gap-2 bg-gradient-to-r from-brand-blue to-[#6d8fca] hover:from-[#4580dc] hover:to-[#5c7eb9] text-white hover:scale-105 transition-transform shadow-sm hover:shadow-md"
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
          
          {/* View Tabs */}
          <Tabs 
            value={settings.activeTab}
            onValueChange={handleTabChange}
            className="mb-6"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Session History</TabsTrigger>
              <TabsTrigger value="analysis">Detailed Analysis</TabsTrigger>
            </TabsList>
            
            <FadeTransition show={true} duration={300}>
              <div style={{ minHeight: isLoading ? '600px' : 'auto' }}>
                {isLoading ? (
                  <DashboardSkeleton />
                ) : (
                  <>
                    <TabsContent value="overview" className="mt-0">
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
                          <DashboardStats streakCount={streakCount} />
                        </motion.div>
                      </motion.div>
                    </TabsContent>
                    
                    <TabsContent value="history" className="mt-0">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden shadow-md mb-8">
                          <CardHeader className="bg-gradient-to-r from-brand-blue/10 to-brand-blue/5 pb-4">
                            <CardTitle className="text-xl text-brand-dark">All Practice Sessions</CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div 
                                  key={i}
                                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
                                  whileHover={{ scale: 1.02 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                  <div>
                                    <h3 className="font-medium">Session #{i}</h3>
                                    <p className="text-sm text-brand-dark/70">
                                      {i} {i === 1 ? 'hour' : 'days'} ago • {Math.floor(Math.random() * 5) + 1}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')} min
                                    </p>
                                  </div>
                                  <Button variant="ghost" className="text-brand-green hover:bg-brand-green/10 hover:scale-105 transition-transform">
                                    View Feedback
                                  </Button>
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </TabsContent>
                    
                    <TabsContent value="analysis" className="mt-0">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Team Leaderboard Section */}
                        <motion.div 
                          className="mt-8 mb-8"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          <LeaderboardTable />
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
          
          <AnimatePresence>
            {showMicTest && (
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MicrophoneTest 
                  onTestComplete={handleMicTestComplete}
                  autoStart={true} 
                />
              </motion.div>
            )}
          </AnimatePresence>
          
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
                  <div className="space-y-4">
                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div>
                        <h3 className="font-medium">Product Demo Pitch</h3>
                        <p className="text-sm text-brand-dark/70">2 hours ago • 3:45 min</p>
                      </div>
                      <Button variant="ghost" className="text-brand-green hover:bg-brand-green/10 hover:scale-105 transition-transform">View Feedback</Button>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div>
                        <h3 className="font-medium">Cold Call Introduction</h3>
                        <p className="text-sm text-brand-dark/70">Yesterday • 2:12 min</p>
                      </div>
                      <Button variant="ghost" className="text-brand-green hover:bg-brand-green/10 hover:scale-105 transition-transform">View Feedback</Button>
                    </motion.div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2 hover:scale-102 transition-transform"
                    >
                      View All Sessions
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Referral Program */}
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
                  {showMicTest && !micTestPassed ? (
                    <Button 
                      className="w-full mb-4 bg-gray-300 hover:bg-gray-300 cursor-not-allowed" 
                      disabled={true}
                    >
                      Start New Practice
                    </Button>
                  ) : (
                    <div className="tour-step-2">
                      {showMicTest ? (
                        <Link to="/practice">
                          <Button className="w-full mb-4 bg-gradient-to-r from-[#008D95] to-[#33C3F0] hover:from-[#007a82] hover:to-[#22b2df] text-white hover:scale-105 transition-all">
                            Start New Practice
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          className="w-full mb-4 bg-gradient-to-r from-[#008D95] to-[#33C3F0] hover:from-[#007a82] hover:to-[#22b2df] text-white hover:scale-105 transition-all" 
                          onClick={handleStartPractice}
                        >
                          Start New Practice
                        </Button>
                      )}
                    </div>
                  )}
                  <Link to="/roleplay">
                    <Button variant="outline" className="w-full hover:scale-105 transition-transform">
                      Try Roleplay Scenarios
                    </Button>
                  </Link>
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
                
                <Link to="/tips">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                  >
                    View All Tips
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </ParallaxSection>
      
      <Footer />
      
      {/* AI Settings Modal */}
      <AISettingsModal
        open={showAISettings}
        onOpenChange={setShowAISettings}
      />
    </div>
  );
};

export default Dashboard;
