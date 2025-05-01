
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoSandbox from '@/components/demo/DemoSandbox';
import WaitlistModal from '@/components/demo/WaitlistModal';
import { sendSessionToCRM } from '@/utils/webhookUtils';
import { toast } from '@/hooks/use-toast';

const Demo = () => {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  
  const handleDemoComplete = (data?: any) => {
    // Save session data
    if (data) {
      setSessionData(data);
    }
    
    // Show the waitlist modal
    setShowWaitlistModal(true);
    
    // Then send the data to CRM via Zapier webhook
    if (data) {
      sendSessionToCRM(data)
        .then(webhookResult => {
          // Show appropriate toast
          if (webhookResult.success) {
            toast({
              title: "Session Recorded",
              description: "Your session data was saved",
              variant: "default",
            });
          } else {
            console.warn("CRM push failed:", webhookResult.message);
            // No toast for failure in production to avoid confusing users
          }
        });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h1 className="text-2xl font-bold text-brand-dark mb-4">Try PitchPerfect AI</h1>
              <p className="text-brand-dark/80 mb-6">
                Experience how PitchPerfect AI helps you improve your sales pitch. 
                Talk about overcoming pricing objections for 60 seconds, and get instant feedback.
              </p>
              
              <DemoSandbox onComplete={handleDemoComplete} />
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <WaitlistModal 
        open={showWaitlistModal} 
        onOpenChange={setShowWaitlistModal}
        sessionData={sessionData}
      />
    </div>
  );
};

export default Demo;
