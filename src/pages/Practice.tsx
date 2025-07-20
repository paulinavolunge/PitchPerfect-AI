
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
import { MicrophonePermissionHandler } from '@/components/permissions/MicrophonePermissionHandler';
import { AudioRecorder } from '@/components/recordings/AudioRecorder';
import { useUserIsolation } from '@/hooks/useUserIsolation';

const Practice = () => {
  const { user, creditsRemaining, deductUserCredits } = useAuth();
  const { toast } = useToast();
  const { validateUserAccess, getUserSpecificKey, clearUserData } = useUserIsolation();
  const [isRecording, setIsRecording] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // User-specific streak data with proper isolation
  useEffect(() => {
    if (!validateUserAccess()) return;
    
    if (user?.id) {
      const streakKey = getUserSpecificKey('streak');
      const storedStreak = localStorage.getItem(streakKey);
      if (storedStreak) {
        setStreakCount(parseInt(storedStreak, 10));
      } else {
        setStreakCount(0);
      }
    } else {
      setStreakCount(0);
    }
  }, [user?.id, validateUserAccess, getUserSpecificKey]);

  const handlePermissionGranted = () => {
    console.log('🟢 Microphone permission granted');
    setHasPermission(true);
    toast({
      title: "Microphone Ready",
      description: "You can now record your pitch!",
    });
  };

  const handlePermissionDenied = () => {
    console.log('🔴 Microphone permission denied');
    setHasPermission(false);
    toast({
      title: "Microphone Access Required",
      description: "Please allow microphone access to record your pitch.",
      variant: "destructive",
    });
  };

  const handleRecordingComplete = async (audioBlob: Blob, audioUrl: string) => {
    console.log('🎵 Recording completed:', { size: audioBlob.size, url: audioUrl });
    
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to analyze your pitch.",
        variant: "destructive",
      });
      return;
    }

    if (creditsRemaining < 1) {
      console.log('🔴 Insufficient credits:', creditsRemaining);
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to analyze a pitch.",
        variant: "destructive",
      });
      return;
    }

    setAudioBlob(audioBlob);
    setAudioUrl(audioUrl);
    await handleAnalyzePitch(audioBlob);
  };

  const handleAnalyzePitch = async (audioData: Blob) => {
    if (!user?.id) return;

    try {
      console.log('🔍 Starting pitch analysis...');
      
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

      // Mock analysis results (in a real app, you'd send audioData to your analysis service)
      const mockTranscript = "Thank you for considering our product. Our solution helps businesses increase efficiency by 40% while reducing operational costs. We've worked with companies similar to yours and consistently delivered measurable results.";
      const mockFeedback = "Great use of specific metrics! Consider adding more emotional connection and addressing potential objections earlier in your pitch.";
      const mockScore = Math.floor(Math.random() * 30) + 70; // Random score between 70-100

      setTranscript(mockTranscript);
      setFeedback(mockFeedback);
      setScore(mockScore);
      setAnalysisComplete(true);

      console.log('✅ Analysis complete:', { score: mockScore, creditsUsed: 1 });

      // Update streak if score is good (with user-specific storage)
      if (mockScore >= 80 && user?.id) {
        const newStreak = streakCount + 1;
        setStreakCount(newStreak);
        const streakKey = getUserSpecificKey('streak');
        localStorage.setItem(streakKey, newStreak.toString());
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
      console.error('❌ Analysis error:', error);
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
    setAudioBlob(null);
    setAudioUrl(null);
    trackEvent('practice_reset');
    
    toast({
      title: "Practice Reset",
      description: "Ready for a new recording session!",
    });
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
        {!analysisComplete ? (
          <MicrophonePermissionHandler
            onPermissionGranted={handlePermissionGranted}
            onPermissionDenied={handlePermissionDenied}
          >
            {hasPermission && (
              <AudioRecorder
                maxDuration={180}
                onRecordingComplete={handleRecordingComplete}
                className="mb-8"
              />
            )}
            
            {creditsRemaining < 1 && (
              <Card className="mb-8 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-600 text-center">
                    You need at least 1 credit to analyze a pitch. Please purchase more credits to continue.
                  </p>
                </CardContent>
              </Card>
            )}
          </MicrophonePermissionHandler>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Badge variant="secondary" className="text-lg px-4 py-2 mr-4">
                  Analysis Complete!
                </Badge>
                <Button onClick={resetPractice} className="bg-brand-blue hover:bg-brand-blue/90">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Practice Again
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>
        )}

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

            {/* Playback */}
            {audioUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Recording</CardTitle>
                </CardHeader>
                <CardContent>
                  <audio
                    controls
                    src={audioUrl}
                    className="w-full"
                    aria-label="Your recorded pitch"
                  />
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
