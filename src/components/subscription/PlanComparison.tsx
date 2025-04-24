
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckIcon, XIcon } from 'lucide-react';

type PlanFeature = {
  name: string;
  freeIncluded: boolean;
  premiumIncluded: boolean;
  description?: string;
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
    description: 'Access scenarios for all industries' 
  },
  { 
    name: 'Advanced AI Feedback', 
    freeIncluded: false, 
    premiumIncluded: true,
    description: 'Get detailed feedback on your performance' 
  },
  { 
    name: 'Script Analytics', 
    freeIncluded: false, 
    premiumIncluded: true,
    description: 'Detailed analysis of your sales scripts' 
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
    description: 'Practice as much as you need' 
  },
];

const PlanComparison: React.FC = () => {
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Free Plan */}
      <Card className="border border-gray-200 rounded-xl p-6 bg-white shadow-md">
        <div className="text-center pb-6 border-b">
          <h2 className="text-xl font-bold text-brand-dark">Free Plan</h2>
          <div className="mt-4 text-3xl font-bold">$0</div>
          <p className="text-sm text-muted-foreground mt-2">Forever free</p>
          <Button 
            variant="outline" 
            className="mt-6 w-full"
            disabled
          >
            Current Plan
          </Button>
        </div>
        <ul className="mt-6 space-y-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <span className="mr-2 mt-1">
                {feature.freeIncluded ? 
                  <CheckIcon size={18} className="text-green-500" /> : 
                  <XIcon size={18} className="text-gray-300" />
                }
              </span>
              <div>
                <span className={feature.freeIncluded ? 'text-brand-dark' : 'text-gray-400'}>
                  {feature.name}
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
      <Card className="border-2 border-brand-green rounded-xl p-6 bg-white shadow-lg relative">
        <div className="absolute -top-3 right-4 bg-brand-green text-white text-xs font-bold py-1 px-3 rounded-full">
          RECOMMENDED
        </div>
        <div className="text-center pb-6 border-b">
          <h2 className="text-xl font-bold text-brand-dark">Premium Plan</h2>
          <div className="mt-4 text-3xl font-bold">$29<span className="text-lg text-muted-foreground">/month</span></div>
          <p className="text-sm text-muted-foreground mt-2">Cancel anytime</p>
          <Button 
            className="mt-6 w-full bg-brand-green hover:bg-brand-green/90"
          >
            Upgrade to Premium
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
