
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import PlanComparison from '@/components/subscription/PlanComparison';
import SubscriptionManagement from '@/components/subscription/SubscriptionManagement';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Navigate } from 'react-router-dom';
import { CheckIcon, XIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const Subscription = () => {
  const { toast } = useToast();
  const { user, isPremium, subscriptionTier, subscriptionEnd, refreshSubscription } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [customerPortalUrl, setCustomerPortalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);

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
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          price: 'monthly', // or 'yearly'
          successUrl: `${window.location.origin}/subscription?success=true`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
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

  // Handle URL query parameters for success/cancel
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      toast({
        title: "Subscription successful!",
        description: "Thank you for subscribing to PitchPerfect AI Premium.",
      });
      refreshSubscription();
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (query.get('canceled')) {
      toast({
        title: "Subscription canceled",
        description: "Your subscription process was canceled.",
      });
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, refreshSubscription]);

  if (!user) {
    return <Navigate to="/login" state={{ from: '/subscription' }} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-brand-dark mb-4">Choose Your Plan</h1>
            <p className="text-lg text-brand-dark/70 max-w-2xl mx-auto">
              Unlock premium features to elevate your sales conversations and close more deals with confidence.
            </p>
            
            {isPremium && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <CheckIcon className="w-4 h-4 mr-2" />
                You're on the {subscriptionTier} plan
              </div>
            )}
          </div>
          
          <PlanComparison 
            isPremium={isPremium} 
            onUpgradeClick={handleUpgradeClick} 
            isLoading={isLoading} 
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
