
import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type ConsentType = 'data_collection' | 'analytics' | 'microphone' | 'ai_improvement';

interface ConsentManagerProps {
  children: React.ReactNode;
}

const ConsentManager: React.FC<ConsentManagerProps> = ({ children }) => {
  const [showConsent, setShowConsent] = useState(false);
  const [consentType, setConsentType] = useState<ConsentType | null>(null);
  const [consentTitle, setConsentTitle] = useState('');
  const [consentDescription, setConsentDescription] = useState('');
  
  const consentSettings = {
    data_collection: {
      title: 'Data Collection Consent',
      description: 'We collect data about your practice sessions to provide personalized feedback and improve your experience. This includes recordings, transcripts, and performance metrics. You can withdraw consent at any time in your privacy settings.'
    },
    analytics: {
      title: 'Analytics Consent',
      description: 'We use analytics to understand how you use the app and improve our features. This data is anonymized and doesn\'t include personal information. You can withdraw consent at any time in your privacy settings.'
    },
    microphone: {
      title: 'Microphone Access',
      description: 'PitchPerfect AI needs access to your microphone to record your voice during practice sessions. Your recordings are encrypted and only used to provide feedback. You can delete recordings at any time.'
    },
    ai_improvement: {
      title: 'AI Improvement Data Sharing',
      description: 'Help us improve our AI by allowing us to use anonymized data from your sessions for training. No personally identifiable information is used. You can withdraw consent at any time in your privacy settings.'
    }
  };
  
  useEffect(() => {
    // Check which consents we need to ask for on first load
    const checkConsents = () => {
      if (localStorage.getItem('consentShown') === 'true') {
        return;
      }
      
      // If data collection consent hasn't been given yet, show that first
      if (localStorage.getItem('dataCollectionConsent') !== 'true') {
        showConsentDialog('data_collection');
        return;
      }
      
      // Then check analytics consent
      if (localStorage.getItem('analyticsConsent') !== 'true') {
        showConsentDialog('analytics');
        return;
      }
      
      // If we've shown all needed consents, mark as complete
      localStorage.setItem('consentShown', 'true');
    };
    
    // Wait a moment before showing consent to let the app load
    const timer = setTimeout(() => {
      checkConsents();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const showConsentDialog = (type: ConsentType) => {
    setConsentType(type);
    setConsentTitle(consentSettings[type].title);
    setConsentDescription(consentSettings[type].description);
    setShowConsent(true);
  };
  
  const handleAccept = () => {
    if (!consentType) return;
    
    // Save the consent in localStorage
    localStorage.setItem(`${consentType}Consent`, 'true');
    
    // Show feedback to user
    toast.success(`${consentSettings[consentType].title} accepted`);
    
    // Close dialog
    setShowConsent(false);
    setConsentType(null);
    
    // Check if there are more consents to show
    if (consentType === 'data_collection') {
      setTimeout(() => {
        showConsentDialog('analytics');
      }, 500);
    } else if (consentType === 'analytics') {
      localStorage.setItem('consentShown', 'true');
    }
  };
  
  const handleDecline = () => {
    if (!consentType) return;
    
    // Mark as declined in localStorage
    localStorage.setItem(`${consentType}Consent`, 'false');
    
    // For data_collection and analytics, we still need to show the next consent
    if (consentType === 'data_collection') {
      toast.info('You can change this setting anytime in your privacy preferences.');
      setTimeout(() => {
        showConsentDialog('analytics');
      }, 500);
    } else if (consentType === 'analytics') {
      localStorage.setItem('consentShown', 'true');
      toast.info('You can change this setting anytime in your privacy preferences.');
    }
    
    // Close dialog
    setShowConsent(false);
    setConsentType(null);
  };
  
  // Expose a function to request specific consent types programmatically
  const requestConsent = (type: ConsentType): Promise<boolean> => {
    return new Promise((resolve) => {
      // If consent already given, return immediately
      if (localStorage.getItem(`${type}Consent`) === 'true') {
        resolve(true);
        return;
      }
      
      // Set up a one-time event listener for this specific consent request
      const handleThisConsent = (accepted: boolean) => {
        resolve(accepted);
      };
      
      // Store the handler temporarily
      (window as any).__consentCallback = handleThisConsent;
      
      // Show the consent dialog
      showConsentDialog(type);
      
      // Set up event handlers for this specific request
      const originalAccept = handleAccept;
      const originalDecline = handleDecline;
      
      handleAccept = () => {
        originalAccept();
        if ((window as any).__consentCallback) {
          (window as any).__consentCallback(true);
          delete (window as any).__consentCallback;
        }
      };
      
      handleDecline = () => {
        originalDecline();
        if ((window as any).__consentCallback) {
          (window as any).__consentCallback(false);
          delete (window as any).__consentCallback;
        }
      };
    });
  };
  
  // Expose the consent API through context
  (window as any).requestUserConsent = requestConsent;
  
  return (
    <>
      {children}
      
      <AlertDialog open={showConsent} onOpenChange={setShowConsent}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{consentTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {consentDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDecline} className="w-full sm:w-auto">
              Decline
            </Button>
            <Button onClick={handleAccept} className="w-full sm:w-auto">
              Accept
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConsentManager;
