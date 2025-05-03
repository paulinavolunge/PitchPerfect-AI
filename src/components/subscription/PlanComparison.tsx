
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckIcon, XIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

// Enterprise features (separate section)
const enterpriseFeatures = [
  { 
    name: 'Custom AI Training',
    description: 'Train AI with your specific sales methodologies'
  },
  {
    name: 'Advanced Analytics & Reporting',
    description: 'Detailed team and individual performance analytics'
  },
  {
    name: 'SSO & Advanced Security',
    description: 'Enterprise-grade security and SSO integration'
  },
  {
    name: 'Dedicated Account Manager',
    description: 'Personal support for your organization'
  },
  {
    name: 'Custom Onboarding',
    description: 'Personalized onboarding for your team'
  }
];

type EnterprisePackage = {
  name: string;
  users: string;
  price: string;
  description: string;
  features: string[];
};

const enterprisePackages: EnterprisePackage[] = [
  {
    name: "Small Enterprise",
    users: "10-25 users",
    price: "$500/month",
    description: "Perfect for small teams and departments",
    features: ["Basic custom AI training", "Standard analytics", "SSO integration", "Email support"]
  },
  {
    name: "Medium Enterprise", 
    users: "26-100 users",
    price: "$1,500/month",
    description: "Ideal for growing organizations",
    features: ["Advanced custom AI training", "Enhanced analytics", "Advanced security", "Priority support"]
  },
  {
    name: "Large Enterprise",
    users: "101+ users",
    price: "$3,000+/month",
    description: "For large organizations with custom needs",
    features: ["Fully customized AI", "Executive dashboard", "Custom integrations", "Dedicated account manager"]
  }
];

const PlanComparison: React.FC<PlanComparisonProps> = ({ isPremium, onUpgradeClick, isLoading, planType }) => {
  const { trialActive, startFreeTrial } = useAuth();
  const [selectedEnterprise, setSelectedEnterprise] = React.useState<number>(0);

  const handleTrialClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await startFreeTrial();
  };

  return (
    <div className="space-y-12">
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
      
      {/* Enterprise Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Enterprise Plans</h2>
        
        <Tabs defaultValue="0" className="w-full" onValueChange={(v) => setSelectedEnterprise(Number(v))}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="0">Small Enterprise</TabsTrigger>
            <TabsTrigger value="1">Medium Enterprise</TabsTrigger>
            <TabsTrigger value="2">Large Enterprise</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Card className="border rounded-xl p-6 bg-white shadow-md">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold">{enterprisePackages[selectedEnterprise].name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{enterprisePackages[selectedEnterprise].description}</p>
                
                <div className="mt-4">
                  <div className="text-3xl font-bold">{enterprisePackages[selectedEnterprise].price}</div>
                  <p className="text-sm text-muted-foreground">{enterprisePackages[selectedEnterprise].users}</p>
                </div>
                
                <Button 
                  className="mt-6 w-full"
                  variant="outline"
                  onClick={() => window.location.href = "mailto:sales@pitchperfectai.com?subject=Enterprise Plan Inquiry"}
                >
                  Contact Sales
                </Button>
                
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  Custom pricing and features available
                </p>
              </div>
            </div>
            
            <div className="md:w-2/3">
              <h4 className="font-medium mb-4">Included Features:</h4>
              <ul className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Standard premium features */}
                <li className="flex items-start">
                  <CheckIcon size={18} className="text-green-500 mr-2 mt-0.5" />
                  <span>All Premium Plan features</span>
                </li>
                
                {/* Enterprise specific features */}
                {enterpriseFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckIcon size={18} className="text-green-500 mr-2 mt-0.5" />
                    <div>
                      <span>{feature.name}</span>
                      {feature.description && (
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      )}
                    </div>
                  </li>
                ))}
                
                {/* Package specific features */}
                {enterprisePackages[selectedEnterprise].features.map((feature, idx) => (
                  <li key={`package-${idx}`} className="flex items-start">
                    <CheckIcon size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlanComparison;
