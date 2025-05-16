import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mic, MicOff, Pause, Play, RefreshCcw, Award } from 'lucide-react';
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

const Practice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showProgressSummary, setShowProgressSummary] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const { user, isPremium } = useAuth();
  const { toast } = useToast();

  // Mock data for progress summary
  const mockStats = [
    { label: "Clarity", value: 76, previousValue: 71, increase: true },
    { label: "Engagement", value: 82, previousValue: 74, increase: true },
    { label: "Pacing", value: 65, previousValue: 68, decrease: true }
  ];
  
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
    }
  }, [user, isPremium]);
  
  const fetchUserStreak = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('streak_count')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Not PGRST116 = not found
        console.error('Error fetching streak:', error);
        return;
      }
      
      if (data) {
        setStreakCount(data.streak_count);
      }
    } catch (err) {
      console.error('Failed to fetch streak:', err);
    }
  };
  
  const toggleRecording = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    if (isRecording) {
      setShowFeedback(true);
      setShowProgressSummary(true);
      updatePracticeStreak();
    }
    setIsRecording(!isRecording);
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
      
      if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
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
        // Check if streak should increment
        const lastActivityDate = new Date(existingStreak.last_activity);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isYesterday = lastActivityDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
        const isToday = lastActivityDate.toISOString().split('T')[0] === today;
        
        // Only update if last activity was yesterday (continue streak) or not today (don't duplicate)
        if (!isToday) {
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
            
            if (newStreakCount > 1) {
              toast({
                title: `${newStreakCount}-day streak!`,
                description: "You're building great practice habits. Keep it up!",
              });
            }
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
  };
  
  const handleFeedbackSubmitted = (wasHelpful: boolean) => {
    // In the future, you could adjust training algorithms based on user feedback
    console.log('Practice session feedback:', wasHelpful ? 'helpful' : 'not helpful');
    
    // You might want to update the UI based on feedback
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
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Practice Tour */}
      <GuidedTour
        steps={tourSteps}
        run={showTour}
        onComplete={handleTourComplete}
      />
      
      <main className="flex-grow pt-20 pb-12"> {/* Adjusted top padding */}
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
                          className={`rounded-full h-20 w-20 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-green hover:bg-brand-green/90'}`}
                          onClick={toggleRecording}
                          aria-label={isRecording ? "Stop recording" : "Start recording"}
                        >
                          {isRecording ? (
                            <MicOff size={32} />
                          ) : (
                            <Mic size={32} />
                          )}
                        </Button>
                      </div>
                      
                      {isRecording && (
                        <div className="animate-pulse text-red-500 font-medium">
                          Recording...
                        </div>
                      )}
                      
                      <div className="flex justify-center gap-4 playback-controls">
                        <Button variant="outline" className="flex items-center gap-2" aria-label="Play example">
                          <Play size={16} />
                          Example
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2" aria-label="Pause recording">
                          <Pause size={16} />
                          Pause
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="bg-brand-blue/20 rounded-xl p-6 text-left">
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
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-brand-dark/70 mb-1">Clarity</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-2xl font-bold text-brand-dark">76%</div>
                            <div className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">+5%</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-brand-dark/70 mb-1">Engagement</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-2xl font-bold text-brand-dark">82%</div>
                            <div className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">+8%</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-brand-dark/70 mb-1">Pacing</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-2xl font-bold text-brand-dark">65%</div>
                            <div className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">-3%</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center gap-4">
                        <Button className="btn-primary bg-brand-green hover:bg-brand-green/90" onClick={resetPractice}>
                          Try Again
                        </Button>
                        <Button variant="outline">
                          Save Feedback
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
