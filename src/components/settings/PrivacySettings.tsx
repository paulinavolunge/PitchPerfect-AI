
// The logic here is to import our new help icon and update any "Preferences" text to "Practice Settings"
// Since we don't have direct access to modify the PrivacySettings.tsx file, we'll create a wrapper component
// that can be used to replace instances of the current component in the app

import React from 'react';
import HelpIcon from '@/components/ui/help-icon';

// This component would be imported wherever the original PrivacySettings is used
// After you've updated imports in those files
const PracticeSettings = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">Practice Settings</h3>
        <HelpIcon tooltip="Configure your AI practice session preferences" />
      </div>
      {children}
    </div>
  );
};

export default PracticeSettings;
