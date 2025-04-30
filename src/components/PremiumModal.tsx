
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LockKeyhole } from 'lucide-react';

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
}

const PremiumModal = ({ open, onOpenChange, featureName }: PremiumModalProps) => {
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    onOpenChange(false);
    navigate('/subscription');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto bg-brand-green/10 p-3 rounded-full">
            <LockKeyhole className="h-6 w-6 text-brand-green" />
          </div>
          <DialogTitle className="text-center pt-4">Premium Feature</DialogTitle>
          <DialogDescription className="text-center">
            {featureName.charAt(0).toUpperCase() + featureName.slice(1)} is a premium feature. Upgrade to access this and all other premium features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="font-medium text-center mb-4">Premium Benefits</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-brand-green mr-2 flex-shrink-0 mt-0.5" />
              <span>Voice interaction with AI roleplays</span>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-brand-green mr-2 flex-shrink-0 mt-0.5" />
              <span>Advanced objection tracking and analytics</span>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-brand-green mr-2 flex-shrink-0 mt-0.5" />
              <span>Access to all industry scenarios</span>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-brand-green mr-2 flex-shrink-0 mt-0.5" />
              <span>Unlimited practice sessions</span>
            </li>
          </ul>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handleUpgradeClick}
            className="w-full sm:w-auto bg-brand-green hover:bg-brand-green/90"
          >
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
