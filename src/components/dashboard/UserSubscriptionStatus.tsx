
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Diamond, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isPremiumFeaturesEnabled, isPricingEnabled } from '@/config/features';

const UserSubscriptionStatus: React.FC = () => {
  const { user, isPremium, creditsRemaining, trialUsed } = useAuth();
  const navigate = useNavigate();

  // Don't show subscription status if premium features are disabled
  if (!isPremiumFeaturesEnabled()) {
    return null;
  }

  if (!user) return null;

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleDemo = () => {
    navigate('/demo');
  };

  if (isPremium) {
    return (
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Crown className="h-5 w-5 text-amber-600 mr-2" />
            Premium Member
          </CardTitle>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Active
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              You have unlimited access to all premium features including advanced analytics, 
              unlimited practice sessions, and priority support.
            </p>
            <Button 
              onClick={() => navigate('/subscription')}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trialUsed) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Diamond className="h-5 w-5 text-blue-600 mr-2" />
            Free Analysis Available
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            New User
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Welcome! You have <strong>1 free pitch analysis</strong> available. 
              Try our AI-powered feedback system and see how it can improve your sales skills.
            </p>
            <div className="flex space-x-2">
              <Button 
                onClick={handleDemo}
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                Start Free Analysis
              </Button>
              <Button 
                onClick={handleUpgrade}
                variant="outline" 
                size="sm"
              >
                View Plans
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (creditsRemaining > 0) {
    return (
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Diamond className="h-5 w-5 text-green-600 mr-2" />
            Credits Available
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {creditsRemaining} left
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              You have <strong>{creditsRemaining} credits</strong> remaining. 
              Each practice session uses 1 credit. {isPricingEnabled() ? 'Upgrade to Premium for unlimited access.' : 'Continue practicing with your available credits.'}
            </p>
            <div className="flex space-x-2">
              <Button 
                onClick={() => navigate('/practice')}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Start Practice
              </Button>
              <Button 
                onClick={handleUpgrade}
                variant="outline" 
                size="sm"
              >
                Upgrade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No credits remaining
  return (
    <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <TrendingUp className="h-5 w-5 text-red-600 mr-2" />
          Credits Needed
        </CardTitle>
        <Badge variant="destructive">
          0 credits
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            You've used all your credits! Upgrade to Premium for unlimited practice 
            sessions or purchase more credits to continue training.
          </p>
          <div className="flex space-x-2">
            <Button 
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              Top Up Credits
            </Button>
            <Button 
              onClick={() => navigate('/tips')}
              variant="outline" 
              size="sm"
            >
              View Tips
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSubscriptionStatus;
