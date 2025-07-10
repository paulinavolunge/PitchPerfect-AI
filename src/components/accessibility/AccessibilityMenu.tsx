import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export const AccessibilityMenu: React.FC = () => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 bg-background/90 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 shadow-lg hover:shadow-xl transition-all duration-200"
      aria-label="Open accessibility settings"
    >
      <Settings className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Accessibility Settings</span>
    </Button>
  );
};