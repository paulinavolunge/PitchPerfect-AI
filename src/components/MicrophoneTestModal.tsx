
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
    if (passed && onComplete) {
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
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
        
        <div className="my-2">
          <MicrophoneTest 
            onTestComplete={handleTestComplete} 
            autoStart={true}
          />
        </div>
        
        <DialogFooter className="sm:justify-between flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
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
