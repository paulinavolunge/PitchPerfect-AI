
import React from 'react';
import PricingPlanCard from './PricingPlanCard';
import TimeOffer from '@/components/promotion/TimeOffer';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';

interface PriceIds {
  micro: { monthly: string; yearly: string };
  solo: { monthly: string; yearly: string };
  professional: { monthly: string; yearly: string };
  team: {
    small: { monthly: string; yearly: string };
    medium: { monthly: string; yearly: string };
    large: { monthly: string; yearly: string };
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
}

const PricingPlans: React.FC<PricingPlansProps> = ({
  planType,
  enterpriseSize,
  setEnterpriseSize,
  promoExpiryDate,
  onCheckout,
  priceIds,
  isLoading,
}) => {
  const { user, isPremium, trialActive, trialEndsAt } = useAuth();
  const navigate = useNavigate();

  const calculateDaysRemaining = () => {
    if (!trialEndsAt) return 0;
    const now = new Date();
    const timeDiff = trialEndsAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = calculateDaysRemaining();

  const handlePlanClick = (plan: string, priceId: string) => {
    trackEvent('plan_selected', { plan, billingCycle: planType });
    onCheckout(priceId, plan);
  };

  const handleFreeClick = () => {
    trackEvent('free_plan_signup_clicked');
    navigate('/signup');
  };

  const handleContactSales = () => {
    trackEvent('enterprise_contact_clicked');
    window.location.href = 'mailto:sales@pitchperfectai.com?subject=Enterprise Pricing Inquiry';
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
          ctaLink="/pricing"
        />
      </div>

      {trialActive && !isPremium && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
            <p className="font-medium text-amber-800">Your free trial is active</p>
          </div>
          <p className="text-amber-700 text-sm mb-2">
            ⚠️ {daysLeft} days left in your trial. Choose a plan to keep access.
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
            { name: '3 practice sessions/month' },
            { name: '2 basic scenarios' },
            { name: 'Basic feedback' },
            { name: 'Community access' },
          ]}
          buttonText={!user ? 'Get Started Free' : 'Current Plan'}
          buttonVariant="outline"
          buttonAction={handleFreeClick}
          isCurrentPlan={user && !isPremium && !trialActive}
          disabled={isPremium || trialActive || isLoading}
        />

        {/* Paid Plans */}
        <PricingPlanCard
          type="micro"
          title="Micro"
          description="Occasional sales practice"
          price={
            planType === 'monthly' ? '$9/month' : '$90/year'
          }
          features={[
            { name: '10 sessions/month' },
            { name: '5 industry scenarios' },
            { name: 'Basic analytics' },
            { name: 'Email support' },
          ]}
          buttonText="Start 7-Day Trial"
          buttonAction={() => handlePlanClick('micro', priceIds.micro[planType])}
          disabled={isLoading}
        />

        <PricingPlanCard
          type="solo"
          title="Solo"
          description="For sales reps"
          price={
            planType === 'monthly' ? '$19/month' : '$190/year'
          }
          features={[
            { name: '30 sessions/month' },
            { name: '8 scenarios' },
            { name: 'Performance analytics' },
            { name: 'Mobile access' },
            { name: 'Basic CRM integration' },
          ]}
          buttonText="Start 14-Day Trial"
          buttonAction={() => handlePlanClick('solo', priceIds.solo[planType])}
          disabled={isLoading}
        />

        <PricingPlanCard
          type="professional"
          title="Professional"
          description="For sales teams"
          price={
            planType === 'monthly' ? '$79/user/month' : '$790/user/year'
          }
          features={[
            { name: 'Unlimited sessions', highlight: true },
            { name: '15+ scenarios', highlight: true },
            { name: 'Advanced dashboards' },
            { name: 'CRM integration' },
            { name: 'Priority support' },
          ]}
          buttonText="Start 14-Day Trial"
          buttonAction={() => handlePlanClick('professional', priceIds.professional[planType])}
          disabled={isLoading}
          isPopular={true}
        />

        <PricingPlanCard
          type="team"
          title="Team"
          description="For growing teams"
          price={
            planType === 'monthly' ? '$59–$69/user/month' : '$590–$690/user/year'
          }
          features={[
            { name: 'Everything in Pro' },
            { name: 'Team management' },
            { name: 'Dedicated account manager' },
            { name: 'Custom reports' },
          ]}
          buttonText="Start 14-Day Trial"
          buttonVariant="outline"
          buttonAction={() =>
            handlePlanClick('team', priceIds.team[enterpriseSize][planType])
          }
          disabled={isLoading}
        />
      </div>

      {/* Enterprise Plan CTA */}
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
