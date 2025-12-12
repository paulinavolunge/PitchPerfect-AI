import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { AlertCircle, Zap, Crown, TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface EnhancedCreditsBarProps {
  credits?: number;
  maxCredits?: number;
  isPremium?: boolean;
}

const EnhancedCreditsBar: React.FC<EnhancedCreditsBarProps> = ({ 
  credits: propCredits, 
  maxCredits = 10,
  isPremium: propIsPremium 
}) => {
  const navigate = useNavigate();
  const { creditsRemaining: authCredits, isPremium: authIsPremium } = useAuth();
  
  // Use props if provided, otherwise fall back to auth context
  const creditsRemaining = propCredits ?? authCredits ?? 0;
  const isPremium = propIsPremium ?? authIsPremium ?? false;
  
  const [showLowCreditsModal, setShowLowCreditsModal] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [hasShownLowCreditsWarning, setHasShownLowCreditsWarning] = useState(false);

  // Calculate progress percentage
  const progressPercentage = isPremium ? 100 : Math.min((creditsRemaining / maxCredits) * 100, 100);
  
  // Determine status color
  const getStatusColor = () => {
    if (isPremium) return 'bg-gradient-to-r from-purple-500 to-indigo-500';
    if (creditsRemaining === 0) return 'bg-red-500';
    if (creditsRemaining <= 3) return 'bg-orange-500';
    return 'bg-primary-600';
  };

  const getProgressColor = () => {
    if (isPremium) return 'bg-gradient-to-r from-purple-500 to-indigo-500';
    if (creditsRemaining === 0) return 'bg-red-500';
    if (creditsRemaining <= 3) return 'bg-orange-500';
    return 'bg-primary-600';
  };

  // Show modals based on credit count
  useEffect(() => {
    // Check if we've already shown the low credits warning this session
    const sessionWarningShown = sessionStorage.getItem('lowCreditsWarningShown');
    
    if (creditsRemaining === 0 && !isPremium) {
      setShowNoCreditsModal(true);
    } else if (creditsRemaining <= 3 && creditsRemaining > 0 && !isPremium && !hasShownLowCreditsWarning && !sessionWarningShown) {
      setShowLowCreditsModal(true);
      setHasShownLowCreditsWarning(true);
      sessionStorage.setItem('lowCreditsWarningShown', 'true');
    }
  }, [creditsRemaining, isPremium, hasShownLowCreditsWarning]);

  return (
    <>
      {/* Credits Display Card */}
      <Card className={`border-2 ${creditsRemaining <= 3 && !isPremium ? 'border-orange-200 bg-orange-50' : 'border-gray-100'} transition-colors duration-300`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isPremium ? (
                <Crown className="h-5 w-5 text-purple-600" />
              ) : (
                <Zap className="h-5 w-5 text-primary-600" />
              )}
              <span className="font-semibold text-foreground">
                {isPremium ? 'Premium Plan' : 'Credits'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${creditsRemaining === 0 && !isPremium ? 'text-red-600' : creditsRemaining <= 3 && !isPremium ? 'text-orange-600' : 'text-foreground'}`}>
                {isPremium ? (
                  <span className="flex items-center gap-1 text-purple-600">
                    <Sparkles className="h-5 w-5" />
                    Unlimited
                  </span>
                ) : (
                  <>
                    {creditsRemaining}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / {maxCredits}
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {!isPremium && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor()}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {creditsRemaining === 0 
                    ? 'No credits remaining' 
                    : creditsRemaining === 1 
                      ? '1 practice session left'
                      : `${creditsRemaining} practice sessions left`
                  }
                </span>
                
                {!isPremium && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/pricing')}
                    className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 -mr-2"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Get More
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Premium badge */}
          {isPremium && (
            <p className="text-sm text-muted-foreground">
              Enjoy unlimited practice sessions with your Pro subscription.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Low Credits Warning Modal (non-blocking) */}
      <Dialog open={showLowCreditsModal} onOpenChange={setShowLowCreditsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Running Low on Credits
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>You have <strong>{creditsRemaining}</strong> practice sessions remaining.</p>
              <p className="font-medium">
                Consider upgrading to Pro for:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Unlimited practice sessions</li>
                <li>Advanced AI feedback</li>
                <li>Detailed progress analytics</li>
                <li>Custom scenarios for your industry</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLowCreditsModal(false)}
              className="flex-1"
            >
              Continue with Free
            </Button>
            <Button
              onClick={() => {
                setShowLowCreditsModal(false);
                navigate('/pricing');
              }}
              className="flex-1 bg-primary-600 hover:bg-primary-700"
            >
              View Pricing
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* No Credits Modal (blocking) */}
      <Dialog open={showNoCreditsModal} onOpenChange={setShowNoCreditsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-red-600" />
              You're Out of Credits
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-3">
              <p className="text-base">
                You've used all your free practice sessions. Ready to unlock unlimited practice?
              </p>
              
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-primary-900">Pro Plan - $29/month</p>
                <ul className="space-y-1 text-sm text-primary-800">
                  <li>✓ Unlimited practice sessions</li>
                  <li>✓ Advanced AI feedback</li>
                  <li>✓ Voice & text modes</li>
                  <li>✓ Progress analytics</li>
                  <li>✓ Custom scenarios</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                💡 <strong>ROI Calculation:</strong> If this helps you close just 1 extra deal per month, 
                it pays for itself 10x over.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Button
              size="lg"
              onClick={() => {
                setShowNoCreditsModal(false);
                navigate('/pricing');
              }}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Pro
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNoCreditsModal(false)}
            >
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedCreditsBar;
