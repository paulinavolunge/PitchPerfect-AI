
import React from 'react';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@supabase/supabase-js';

interface Feature {
  name: string;
  highlight?: boolean;
}

interface PricingPlanCardProps {
  type: 'free' | 'basic' | 'professional' | 'enterprise';
  title: string;
  description: string;
  price: string | React.ReactElement;
  priceDescription: string;
  features: Feature[];
  buttonText: string;
  buttonVariant?: 'default' | 'outline';
  buttonAction: () => void;
  disabled?: boolean;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  user: User | null;
  isPremium: boolean;
  creditsRemaining: number;
  trialUsed: boolean;
}

const PricingPlanCard: React.FC<PricingPlanCardProps> = ({
  title,
  description,
  price,
  priceDescription,
  features,
  buttonText,
  buttonVariant = 'default',
  buttonAction,
  disabled = false,
  isPopular = false,
  isCurrentPlan = false,
}) => {
  return (
    <Card className={`relative h-full flex flex-col ${isPopular ? 'border-brand-blue shadow-lg scale-105' : ''}`}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-blue text-white">
          <Star className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold text-brand-dark">{title}</CardTitle>
        <p className="text-sm text-brand-dark/70 mb-2">{description}</p>
        <div className="mt-4">
          {typeof price === 'string' ? (
            <span className="text-4xl font-bold text-brand-dark">{price}</span>
          ) : (
            price
          )}
          <span className="text-brand-dark/60 ml-1">/{priceDescription}</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow flex flex-col">
        <ul className="space-y-3 mb-8 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className={`text-sm ${feature.highlight ? 'font-semibold text-brand-blue' : 'text-brand-dark/80'}`}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={buttonAction}
          variant={buttonVariant}
          disabled={disabled}
          className={`w-full ${
            isPopular
              ? 'bg-brand-blue hover:bg-brand-blue/90 text-white'
              : buttonVariant === 'outline'
              ? 'border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white'
              : 'bg-brand-blue hover:bg-brand-blue/90 text-white'
          } ${isCurrentPlan ? 'opacity-75' : ''}`}
          size="lg"
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingPlanCard;
