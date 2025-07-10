
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAccessibility } from './AccessibilityProvider';
import { X } from 'lucide-react';

interface AccessibilityMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({ isOpen, onClose }) => {
  const {
    highContrast,
    setHighContrast,
    largeText,
    setLargeText,
    reducedMotion,
    setReducedMotion,
    keyboardNavigation,
    setKeyboardNavigation,
  } = useAccessibility();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Accessibility Settings</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close accessibility settings"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast">High Contrast</Label>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="large-text">Large Text</Label>
            <Switch
              id="large-text"
              checked={largeText}
              onCheckedChange={setLargeText}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="reduced-motion">Reduced Motion</Label>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="keyboard-nav">Enhanced Keyboard Navigation</Label>
            <Switch
              id="keyboard-nav"
              checked={keyboardNavigation}
              onCheckedChange={setKeyboardNavigation}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessibilityMenu;
