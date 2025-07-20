
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Play, Square, RotateCcw, Zap, Trophy, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { trackEvent } from '@/utils/analytics';
import { Helmet } from 'react-helmet-async';

const Practice = () => {
  const { user, creditsRemaining, deductUserCredits } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [streakCount, setStreakCount] = useState(0);

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
    console.log('🔵 Start Recording clicked!', { creditsRemaining, user: !!user });
    
    if (creditsRemaining < 1) {
      console.log('🔴 Insufficient credits:', creditsRemaining);
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to analyze a pitch.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🟢 Starting recording...');
      setIsRecording(true);
      trackEvent('practice_recording_started');
      
      // Mock recording logic
      setTimeout(() => {
        console.log('🟡 Recording timeout complete, stopping...');
        setIsRecording(false);
        handleAnalyzePitch();
      }, 3000);
      
    } catch (error) {
      console.error('🔴 Recording error:', error);
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
    trackEvent('practice_reset');
  };

  return (
    <ResponsiveLayout>
      <Helmet>
        <title>Practice Your Pitch - PitchPerfect AI</title>
        <meta name="description" content="Practice your sales pitch with AI-powered feedback and analysis." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Practice Your Pitch</h1>
          <p className="text-brand-dark/70">
            Record your sales pitch and get instant AI-powered feedback to improve your delivery.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center">
              <Zap className="h-8 w-8 text-brand-green mr-3" />
              <div>
                <p className="text-sm text-brand-dark/70">Credits Remaining</p>
                <p className="text-2xl font-bold text-brand-dark">{creditsRemaining}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center">
              <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-brand-dark/70">Current Streak</p>
                <p className="text-2xl font-bold text-brand-dark">{streakCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center">
              <Target className="h-8 w-8 text-brand-blue mr-3" />
              <div>
                <p className="text-sm text-brand-dark/70">Best Score</p>
                <p className="text-2xl font-bold text-brand-dark">{score || '--'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recording Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2" />
              Record Your Pitch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              {!analysisComplete ? (
                <>
                  <div className="flex justify-center">
                    {!isRecording ? (
                      <Button 
                        onClick={handleStartRecording}
                        size="lg"
                        className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-4 text-lg"
                        disabled={creditsRemaining < 1}
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleStopRecording}
                        size="lg"
                        variant="destructive"
                        className="px-8 py-4 text-lg"
                      >
                        <Square className="h-5 w-5 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                  </div>

                  {isRecording && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-brand-dark">Recording in progress...</span>
                    </div>
                  )}

                  {creditsRemaining < 1 && (
                    <p className="text-red-600 text-sm">
                      You need at least 1 credit to analyze a pitch. Please purchase more credits to continue.
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Analysis Complete!
                  </Badge>
                  
                  <Button onClick={resetPractice} className="bg-brand-blue hover:bg-brand-blue/90">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Practice Again
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {analysisComplete && (
          <div className="space-y-6">
            {/* Score */}
            {score && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-brand-green mb-2">{score}/100</div>
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
