
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { X } from "lucide-react";

interface ConsentOption {
  id: string;
  title: string;
  description: string;
  required: boolean;
  defaultValue: boolean;
}

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
  necessaryCookies: boolean; // Always true, required
}

const ConsentManager: React.FC = () => {
  const { toast } = useToast();
  const [showConsentDialog, setShowConsentDialog] = useState<boolean>(false);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: false,
    marketing: false,
    thirdParty: false,
    necessaryCookies: true // Always required
  });

  // Consent options
  const consentOptions: ConsentOption[] = [
    {
      id: "necessaryCookies",
      title: "Necessary Cookies",
      description: "These cookies are required for basic site functionality and are always enabled.",
      required: true,
      defaultValue: true,
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Allow us to collect information about how you use our app to improve functionality and user experience.",
      required: false,
      defaultValue: false,
    },
    {
      id: "marketing",
      title: "Marketing",
      description: "Enable personalized recommendations and marketing communications based on your usage patterns.",
      required: false,
      defaultValue: false,
    },
    {
      id: "thirdParty",
      title: "Third-party Services",
      description: "Allow integration with third-party services that enhance your experience (transcription services, AI feedback).",
      required: false,
      defaultValue: false,
    },
  ];

  useEffect(() => {
    // Check if consent has been previously given
    const savedConsent = localStorage.getItem('consent-preferences');
    if (savedConsent) {
      setConsentGiven(true);
      setPreferences(JSON.parse(savedConsent));
    } else {
      // Show the consent dialog if no consent has been given yet
      setShowConsentDialog(true);
    }
  }, []);

  const handleToggleConsent = (optionId: keyof ConsentPreferences) => {
    if (optionId === 'necessaryCookies') return; // Cannot toggle required options
    
    setPreferences(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      analytics: true,
      marketing: true,
      thirdParty: true,
      necessaryCookies: true,
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };
  
  const handleDeclineAll = () => {
    // Only accept necessary cookies
    const necessaryOnly: ConsentPreferences = {
      analytics: false,
      marketing: false,
      thirdParty: false,
      necessaryCookies: true,
    };
    setPreferences(necessaryOnly);
    saveConsent(necessaryOnly);
  };

  const saveConsent = (prefs: ConsentPreferences) => {
    localStorage.setItem('consent-preferences', JSON.stringify(prefs));
    setConsentGiven(true);
    setShowConsentDialog(false);
    
    toast({
      title: "Preferences Saved",
      description: "Your privacy preferences have been updated.",
    });
    
    // Here you would also potentially trigger any analytics setup based on preferences
    applyConsentPreferences(prefs);
  };

  const applyConsentPreferences = (prefs: ConsentPreferences) => {
    // Implementation to actually apply these consent preferences
    // For example, enabling/disabling analytics trackers, etc.
    console.log("Applying consent preferences:", prefs);
    
    // Example: If analytics consent is given, initialize analytics
    if (prefs.analytics) {
      // Initialize analytics
      console.log("Analytics enabled");
    }
    
    // Example: If marketing consent is given
    if (prefs.marketing) {
      // Setup marketing cookies/trackers
      console.log("Marketing enabled");
    }
    
    // And so on for other consent types
  };

  const handleSave = () => {
    saveConsent(preferences);
  };

  return (
    <>
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Privacy Preferences</DialogTitle>
            <DialogDescription>
              PitchPerfect AI values your privacy. Please review our data collection practices and select your preferences.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="privacy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="privacy">Privacy Settings</TabsTrigger>
              <TabsTrigger value="details">Detailed Information</TabsTrigger>
            </TabsList>
            
            <TabsContent value="privacy" className="space-y-4 mt-4">
              <div className="space-y-4">
                {consentOptions.map((option) => (
                  <div key={option.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h4 className="font-medium">{option.title}</h4>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                      {option.required && <span className="text-xs text-muted-foreground">(Required)</span>}
                    </div>
                    <Button
                      variant={preferences[option.id as keyof ConsentPreferences] ? "default" : "outline"}
                      size="sm"
                      disabled={option.required}
                      onClick={() => handleToggleConsent(option.id as keyof ConsentPreferences)}
                    >
                      {preferences[option.id as keyof ConsentPreferences] ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="details">
              <div className="space-y-4 mt-4">
                <h4 className="font-medium">How We Use Your Data</h4>
                <p className="text-sm">
                  PitchPerfect AI collects and processes personal data to provide our sales training services and improve your experience. 
                  We use data about your interactions, practice sessions, and feedback to enhance our AI coaching capabilities.
                </p>
                
                <h4 className="font-medium">Data Storage</h4>
                <p className="text-sm">
                  Your data is encrypted and stored securely using industry-standard protocols. We retain your personal information only for as long as necessary to provide you with our services.
                </p>
                
                <h4 className="font-medium">Your Rights</h4>
                <p className="text-sm">
                  You have the right to access, correct, download, or request deletion of your personal data at any time through your account settings or by contacting us.
                </p>
                
                <h4 className="font-medium">Third-Party Sharing</h4>
                <p className="text-sm">
                  If you enable third-party services, we may share relevant data with these providers to enhance your training experience. We do not sell your personal information.
                </p>
                
                <Button variant="link" size="sm" className="px-0" asChild>
                  <a href="/privacy" target="_blank">Read Full Privacy Policy</a>
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-col sm:flex-row sm:justify-between">
            <div className="flex space-x-2 mb-2 sm:mb-0">
              <Button variant="outline" onClick={handleDeclineAll}>Decline All</Button>
              <Button variant="outline" onClick={handleAcceptAll}>Accept All</Button>
            </div>
            <Button onClick={handleSave}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Privacy settings button (visible when dialog is closed) */}
      {!showConsentDialog && (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-md flex items-center gap-1"
          onClick={() => setShowConsentDialog(true)}
        >
          Privacy Settings <X size={16} className="ml-1" />
        </Button>
      )}
    </>
  );
};

export default ConsentManager;
