
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({
  open,
  onOpenChange,
  featureName = 'this feature',
}) => {
  const navigate = useNavigate();
  
  const handleUpgradeClick = () => {
    onOpenChange(false);
    navigate('/subscription');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock size={20} className="text-amber-500" /> 
            Premium Feature
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-center font-medium text-amber-800">
              Unlock {featureName} with Premium
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-center">
              Get Real-Time Feedback + Voice Roleplay Practice
            </p>
            <ul className="space-y-2 mt-4">
              <li className="flex items-start gap-2">
                <div className="text-brand-green font-bold mt-0.5">•</div>
                <p className="text-sm text-brand-dark/80">Unlimited voice roleplays with AI sales prospects</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="text-brand-green font-bold mt-0.5">•</div>
                <p className="text-sm text-brand-dark/80">Deep-dive objection handling practice</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="text-brand-green font-bold mt-0.5">•</div>
                <p className="text-sm text-brand-dark/80">Detailed performance analytics</p>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:mt-0 w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handleUpgradeClick}
            className="bg-brand-green hover:bg-brand-green/90 text-white w-full sm:w-auto"
          >
            Upgrade to Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
