
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PricingHeaderProps {
  planType: "monthly" | "yearly";
  setPlanType: (planType: "monthly" | "yearly") => void;
  trialActive?: boolean;
  isPremium?: boolean;
}

const PricingHeader: React.FC<PricingHeaderProps> = ({ 
  planType, 
  setPlanType,
  trialActive,
  isPremium
}) => {
  const navigate = useNavigate();
  
  const getTitle = () => {
    if (isPremium) {
      return "You're on the Premium Plan";
    } else if (trialActive) {
      return "Choose a Plan for After Your Trial";
    } else {
      return "Simple, Transparent Pricing";
    }
  };

  const getSubtitle = () => {
    if (isPremium) {
      return "Manage your subscription or explore other available options.";
    } else if (trialActive) {
      return "Your trial gives you access to all premium features. Choose a plan to continue when your trial ends.";
    } else {
      return "Unlock premium features and take your sales conversations to the next level.";
    }
  };

  return (
    <div className="text-center mb-12 md:mb-16">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-brand-dark">{getTitle()}</h1>
      <p className="text-lg text-brand-dark/70 max-w-2xl mx-auto mb-8">{getSubtitle()}</p>
      
      <div className="flex justify-center space-x-4 mb-8">
        <button
          className={`px-6 py-2 rounded-lg transition-all ${planType === 'monthly' 
            ? 'bg-brand-blue text-white shadow-md' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setPlanType('monthly')}
          aria-label="Show monthly pricing"
        >
          Monthly Billing
        </button>
        <button
          className={`px-6 py-2 rounded-lg transition-all flex items-center ${planType === 'yearly' 
            ? 'bg-brand-blue text-white shadow-md' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setPlanType('yearly')}
          aria-label="Show yearly pricing"
        >
          Yearly Billing
          <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Save 17%</span>
        </button>
      </div>
      
      {isPremium && (
        <div className="mt-6">
          <Button 
            onClick={() => navigate('/subscription')}
            className="bg-brand-green hover:bg-brand-green/90 text-white"
          >
            Manage Subscription
          </Button>
        </div>
      )}
    </div>
  );
};

export default PricingHeader;
