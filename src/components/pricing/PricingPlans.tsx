
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
  
  // Calculate days remaining in trial
  const calculateDaysRemaining = () => {
    if (!trialEndsAt) return 0;
    
    const now = new Date();
    const diffTime = trialEndsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };
  
  // Handle actions
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

  // Define enterprise plan details based on size
  const enterprisePlans = {
    small: {
      name: "Small Enterprise",
      price: "$500",
      users: "10-25",
      features: [
        "All Team features",
        "Basic custom AI training",
        "Standard analytics dashboard",
        "SSO integration",
        "Email support"
      ]
    },
    medium: {
      name: "Medium Enterprise",
      price: "$1,500",
      users: "26-100",
      features: [
        "All Small Enterprise features",
        "Advanced custom AI training",
        "Enhanced analytics and reporting",
        "Advanced SSO and security",
        "Priority support with 24-hour response"
      ]
    },
    large: {
      name: "Large Enterprise",
      price: "$3,000+",
      users: "101+",
      features: [
        "All Medium Enterprise features",
        "Fully customized AI training",
        "Executive analytics dashboard",
        "Custom integrations",
        "Dedicated account manager",
        "Custom onboarding and training"
      ]
    }
  };

  // Determine button text for Team plan based on user status and plan type
  const getTeamButtonText = () => {
    if (!user) {
      return planType === "monthly" ? "Sign up for Monthly Team" : "Sign up for Yearly Team";
    } else if (isPremium) {
      return "Manage Subscription";
    } else if (trialActive) {
      return `Upgrade Trial to ${planType === "monthly" ? "Monthly" : "Yearly"}`;
    } else {
      return `Upgrade to ${planType === "monthly" ? "Monthly" : "Yearly"} Team`;
    }
  };

  const daysLeft = calculateDaysRemaining();

  return (
    <>
      {/* Time-limited offer card for Team plan */}
      <div className="max-w-md mx-auto mb-8">
        <TimeOffer 
          expiryDate={promoExpiryDate}
          discount="Get 1 Month Free"
          description="Sign up for the annual Team Plan and get your first month free"
          variant="card"
          ctaText="Claim This Deal"
          ctaLink="/subscription?plan=yearly"
        />
      </div>
      
      {trialActive && !isPremium && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
            <p className="font-medium text-amber-800">Your free trial is active</p>
          </div>
          <p className="text-amber-700 text-sm mb-2">
            ⚠️ Only {daysLeft} days left in your trial. Upgrade now to keep access to premium features.
          </p>
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto pricing-cards">
        {/* Solo Plan */}
        <PricingPlanCard
          type="solo"
          title="Solo"
          description="Perfect for individuals"
          price={<span className="text-4xl font-bold">$0</span>}
          priceDescription="forever"
          features={[
            { name: "Basic sales practice tools" },
            { name: "Limited AI tips and feedback" },
            { name: "Progress tracking dashboard" },
            { name: "Community support" }
          ]}
          buttonText={!user ? "Sign up free" : "Current plan"}
          buttonVariant="outline"
          buttonAction={() => navigate('/signup')}
          isCurrentPlan={user && !isPremium && !trialActive}
          disabled={isPremium || trialActive}
        />
        
        {/* Team Plan */}
        <PricingPlanCard
          type="team"
          title="Team"
          description="For growing teams"
          price={
            planType === "monthly" ? (
              <>
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-500 ml-2">/ user / month</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-bold">$290</span>
                <span className="text-gray-500 ml-2">/ user / year</span>
                <p className="text-sm text-green-600 mt-1">Save $58 (17% off)</p>
              </>
            )
          }
          features={[
            { name: "All Solo plan features" },
            { name: "AI roleplay practice with voice or text", highlight: true },
            { name: "Team analytics dashboard" },
            { name: "Unlimited AI tips and suggestions" },
            { name: "Priority support" }
          ]}
          buttonText={getTeamButtonText()}
          buttonAction={!user ? handleSignupClick : handleUpgradeClick}
          isCurrentPlan={isPremium || trialActive}
          isPopular={true}
          trialBadge={trialActive && !isPremium}
          // Always enable the Team button regardless of current plan status
          disabled={false}
        />
        
        {/* Enterprise Plan */}
        <PricingPlanCard
          type="enterprise"
          title="Enterprise"
          description="For larger organizations"
          price=""
          features={[]}
          buttonText="Contact Sales"
          buttonVariant="outline"
          buttonAction={handleContactSales}
          enterpriseProps={{
            sizes: enterprisePlans,
            enterpriseSize,
            setEnterpriseSize
          }}
        />
      </div>
    </>
  );
};

export default PricingPlans;
