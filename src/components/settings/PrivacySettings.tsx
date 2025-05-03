
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PrivacySettings = () => {
  const { user } = useAuth();
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(
    localStorage.getItem('dataCollection') !== 'disabled'
  );
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    localStorage.getItem('analyticsEnabled') !== 'disabled'
  );
  const [aiImprovementEnabled, setAiImprovementEnabled] = useState(
    localStorage.getItem('aiImprovementEnabled') !== 'disabled'
  );

  const handleDataCollectionChange = (checked: boolean) => {
    setDataCollectionEnabled(checked);
    localStorage.setItem('dataCollection', checked ? 'enabled' : 'disabled');
    toast.success(
      checked ? 'Data collection enabled' : 'Data collection disabled'
    );
  };

  const handleAnalyticsChange = (checked: boolean) => {
    setAnalyticsEnabled(checked);
    localStorage.setItem('analyticsEnabled', checked ? 'enabled' : 'disabled');
    toast.success(
      checked ? 'Analytics enabled' : 'Analytics disabled'
    );
  };

  const handleAiImprovementChange = (checked: boolean) => {
    setAiImprovementEnabled(checked);
    localStorage.setItem('aiImprovementEnabled', checked ? 'enabled' : 'disabled');
    toast.success(
      checked
        ? 'AI improvement data sharing enabled'
        : 'AI improvement data sharing disabled'
    );
  };

  const handleDownloadData = async () => {
    if (!user) return;

    toast.info('Preparing your data for download...');

    try {
      // Implementation would call SecureDataService to get user data
      // This is a placeholder for the actual implementation
      setTimeout(() => {
        const userData = {
          email: user.email,
          created_at: user.created_at,
          practice_sessions: [],
          recordings: []
          // Additional user data would be included here
        };

        // Create a downloadable file
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-pitchperfect-data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Your data has been downloaded');
      }, 1500);
    } catch (error) {
      console.error('Error downloading user data:', error);
      toast.error('Failed to download data. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Privacy & Data Settings
          </CardTitle>
          <CardDescription>
            Control how your data is used within PitchPerfect AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="data-collection" className="font-medium">
                  Data Collection
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow collection of practice session data for personalized feedback
                </p>
              </div>
              <Switch
                id="data-collection"
                checked={dataCollectionEnabled}
                onCheckedChange={handleDataCollectionChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="analytics" className="font-medium">
                  Analytics
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow usage analytics to help improve the app experience
                </p>
              </div>
              <Switch
                id="analytics"
                checked={analyticsEnabled}
                onCheckedChange={handleAnalyticsChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ai-improvement" className="font-medium">
                  AI Improvement
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow anonymized data to be used for improving our AI models
                </p>
              </div>
              <Switch
                id="ai-improvement"
                checked={aiImprovementEnabled}
                onCheckedChange={handleAiImprovementChange}
              />
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200 mt-4">
            <AlertDescription className="text-blue-800">
              Your privacy choices are saved locally. You can change these settings at any time.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <Button
            variant="outline"
            className="flex gap-2 items-center w-full sm:w-auto"
            onClick={handleDownloadData}
          >
            <Download size={16} />
            Download My Data
          </Button>
          <Button
            variant="outline"
            className="flex gap-2 items-center text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
            onClick={() => window.location.href = "/account-delete"}
          >
            <Trash2 size={16} />
            Delete My Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PrivacySettings;
