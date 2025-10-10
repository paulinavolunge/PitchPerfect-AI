
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon, BookOpen } from 'lucide-react';

interface GettingStartedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
}

const GettingStartedModal: React.FC<GettingStartedModalProps> = ({ 
  open, 
  onOpenChange, 
  onStartTour 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-green" />
            Welcome to PitchPerfect AI
          </DialogTitle>
          <DialogDescription>
            Let's get you started with improving your sales skills!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Here's how it works:</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="bg-brand-green/20 p-1 rounded-full mt-0.5">
                <CheckIcon className="h-4 w-4 text-brand-green" />
              </div>
              <p><strong>1. Choose a scenario</strong> - Select difficulty, objection type, and industry or upload your own script.</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="bg-brand-green/20 p-1 rounded-full mt-0.5">
                <CheckIcon className="h-4 w-4 text-brand-green" />
              </div>
              <p><strong>2. Start practicing</strong> - Interact with AI customers through text or voice (premium). Adjust voice style and volume as needed.</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="bg-brand-green/20 p-1 rounded-full mt-0.5">
                <CheckIcon className="h-4 w-4 text-brand-green" />
              </div>
              <p><strong>3. Get feedback</strong> - Receive real-time responses and guidance on improving your pitch.</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="bg-brand-green/20 p-1 rounded-full mt-0.5">
                <CheckIcon className="h-4 w-4 text-brand-green" />
              </div>
              <p><strong>4. Track progress</strong> - View your history and improvements on your dashboard.</p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip tour
          </Button>
          <Button className="bg-brand-green hover:bg-brand-green/90" onClick={onStartTour}>
            Take a quick tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GettingStartedModal;
