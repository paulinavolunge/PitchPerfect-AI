
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Crown, Check, Calendar, Clock } from 'lucide-react';

const UserSubscriptionStatus = () => {
  const { isPremium, subscriptionTier, subscriptionEnd, trialActive, trialEndsAt, startFreeTrial } = useAuth();
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDaysRemaining = (endDate: Date | null) => {
    if (!endDate) return 0;
    
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };
  
  return (
    <Card className={`border ${isPremium ? 'border-brand-green' : trialActive ? 'border-amber-400' : 'border-gray-200'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${
            isPremium ? 'bg-brand-green/20' : 
            trialActive ? 'bg-amber-100' : 
            'bg-gray-100'
          }`}>
            <Crown className={`h-6 w-6 ${
              isPremium ? 'text-brand-green' : 
              trialActive ? 'text-amber-500' : 
              'text-gray-400'
            }`} />
          </div>
          <div>
            <h3 className="font-medium text-lg">
              {isPremium ? 'Premium Subscription Active' : 
               trialActive ? 'Free Trial Active' : 
               'Free Plan'}
            </h3>
            {isPremium ? (
              <div className="space-y-2 mt-2">
                <p className="text-sm text-gray-600">
                  You have access to all premium features.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Renews on {formatDate(subscriptionEnd)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full font-medium">
                    {subscriptionTier || 'Premium'}
                  </span>
                </div>
              </div>
            ) : trialActive ? (
              <div className="space-y-2 mt-2">
                <p className="text-sm text-gray-600">
                  You have temporary access to premium features.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{calculateDaysRemaining(trialEndsAt)} days remaining • Ends on {formatDate(trialEndsAt?.toISOString() || null)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Trial
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                <p className="text-sm text-gray-600">
                  Try our 7-day free trial or upgrade to unlock all premium features.
                </p>
                <ul className="space-y-1 mt-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-gray-400" />
                    <span>Basic roleplay scenarios</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-gray-400" />
                    <span>Limited feedback</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-6">
        {isPremium ? (
          <Link to="/subscription" className="w-full">
            <Button variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </Link>
        ) : trialActive ? (
          <Link to="/subscription" className="w-full">
            <Button className="w-full bg-brand-green hover:bg-brand-green/90">
              Upgrade to Premium
            </Button>
          </Link>
        ) : (
          <div className="w-full grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={startFreeTrial}
            >
              Start Free Trial
            </Button>
            <Link to="/subscription" className="w-full">
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
