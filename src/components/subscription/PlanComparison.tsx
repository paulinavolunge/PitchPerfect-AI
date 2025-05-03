
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckIcon, XIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type PlanFeature = {
  name: string;
  freeIncluded: boolean;
  premiumIncluded: boolean;
  description?: string;
  trialAvailable?: boolean;
};

type PlanComparisonProps = {
  isPremium: boolean;
  onUpgradeClick: () => void;
  isLoading: boolean;
  planType: "monthly" | "yearly";
};

const features: PlanFeature[] = [
  { 
    name: 'Basic Roleplays', 
    freeIncluded: true, 
    premiumIncluded: true,
    description: 'Practice with common sales scenarios' 
  },
  { 
    name: 'Voice Interaction', 
    freeIncluded: true, 
    premiumIncluded: true,
    description: 'Practice your pitch using voice commands' 
  },
  { 
    name: 'Basic Feedback', 
    freeIncluded: true, 
    premiumIncluded: true,
    description: 'Get simple feedback on your performance' 
  },
  { 
    name: 'All Industry Scenarios', 
    freeIncluded: false, 
    premiumIncluded: true,
    description: 'Access scenarios for all industries',
    trialAvailable: true
  },
  { 
    name: 'Advanced AI Feedback', 
    freeIncluded: false, 
    premiumIncluded: true,
    description: 'Detailed feedback on your performance',
    trialAvailable: true 
  },
  { 
    name: 'Script Analytics', 
    freeIncluded: false, 
    premiumIncluded: true,
    description: 'Detailed analysis of your sales scripts',
    trialAvailable: true 
  },
  { 
    name: 'Team Collaboration', 
    freeIncluded: false, 
    premiumIncluded: true,
    description: 'Share scripts and feedback with your team' 
  },
  { 
    name: 'Unlimited Practice Sessions', 
    freeIncluded: false, 
    premiumIncluded: true,
    description: 'Practice as much as you need',
    trialAvailable: true
  },
];

const PlanComparison: React.FC<PlanComparisonProps> = ({ isPremium, onUpgradeClick, isLoading, planType }) => {
  const { trialActive, startFreeTrial } = useAuth();

  const handleTrialClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await startFreeTrial();
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Free Plan */}
      <Card className={`border ${isPremium ? 'border-gray-200' : trialActive ? 'border-amber-400' : 'border-brand-green'} rounded-xl p-6 bg-white shadow-md relative`}>
        {!isPremium && !trialActive && (
          <div className="absolute -top-3 right-4 bg-brand-green text-white text-xs font-bold py-1 px-3 rounded-full">
            CURRENT PLAN
          </div>
        )}
        {trialActive && !isPremium && (
          <div className="absolute -top-3 right-4 bg-amber-400 text-white text-xs font-bold py-1 px-3 rounded-full">
            TRIAL ACTIVE
          </div>
        )}
        <div className="text-center pb-6 border-b">
          <h2 className="text-xl font-bold text-brand-dark">Free Plan</h2>
          <div className="mt-4 text-3xl font-bold">$0</div>
          <p className="text-sm text-muted-foreground mt-2">Forever free</p>
          {!trialActive ? (
            <Button 
              variant="outline" 
              className="mt-6 w-full"
              onClick={handleTrialClick}
              disabled={isPremium}
            >
              {isPremium ? 'Available Features' : 'Start 7-Day Free Trial'}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="mt-6 w-full"
              disabled
            >
              Trial Active
            </Button>
          )}
        </div>
        <ul className="mt-6 space-y-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <span className="mr-2 mt-1">
                {feature.freeIncluded ? 
                  <CheckIcon size={18} className="text-green-500" /> : 
                  feature.trialAvailable && trialActive ?
                  <CheckIcon size={18} className="text-amber-500" /> :
                  <XIcon size={18} className="text-gray-300" />
                }
              </span>
              <div>
                <span className={
                  feature.freeIncluded ? 'text-brand-dark' : 
                  (feature.trialAvailable && trialActive) ? 'text-brand-dark' : 
                  'text-gray-400'
                }>
                  {feature.name}
                  {feature.trialAvailable && trialActive && !feature.freeIncluded && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Trial
                    </span>
                  )}
                </span>
                {feature.description && (
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
      
      {/* Premium Plan */}
      <Card className={`${isPremium ? 'border-2 border-brand-green' : 'border'} rounded-xl p-6 bg-white shadow-lg relative`}>
        {isPremium && (
          <div className="absolute -top-3 right-4 bg-brand-green text-white text-xs font-bold py-1 px-3 rounded-full">
            CURRENT PLAN
          </div>
        )}
        {!isPremium && (
          <div className="absolute -top-3 right-4 bg-brand-green text-white text-xs font-bold py-1 px-3 rounded-full">
            RECOMMENDED
          </div>
        )}
        <div className="text-center pb-6 border-b">
          <h2 className="text-xl font-bold text-brand-dark">Premium Plan</h2>
          <div className="mt-4">
            {planType === "monthly" ? (
              <>
                <span className="text-3xl font-bold">$29</span>
                <span className="text-lg text-muted-foreground">/month</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold">$290</span>
                <span className="text-lg text-muted-foreground">/year</span>
                <p className="text-sm text-green-600 mt-1">Save 17% compared to monthly</p>
              </>
            )}
          </div>
          <Button 
            className="mt-6 w-full bg-brand-green hover:bg-brand-green/90"
            onClick={onUpgradeClick}
            disabled={isPremium || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isPremium ? (
              'Current Plan'
            ) : (
              'Upgrade to Premium'
            )}
          </Button>
        </div>
        <ul className="mt-6 space-y-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <span className="mr-2 mt-1">
                {feature.premiumIncluded ? 
                  <CheckIcon size={18} className="text-green-500" /> : 
                  <XIcon size={18} className="text-gray-300" />
                }
              </span>
              <div>
                <span className="text-brand-dark">{feature.name}</span>
                {feature.description && (
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default PlanComparison;
