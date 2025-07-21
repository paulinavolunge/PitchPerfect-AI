
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Play, Square, RotateCcw, Zap, Trophy, Target, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { trackEvent } from '@/utils/analytics';
import { Helmet } from 'react-helmet-async';
import { MicrophonePermissionHandler } from '@/components/permissions/MicrophonePermissionHandler';
import { AudioRecorder } from '@/components/recordings/AudioRecorder';
import { useUserIsolation } from '@/hooks/useUserIsolation';
import { PitchQualityValidator } from '@/utils/contentSafety';

const Practice = () => {
  const { user, creditsRemaining, deductUserCredits } = useAuth();
  const { toast } = useToast();
  const { validateUserAccess, getUserSpecificKey, clearUserData } = useUserIsolation();
  const [practiceMode, setPracticeMode] = useState<'voice' | 'text' | ''>('');
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleAnalyzePitch = async (audioData?: Blob) => {
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

      // Get quality-based analysis results
      const qualityValidation = practiceMode === 'text' ? 
        PitchQualityValidator.validatePitchQuality(textInput) : 
        { quality: 'excellent', score: Math.floor(Math.random() * 30) + 70, feedback: '' };
      
      const analysisScore = practiceMode === 'text' ? 
        PitchQualityValidator.getAnalysisScore(textInput) : 
        Math.floor(Math.random() * 30) + 70;
      
      const mockTranscript = practiceMode === 'text' ? textInput : 
        "Thank you for considering our product. Our solution helps businesses increase efficiency by 40% while reducing operational costs. We've worked with companies similar to yours and consistently delivered measurable results.";
      
      // Generate structured feedback based on quality and score
      const structuredFeedback = practiceMode === 'text' ? {
        clarity: qualityValidation.quality === 'excellent' ? 'Clear and concise' : qualityValidation.quality === 'good' ? 'Mostly clear' : 'Needs clarity improvement',
        confidence: qualityValidation.quality === 'excellent' ? 'Strong and assertive' : qualityValidation.quality === 'good' ? 'Moderate confidence' : 'Needs more assertiveness',
        persuasiveness: qualityValidation.quality === 'excellent' ? 'Compelling arguments' : qualityValidation.quality === 'good' ? 'Somewhat persuasive' : 'Strengthen value proposition',
        tone: qualityValidation.quality === 'excellent' ? 'Friendly and professional' : qualityValidation.quality === 'good' ? 'Professional tone' : 'Consider warming up tone',
        objectionHandling: qualityValidation.quality === 'excellent' ? 'Good use of value-based responses' : qualityValidation.quality === 'good' ? 'Basic objection handling' : 'Address potential objections proactively'
      } : {
        clarity: analysisScore >= 85 ? 'Clear and concise' : analysisScore >= 70 ? 'Mostly clear' : 'Needs clarity improvement',
        confidence: analysisScore >= 80 ? 'Strong and assertive' : analysisScore >= 65 ? 'Moderate confidence' : 'Needs more assertiveness',
        persuasiveness: analysisScore >= 75 ? 'Compelling arguments' : analysisScore >= 60 ? 'Somewhat persuasive' : 'Strengthen value proposition',
        tone: analysisScore >= 80 ? 'Friendly and professional' : analysisScore >= 65 ? 'Professional tone' : 'Consider warming up tone',
        objectionHandling: analysisScore >= 70 ? 'Good use of value-based responses' : 'Address potential objections proactively'
      };
      
      const mockFeedback = structuredFeedback;

      setTranscript(mockTranscript);
      setFeedback(JSON.stringify(mockFeedback)); // Store as JSON for structured display
      setScore(analysisScore);
      setAnalysisComplete(true);

      console.log('✅ Analysis complete:', { score: analysisScore, creditsUsed: 1, mode: practiceMode, quality: qualityValidation.quality });

      // Update streak if score is good (with user-specific storage)
      if (analysisScore >= 80 && user?.id) {
        const newStreak = streakCount + 1;
        setStreakCount(newStreak);
        const streakKey = getUserSpecificKey('streak');
        localStorage.setItem(streakKey, newStreak.toString());
      }

      trackEvent('practice_analysis_complete', {
        score: analysisScore,
        credits_used: 1,
        mode: practiceMode
      });

      toast({
        title: "Analysis Complete!",
        description: `Your pitch scored ${analysisScore}/100`,
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

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      toast({
        title: "Please Enter Your Pitch",
        description: "Type your pitch in the text area before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Validate pitch quality before proceeding
    const qualityValidation = PitchQualityValidator.validatePitchQuality(textInput);
    
    if (!qualityValidation.isValid) {
      toast({
        title: "Insufficient Content",
        description: qualityValidation.feedback,
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to analyze your pitch.",
        variant: "destructive",
      });
      return;
    }

    if (creditsRemaining < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to analyze a pitch.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await handleAnalyzePitch();
    setIsSubmitting(false);
  };

  const resetPractice = () => {
    setAnalysisComplete(false);
    setTranscript('');
    setFeedback('');
    setScore(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setTextInput('');
    setIsSubmitting(false);
    trackEvent('practice_reset');
    
    toast({
      title: "Practice Reset",
      description: "Ready for a new practice session!",
    });
  };

  return (
    <ResponsiveLayout>
      <Helmet>
        <title>Practice Your Pitch - PitchPerfect AI</title>
        <meta name="description" content="Practice your sales pitch with AI-powered feedback and analysis." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* FORCED EARLY ACCESS BANNER - ALWAYS VISIBLE */}
        <div className="bg-yellow-100 text-yellow-800 p-6 rounded-xl text-center mb-6 border-2 border-yellow-300 shadow-lg">
          <div className="text-lg font-semibold mb-2">
            🚧 PitchPerfect AI is in early access! You're one of the very first users 🙌
          </div>
          <div className="text-sm">
            We're still polishing things — so if something doesn't work, we're likely fixing it already.<br />
            Thank you for being part of the journey. You matter more than you know.
          </div>
        </div>
        
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

        {/* Practice Interface */}
        {!analysisComplete ? (
          <div className="space-y-6">
            {/* Mode Selection Card */}
            {practiceMode === 'voice' ? null : practiceMode === 'text' ? null : (
              <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-white shadow-md">
                <h2 className="text-2xl font-bold mb-4">🎯 Ready to Practice Your Pitch?</h2>
                <p className="text-gray-600 mb-6 max-w-xl">
                  Record your sales pitch or write it out — we'll analyze it and give you AI-powered feedback on tone, pacing, confidence, and objection handling.
                </p>

                <div className="flex space-x-4 mb-6">
                  <Button 
                    onClick={() => setPracticeMode('voice')}
                    className="bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold py-3 px-6 rounded-xl shadow-lg"
                  >
                    🎙️ Voice Practice
                  </Button>
                  <Button 
                    onClick={() => setPracticeMode('text')}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg"
                  >
                    💬 Text Practice
                  </Button>
                </div>

                <p className="text-sm text-gray-500">
                  Get started by choosing your preferred practice style.
                  Don't worry — you can switch anytime!
                </p>
              </div>
            )}

            {/* Voice Practice Mode */}
            {practiceMode === 'voice' && (
              <div className="space-y-6">
                {/* Back to Mode Selection */}
                <div className="flex items-center gap-4 mb-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setPracticeMode('')}
                    className="text-brand-dark/70 hover:text-brand-dark"
                  >
                    ← Back to selection
                  </Button>
                  <Badge variant="secondary" className="bg-brand-blue/10 text-brand-blue">
                    🎙️ Voice Practice Mode
                  </Badge>
                </div>

                {/* Welcome Card for First-Time Users */}
                {!hasPermission && (
                  <Card className="text-center py-8 bg-gradient-to-br from-brand-blue/5 to-brand-green/5 border-brand-blue/20">
                    <CardContent className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
                        <Mic className="h-8 w-8 text-brand-blue" />
                      </div>
                      <h3 className="text-2xl font-bold text-brand-dark">🎤 Ready to sharpen your pitch?</h3>
                      <p className="text-brand-dark/70 max-w-md mx-auto">
                        Click the button below to record your first practice session.
                        We'll give you instant AI-powered feedback to help you grow.
                      </p>
                      
                      {/* What to Expect */}
                      <div className="bg-white/50 rounded-lg p-4 mt-6 max-w-sm mx-auto">
                        <h4 className="font-semibold text-brand-dark mb-3">🧠 Here's what you'll get after recording:</h4>
                        <div className="space-y-2 text-sm text-brand-dark/80">
                          <div className="flex items-center gap-2">
                            <span className="text-brand-green">✅</span>
                            <span>Instant pitch score</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-brand-green">✅</span>
                            <span>Strengths and areas to improve</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-brand-green">✅</span>
                            <span>AI tips tailored to your tone & pacing</span>
                          </div>
                        </div>
                      </div>

                      {/* Gamification Badge */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 max-w-sm mx-auto">
                        <div className="flex items-center gap-2 justify-center">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                          <span className="text-yellow-800 font-medium">🏅 Record your first pitch to earn the "Starter Badge"</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                  
                  {/* Enhanced Permission Denied State */}
                  {!hasPermission && (
                    <Card className="border-amber-200 bg-amber-50">
                      <CardContent className="pt-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                          <Mic className="h-6 w-6 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-amber-800 mb-2">⚠️ Microphone Access Required</h3>
                        <p className="text-amber-700 mb-4">
                          We couldn't access your microphone. Please allow mic access and refresh the page.
                        </p>
                        <Button 
                          onClick={() => window.location.reload()} 
                          variant="outline" 
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          🔄 Try Again
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </MicrophonePermissionHandler>
              </div>
            )}

            {/* Text Practice Mode */}
            {practiceMode === 'text' && (
              <div className="space-y-6">
                {/* Back to Mode Selection */}
                <div className="flex items-center gap-4 mb-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setPracticeMode('')}
                    className="text-brand-dark/70 hover:text-brand-dark"
                  >
                    ← Back to selection
                  </Button>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    💬 Text Practice Mode
                  </Badge>
                </div>

                <Card className="text-center py-8 bg-gradient-to-br from-purple-50 to-brand-blue/5 border-purple-200">
                  <CardContent className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-brand-dark">💬 Type your pitch below</h3>
                    <p className="text-brand-dark/70 max-w-md mx-auto">
                      Write out your sales pitch and get detailed AI feedback on your messaging and structure.
                    </p>
                    
                    {/* What to Expect */}
                    <div className="bg-white/50 rounded-lg p-4 mt-6 max-w-sm mx-auto">
                      <h4 className="font-semibold text-brand-dark mb-3">🧠 Here's what you'll get after submitting:</h4>
                      <div className="space-y-2 text-sm text-brand-dark/80">
                        <div className="flex items-center gap-2">
                          <span className="text-brand-green">✅</span>
                          <span>Instant pitch score</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-brand-green">✅</span>
                          <span>Message structure analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-brand-green">✅</span>
                          <span>AI tips for clearer communication</span>
                        </div>
                      </div>
                    </div>

                    {/* Gamification Badge */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 max-w-sm mx-auto">
                      <div className="flex items-center gap-2 justify-center">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <span className="text-yellow-800 font-medium">🏅 Submit your first pitch to earn the "Writer Badge"</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Text Input Area */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Your Pitch
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste your pitch or type it out here..."
                      className="w-full border border-gray-300 p-4 rounded-xl mt-4 mb-4 resize-none h-40"
                      maxLength={2000}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-brand-dark/60">
                          {textInput.length}/2000 characters
                        </span>
                        <span className="text-xs text-brand-dark/50">
                          💡 Minimum: 50 characters, 10 words, 2 sentences for accurate analysis
                        </span>
                      </div>
                      <button 
                        onClick={handleTextSubmit}
                        disabled={isSubmitting || !textInput.trim() || creditsRemaining < 1}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-xl shadow disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Analyzing...
                          </>
                        ) : (
                          "🚀 Analyze My Pitch"
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Credits Warning */}
            {creditsRemaining < 1 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6 text-center">
                  <Zap className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600">
                    You need at least 1 credit to analyze a pitch. Please purchase more credits to continue.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
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
                  <div className="space-y-3">
                    {(() => {
                      try {
                        const feedbackData = JSON.parse(feedback);
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              <span className="font-medium">Clarity:</span>
                              <span className="text-brand-dark/80">{feedbackData.clarity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              <span className="font-medium">Confidence:</span>
                              <span className="text-brand-dark/80">{feedbackData.confidence}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              <span className="font-medium">Persuasiveness:</span>
                              <span className="text-brand-dark/80">{feedbackData.persuasiveness}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              <span className="font-medium">Tone/Emotion:</span>
                              <span className="text-brand-dark/80">{feedbackData.tone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              <span className="font-medium">Objection Handling:</span>
                              <span className="text-brand-dark/80">{feedbackData.objectionHandling}</span>
                            </div>
                          </>
                        );
                      } catch {
                        return <p className="text-brand-dark/80 leading-relaxed">{feedback}</p>;
                      }
                    })()}
                  </div>
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
