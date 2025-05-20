
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import PlanComparison from '@/components/subscription/PlanComparison';
import SubscriptionManagement from '@/components/subscription/SubscriptionManagement';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Navigate, useSearchParams } from 'react-router-dom';
import { CheckIcon, XIcon, Gift, Clock, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_your_stripe_publishable_key_here');

const Subscription = () => {
  const { toast } = useToast();
  const { user, isPremium, subscriptionTier, subscriptionEnd, trialActive, trialEndsAt, refreshSubscription } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [searchParams, setSearchParams] = useSearchParams();
  const [referralApplied, setReferralApplied] = useState(false);
  
  useEffect(() => {
    // Check for referral parameter
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralApplied(true);
      // In a real implementation, we would validate the referral code here
      toast({
        title: "Referral Applied!",
        description: "You'll get 1 free month when you subscribe to a plan.",
      });
      
      // Remove from URL after processing
      searchParams.delete('ref');
      setSearchParams(searchParams);
    }
    
    // Set plan type from URL if present
    const urlPlan = searchParams.get('plan');
    if (urlPlan === 'yearly' || urlPlan === 'monthly') {
      setPlanType(urlPlan);
    }
    
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription, searchParams, setSearchParams, toast]);

  // Calculate days remaining in trial
  const calculateDaysRemaining = () => {
    if (!trialEndsAt) return 0;
    
    const now = new Date();
    const diffTime = trialEndsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleUpgradeClick = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upgrade your subscription.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Determine which price to use based on the selected plan type
      const priceId = planType === "monthly" 
        ? process.env.STRIPE_MONTHLY_PRICE_ID || process.env.VITE_STRIPE_MONTHLY_PRICE_ID
        : process.env.STRIPE_YEARLY_PRICE_ID || process.env.VITE_STRIPE_YEARLY_PRICE_ID;
      
      // Call create-checkout edge function with priceId
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/subscription?success=true`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.sessionId) {
        // Load Stripe and redirect to checkout
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error("Failed to load Stripe");
        }
        
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        });
        
        if (stripeError) {
          console.error('Stripe redirect error:', stripeError);
          throw new Error(stripeError.message);
        }
      } else if (data?.url) {
        // Fallback to URL redirect if sessionId not available
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { returnUrl: `${window.location.origin}/subscription` }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrialClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Use the same checkout flow but indicate it's for a trial
    await handleUpgradeClick();
  };

  // Handle URL query parameters for success/cancel
  useEffect(() => {
    if (searchParams.get('success')) {
      toast({
        title: "Subscription successful!",
        description: "Thank you for subscribing to PitchPerfect AI Premium.",
      });
      refreshSubscription();
      // Clean up the URL
      searchParams.delete('success');
      setSearchParams(searchParams);
    } else if (searchParams.get('canceled')) {
      toast({
        title: "Subscription canceled",
        description: "Your subscription process was canceled.",
      });
      // Clean up the URL
      searchParams.delete('canceled');
      setSearchParams(searchParams);
    }
  }, [toast, refreshSubscription, searchParams, setSearchParams]);

  if (!user) {
    return <Navigate to="/login" state={{ from: '/subscription' }} />;
  }

  const getPageTitle = () => {
    if (isPremium) {
      return "Your Subscription";
    } else if (trialActive) {
      return "Upgrade Your Trial";
    } else {
      return "Choose Your Plan";
    }
  };

  const getPageSubtitle = () => {
    if (isPremium) {
      return "Manage your premium features and subscription settings.";
    } else if (trialActive) {
      return `You're currently on a free trial with ${calculateDaysRemaining()} days remaining. Upgrade to keep access to premium features.`;
    } else {
      return "Unlock premium features to elevate your sales conversations and close more deals with confidence.";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-brand-dark mb-4">{getPageTitle()}</h1>
            <p className="text-lg text-brand-dark/70 max-w-2xl mx-auto">
              {getPageSubtitle()}
            </p>
            
            {isPremium && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <CheckIcon className="w-4 h-4 mr-2" />
                You're on the {subscriptionTier} plan
              </div>
            )}

            {trialActive && !isPremium && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-full">
                <Clock className="w-4 h-4 mr-2" />
                Trial - {calculateDaysRemaining()} days remaining
              </div>
            )}
            
            {referralApplied && (
              <div className="mt-4 max-w-md mx-auto">
                <Alert className="bg-purple-50 border-purple-200">
                  <Gift className="h-4 w-4 text-purple-500" />
                  <AlertDescription className="text-sm">
                    Referral discount applied. You'll receive 1 month free with your subscription.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {!isPremium && (
              <div className="mt-8 max-w-xs mx-auto">
                <Tabs value={planType} onValueChange={(v) => setPlanType(v as "monthly" | "yearly")}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="monthly" className="text-sm">Monthly ($29/mo)</TabsTrigger>
                    <TabsTrigger value="yearly" className="text-sm">Yearly ($290/yr)</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>
          
          <PlanComparison 
            isPremium={isPremium} 
            onUpgradeClick={handleUpgradeClick} 
            isLoading={isLoading}
            planType={planType}
            trialActive={trialActive}
          />
          
          {isPremium && subscriptionEnd && (
            <div className="mt-8 max-w-4xl mx-auto text-center">
              <p className="text-sm text-brand-dark/70">
                Your subscription renews on {new Date(subscriptionEnd).toLocaleDateString()}
              </p>
              <Button 
                variant="outline" 
                onClick={handleManageSubscription} 
                className="mt-2"
                disabled={isLoading}
                aria-label="Manage subscription"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Manage Subscription
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Subscription;
