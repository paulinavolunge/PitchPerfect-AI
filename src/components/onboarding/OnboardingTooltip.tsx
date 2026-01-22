
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, X } from 'lucide-react';

interface OnboardingTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  showOnFirstVisit?: boolean;
  storageKey?: string;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  children,
  content,
  side = 'top',
  showOnFirstVisit = false,
  storageKey
}) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (!showOnFirstVisit || !storageKey) return false;
    return !localStorage.getItem(storageKey);
  });

  const handleClose = () => {
    setIsOpen(false);
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side}
          className="max-w-xs p-3"
          aria-label="Help tooltip"
        >
          <div className="flex justify-between items-start gap-2">
            <p className="text-sm">{content}</p>
            {showOnFirstVisit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-auto p-1"
                aria-label="Close tooltip"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OnboardingTooltip;
