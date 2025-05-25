
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/utils/analytics';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {
          returnUrl: `${window.location.origin}/dashboard`
        }
      });

      if (error || !data?.url) {
        throw new Error(error?.message || 'No portal URL');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error opening subscription portal',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Your Subscription</h1>
      <p className="mb-4">You can update your billing, change your plan, or cancel at any time.</p>
      <button
        onClick={handleManageSubscription}
        className="bg-brand-blue text-white px-6 py-3 rounded-lg hover:bg-brand-blue/90 transition"
      >
        Open Stripe Billing Portal
      </button>
    </div>
  );
};

export default SubscriptionManagement;
