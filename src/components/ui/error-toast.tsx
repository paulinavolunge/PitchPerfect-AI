
import React from 'react';
import { AlertCircle, CreditCard, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ErrorToastOptions {
  title: string;
  description: string;
  showPricingButton?: boolean;
  duration?: number;
}

export const showErrorToast = ({ title, description, showPricingButton = false, duration = 6000 }: ErrorToastOptions) => {
  toast({
    title,
    description,
    duration,
    variant: "destructive",
    action: showPricingButton ? (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => window.location.href = '/pricing'}
        className="flex items-center gap-2"
      >
        <CreditCard className="h-4 w-4" />
        Buy Credits
      </Button>
    ) : undefined,
  });
};

export const showInsufficientCreditsToast = (creditsNeeded: number, creditsAvailable: number) => {
  showErrorToast({
    title: "Insufficient Credits",
    description: `You need ${creditsNeeded} credits but only have ${creditsAvailable}. Please visit the Pricing page to top up.`,
    showPricingButton: true,
    duration: 8000,
  });
};

export const showNoCreditsToast = () => {
  showErrorToast({
    title: "Out of Credits",
    description: "You don't have enough credits to start this session. Please visit the Pricing page to top up.",
    showPricingButton: true,
    duration: 8000,
  });
};
