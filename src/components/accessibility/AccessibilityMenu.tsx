
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, X, Type, Eye, Navigation } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';
import { handleEscapeKey } from '@/utils/accessibility';

interface AccessibilityMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({ isOpen, onClose }) => {
  const {
    highContrast,
    reducedMotion,
    fontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
  } = useAccessibility();

  useEffect(() => {
    if (isOpen) {
      const cleanup = handleEscapeKey(onClose);
      return cleanup;
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Accessibility Settings
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={onClose}
              aria-label="Close accessibility settings"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* High Contrast */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="high-contrast" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                High Contrast Mode
              </Label>
              <Switch
                id="high-contrast"
                checked={highContrast}
                onCheckedChange={toggleHighContrast}
                aria-describedby="high-contrast-desc"
              />
            </div>
            <p id="high-contrast-desc" className="text-sm text-muted-foreground">
              Increases color contrast for better visibility
            </p>
          </div>

          <Separator />

          {/* Reduced Motion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reduced-motion" className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Reduce Motion
              </Label>
              <Switch
                id="reduced-motion"
                checked={reducedMotion}
                onCheckedChange={toggleReducedMotion}
                aria-describedby="reduced-motion-desc"
              />
            </div>
            <p id="reduced-motion-desc" className="text-sm text-muted-foreground">
              Minimizes animations and transitions
            </p>
          </div>

          <Separator />

          {/* Font Size */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={fontSize === 'normal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize('normal')}
                className="text-sm"
              >
                Normal
              </Button>
              <Button
                variant={fontSize === 'large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize('large')}
                className="text-base"
              >
                Large
              </Button>
              <Button
                variant={fontSize === 'xl' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize('xl')}
                className="text-lg"
              >
                XL
              </Button>
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground">
            <p>These settings are saved locally and will persist across sessions.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessibilityMenu;
