
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MicrophoneTest from "@/components/MicrophoneTest";
import { trackEvent } from '@/utils/analytics';

interface MicrophoneTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const MicrophoneTestModal: React.FC<MicrophoneTestModalProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const [testPassed, setTestPassed] = useState<boolean | null>(null);
  
  const handleTestComplete = (passed: boolean) => {
    setTestPassed(passed);
    trackEvent('mic_test_passed', { passed });
    
    if (passed && onComplete) {
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  };
  
  const handleSkipTest = () => {
    trackEvent('mic_test_skipped');
    onOpenChange(false);
    if (onComplete) onComplete();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Microphone Check</DialogTitle>
          <DialogDescription>
            We need to check your microphone before you can start practicing. Please speak normally to test your audio levels.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-2" role="region" aria-live="polite">
          <MicrophoneTest 
            onTestComplete={handleTestComplete} 
            autoStart={true}
          />
        </div>
        
        <DialogFooter className="sm:justify-between flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkipTest}
            aria-label="Skip microphone test and continue"
          >
            Skip Check
          </Button>
          
          {testPassed !== null && (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                if (onComplete) onComplete();
              }}
              variant={testPassed ? "default" : "outline"}
              className={testPassed ? "bg-[#008D95] hover:bg-[#007A80] text-white" : ""}
              aria-label={testPassed ? "Continue to practice" : "Try microphone test again later"}
            >
              {testPassed ? "Continue" : "Try Again Later"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MicrophoneTestModal;
