
import React from 'react';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface PricingPlanCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  credits?: number;
  buttonText: string;
  buttonVariant?: 'default' | 'outline';
  priceId?: string;
  isSubscription?: boolean;
}

const PricingPlanCard: React.FC<PricingPlanCardProps> = ({
  title,
  price,
  period,
  features,
  popular = false,
  credits,
  buttonText,
  buttonVariant = 'default',
  priceId,
  isSubscription = false,
}) => {
  const { user } = useAuth();

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make a purchase.",
        variant: "destructive",
      });
      return;
    }

    try {
      const functionName = isSubscription ? 'create-checkout' : 'create-payment';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          priceId,
          planName: title,
          credits: credits,
          returnUrl: `${window.location.origin}/success?type=${isSubscription ? 'subscription' : 'credits'}&plan=${encodeURIComponent(title)}&credits=${credits || 0}`
        }
      });

      if (error) {
        console.error('Purchase error:', error);
        toast({
          title: "Purchase Failed",
          description: "There was an error processing your purchase. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Show loading toast
        toast({
          title: "Redirecting to Checkout",
          description: `Processing your ${isSubscription ? 'subscription' : 'credit purchase'} request...`,
          duration: 3000,
        });
        
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`relative h-full flex flex-col ${popular ? 'border-brand-blue shadow-lg scale-105' : ''}`}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-blue text-white">
          <Star className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold text-brand-dark">{title}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold text-brand-dark">{price}</span>
          <span className="text-brand-dark/60 ml-1">/{period}</span>
        </div>
        {credits && (
          <p className="text-sm text-brand-dark/70 mt-2">{credits} credits included</p>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow flex flex-col">
        <ul className="space-y-3 mb-8 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-brand-dark/80 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={handlePurchase}
          variant={buttonVariant}
          className={`w-full ${
            popular
              ? 'bg-brand-blue hover:bg-brand-blue/90 text-white'
              : buttonVariant === 'outline'
              ? 'border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white'
              : 'bg-brand-blue hover:bg-brand-blue/90 text-white'
          }`}
          size="lg"
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingPlanCard;
