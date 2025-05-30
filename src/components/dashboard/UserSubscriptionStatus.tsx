import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Crown, Check, Diamond } from 'lucide-react'; // Added Diamond for credits, removed Calendar, Clock

const UserSubscriptionStatus = () => {
  // Access creditsRemaining and trialUsed from useAuth
  const { user, isPremium, subscriptionTier, creditsRemaining, trialUsed } = useAuth();

  const getStatusMessage = () => {
    if (!user) {
      // Should not happen if this component is rendered inside authenticated route, but for safety
      return "Please log in to see your status.";
    }
    if (isPremium) {
      return `You're on the ${subscriptionTier} plan with unlimited access.`;
    }
    if (trialUsed) {
      // If trial has been used, display current credits
      return `You have ${creditsRemaining} credits remaining.`;
    }
    // If trial not used, offer 1 free pitch analysis
    return "New users get 1 Free Pitch Analysis. Upgrade for more!";
  };

  const getCardBorderClass = () => {
    if (isPremium) return 'border-brand-green';
    if (creditsRemaining > 0) return 'border-brand-blue'; // Has credits, but not premium
    if (!trialUsed) return 'border-yellow-400'; // Has free pitch analysis available
    return 'border-gray-200'; // No credits, trial used, free plan
  };

  return (
    <Card className={`border ${getCardBorderClass()}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${
            isPremium ? 'bg-brand-green/20' : 
            (creditsRemaining > 0 || !trialUsed) ? 'bg-brand-blue/20' : // Has credits or free pitch
            'bg-gray-100'
          }`}>
            <Crown className={`h-6 w-6 ${
              isPremium ? 'text-brand-green' : 
              (creditsRemaining > 0 || !trialUsed) ? 'text-brand-blue' : 
              'text-gray-400'
            }`} />
          </div>
          <div>
            <h3 className="font-medium text-lg">
              {isPremium ? 'Premium Subscription Active' : 
               (creditsRemaining > 0) ? 'Active with Credits' : 
               (!trialUsed ? 'Free Pitch Analysis Available' : 'Free Plan')}
            </h3>
            <div className="space-y-2 mt-2">
              <p className="text-sm text-gray-600">
                {getStatusMessage()}
              </p>

              {isPremium && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full font-medium">
                    {subscriptionTier || 'Premium'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {/* Subscription end date logic here if needed, but not central to credits */}
                  </span>
                </div>
              )}

              {!isPremium && ( // If not premium, display credits or prompt for analysis
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Diamond className="h-4 w-4" />
                  <span>{creditsRemaining} credits remaining</span>
                </div>
              )}

              {!isPremium && !trialUsed && ( // Specifically for new users before their 1 free analysis
                <ul className="space-y-1 mt-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-gray-400" />
                    <span>1 Free Pitch Analysis</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-gray-400" />
                    <span>Basic features</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-6">
        {isPremium ? (
          <Link to="/pricing" className="w-full"> {/* Changed to pricing for credit purchase */}
            <Button variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </Link>
        ) : (
          <div className="w-full grid grid-cols-2 gap-2">
            {!trialUsed && creditsRemaining === 0 ? ( // If trial not used and no credits, offer 1 free pitch analysis
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={startFreeTrial}
              >
                Get 1 Free Pitch Analysis
              </Button>
            ) : null}

            <Link to="/pricing" className={`w-full ${(!trialUsed && creditsRemaining === 0) ? '' : 'col-span-2'}`}> {/* Make Upgrade button span 2 columns if only option */}
              <Button className="w-full bg-brand-green hover:bg-brand-green/90">
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default UserSubscriptionStatus;
