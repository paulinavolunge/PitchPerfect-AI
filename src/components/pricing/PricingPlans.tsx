import React from 'react';
import PricingPlanCard from './PricingPlanCard';
import TimeOffer from '@/components/promotion/TimeOffer';
import { useAuth } from '@/context/AuthContext'; // Keep useAuth for internal logic
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import { User } from '@supabase/supabase-js'; // Import User type

interface PriceIds {
  starter: { monthly: string; yearly: string; credits: number }; // Added credits
  professional: { monthly: string; yearly: string; credits: number }; // Added credits
  team: {
    small: { monthly: string; yearly: string; credits: number }; // Added credits
    medium: { monthly: string; yearly: string; credits: number }; // Added credits
    large: { monthly: string; yearly: string; credits: number }; // Added credits
  };
}

interface PricingPlansProps {
  planType: 'monthly' | 'yearly';
  enterpriseSize: 'small' | 'medium' | 'large';
  setEnterpriseSize: (size: 'small' | 'medium' | 'large') => void;
  promoExpiryDate: Date;
  onCheckout: (priceId: string, planName: string) => void;
  priceIds: PriceIds;
  isLoading: boolean;
  user: User | null; // Pass user from parent (Pricing.tsx)
  isPremium: boolean; // Pass isPremium from parent
  creditsRemaining: number; // Pass creditsRemaining from parent
  trialUsed: boolean; // Pass trialUsed from parent
}

const PricingPlans: React.FC<PricingPlansProps> = ({
  planType,
  enterpriseSize,
  setEnterpriseSize,
  promoExpiryDate,
  onCheckout,
  priceIds,
  isLoading,
  user, // Received as prop
  isPremium, // Received as prop
  creditsRemaining, // Received as prop
  trialUsed, // Received as prop
}) => {
  const navigate = useNavigate();

  // Removed calculateDaysRemaining as trial is now credit-based

  const handlePlanClick = (plan: string, priceId: string) => {
    trackEvent('plan_selected', { plan, billingCycle: planType });
    onCheckout(priceId, plan);
  };

  const handleFreeClick = () => {
    trackEvent('free_plan_signup_clicked');
    // If user is not logged in, direct to signup (which gives 1 free analysis)
    if (!user) {
      navigate('/signup');
    } else if (!trialUsed && creditsRemaining === 0) {
      // If logged in but hasn't used free analysis, navigate to demo to trigger it
      navigate('/demo');
    } else {
      // Logged in, trial used, no credits, not premium - current plan is free plan
      // Or if premium, current plan is premium - do nothing
      navigate('/dashboard'); // Direct to dashboard if already a user
    }
  };

  const handleContactSales = () => {
    trackEvent('enterprise_contact_clicked');
    window.location.href = 'mailto:sales@pitchperfectai.com?subject=Enterprise Pricing Inquiry';
  };

  // Determine the button text for the "Free" plan dynamically
  const getFreePlanButtonText = () => {
    if (!user) {
      return 'Get Started Free'; // New visitor
    } else if (isPremium) {
      return 'Current Plan (Premium)'; // Already premium
    } else if (!trialUsed && creditsRemaining === 0) {
      return 'Get 1 Free Pitch Analysis'; // Logged in, hasn't used free analysis
    } else {
      return 'Current Plan (Free)'; // Logged in, used free analysis, no credits
    }
  };

  // Determine if the "Free" plan button should be disabled
  const isFreePlanButtonDisabled = () => {
    if (!user) return false; // Always allow new visitors to click
    if (isPremium) return true; // Already premium, free plan is irrelevant
    if (trialUsed && creditsRemaining === 0) return true; // Logged in, used free analysis, no credits. Can't "get started free" again.
    return false;
  };


  return (
    <>
      <div className="max-w-4xl mx-auto mb-8">
        <TimeOffer
          expiryDate={promoExpiryDate}
          discount="Save 17% on Annual Plans"
          description="Switch to annual billing and save on all paid plans"
          variant="card"
          ctaText="View Annual Pricing"
          ctaLink="/pricing?plan=yearly" // Ensure it links to yearly
        />
      </div>

      {user && !isPremium && !trialUsed && ( // Alert for logged-in users who haven't used free analysis
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="font-medium text-yellow-800">1 Free Pitch Analysis Available!</p>
          </div>
          <p className="text-yellow-700 text-sm mb-2">
            Start a demo or practice session to use your free pitch analysis.
          </p>
        </div>
      )}
      {user && !isPremium && trialUsed && creditsRemaining === 0 && ( // Alert for logged-in users with no credits
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="font-medium text-red-800">No Credits Remaining</p>
          </div>
          <p className="text-red-700 text-sm mb-2">
            Your free pitch analysis has been used, and you have no credits left. Please upgrade to continue.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {/* Free Plan */}
        <PricingPlanCard
          type="free"
          title="Free"
          description="Try before you buy"
          price={<span className="text-4xl font-bold">$0</span>}
          priceDescription="forever"
          features={[
            { name: '1 Free Pitch Analysis' }, // Changed
            { name: 'Basic AI Feedback' },
            { name: 'Limited Scenarios' },
            { name: 'Community access' },
          ]}
          buttonText={getFreePlanButtonText()}
          buttonVariant="outline"
          buttonAction={handleFreeClick}
          isCurrentPlan={user && !isPremium && (trialUsed || creditsRemaining === 0)} // Current if logged in, not premium, and either trial used or no credits
          disabled={isFreePlanButtonDisabled() || isLoading}
          user={user} // Pass user status
          isPremium={isPremium} // Pass premium status
          creditsRemaining={creditsRemaining} // Pass credits
          trialUsed={trialUsed} // Pass trial status
        />

        {/* Starter Plan - New Plan */}
        <PricingPlanCard
          type="starter"
          title="Starter"
          description="For light users"
          price={
            planType === 'monthly' ? '$15/month' : '$150/year' // Adjusted price
          }
          priceDescription={planType === 'monthly' ? `${priceIds.starter.credits} credits` : `${priceIds.starter.credits * 12} credits/year`} // Show credits
          features={[
            { name: `${priceIds.starter.credits} credits/month`, highlight: true }, // Show credits
            { name: 'Access all features' },
            { name: 'Basic analytics' },
            { name: 'Email support' },
          ]}
          buttonText={isPremium ? 'Current Plan' : 'Buy Starter Plan'}
          buttonAction={() => handlePlanClick('starter', priceIds.starter[planType])}
          disabled={isPremium || isLoading}
          isPopular={false}
          user={user}
          isPremium={isPremium}
          creditsRemaining={creditsRemaining}
          trialUsed={trialUsed}
        />

        {/* Professional Plan - Adjusted from Solo */}
        <PricingPlanCard
          type="professional"
          title="Professional"
          description="For sales reps"
          price={
            planType === 'monthly' ? '$39/month' : '$390/year' // Adjusted price
          }
          priceDescription={planType === 'monthly' ? `${priceIds.professional.credits} credits` : `${priceIds.professional.credits * 12} credits/year`} // Show credits
          features={[
            { name: `${priceIds.professional.credits} credits/month`, highlight: true }, // Show credits
            { name: 'Unlimited practice sessions' },
            { name: 'Advanced AI Feedback' },
            { name: 'Mobile access & CRM integration' },
            { name: 'Priority support' },
          ]}
          buttonText={isPremium ? 'Current Plan' : 'Buy Professional Plan'}
          buttonAction={() => handlePlanClick('professional', priceIds.professional[planType])}
          disabled={isPremium || isLoading}
          isPopular={true} // Marked as popular
          user={user}
          isPremium={isPremium}
          creditsRemaining={creditsRemaining}
          trialUsed={trialUsed}
        />

        {/* Team Plan - Adjusted from Professional */}
        <PricingPlanCard
          type="team"
          title="Team"
          description="For growing teams"
          price={
            planType === 'monthly' ? 'Custom Quote' : 'Custom Quote'
          }
          priceDescription="contact sales"
          features={[
            { name: 'Everything in Professional' },
            { name: 'Team management & analytics' },
            { name: 'Custom AI training' },
            { name: 'Dedicated account manager' },
          ]}
          buttonText="Contact Sales"
          buttonVariant="outline"
          buttonAction={handleContactSales} // Direct to sales contact
          disabled={isLoading}
          user={user}
          isPremium={isPremium}
          creditsRemaining={creditsRemaining}
          trialUsed={trialUsed}
        />
      </div>

      {/* Enterprise Plan CTA - Adjusted */}
      <div className="mt-16 text-center">
        <h3 className="text-2xl font-bold text-brand-dark mb-2">Need more customization?</h3>
        <p className="text-brand-dark/70 mb-4">We support enterprise needs and custom deployments</p>
        <button
          onClick={handleContactSales}
          className="px-6 py-3 bg-brand-blue text-white font-semibold rounded-lg hover:bg-brand-blue/90 transition-all"
        >
          Contact Sales
        </button>
      </div>
    </>
  );
};

export default PricingPlans;
