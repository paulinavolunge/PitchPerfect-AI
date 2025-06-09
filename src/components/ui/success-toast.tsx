
import React from 'react';
import { CheckCircle, CreditCard, Crown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SuccessToastOptions {
  title: string;
  description: string;
  icon?: 'check' | 'credit' | 'crown';
  duration?: number;
}

export const showSuccessToast = ({ title, description, icon = 'check', duration = 5000 }: SuccessToastOptions) => {
  const IconComponent = icon === 'credit' ? CreditCard : icon === 'crown' ? Crown : CheckCircle;
  
  toast({
    title,
    description,
    duration,
    variant: "default",
    action: (
      <div className="flex items-center">
        <IconComponent className="h-5 w-5 text-green-600" />
      </div>
    ),
  });
};

export const showCreditSuccessToast = (creditsAdded: number, totalCredits: number) => {
  showSuccessToast({
    title: "Credits Added Successfully!",
    description: `${creditsAdded} credits have been added to your account. You now have ${totalCredits} credits.`,
    icon: 'credit',
    duration: 6000,
  });
};

export const showSubscriptionSuccessToast = (planName: string) => {
  showSuccessToast({
    title: `Welcome to ${planName}!`,
    description: `You're now subscribed to the ${planName} plan. Your monthly credits have been added.`,
    icon: 'crown',
    duration: 6000,
  });
};

export const showCreditUsageToast = (creditsUsed: number, remainingCredits: number, featureName?: string) => {
  const featureText = featureName ? ` for ${featureName}` : '';
  showSuccessToast({
    title: `${creditsUsed} Credit${creditsUsed > 1 ? 's' : ''} Used`,
    description: `Credit${creditsUsed > 1 ? 's' : ''} used${featureText}. You have ${remainingCredits} credits remaining.`,
    icon: 'credit',
    duration: 4000,
  });
};
