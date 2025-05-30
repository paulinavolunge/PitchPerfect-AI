
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, X, Zap, Target, BarChart3, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, feature }) => {
  const { user, isPremium, creditsRemaining, trialUsed } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  const handleSignUp = () => {
    onClose();
    navigate('/signup');
  };

  const premiumFeatures = [
    {
      icon: Zap,
      title: "Unlimited Practice Sessions",
      description: "No limits on your AI-powered role-play sessions"
    },
    {
      icon: Target,
      title: "Advanced Scenarios",
      description: "Access industry-specific and complex sales scenarios"
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description: "Comprehensive performance tracking and insights"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Manage and track your entire sales team's progress"
    }
  ];

  const getTitle = () => {
    if (!user) return "Sign Up for Free Access";
    if (!trialUsed) return "Start Your Free Analysis";
    if (creditsRemaining === 0) return "You're Out of Credits";
    return `Unlock ${feature || 'Premium Features'}`;
  };

  const getDescription = () => {
    if (!user) return "Create your free account to start analyzing your pitches with AI.";
    if (!trialUsed) return "You have 1 free pitch analysis available. Try it now!";
    if (creditsRemaining === 0) return "Top up your credits to continue practicing and improving your sales skills.";
    return `Upgrade to Premium to access ${feature || 'all advanced features'} and unlimited practice sessions.`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-semibold">
                {getTitle()}
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-base text-gray-600 mt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-4">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <feature.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col space-y-3 pt-4 border-t">
            {!user ? (
              <>
                <Button
                  onClick={handleSignUp}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3"
                >
                  Sign Up Free
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Start with 1 free pitch analysis • No credit card required
                </p>
              </>
            ) : (
              <>
                <Button
                  onClick={handleUpgrade}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3"
                >
                  {creditsRemaining === 0 ? 'Top Up Credits' : 'Upgrade to Premium'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                >
                  Maybe Later
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
