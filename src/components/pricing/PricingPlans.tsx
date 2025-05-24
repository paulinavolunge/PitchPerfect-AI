
import React from 'react';
import PricingPlanCard from './PricingPlanCard';
import TimeOffer from '@/components/promotion/TimeOffer';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface PricingPlansProps {
  planType: "monthly" | "yearly";
  enterpriseSize: "small" | "medium" | "large";
  setEnterpriseSize: (size: "small" | "medium" | "large") => void;
  promoExpiryDate: Date;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ 
  planType, 
  enterpriseSize, 
  setEnterpriseSize, 
  promoExpiryDate 
}) => {
  const { user, isPremium, trialActive, trialEndsAt } = useAuth();
  const navigate = useNavigate();
  
  const calculateDaysRemaining = () => {
    if (!trialEndsAt) return 0;
    
    const now = new Date();
    const diffTime = trialEndsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };
  
  const handleUpgradeClick = () => {
    if (!user) {
      navigate('/login', { state: { from: '/subscription' } });
      return;
    }
    navigate('/subscription');
  };

  const handleSignupClick = () => {
    navigate('/signup', { state: { from: '/subscription', plan: planType } });
  };

  const handleContactSales = () => {
    window.location.href = "mailto:sales@pitchperfectai.com?subject=Enterprise Pricing Inquiry";
  };

  const daysLeft = calculateDaysRemaining();

  return (
    <>
      {/* Time-limited offer banner */}
      <div className="max-w-4xl mx-auto mb-8">
        <TimeOffer 
          expiryDate={promoExpiryDate}
          discount="Save 20% on Annual Plans"
          description="Switch to annual billing and get two months free"
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
            ⚠️ Only {daysLeft} days left in your trial. Choose a plan to continue accessing premium features.
          </p>
        </div>
      )}
      
      {/* Free Plan - Lead Magnet */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-brand-dark mb-2">Start Your Sales Training Journey</h3>
          <p className="text-brand-dark/70 max-w-2xl mx-auto">Begin with our free plan and upgrade as you grow</p>
        </div>
        
        <div className="max-w-sm mx-auto">
          <PricingPlanCard
            type="free"
            title="Free"
            description="Perfect for getting started"
            price={<span className="text-4xl font-bold">$0</span>}
            priceDescription="forever"
            features={[
              { name: "3 practice sessions per month" },
              { name: "2 basic scenarios" },
              { name: "Basic feedback" },
              { name: "Community access" }
            ]}
            buttonText={!user ? "Get Started Free" : "Current Plan"}
            buttonVariant="outline"
            buttonAction={() => navigate('/signup')}
            isCurrentPlan={user && !isPremium && !trialActive}
            disabled={isPremium || trialActive}
          />
        </div>
      </div>

      {/* Main Pricing Grid */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-brand-dark mb-2">Choose Your Perfect Plan</h3>
          <p className="text-brand-dark/70 max-w-2xl mx-auto">Upgrade to unlock advanced features and accelerate your sales success</p>
        </div>
        
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Micro Plan */}
          <PricingPlanCard
            type="micro"
            title="Micro"
            description="For occasional practice"
            price={
              planType === "monthly" ? (
                <>
                  <span className="text-3xl font-bold">$9</span>
                  <span className="text-gray-500 ml-2">/ month</span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold">$86</span>
                  <span className="text-gray-500 ml-2">/ year</span>
                  <p className="text-sm text-green-600 mt-1">Save $22 (20% off)</p>
                </>
              )
            }
            features={[
              { name: "10 practice sessions/month" },
              { name: "5 industry scenarios" },
              { name: "Basic analytics" },
              { name: "Email support" }
            ]}
            buttonText="Start 7-Day Trial"
            buttonAction={!user ? handleSignupClick : handleUpgradeClick}
            trialBadge={false}
          />

          {/* Solo Plan */}
          <PricingPlanCard
            type="solo"
            title="Solo"
            description="For individual sales reps"
            price={
              planType === "monthly" ? (
                <>
                  <span className="text-3xl font-bold">$19</span>
                  <span className="text-gray-500 ml-2">/ month</span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold">$182</span>
                  <span className="text-gray-500 ml-2">/ year</span>
                  <p className="text-sm text-green-600 mt-1">Save $46 (20% off)</p>
                </>
              )
            }
            features={[
              { name: "30 practice sessions/month" },
              { name: "8 industry scenarios" },
              { name: "Performance analytics" },
              { name: "Email support" },
              { name: "Mobile app access" },
              { name: "Basic CRM integration" }
            ]}
            buttonText="Start 14-Day Trial"
            buttonAction={!user ? handleSignupClick : handleUpgradeClick}
            trialBadge={false}
          />
          
          {/* Professional Plan - Most Popular */}
          <PricingPlanCard
            type="professional"
            title="Professional"
            description="For small sales teams"
            price={
              planType === "monthly" ? (
                <>
                  <span className="text-3xl font-bold">$79</span>
                  <span className="text-gray-500 ml-2">/ user / month</span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold">$758</span>
                  <span className="text-gray-500 ml-2">/ user / year</span>
                  <p className="text-sm text-green-600 mt-1">Save $190 (20% off)</p>
                </>
              )
            }
            features={[
              { name: "Unlimited practice sessions", highlight: true },
              { name: "15+ industry + custom scenarios", highlight: true },
              { name: "Advanced analytics & dashboards" },
              { name: "Team performance tracking" },
              { name: "Priority support & video tutorials" },
              { name: "Advanced CRM integrations" },
              { name: "Team collaboration features" }
            ]}
            buttonText="Start 14-Day Trial"
            buttonAction={!user ? handleSignupClick : handleUpgradeClick}
            isCurrentPlan={isPremium || trialActive}
            isPopular={true}
            trialBadge={trialActive && !isPremium}
          />

          {/* Team Plan */}
          <PricingPlanCard
            type="team"
            title="Team"
            description="For medium sales departments"
            price={
              planType === "monthly" ? (
                <>
                  <span className="text-2xl font-bold">$69-59</span>
                  <span className="text-gray-500 ml-2">/ user / month</span>
                  <p className="text-xs text-gray-600 mt-1">Based on team size</p>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold">$662-566</span>
                  <span className="text-gray-500 ml-2">/ user / year</span>
                  <p className="text-xs text-gray-600 mt-1">11-49 users</p>
                </>
              )
            }
            features={[
              { name: "Everything in Professional" },
              { name: "Custom scenario builder" },
              { name: "Advanced integrations" },
              { name: "Dedicated account manager" },
              { name: "Custom reporting & ROI tracking" },
              { name: "Limited white-label options" }
            ]}
            buttonText="Start 14-Day Trial"
            buttonVariant="outline"
            buttonAction={!user ? handleSignupClick : handleUpgradeClick}
          />
        </div>
      </div>

      {/* Enterprise Plan */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-brand-dark mb-2">Enterprise Solution</h3>
          <p className="text-brand-dark/70">Custom solutions for large organizations</p>
        </div>
        
        <PricingPlanCard
          type="enterprise"
          title="Enterprise"
          description="For large organizations (50+ users)"
          price="Custom Pricing"
          features={[
            { name: "Everything in Team Plan" },
            { name: "Full white-label options" },
            { name: "Custom integrations & API access" },
            { name: "On-premise deployment options" },
            { name: "Premium training & onboarding" },
            { name: "SLA guarantees" },
            { name: "Dedicated success manager" },
            { name: "Custom development support" }
          ]}
          buttonText="Contact Sales"
          buttonVariant="outline"
          buttonAction={handleContactSales}
        />
      </div>

      {/* Trust Elements */}
      <div className="text-center mt-16 space-y-4">
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-brand-dark/70">
          <span className="flex items-center">
            ✓ 14-day free trial, no credit card required
          </span>
          <span className="flex items-center">
            ✓ Cancel anytime
          </span>
          <span className="flex items-center">
            ✓ 30-day money-back guarantee
          </span>
        </div>
        <p className="text-xs text-brand-dark/50">
          SSL encrypted • GDPR/CCPA compliant • SOC 2 Type II certified
        </p>
      </div>
    </>
  );
};

export default PricingPlans;
