import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight } from 'lucide-react';
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
import { VoiceSynthesis } from '@/utils/VoiceSynthesis';
import { supabase } from '@/lib/supabase';
import { FileAudio, Mic, Users, Bot } from 'lucide-react';
import AIDisclosure from '@/components/AIDisclosure';
import AISettingsModal from '@/components/AISettingsModal';

const Dashboard = () => {
  const { user, refreshSubscription } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [showMicTest, setShowMicTest] = useState(false);
  const [micTestPassed, setMicTestPassed] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const navigate = useNavigate();
  const [showAISettings, setShowAISettings] = useState(false);
  
  // Define tour steps
  const tourSteps: Step[] = [
    {
      target: '.tour-step-1',
      content: 'Start by selecting a scenario that you want to practice.',
      disableBeacon: true,
      placement: 'bottom' as const,
    },
    {
      target: '.tour-step-2',
      content: 'Press the record button to start your practice session.',
      placement: 'bottom' as const,
    },
    {
      target: '.tour-step-3',
      content: 'After your session, you\'ll see feedback and suggestions to improve your pitch.',
      placement: 'top' as const,
    }
  ];
  
  useEffect(() => {
    // Check if user has completed the tour before
    const hasTourBeenShown = localStorage.getItem('tourCompleted');
    
    if (user && !hasTourBeenShown) {
      // Show the tour if user is logged in and hasn't seen it before
      setShowTour(true);
    }
    
    // Refresh subscription status when dashboard loads
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);
  
  const handleTourComplete = () => {
    // Save tour completion in localStorage
    localStorage.setItem('tourCompleted', 'true');
    setTourCompleted(true);
  };
  
  const handleStartPractice = () => {
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
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        run={showTour}
        onComplete={handleTourComplete}
      />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-dark mb-1">Dashboard</h1>
              <p className="text-brand-dark/70">Welcome back, {user?.user_metadata?.first_name || 'there'}!</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => navigate('/call-recordings')}
              >
                <FileAudio size={16} />
                Call Recordings
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => navigate('/practice')}
              >
                <Mic size={16} />
                Practice Session
              </Button>
              
              <Button 
                className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90"
                onClick={() => navigate('/roleplay')}
              >
                <Users size={16} />
                Role Play
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowAISettings(true)}
              >
                <Bot size={16} className="text-purple-600" />
                AI Settings
              </Button>
            </div>
          </div>
          
          <AIDisclosure 
            variant="compact"
            description="Your dashboard contains AI-generated insights and suggestions based on your practice sessions."
            className="mb-6"
          />
          
          <div className="mb-8">
            <UserSubscriptionStatus />
          </div>
          
          <DashboardStats streakCount={streakCount} />
          
          {showMicTest && (
            <div className="mb-8">
              <MicrophoneTest 
                onTestComplete={handleMicTestComplete}
                autoStart={true} 
              />
            </div>
          )}
          
          {/* Team Leaderboard Section */}
          <div className="mt-8 mb-8">
            <LeaderboardTable />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader className="bg-brand-blue/10 pb-4">
                  <CardTitle className="text-xl text-brand-dark">Recent Practice Sessions</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium">Product Demo Pitch</h3>
                        <p className="text-sm text-brand-dark/70">2 hours ago • 3:45 min</p>
                      </div>
                      <Button variant="ghost" className="text-brand-green hover:bg-brand-green/10">View Feedback</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium">Cold Call Introduction</h3>
                        <p className="text-sm text-brand-dark/70">Yesterday • 2:12 min</p>
                      </div>
                      <Button variant="ghost" className="text-brand-green hover:bg-brand-green/10">View Feedback</Button>
                    </div>
                    
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      View All Sessions
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Referral Program */}
              <ReferralProgram />
            </div>
            
            <div className="space-y-6">
              <Card className="bg-brand-green/5 border-brand-green/30">
                <CardContent className="p-6 tour-step-1">
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
                          <Button className="w-full mb-4 bg-brand-green hover:bg-brand-green/90">
                            Start New Practice
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          className="w-full mb-4 bg-brand-green hover:bg-brand-green/90" 
                          onClick={handleStartPractice}
                        >
                          Start New Practice
                        </Button>
                      )}
                    </div>
                  )}
                  <Link to="/roleplay">
                    <Button variant="outline" className="w-full">
                      Try Roleplay Scenarios
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <div className="space-y-4 tour-step-3">
                <h3 className="font-medium text-xl text-brand-dark">AI Suggestions</h3>
                <AISuggestionCard
                  title="Use Benefit-Focused Language"
                  description="Try framing features in terms of customer benefits using phrases like 'which means that you can...'"
                  type="tip"
                />
                
                <AISuggestionCard
                  title="Elevator Pitch Template"
                  description="Our [product] helps [target audience] to [solve problem] by [unique approach] unlike [alternative]."
                  type="script"
                />
                
                <Link to="/tips">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    View All Tips
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
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
