
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
import { Settings, UserPlus } from 'lucide-react';
import MicrophoneGuard from '@/components/MicrophoneGuard';
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

  const handleObjectionSubmit = async (input: { type: 'voice' | 'text'; data: Blob | string }) => {
    console.log('Objection practice submission:', input);
    
    // For demo purposes, we'll deduct credits if user is authenticated
    if (!isGuestMode && user) {
      const creditsToDeduct = input.type === 'text' ? 1 : 2; // Voice costs more
      const featureType = `demo_objection_${input.type}`;
      
      const deducted = await deductUserCredits(featureType, creditsToDeduct);
      if (!deducted) {
        // Credit deduction failed, don't process the demo
        // The deductUserCredits function already shows appropriate toast
        return;
      }
    }
    
    // Process the submission and generate feedback
    const feedbackData = {
      type: input.type,
      response: input.type === 'text' ? input.data : 'Voice response processed',
      timestamp: new Date().toISOString(),
      feedback: "Good handling of the objection. Consider emphasizing value over cost.",
      score: Math.floor(Math.random() * 3) + 7 // Mock score 7-10
    };
    
    // Complete the demo with the feedback data
    handleDemoComplete(feedbackData);
    
    // Show completion toast (separate from credit usage toast)
    toast({
      title: "Response Analyzed",
      description: `Your ${input.type} response has been processed and feedback is ready.`,
      variant: "default",
      duration: 4000,
    });
  };

  const handleTryMoreFeatures = () => {
    navigate('/roleplay');
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
                
                <MicrophoneGuard>
                  <PracticeObjection
                    scenario={objectionScenario}
                    onSubmit={handleObjectionSubmit}
                  />
                </MicrophoneGuard>
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
