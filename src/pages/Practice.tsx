import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mic, MicOff, Pause, Play, RefreshCcw, Award, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PremiumModal from '@/components/PremiumModal';
import ProgressSummary from '@/components/gamification/ProgressSummary';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import StreakBadge from '@/components/dashboard/StreakBadge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/gamification/BadgeSystem';
import QuickStartGuide from '@/components/onboarding/QuickStartGuide';
import { Step } from 'react-joyride';
import GuidedTour from '@/components/GuidedTour';
import FeedbackPrompt from '@/components/feedback/FeedbackPrompt';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '@/utils/analytics';

const Practice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showProgressSummary, setShowProgressSummary] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const { user, isPremium } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock data for progress summary with visual indicators
  const mockStats = [
    { 
      label: "Clarity", 
      value: 76, 
      previousValue: 71, 
      increase: true,
      change: 5
    },
    { 
      label: "Engagement", 
      value: 82, 
      previousValue: 74, 
      increase: true,
      change: 8
    },
    { 
      label: "Pacing", 
      value: 65, 
      previousValue: 68, 
      decrease: true,
      change: -3
    }
  ];
  
  // Mock data for progress summary
  const mockFeedback = [
    { text: "Clear explanation of the product's core functionality", type: 'strength' as const },
    { text: "Good enthusiasm and energy throughout the pitch", type: 'strength' as const },
    { text: "Strong closing statement with clear call-to-action", type: 'strength' as const },
    { text: "Speaking pace was 15% too fast in the technical section", type: 'improvement' as const },
    { text: "Consider adding more specific customer examples", type: 'improvement' as const },
    { text: "The value proposition could be stated earlier in the pitch", type: 'improvement' as const }
  ];
  
  const mockEarnedBadges: Badge[] = [
    {
      id: 'first-pitch',
      name: 'First Pitch',
      description: 'Completed your first practice pitch',
      icon: <Award />,
      unlocked: true,
      colorClass: 'bg-brand-green',
    }
  ];
  
  const mockNextMilestone = {
    name: "Complete 5 Practice Sessions",
    progress: 1,
    total: 5
  };

  // Practice tour steps
  const tourSteps: Step[] = [
    {
      target: '.practice-scenario',
      content: 'This is your practice scenario. You can see details about what you should focus on in your pitch.',
      disableBeacon: true,
    },
    {
      target: '.record-button',
      content: 'Click this button to start recording your practice pitch. Click again when you\'re finished.',
      placement: 'top' as const,
    },
    {
      target: '.playback-controls',
      content: 'Use these controls to listen to examples or pause your recording.',
      placement: 'bottom' as const,
    },
    {
      target: '.tips-section',
      content: 'Review these tips to help improve your pitch for this specific scenario.',
      placement: 'top' as const,
    }
  ];
  
  useEffect(() => {
    if (user) {
      fetchUserStreak();
      
      const hasSeenPracticeTour = localStorage.getItem('hasSeenPracticeTour');
      if (!hasSeenPracticeTour) {
        setShowTour(true);
      }
    }
    
    if (!isPremium) {
      setShowPremiumModal(true);
      trackEvent('premium_modal_viewed', { context: 'practice_page' });
    }
  }, [user, isPremium]);
  
  const fetchUserStreak = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('streak_count, last_activity')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching streak:', error);
        return;
      }
      
      if (data) {
        setStreakCount(data.streak_count);
        
        // Confirm timezone handling - check if last activity was today
        const today = new Date().toISOString().split('T')[0];
        const lastActivity = data.last_activity;
        
        console.log('Streak validation:', {
          today,
          lastActivity,
          streakCount: data.streak_count,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      }
    } catch (err) {
      console.error('Failed to fetch streak:', err);
    }
  };
  
  const toggleRecording = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      trackEvent('premium_modal_viewed', { context: 'recording_attempt' });
      return;
    }
    
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setShowFeedback(true);
      setShowProgressSummary(true);
      updatePracticeStreak();
      trackEvent('pitch_recording_stopped');
    } else {
      // Start recording
      setIsRecording(true);
      trackEvent('pitch_recording_started');
    }
  };
  
  const updatePracticeStreak = async () => {
    if (!user?.id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingStreak, error: fetchError } = await supabase
        .from('user_streaks')
        .select('streak_count, last_activity')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching streak for update:', fetchError);
        return;
      }
      
      if (!existingStreak) {
        // Create new streak record
        const { error: insertError } = await supabase
          .from('user_streaks')
          .insert({
            user_id: user.id,
            streak_count: 1,
            last_activity: today
          });
          
        if (insertError) {
          console.error('Error creating streak:', insertError);
        } else {
          setStreakCount(1);
          toast({
            title: "Streak started!",
            description: "You've started your practice streak. Practice tomorrow to keep it going!",
          });
        }
      } else {
        const lastActivityDate = new Date(existingStreak.last_activity);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isYesterday = lastActivityDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
        const isToday = lastActivityDate.toISOString().split('T')[0] === today;
        
        // Handle same-day repeat sessions - don't update streak
        if (isToday) {
          console.log('Same-day practice session - streak unchanged');
          return;
        }
        
        // Handle missed days (streak resets) or consecutive days
        const newStreakCount = isYesterday ? existingStreak.streak_count + 1 : 1;
        
        const { error: updateError } = await supabase
          .from('user_streaks')
          .update({
            streak_count: newStreakCount,
            last_activity: today
          })
          .eq('user_id', user.id);
          
        if (updateError) {
          console.error('Error updating streak:', updateError);
        } else {
          setStreakCount(newStreakCount);
          
          if (newStreakCount === 1 && !isYesterday) {
            toast({
              title: "Streak reset",
              description: "Your streak has been reset. Start practicing daily to build it back up!",
            });
          } else if (newStreakCount > 1) {
            toast({
              title: `${newStreakCount}-day streak!`,
              description: "You're building great practice habits. Keep it up!",
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to update streak:', err);
    }
  };
  
  const resetPractice = () => {
    setIsRecording(false);
    setShowFeedback(false);
  };
  
  const handleTourComplete = () => {
    localStorage.setItem('hasSeenPracticeTour', 'true');
    trackEvent('practice_tour_completed');
  };
  
  const handleFeedbackSubmitted = (wasHelpful: boolean) => {
    console.log('Practice session feedback:', wasHelpful ? 'helpful' : 'not helpful');
    
    if (wasHelpful) {
      toast({
        title: "Great!",
        description: "We'll keep refining your practice experience.",
        variant: "default",
      });
    } else {
      toast({
        title: "Thanks for your feedback",
        description: "We'll work on improving your practice sessions.",
        variant: "default",
      });
    }
  };
  
  const handleSaveFeedback = () => {
    if (!user) {
      toast({
        title: "Sign up to save",
        description: "Create a free account to save feedback",
      });
      navigate('/signup');
      return;
    }
    
    // Save feedback logic for authenticated users
    toast({
      title: "Feedback saved!",
      description: "Your practice session has been saved to your dashboard.",
    });
  };

  const handleViewFeedback = () => {
    setShowFeedback(true);
    setShowProgressSummary(true);
    trackEvent('ai_feedback_viewed');
    
    // Track badge earned
    trackEvent('badge_earned', { 
      badge: 'First Pitch',
      context: 'practice_session'
    });
  };

  const StatDisplay = ({ stat }: { stat: typeof mockStats[0] }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-sm text-brand-dark/70 mb-1">{stat.label}</p>
      <div className="flex items-center justify-center gap-2">
        <div className="text-2xl font-bold text-brand-dark">{stat.value}%</div>
        <div className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
          stat.increase 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {stat.increase ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {Math.abs(stat.change)}%
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Practice Tour */}
      <GuidedTour
        steps={tourSteps}
        run={showTour}
        onComplete={handleTourComplete}
      />
      
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-brand-dark">Practice Your Pitch</h1>
                  {streakCount > 0 && <StreakBadge streakCount={streakCount} />}
                </div>
                <p className="text-brand-dark/70 mb-4">Choose a scenario or upload your script to start practicing and get instant AI feedback.</p>
              </div>
              <Button variant="outline" onClick={resetPractice} className="flex items-center gap-2">
                <RefreshCcw size={16} />
                New Session
              </Button>
            </div>
            
            {!localStorage.getItem('hasSeenPracticeTour') && (
              <div className="mb-8">
                <QuickStartGuide onStartTour={() => setShowTour(true)} />
              </div>
            )}
            
            <Card className="mb-8 practice-scenario">
              <CardContent className="p-8">
                <div className="text-center">
                  <h2 className="text-xl font-medium mb-6">Product Demo Pitch</h2>
                  
                  {!showFeedback ? (
                    <div className="space-y-8">
                      <p className="text-brand-dark/70 max-w-lg mx-auto">
                        Demonstrate your product's key features and benefits in a clear, engaging 2-3 minute pitch.
                      </p>
                      
                      <div className="flex justify-center record-button">
                        <Button
                          className={`rounded-full h-20 w-20 group ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-green hover:bg-brand-green/90'}`}
                          onClick={toggleRecording}
                          aria-label={isRecording ? "Stop recording your pitch" : "Start recording your pitch"}
                          aria-pressed={isRecording}
                        >
                          {isRecording ? (
                            <MicOff size={32} />
                          ) : (
                            <Mic size={32} />
                          )}
                        </Button>
                      </div>
                      
                      {isRecording && (
                        <div className="animate-pulse text-red-500 font-medium" aria-live="polite">
                          Recording...
                        </div>
                      )}
                      
                      <div className="flex justify-center gap-4 playback-controls">
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-2 group" 
                          aria-label="Play example pitch"
                        >
                          <Play size={16} />
                          Example
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-2 group" 
                          aria-label="Pause current recording"
                          aria-pressed={false}
                        >
                          <Pause size={16} />
                          Pause
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="bg-brand-blue/20 rounded-xl p-6 text-left" aria-live="polite">
                        <h3 className="font-medium text-lg mb-4 text-brand-dark">AI Feedback</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-brand-dark mb-2">Strengths</h4>
                            <ul className="list-disc pl-5 space-y-1 text-brand-dark/70">
                              <li>Clear explanation of the product's core functionality</li>
                              <li>Good enthusiasm and energy throughout the pitch</li>
                              <li>Strong closing statement with clear call-to-action</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-brand-dark mb-2">Areas for Improvement</h4>
                            <ul className="list-disc pl-5 space-y-1 text-brand-dark/70">
                              <li>Speaking pace was 15% too fast in the technical section</li>
                              <li>Consider adding more specific customer examples</li>
                              <li>The value proposition could be stated earlier in the pitch</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center" aria-live="polite">
                        {mockStats.map((stat, index) => (
                          <StatDisplay key={index} stat={stat} />
                        ))}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button className="btn-primary bg-brand-green hover:bg-brand-green/90 group" onClick={resetPractice}>
                          Try Again
                        </Button>
                        <Button variant="outline" onClick={handleSaveFeedback} className="group">
                          Save Feedback
                        </Button>
                        <Button 
                          onClick={() => navigate('/roleplay')}
                          className="bg-brand-blue hover:bg-brand-blue/90 text-white group flex items-center gap-2"
                        >
                          <TrendingUp size={16} />
                          Continue to Roleplay
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Add feedback prompt before the tips section */}
            <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-300 rounded-lg">
              <FeedbackPrompt 
                feedbackType="practice"
                onFeedbackSubmitted={handleFeedbackSubmitted}
              />
            </div>
            
            <Card className="tips-section">
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-4 text-brand-dark">Tips for this scenario</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="text-brand-green font-bold">•</div>
                    <p className="text-brand-dark/70">Start with a compelling problem statement that resonates with your audience</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="text-brand-green font-bold">•</div>
                    <p className="text-brand-dark/70">Limit your pitch to 2-3 key benefits rather than listing all features</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="text-brand-green font-bold">•</div>
                    <p className="text-brand-dark/70">Include a specific success metric or case study to build credibility</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="text-brand-green font-bold">•</div>
                    <p className="text-brand-dark/70">End with a clear, low-friction next step for your prospect</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Premium Modal */}
      <PremiumModal 
        open={showPremiumModal} 
        onOpenChange={setShowPremiumModal} 
        featureName="voice practice"
      />
      
      {/* Progress Summary Dialog */}
      <Dialog open={showProgressSummary} onOpenChange={setShowProgressSummary}>
        <DialogContent className="sm:max-w-2xl">
          <ProgressSummary
            sessionName="Product Demo Pitch"
            stats={mockStats}
            feedback={mockFeedback}
            earnedBadges={mockEarnedBadges}
            nextMilestone={mockNextMilestone}
            onClose={() => setShowProgressSummary(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Practice;
