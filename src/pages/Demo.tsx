
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoSandbox from '@/components/demo/DemoSandbox';
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
import { useNavigate } from 'react-router-dom';

const Demo = () => {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [crmProvider, setCrmProvider] = useState<CRMProvider>("zapier");
  const { isGuestMode } = useGuestMode();
  const navigate = useNavigate();
  
  const handleDemoComplete = (data?: any) => {
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

  const handleTryMoreFeatures = () => {
    navigate('/roleplay');
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
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
                <h1 className="text-2xl font-bold text-brand-dark">Try PitchPerfect AI</h1>
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
                Talk about overcoming pricing objections for 60 seconds, and get instant feedback.
              </p>
              
              <MicrophoneGuard>
                <DemoSandbox onComplete={handleDemoComplete} />
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
  );
};

export default Demo;
