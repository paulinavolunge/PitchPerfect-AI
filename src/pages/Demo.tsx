
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoSandbox from '@/components/demo/DemoSandbox';
import PracticeObjection from '@/components/demo/PracticeObjection';
import WaitlistModal from '@/components/demo/WaitlistModal';
import GuestBanner from '@/components/GuestBanner';
import WebhookSettings from '@/components/WebhookSettings';
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
import DemoNavigation from '@/components/demo/DemoNavigation';

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
    console.log("Demo component mounted");
    console.log("Demo page loaded with objection scenario:", objectionScenario);
    console.log("Guest mode:", isGuestMode, "User:", user);
  }, []);
  
  const handleDemoComplete = (data?: any) => {
    console.log("Demo completed with data:", data);
    // Save session data
    if (data) {
      setSessionData(data);
    }
    
    // Only show the waitlist modal for non-guest users
    if (!isGuestMode) {
      setShowWaitlistModal(true);
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
    console.log('💾 savePracticeSession called with:', practiceData);
    console.log('👤 User:', user?.id, 'Guest mode:', isGuestMode);
    
    if (!user?.id || isGuestMode) {
      console.log('❌ Skipping database save - guest mode or no user');
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

      console.log('Saving practice session to database:', sessionData);

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

      console.log('Practice session saved successfully:', data);
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
    console.log('Objection practice submission:', input);
    console.log('Submission type:', input.type);
    console.log('Submission data:', input.data);
    
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
      console.log('Starting AI analysis simulation...');
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

        if (error) {
          console.error('Demo feedback error:', error);
          throw new Error(error.message);
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
          
          console.log(`Deducting ${creditsToDeduct} credits for successful ${featureType}`);
          
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
      
      console.log('Generated feedback data:', feedbackData);
      
      setFeedback(feedbackData.feedback);
      
      // Save practice session to database for authenticated users
      await savePracticeSession(feedbackData);
      
      // Complete the demo with the feedback data
      handleDemoComplete(feedbackData);
      
      // Show completion toast (separate from credit usage toast)
      toast({
        title: "Analysis Complete",
        description: `Your ${input.type} response has been analyzed and feedback is ready.`,
        variant: "default",
        duration: 4000,
      });
      
      console.log('Demo submission completed successfully');
      
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
    // Generate more realistic feedback based on response content
    if (response.toLowerCase().includes('value') || response.toLowerCase().includes('roi')) {
      return "Excellent approach! You focused on value and ROI, which effectively addresses pricing concerns. Consider providing specific examples or metrics to strengthen your response further.";
    } else if (response.toLowerCase().includes('understand') || response.toLowerCase().includes('budget')) {
      return "Good empathetic approach. You acknowledged their budget concerns, which builds rapport. Try adding more concrete benefits and cost justification to overcome the objection.";
    } else if (response.toLowerCase().includes('compare') || response.toLowerCase().includes('competition')) {
      return "Smart strategy addressing the competitive landscape. Consider highlighting unique differentiators and long-term value proposition to justify the premium pricing.";
    } else {
      return "Good handling of the objection. Consider emphasizing value over cost and highlighting ROI to strengthen your response. Try to be more specific about benefits that justify the pricing.";
    }
  };

  const handleTryMoreFeatures = () => {
    navigate('/roleplay');
  };

  const handleRetry = () => {
    console.log('Retrying demo...');
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
        <DemoNavigation 
          currentStep={1}
          totalSteps={3}
          showProgress={true}
          onHelp={() => console.log('Help requested')}
        />
        {isGuestMode && <GuestBanner />}
        <main className="flex-grow pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <AIDisclosure 
                title="AI-Powered Demo"
                description="This demo features AI-generated feedback based on your speech. The analysis and suggestions are created by artificial intelligence and should be considered illustrative."
                className="mb-6"
              />
              
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-brand-dark">Try PitchPerfect AI - Objection Handling Practice</h1>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowWebhookSettings(true)}
                    className="flex items-center gap-1"
                  >
                    <Settings className="h-4 w-4" />
                    <span>CRM Settings</span>
                  </Button>
                </div>
                <p className="text-brand-dark/80 mb-6">
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
                    <PracticeObjection
                      scenario={objectionScenario}
                      onSubmit={handleObjectionSubmit}
                    />
                  </MicrophoneGuard>
                )}

                {feedback && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2">AI Feedback</h3>
                    <p className="text-green-700">{feedback}</p>
                  </div>
                )}
              </div>
              
              {isGuestMode && sessionData && (
                <div className="bg-brand-blue/10 rounded-lg p-6 text-center mb-8">
                  <h3 className="text-xl font-medium mb-2 text-brand-dark">Want to try more features?</h3>
                  <p className="text-brand-dark/70 mb-4">
                    You're using PitchPerfect AI in guest mode. Try our role-playing feature or sign up to save your progress.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button 
                      onClick={handleTryMoreFeatures}
                      className="bg-brand-blue hover:bg-brand-blue/90"
                    >
                      Try Role-Playing
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/signup')}
                      className="flex items-center gap-2"
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
        <Footer />

        <WaitlistModal 
          open={showWaitlistModal} 
          onOpenChange={setShowWaitlistModal}
          sessionData={sessionData}
        />
        
        <WebhookSettings
          open={showWebhookSettings}
          onOpenChange={setShowWebhookSettings}
        />
      </div>
    </>
  );
};

export default Demo;
