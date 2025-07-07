import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Accessibility, 
  Eye, 
  Volume2, 
  MousePointer,
  Keyboard,
  X
} from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibilityMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({ isOpen, onClose }) => {
  const { isHighContrast, setHighContrast, announceToScreenReader } = useAccessibility();
  const [textSize, setTextSize] = useState('normal');
  const [animations, setAnimations] = useState(true);

  const handleHighContrastToggle = (checked: boolean) => {
    setHighContrast(checked);
    announceToScreenReader(
      checked ? 'High contrast mode enabled' : 'High contrast mode disabled'
    );
  };

  const handleTextSizeChange = (size: string) => {
    setTextSize(size);
    document.documentElement.classList.remove('text-sm', 'text-lg', 'text-xl');
    if (size !== 'normal') {
      document.documentElement.classList.add(`text-${size}`);
    }
    announceToScreenReader(`Text size changed to ${size}`);
  };

  const handleAnimationsToggle = (checked: boolean) => {
    setAnimations(checked);
    if (!checked) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    announceToScreenReader(
      checked ? 'Animations enabled' : 'Animations disabled'
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-labelledby="accessibility-menu-title"
      aria-modal="true"
    >
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Accessibility className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <CardTitle id="accessibility-menu-title">Accessibility Options</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close accessibility menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Label htmlFor="high-contrast" className="text-sm font-medium">
                High Contrast
              </Label>
            </div>
            <Switch
              id="high-contrast"
              checked={isHighContrast}
              onCheckedChange={handleHighContrastToggle}
              aria-describedby="high-contrast-desc"
            />
          </div>
          <p id="high-contrast-desc" className="text-xs text-muted-foreground">
            Increase color contrast for better visibility
          </p>

          {/* Text Size */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <MousePointer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Label className="text-sm font-medium">Text Size</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['sm', 'normal', 'lg'].map((size) => (
                <Button
                  key={size}
                  variant={textSize === size ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTextSizeChange(size)}
                  className="text-xs"
                  aria-pressed={textSize === size}
                >
                  {size === 'sm' ? 'Small' : size === 'normal' ? 'Normal' : 'Large'}
                </Button>
              ))}
            </div>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Label htmlFor="animations" className="text-sm font-medium">
                Animations
              </Label>
            </div>
            <Switch
              id="animations"
              checked={animations}
              onCheckedChange={handleAnimationsToggle}
              aria-describedby="animations-desc"
            />
          </div>
          <p id="animations-desc" className="text-xs text-muted-foreground">
            Enable or disable motion effects
          </p>

          {/* Keyboard Navigation Help */}
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-3 mb-3">
              <Keyboard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-medium">Keyboard Navigation</h3>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> - Navigate forward</div>
              <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift+Tab</kbd> - Navigate backward</div>
              <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> - Activate buttons</div>
              <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> - Close dialogs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessibilityMenu;