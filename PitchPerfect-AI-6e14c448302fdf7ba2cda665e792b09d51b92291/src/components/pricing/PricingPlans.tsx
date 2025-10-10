
import React from 'react';
import PricingPlanCard from './PricingPlanCard';
import TimeOffer from '@/components/promotion/TimeOffer';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import { User } from '@supabase/supabase-js';

interface PriceIds {
  starter: { monthly: string; yearly: string; credits: number };
  professional: { monthly: string; yearly: string; credits: number };
  team: {
    small: { monthly: string; yearly: string; credits: number };
    medium: { monthly: string; yearly: string; credits: number };
    large: { monthly: string; yearly: string; credits: number };
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
  user: User | null;
  isPremium: boolean;
  creditsRemaining: number;
  trialUsed: boolean;
}

const PricingPlans: React.FC<PricingPlansProps> = ({
  planType,
  enterpriseSize,
  setEnterpriseSize,
  promoExpiryDate,
  onCheckout,
  priceIds,
  isLoading,
  user,
  isPremium,
  creditsRemaining,
  trialUsed,
}) => {
  const navigate = useNavigate();

  const handlePlanClick = (plan: string, priceId: string) => {
    trackEvent('plan_selected', { plan, billingCycle: planType });
    onCheckout(priceId, plan);
  };

  const handleFreeClick = () => {
    trackEvent('free_plan_signup_clicked');
    if (!user) {
      navigate('/signup');
    } else if (!trialUsed && creditsRemaining === 0) {
      navigate('/demo');
    } else {
      navigate('/dashboard');
    }
  };

  const handleContactSales = () => {
    trackEvent('enterprise_contact_clicked');
    window.location.href = 'mailto:sales@pitchperfectai.com?subject=Enterprise Pricing Inquiry';
  };

  const getFreePlanButtonText = () => {
    if (!user) {
      return 'Get Started Free';
    } else if (isPremium) {
      return 'Current Plan (Premium)';
    } else if (!trialUsed && creditsRemaining === 0) {
      return 'Get 1 Free Pitch Analysis';
    } else {
      return 'Current Plan (Free)';
    }
  };

  const isFreePlanButtonDisabled = () => {
    if (!user) return false;
    if (isPremium) return true;
    if (trialUsed && creditsRemaining === 0) return true;
    return false;
  };

  const actualPriceIds = {
    basic: {
      monthly: "price_1RY7IeRv5Z8vxUAiVn18tSaO",
      credits: 50
    },
    professional: {
      monthly: "price_1RY7J9Rv5Z8vxUAimaSyVGQg",
      credits: 200
    },
    enterprise: {
      monthly: "price_1RY7JQRv5Z8vxUAiXFltiMqU",
      credits: -1
    }
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
          ctaLink="/pricing?plan=yearly"
        />
      </div>

      {user && !isPremium && !trialUsed && (
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
      {user && !isPremium && trialUsed && creditsRemaining === 0 && (
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
        <PricingPlanCard
          type="free"
          title="Free"
          description="Try before you buy"
          price={<span className="text-4xl font-bold">$0</span>}
          priceDescription="forever"
          features={[
            { name: '1 Free Pitch Analysis' },
            { name: 'Basic AI Feedback' },
            { name: 'Limited Scenarios' },
            { name: 'Community access' },
          ]}
          buttonText={getFreePlanButtonText()}
          buttonVariant="outline"
          buttonAction={handleFreeClick}
          isCurrentPlan={user && !isPremium && (trialUsed || creditsRemaining === 0)}
          disabled={isFreePlanButtonDisabled() || isLoading}
          user={user}
          isPremium={isPremium}
          creditsRemaining={creditsRemaining}
          trialUsed={trialUsed}
        />

        <PricingPlanCard
          type="basic"
          title="Basic Practice Pack"
          description="Perfect for getting started"
          price="$29/month"
          priceDescription={`${actualPriceIds.basic.credits} credits`}
          features={[
            { name: `${actualPriceIds.basic.credits} credits/month`, highlight: true },
            { name: 'Text & Voice Input' },
            { name: 'AI Feedback Analysis' },
            { name: 'Progress Tracking' },
            { name: 'Email Support' },
          ]}
          buttonText={isPremium ? 'Current Plan' : 'Get Basic Plan'}
          buttonAction={() => handlePlanClick('basic', actualPriceIds.basic.monthly)}
          disabled={isPremium || isLoading}
          isPopular={false}
          user={user}
          isPremium={isPremium}
          creditsRemaining={creditsRemaining}
          trialUsed={trialUsed}
        />

        <PricingPlanCard
          type="professional"
          title="Professional Pack"
          description="Most popular for sales pros"
          price="$79/month"
          priceDescription={`${actualPriceIds.professional.credits} credits`}
          features={[
            { name: `${actualPriceIds.professional.credits} credits/month`, highlight: true },
            { name: 'Advanced Voice Analysis' },
            { name: 'Custom Scenarios' },
            { name: 'Detailed Performance Reports' },
            { name: 'Priority Support' },
            { name: 'Team Sharing (up to 3 users)' },
          ]}
          buttonText={isPremium ? 'Current Plan' : 'Go Professional'}
          buttonAction={() => handlePlanClick('professional', actualPriceIds.professional.monthly)}
          disabled={isPremium || isLoading}
          isPopular={true}
          user={user}
          isPremium={isPremium}
          creditsRemaining={creditsRemaining}
          trialUsed={trialUsed}
        />

        <PricingPlanCard
          type="enterprise"
          title="Enterprise Pack"
          description="For teams and organizations"
          price="$199/month"
          priceDescription="unlimited credits"
          features={[
            { name: 'Unlimited Credits', highlight: true },
            { name: 'Custom Branding' },
            { name: 'Team Analytics Dashboard' },
            { name: 'Advanced Integrations' },
            { name: 'Dedicated Success Manager' },
            { name: 'Custom Training Materials' },
          ]}
          buttonText={isPremium ? 'Current Plan' : 'Go Enterprise'}
          buttonAction={() => handlePlanClick('enterprise', actualPriceIds.enterprise.monthly)}
          disabled={isPremium || isLoading}
          user={user}
          isPremium={isPremium}
          creditsRemaining={creditsRemaining}
          trialUsed={trialUsed}
        />
      </div>

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
