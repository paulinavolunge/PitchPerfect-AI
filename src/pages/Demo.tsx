
import React, { useState, useEffect, Suspense, lazy, startTransition } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import LazyLoadManager from '@/components/optimized/LazyLoadManager';
import { Skeleton } from '@/components/ui/skeleton';
import { sendSessionToCRM, CRMProvider } from '@/utils/webhookUtils';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Settings, UserPlus, RefreshCw } from 'lucide-react';
import MicrophoneGuard from '@/components/MicrophoneGuard';
import { supabase } from '@/integrations/supabase/client';
import AIDisclosure from '@/components/AIDisclosure';
import { useGuestMode } from '@/context/GuestModeContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Lazy load heavy demo components
const Footer = lazy(() => import('@/components/Footer'));
const DemoSandbox = lazy(() => import('@/components/demo/DemoSandbox'));
const PracticeObjection = lazy(() => import('@/components/demo/PracticeObjection'));
const WaitlistModal = lazy(() => import('@/components/demo/WaitlistModal'));
const GuestBanner = lazy(() => import('@/components/GuestBanner'));
const WebhookSettings = lazy(() => import('@/components/WebhookSettings'));
const DemoNavigation = lazy(() => import('@/components/demo/DemoNavigation'));

const Demo = () => {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [crmProvider, setCrmProvider] = useState<CRMProvider>("zapier");
  const [objectionScenario, setObjectionScenario] = useState("Your solution looks interesting, but honestly, it's priced higher than what we were expecting to pay. We have other options that cost less.");
  const [hasError, setHasError] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { isGuestMode } = useGuestMode();
  const { user, deductUserCredits } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Demo component mounted");
      console.log("Demo page loaded with objection scenario:", objectionScenario);
      console.log("Guest mode:", isGuestMode, "User:", user);
    }
  }, []);

  const handleDemoComplete = (data?: any) => {
    if (import.meta.env.DEV) {
      console.log("Demo completed with data:", data);
    }
    // Save session data
    if (data) {
      setSessionData(data);
    }

    // Only show the waitlist modal for non-guest users
    if (!isGuestMode) {
      startTransition(() => setShowWaitlistModal(true));
    }

    // Then send the data to CRM via webhook
    if (data) {
      sendSessionToCRM(data, crmProvider)
        .then(webhookResult => {
          // Show appropriate toast
          if (webhookResult.success) {
            toast({
              title: "Session Recorded",
              description: webhookResult.message,
              variant: "default",
            });
          } else {
            console.warn("CRM push failed:", webhookResult.message);
            // No toast for failure in production to avoid confusing users
          }
        });
    }
  };

  const savePracticeSession = async (practiceData: any) => {
    if (import.meta.env.DEV) {
      console.log('💾 savePracticeSession called with:', practiceData);
      console.log('👤 User:', user?.id, 'Guest mode:', isGuestMode);
    }

    if (!user?.id || isGuestMode) {
      if (import.meta.env.DEV) {
        console.log('❌ Skipping database save - guest mode or no user');
      }
      return;
    }

    try {
      const sessionData = {
        user_id: user.id,
        scenario_type: 'objection_handling',
        difficulty: 'beginner',
        industry: 'general',
        duration_seconds: 60, // Estimated practice duration
        score: practiceData.score,
        transcript: {
          input_type: practiceData.type,
          response_text: practiceData.response,
          feedback: practiceData.feedback
        },
        feedback_data: {
          score: practiceData.score,
          feedback: practiceData.feedback,
          type: practiceData.type,
          timestamp: practiceData.timestamp
        },
        completed_at: new Date().toISOString()
      };

      if (import.meta.env.DEV) {
        console.log('Saving practice session to database:', sessionData);
      }

      const { data, error } = await supabase
        .from('practice_sessions')
        .insert(sessionData)
        .select();

      if (error) {
        console.error('Error saving practice session:', error);
        toast({
          title: "Save Error",
          description: "Practice completed but couldn't save to your progress. Your credits were still used.",
          variant: "destructive",
        });
        return;
      }

      if (import.meta.env.DEV) {
        console.log('Practice session saved successfully:', data);
      }
      toast({
        title: "Progress Saved",
        description: "Your practice session has been saved to your dashboard!",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to save practice session:', error);
    }
  };

  const handleObjectionSubmit = async (input: { type: 'voice' | 'text'; data: Blob | string }) => {
    if (import.meta.env.DEV) {
      console.log('Objection practice submission:', input);
      console.log('Submission type:', input.type);
      console.log('Submission data:', input.data);
    }

    try {
      setHasError(false);

      // Show immediate feedback that we're processing
      toast({
        title: "Processing Response",
        description: `Analyzing your ${input.type} response...`,
        duration: 3000,
      });

      // Credits will be deducted AFTER successful AI response

      // Simulate AI processing with a more realistic delay
      if (import.meta.env.DEV) {
        console.log('Starting AI analysis simulation...');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call AI feedback service
      const responseText = typeof input.data === 'string' ? input.data : 'Voice response processed';

      let feedbackData;
      try {
        const { data, error } = await supabase.functions.invoke('demo-feedback', {
          body: {
            response: responseText,
            inputType: input.type
          }
        });

        if (import.meta.env.DEV) {
          console.log('API Response:', { data, error });
        }

        if (error) {
          console.error('Demo feedback API error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw new Error(error.message || 'Failed to get AI feedback');
        }

        feedbackData = {
          type: input.type,
          response: responseText,
          timestamp: new Date().toISOString(),
          feedback: data.feedback || generateFallbackFeedback(responseText),
          score: Math.floor(Math.random() * 3) + 7, // Still use random score for demo
          aiSuccess: !data.fallback // Track if this was from real AI
        };

        // Deduct credits AFTER successful AI response
        if (!isGuestMode && user && !data.fallback) {
          const creditsToDeduct = input.type === 'text' ? 1 : 2; // Voice costs more
          const featureType = `demo_objection_${input.type}`;

          if (import.meta.env.DEV) {
            console.log(`Deducting ${creditsToDeduct} credits for successful ${featureType}`);
          }

          const deducted = await deductUserCredits(featureType, creditsToDeduct);
          if (!deducted) {
            console.warn('Credit deduction failed after successful AI response');
            // Don't stop the flow - user already got the value
          }
        }

      } catch (error) {
        console.error('AI feedback failed, using fallback:', error);

        // Fallback to local feedback generation (no credit deduction for fallback)
        feedbackData = {
          type: input.type,
          response: responseText,
          timestamp: new Date().toISOString(),
          feedback: generateFallbackFeedback(responseText),
          score: Math.floor(Math.random() * 3) + 7, // Demo score 7-10
          aiSuccess: false // Mark as fallback
        };
      }

      if (import.meta.env.DEV) {
        console.log('Generated feedback data:', feedbackData);
      }

      setFeedback(feedbackData.feedback);

      // Save practice session to database for authenticated users
      await savePracticeSession(feedbackData);

      // NOTE: Removed handleDemoComplete call to prevent PDF modal from showing after first response
      // Users can practice multiple times without interruption

      // Show completion toast (separate from credit usage toast)
      toast({
        title: "Analysis Complete",
        description: `Your ${input.type} response has been analyzed and feedback is ready.`,
        variant: "default",
        duration: 4000,
      });

      if (import.meta.env.DEV) {
        console.log('Demo submission completed successfully');
      }

    } catch (error) {
      console.error('Error processing objection:', error);
      setHasError(true);
      toast({
        title: "Processing Error",
        description: "There was an issue analyzing your response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateFallbackFeedback = (response: string): string => {
    const lowerResponse = response.toLowerCase().trim();
    const wordCount = response.trim().split(/\s+/).length;

    // Handle very short responses (1-3 words)
    if (wordCount <= 3) {
      return `⚠️ <strong>Too brief!</strong> A pricing objection needs a real answer.<br/><br/>🎯 <strong>Try this instead:</strong><br/>"I understand price is key. Our solution cuts operational costs by 40% in Q1—that's $50K+ savings annually for companies like yours. Want to see the ROI breakdown for your specific situation?"`;
    }

    // Handle vague/unclear responses
    if (lowerResponse.match(/^(why not\?|ok|sure|maybe|fine|good|sounds good|nice)$/)) {
      return `❌ <strong>This doesn't address the objection.</strong> The customer needs concrete value, not vague responses.<br/><br/>💡 <strong>Say this instead:</strong><br/>"I appreciate your honesty about price. Here's why clients see this as investment, not cost: We save teams 15-20 hours weekly. That's $75K/year in productivity for your team size. Plus free implementation and dedicated support from day one. What matters more to you—time savings or cost reduction?"`;
    }

    // Positive keyword detection - value/ROI focus
    if (lowerResponse.includes('value') || lowerResponse.includes('roi')) {
      return "Excellent approach! You focused on value and ROI, which directly addresses pricing concerns. To make this even stronger, add specific numbers and a clear next step.\n\n**Example enhancement:**\n'Most clients see 3-5x ROI in the first year. For instance, one client in your industry reduced processing time by 60%, saving them $120K annually on a $40K investment. Would you be open to a 15-minute call where I can show you exactly how this would work for your team?'";
    }

    // Empathy-based responses
    if (lowerResponse.includes('understand') || lowerResponse.includes('budget')) {
      return `👏 <strong>Good empathy!</strong> You're building trust by acknowledging their concern.<br/><br/>💪 <strong>Now add this punch:</strong><br/>"Budget is always a factor—I get it. Our clients save 25-30% on current solutions within 6 months. We offer flexible payments too. If timing's the issue, let's start with a pilot at 50% cost. Work for this quarter?"`;
    }

    // Competitive positioning
    if (lowerResponse.includes('compare') || lowerResponse.includes('competition')) {
      return `🔥 <strong>Smart move</strong> addressing competitors head-on!<br/><br/>🚀 <strong>Differentiate like this:</strong><br/>"Yes, cheaper options exist. Here's why we're worth it: 2x faster implementation, 24/7 support, and 40% better results on average. Company X jumped from 12% to 19% conversion in 3 months after switching. The price difference paid for itself in Q1. What capabilities matter most to you?"`;
    }

    // Default fallback for moderate responses
    return `✅ <strong>Good start!</strong> Now let's make it irresistible.<br/><br/>🎯 <strong>Try this approach:</strong><br/>"I hear your price concern. Here's the truth: 250% ROI in year one. Recent client in your industry: $180K savings on $60K investment. We include free training, priority support, quarterly strategy reviews. Zero risk: 90-day value guarantee or full refund. Quick demo to see your specific impact?"`;
  };

  const handleTryMoreFeatures = () => {
    navigate('/roleplay');
  };

  const handleRetry = () => {
    if (import.meta.env.DEV) {
      console.log('Retrying demo...');
    }
    setHasError(false);
    setFeedback(null);
    setSessionData(null);
  };

  return (
    <>
      <Helmet>
        <title>Try PitchPerfect AI Demo | Free Sales Practice Session</title>
        <meta name="description" content="Experience PitchPerfect AI with our free interactive demo. Practice handling sales objections and get instant AI-powered feedback on your pitch delivery." />
        <meta name="keywords" content="sales demo, AI pitch practice, free trial, objection handling, sales training demo" />
        <meta property="og:title" content="Free PitchPerfect AI Demo - Try AI Sales Training" />
        <meta property="og:description" content="Test drive our AI-powered sales training platform. Practice objection handling and get instant feedback." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/demo`} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <Suspense fallback={<Skeleton className="h-16 w-full" />}>
          <DemoNavigation
            currentStep={1}
            totalSteps={3}
            showProgress={true}
            onHelp={() => console.log('Help requested')}
          />
        </Suspense>
        {isGuestMode && (
          <Suspense fallback={<Skeleton className="h-12 w-full" />}>
            <GuestBanner />
          </Suspense>
        )}
        <main className="flex-grow pt-24 pb-12 px-4 sm:px-6">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="max-w-4xl mx-auto">
              <AIDisclosure
                title="AI-Powered Demo"
                description="This demo features AI-generated feedback based on your speech. The analysis and suggestions are created by artificial intelligence and should be considered illustrative."
                className="mb-4 sm:mb-6"
              />

              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h1 className="text-xl sm:text-2xl font-bold text-brand-dark">Try PitchPerfect AI - Objection Handling Practice</h1>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startTransition(() => setShowWebhookSettings(true))}
                    className="flex items-center gap-1 min-h-[36px] self-start sm:self-auto"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">CRM Settings</span>
                  </Button>
                </div>
                <p className="text-brand-dark/80 mb-4 sm:mb-6 text-sm sm:text-base">
                  Experience how PitchPerfect AI helps you improve your sales pitch.
                  Practice handling pricing objections using either voice or text input, and get instant feedback.
                </p>

                {hasError ? (
                  <div className="text-center py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                      <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
                      <p className="text-red-600 mb-4">We encountered an issue processing your response. This could be a temporary problem.</p>
                      <Button onClick={handleRetry} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <MicrophoneGuard>
                    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                      <PracticeObjection
                        scenario={objectionScenario}
                        onSubmit={handleObjectionSubmit}
                      />
                    </Suspense>
                  </MicrophoneGuard>
                )}

                {feedback && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2 text-sm sm:text-base">AI Feedback</h3>
                    <div className="text-green-700 text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: feedback }} />
                  </div>
                )}
              </div>

              {isGuestMode && sessionData && (
                <div className="bg-brand-blue/10 rounded-lg p-4 sm:p-6 text-center mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-xl font-medium mb-2 text-brand-dark">Want to try more features?</h3>
                  <p className="text-brand-dark/70 mb-4 text-sm sm:text-base">
                    You're using PitchPerfect AI in guest mode. Try our role-playing feature or sign up to save your progress.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button
                      onClick={handleTryMoreFeatures}
                      className="bg-brand-blue hover:bg-brand-blue/90 min-h-[44px] w-full sm:w-auto"
                    >
                      Try Role-Playing
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/signup')}
                      className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
                    >
                      <UserPlus className="h-4 w-4" />
                      Sign Up Free
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <Footer />
        </Suspense>

        <Suspense fallback={null}>
          <WaitlistModal
            open={showWaitlistModal}
            onOpenChange={setShowWaitlistModal}
            sessionData={sessionData}
          />
        </Suspense>

        <Suspense fallback={null}>
          <WebhookSettings
            open={showWebhookSettings}
            onOpenChange={setShowWebhookSettings}
          />
        </Suspense>
      </div>
    </>
  );
};

export default Demo;
