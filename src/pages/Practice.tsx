
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Play, Square, RotateCcw, Zap, Trophy, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { trackEvent } from '@/utils/analytics';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { MetaTags } from '@/components/shared/MetaTags';
import { EnhancedButton } from '@/components/ui/enhanced-button';

const Practice = () => {
  const { user, creditsRemaining, deductUserCredits } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  const progressSteps = [
    { id: 'setup', title: 'Setup Practice', description: 'Choose your scenario' },
    { id: 'record', title: 'Record Pitch', description: 'Practice your delivery' },
    { id: 'analyze', title: 'Get Analysis', description: 'Review AI feedback' }
  ];

  // Mock streak data since user_streaks table doesn't exist
  useEffect(() => {
    if (user?.id) {
      // Use a simple localStorage-based streak for now
      const storedStreak = localStorage.getItem(`streak_${user.id}`);
      if (storedStreak) {
        setStreakCount(parseInt(storedStreak, 10));
      }
    }
  }, [user?.id]);

  const handleStartRecording = async () => {
    if (creditsRemaining < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to analyze a pitch.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRecording(true);
      setCurrentStep(2);
      trackEvent('practice_recording_started');
      
      // Mock recording logic
      setTimeout(() => {
        setIsRecording(false);
        handleAnalyzePitch();
      }, 3000);
      
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    handleAnalyzePitch();
  };

  const handleAnalyzePitch = async () => {
    if (!user?.id) return;

    try {
      setCurrentStep(3);
      
      // Deduct credits for analysis
      const success = await deductUserCredits('pitch_analysis', 1);
      
      if (!success) {
        toast({
          title: "Credit Deduction Failed",
          description: "Unable to process payment for analysis.",
          variant: "destructive",
        });
        return;
      }

      // Mock analysis results
      const mockTranscript = "Thank you for considering our product. Our solution helps businesses increase efficiency by 40% while reducing operational costs. We've worked with companies similar to yours and consistently delivered measurable results.";
      const mockFeedback = "Great use of specific metrics! Consider adding more emotional connection and addressing potential objections earlier in your pitch.";
      const mockScore = Math.floor(Math.random() * 30) + 70; // Random score between 70-100

      setTranscript(mockTranscript);
      setFeedback(mockFeedback);
      setScore(mockScore);
      setAnalysisComplete(true);

      // Update streak if score is good
      if (mockScore >= 80) {
        const newStreak = streakCount + 1;
        setStreakCount(newStreak);
        if (user?.id) {
          localStorage.setItem(`streak_${user.id}`, newStreak.toString());
        }
      }

      trackEvent('practice_analysis_complete', {
        score: mockScore,
        credits_used: 1
      });

      toast({
        title: "Analysis Complete!",
        description: `Your pitch scored ${mockScore}/100`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze your pitch. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetPractice = () => {
    setAnalysisComplete(false);
    setTranscript('');
    setFeedback('');
    setScore(null);
    setCurrentStep(1);
    trackEvent('practice_reset');
  };

  return (
    <ResponsiveLayout>
      <MetaTags
        title="Practice Your Pitch - PitchPerfect AI"
        description="Practice your sales pitch with AI-powered feedback and analysis. Improve your delivery, pacing, and effectiveness."
        keywords="sales pitch practice, AI feedback, pitch analysis, sales training, objection handling, roleplay training"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Practice Your Pitch</h1>
          <p className="text-brand-dark/70">
            Record your sales pitch and get instant AI-powered feedback to improve your delivery.
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator 
          steps={progressSteps} 
          currentStep={currentStep} 
          className="mb-8"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center">
              <Zap className="h-8 w-8 text-brand-green mr-3" aria-hidden="true" />
              <div>
                <p className="text-sm text-brand-dark/70">Credits Remaining</p>
                <p className="text-2xl font-bold text-brand-dark" aria-label={`${creditsRemaining} credits remaining`}>{creditsRemaining}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center">
              <Trophy className="h-8 w-8 text-yellow-500 mr-3" aria-hidden="true" />
              <div>
                <p className="text-sm text-brand-dark/70">Current Streak</p>
                <p className="text-2xl font-bold text-brand-dark" aria-label={`${streakCount} day practice streak`}>{streakCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center">
              <Target className="h-8 w-8 text-brand-blue mr-3" aria-hidden="true" />
              <div>
                <p className="text-sm text-brand-dark/70">Best Score</p>
                <p className="text-2xl font-bold text-brand-dark" aria-label={`Best score: ${score || 'No score yet'}`}>{score || '--'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recording Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2" aria-hidden="true" />
              Record Your Pitch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              {!analysisComplete ? (
                <>
                  <div className="flex justify-center">
                    {!isRecording ? (
                      <EnhancedButton 
                        onClick={handleStartRecording}
                        size="lg"
                        enhanced={true}
                        disabled={creditsRemaining < 1}
                        icon={Play}
                        className="px-8 py-4 text-lg"
                        aria-label="Start recording your sales pitch"
                      >
                        Start Recording
                      </EnhancedButton>
                    ) : (
                      <EnhancedButton 
                        onClick={handleStopRecording}
                        size="lg"
                        variant="secondary"
                        icon={Square}
                        className="px-8 py-4 text-lg bg-red-500 hover:bg-red-600 text-white"
                        aria-label="Stop recording your sales pitch"
                      >
                        Stop Recording
                      </EnhancedButton>
                    )}
                  </div>

                  {isRecording && (
                    <div className="flex items-center justify-center space-x-2" role="status" aria-live="polite">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" aria-hidden="true"></div>
                      <span className="text-brand-dark">Recording in progress...</span>
                    </div>
                  )}

                  {creditsRemaining < 1 && (
                    <div className="text-red-600 text-sm" role="alert">
                      You need at least 1 credit to analyze a pitch. Please purchase more credits to continue.
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Analysis Complete!
                  </Badge>
                  
                  <EnhancedButton 
                    onClick={resetPractice} 
                    icon={RotateCcw}
                    className="bg-brand-blue hover:bg-brand-blue/90"
                    aria-label="Start a new practice session"
                  >
                    Practice Again
                  </EnhancedButton>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {analysisComplete && (
          <div className="space-y-6" role="region" aria-label="Practice results">
            {/* Score */}
            {score && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-brand-green mb-2" aria-label={`Your score is ${score} out of 100`}>{score}/100</div>
                    <p className="text-brand-dark/70">
                      {score >= 90 ? 'Excellent!' : 
                       score >= 80 ? 'Great job!' : 
                       score >= 70 ? 'Good work!' : 'Keep practicing!'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transcript */}
            {transcript && (
              <Card>
                <CardHeader>
                  <CardTitle>Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-brand-dark/80 leading-relaxed">{transcript}</p>
                </CardContent>
              </Card>
            )}

            {/* Feedback */}
            {feedback && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-brand-dark/80 leading-relaxed">{feedback}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
};

export default Practice;
