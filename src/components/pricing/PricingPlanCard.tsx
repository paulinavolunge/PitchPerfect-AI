
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, XIcon, Diamond } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { User } from '@supabase/supabase-js';

interface FeatureItem {
  name: string;
  highlight?: boolean;
  included?: boolean;
}

interface EnterpriseSizes {
  small: {
    name: string;
    price: string;
    users: string;
    features: string[];
  };
  medium: {
    name: string;
    price: string;
    users: string;
    features: string[];
  };
  large: {
    name: string;
    price: string;
    users: string;
    features: string[];
  };
}

interface EnterpriseProps {
  sizes: EnterpriseSizes;
  enterpriseSize: "small" | "medium" | "large";
  setEnterpriseSize: (size: "small" | "medium" | "large") => void;
}

interface PricingPlanCardProps {
  type: "free" | "basic" | "professional" | "enterprise";
  title: string;
  description: string;
  price: React.ReactNode;
  priceDescription?: string;
  features: FeatureItem[];
  buttonText: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  buttonAction: () => void;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  disabled?: boolean;
  user: User | null;
  isPremium: boolean;
  creditsRemaining: number;
  trialUsed: boolean;
  enterpriseProps?: EnterpriseProps;
}

const PricingPlanCard: React.FC<PricingPlanCardProps> = ({ 
  type,
  title, 
  description, 
  price, 
  priceDescription, 
  features, 
  buttonText, 
  buttonVariant = "default", 
  buttonAction,
  isCurrentPlan,
  isPopular,
  disabled,
  user,
  isPremium,
  creditsRemaining,
  trialUsed,
  enterpriseProps
}) => {
  const [expanded, setExpanded] = useState(false);

  const renderFeatureItem = (item: FeatureItem, index: number) => (
    <li key={index} className={`flex items-center gap-2 py-1 ${item.highlight ? 'font-medium' : ''}`}>
      {item.included !== false ? (
        <CheckIcon className={`h-5 w-5 ${item.highlight ? 'text-brand-blue' : 'text-green-500'}`} />
      ) : (
        <XIcon className="h-5 w-5 text-gray-400" />
      )}
      <span>{item.name}</span>
    </li>
  );

  const renderEnterpriseSizeSelector = () => {
    if (!enterpriseProps) return null;

    const { sizes, enterpriseSize, setEnterpriseSize } = enterpriseProps;

    return (
      <div className="mb-6 mt-4 border-t border-b py-4">
        <RadioGroup value={enterpriseSize} onValueChange={(value) => setEnterpriseSize(value as any)}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="small" id="enterprise-small" />
              <Label htmlFor="enterprise-small" className="flex-1">
                <span className="font-medium">{sizes.small.name}</span>
                <p className="text-sm text-gray-500">({sizes.small.users} users)</p>
              </Label>
              <span className="font-medium">{sizes.small.price}</span>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="enterprise-medium" />
              <Label htmlFor="enterprise-medium" className="flex-1">
                <span className="font-medium">{sizes.medium.name}</span>
                <p className="text-sm text-gray-500">({sizes.medium.users} users)</p>
              </Label>
              <span className="font-medium">{sizes.medium.price}</span>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="large" id="enterprise-large" />
              <Label htmlFor="enterprise-large" className="flex-1">
                <span className="font-medium">{sizes.large.name}</span>
                <p className="text-sm text-gray-500">({sizes.large.users} users)</p>
              </Label>
              <span className="font-medium">{sizes.large.price}</span>
            </div>
          </div>
        </RadioGroup>
      </div>
    );
  };

  const renderEnterpriseFeatures = () => {
    if (!enterpriseProps) return null;

    const { sizes, enterpriseSize } = enterpriseProps;
    const selectedSize = sizes[enterpriseSize];

    return (
      <ul className="space-y-2 mb-6">
        {selectedSize.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 py-1">
            <CheckIcon className="h-5 w-5 text-green-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Determine if this is the "current plan" badge
  const showCurrentPlanBadge = () => {
    if (!user) return false; // Not logged in
    if (isPremium && (type === 'basic' || type === 'professional' || type === 'enterprise')) {
      // If the user is premium and on a specific plan, show badge for that plan
      // This requires subscriptionTier to be passed down or matched
      return false; // Assuming current Premium Plan is passed via isCurrentPlan prop from PricingPlans
    }
    if (type === 'free' && !isPremium && (trialUsed || creditsRemaining === 0)) {
      return true; // Logged in, not premium, and either used free analysis or has no credits
    }
    return false;
  };

  // Determine if this is the "Free Pitch Analysis" badge
  const showFreePitchAnalysisBadge = () => {
    return type === 'free' && user && !isPremium && !trialUsed && creditsRemaining === 0;
  };

  return (
    <div 
      className={`rounded-xl border bg-card text-card-foreground shadow transition-all duration-300 ease-in-out overflow-hidden relative flex flex-col
        ${isPopular ? 'scale-105 shadow-lg border-brand-blue/20 z-10' : 'hover:shadow-md'}
        ${isCurrentPlan ? 'ring-2 ring-brand-green' : ''}
      `}
    >
      {isPopular && (
        <div className="bg-brand-blue py-1 px-4 absolute top-0 right-0 rounded-bl-xl text-white text-xs font-medium">
          Most Popular
        </div>
      )}

      {showCurrentPlanBadge() && (
        <div className="bg-brand-green py-1 px-4 absolute top-0 left-0 rounded-br-xl text-white text-xs font-medium">
          Current Plan
        </div>
      )}

      {showFreePitchAnalysisBadge() && (
        <div className="bg-yellow-500 py-1 px-4 absolute top-0 left-0 rounded-br-xl text-white text-xs font-medium flex items-center">
          <Diamond className="h-3 w-3 mr-1" /> 1 Free Analysis
        </div>
      )}

      <div className="p-6 flex-1">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>

        <div className="mb-6">
          <div className="flex items-end">
            {price}
          </div>
          {priceDescription && (
            <p className="text-sm text-gray-500">{priceDescription}</p>
          )}
        </div>

        {type === 'enterprise' ? renderEnterpriseSizeSelector() : null}
        {type === 'enterprise' ? renderEnterpriseFeatures() : (
          <ul className="space-y-2 mb-6">
            {features.map((item, index) => renderFeatureItem(item, index))}
          </ul>
        )}
      </div>

      <div className="p-6 pt-0">
        <Button 
          onClick={buttonAction}
          variant={buttonVariant} 
          disabled={disabled || (isCurrentPlan && !showFreePitchAnalysisBadge())}
          className={`w-full ${isPopular && buttonVariant === 'default' ? 'bg-brand-blue hover:bg-brand-blue/90' : ''}`}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default PricingPlanCard;
