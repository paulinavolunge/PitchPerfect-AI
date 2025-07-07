import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Accessibility } from 'lucide-react';
import AccessibilityMenu from './AccessibilityMenu';

const AccessibilityButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsMenuOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-white shadow-lg border-2 border-primary-200 hover:bg-primary-50"
        aria-label="Open accessibility options"
        title="Accessibility Options"
      >
        <Accessibility className="h-4 w-4" aria-hidden="true" />
      </Button>
      
      <AccessibilityMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </>
  );
};

export default AccessibilityButton;