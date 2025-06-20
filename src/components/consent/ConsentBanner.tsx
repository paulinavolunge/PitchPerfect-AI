import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Shield, Cookie } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { setAnalyticsConsent } from '@/utils/analytics';

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export const ConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: false,
    marketing: false,
    functional: true // Always required
  });

  useEffect(() => {
    const consent = localStorage.getItem('privacy-consent');
    if (!consent) {
      setShowBanner(true);
    }
    
    // Check if analytics consent already exists and trigger analytics
    const analyticsConsent = localStorage.getItem('analytics-consent');
    if (analyticsConsent === 'true') {
      console.log('🔧 ConsentBanner: Analytics consent found, triggering loadAnalytics');
      if (typeof window.loadAnalytics === 'function') {
        // Delay slightly to ensure DOM is ready
        setTimeout(() => {
          window.loadAnalytics!();
        }, 100);
      } else {
        console.warn('⚠️ ConsentBanner: window.loadAnalytics not available');
      }
    }
  }, []);

  const saveConsent = (consentData: ConsentPreferences) => {
    console.log('🔧 ConsentBanner: Saving consent:', consentData);
    
    localStorage.setItem('privacy-consent', JSON.stringify(consentData));
    localStorage.setItem('marketing-consent', consentData.marketing.toString());
    
    // Use the analytics utility function to set consent properly
    setAnalyticsConsent(consentData.analytics);
    
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    const allConsent = { analytics: true, marketing: true, functional: true };
    saveConsent(allConsent);
  };

  const handleRejectAll = () => {
    const minimalConsent = { analytics: false, marketing: false, functional: true };
    saveConsent(minimalConsent);
  };

  const handleCustomize = () => {
    setShowPreferences(true);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/20 to-transparent">
        <Card className="max-w-lg mx-auto border-2 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Cookie className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Your Privacy Matters</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We use cookies and similar technologies to improve your experience, 
                  analyze usage, and provide personalized content. You can manage your 
                  preferences at any time.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomize}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="flex-1"
              >
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Accept All
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              By continuing, you agree to our{' '}
              <a href="/privacy" className="underline hover:text-blue-600">Privacy Policy</a>
              {' '}and{' '}
              <a href="/terms" className="underline hover:text-blue-600">Terms of Service</a>
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Preferences
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">Essential Cookies</h4>
                  <p className="text-sm text-gray-600">Required for the website to function</p>
                </div>
                <div className="text-sm text-green-600 font-medium">Always On</div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">Analytics Cookies</h4>
                  <p className="text-sm text-gray-600">Help us understand how you use our site</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">Marketing Cookies</h4>
                  <p className="text-sm text-gray-600">Used to show you relevant advertisements</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowPreferences(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSavePreferences} className="flex-1">
                Save Preferences
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
