
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { Lock } from 'lucide-react';

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({
  open,
  onOpenChange,
  featureName,
}) => {
  const navigate = useNavigate();
  const { user, isPremium, trialActive, trialEndsAt, startFreeTrial } = useAuth();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/subscription');
  };

  const handleStartTrial = async () => {
    try {
      await startFreeTrial();
      onOpenChange(false);
    } catch (error) {
      console.error('Error starting trial:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto bg-amber-100 p-3 rounded-full mb-4">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">Premium Feature</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {trialActive ? (
              <>
                <p className="mb-2">
                  You're currently in your free trial period which ends on {formatDate(trialEndsAt!)}
                </p>
                <p>
                  Enjoy access to <span className="font-medium">{featureName}</span> and other premium features!
                </p>
              </>
            ) : (
              <>
                <p className="mb-2">
                  <span className="font-medium">{featureName}</span> is a premium feature.
                </p>
                <p>
                  {!user 
                    ? "Sign up to start your 7-day free trial or upgrade to premium."
                    : "Start your 7-day free trial or upgrade to premium to access this feature."}
                </p>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {!user ? (
            <>
              <Button variant="outline" onClick={() => {
                onOpenChange(false);
                navigate('/signup');
              }} className="w-full">
                Sign Up
              </Button>
              <Button onClick={() => {
                onOpenChange(false);
                navigate('/login');
              }} className="w-full bg-brand-green hover:bg-brand-green/90">
                Login
              </Button>
            </>
          ) : trialActive ? (
            <Button onClick={handleUpgrade} className="w-full bg-brand-green hover:bg-brand-green/90">
              Upgrade to Premium
            </Button>
          ) : (
            <>
              <Button onClick={handleStartTrial} variant="outline" className="w-full">
                Start 7-Day Free Trial
              </Button>
              <Button onClick={handleUpgrade} className="w-full bg-brand-green hover:bg-brand-green/90">
                Upgrade to Premium
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
