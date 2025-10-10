
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import AccessibilityMenu from './AccessibilityMenu';

const AccessibilityButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-4 z-50 bg-white shadow-lg border-2 border-primary-200 hover:bg-primary-50"
        onClick={() => setIsMenuOpen(true)}
        aria-label="Open accessibility settings"
      >
        <Settings className="h-4 w-4" />
      </Button>
      
      <AccessibilityMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </>
  );
};

export default AccessibilityButton;
