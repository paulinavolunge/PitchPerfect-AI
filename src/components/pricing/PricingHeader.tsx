
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

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
      return "Start free and scale as you grow. All plans include our core AI-powered sales training features.";
    }
  };

  return (
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-brand-dark bg-gradient-to-r from-brand-dark to-brand-blue bg-clip-text">
        {getTitle()}
      </h1>
      <p className="text-xl text-brand-dark/70 max-w-3xl mx-auto mb-12 leading-relaxed">
        {getSubtitle()}
      </p>
      
      {!isPremium && (
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center space-x-1 shadow-inner">
            <button
              className={`px-6 py-3 rounded-lg transition-all duration-300 font-medium flex items-center space-x-2 ${
                planType === 'monthly' 
                  ? 'bg-white text-brand-dark shadow-md transform scale-105' 
                  : 'text-gray-600 hover:text-brand-dark'
              }`}
              onClick={() => setPlanType('monthly')}
              aria-label="Show monthly pricing"
            >
              <span>Monthly</span>
            </button>
            <button
              className={`px-6 py-3 rounded-lg transition-all duration-300 font-medium flex items-center space-x-2 ${
                planType === 'yearly' 
                  ? 'bg-white text-brand-dark shadow-md transform scale-105' 
                  : 'text-gray-600 hover:text-brand-dark'
              }`}
              onClick={() => setPlanType('yearly')}
              aria-label="Show yearly pricing with discount"
            >
              <span>Annual</span>
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                <Check className="h-3 w-3" />
                <span>Save 17%</span>
              </span>
            </button>
          </div>
        </div>
      )}
      
      {planType === 'yearly' && !isPremium && (
        <div className="inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-8">
          <p className="text-green-800 text-sm font-medium">
            🎉 Annual billing saves you 17% across all plans!
          </p>
        </div>
      )}
      
      {isPremium && (
        <div className="mt-6">
          <Button 
            onClick={() => navigate('/subscription')}
            className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-3 text-lg"
          >
            Manage Subscription
          </Button>
        </div>
      )}
    </div>
  );
};

export default PricingHeader;
