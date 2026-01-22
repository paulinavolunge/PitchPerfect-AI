
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getScenarioIntro, generateAIResponse } from '@/components/roleplay/chat/ChatLogic';
import { Progress } from "@/components/ui/progress";
import { Check, PlayCircle } from "lucide-react";
import LoadingIndicator from "@/components/ui/loading-indicator";

interface GuidedDemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type DemoStep = {
  type: 'intro' | 'customer' | 'user' | 'ai';
  content: string;
  speaker?: string;
};

const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Sample demo script
  const demoSteps: DemoStep[] = [
    {
      type: 'intro',
      content: 'Welcome to PitchPerfect AI! Let\'s see how it works with a quick demo of a pricing objection conversation.',
    },
    {
      type: 'customer',
      content: 'Your solution looks interesting, but honestly, it\'s priced higher than what we were expecting to pay.',
      speaker: 'Potential Customer'
    },
    {
      type: 'user',
      content: 'I understand price is a concern. Our pricing reflects the value we provide. When you consider the ROI and time savings, most of our customers find it pays for itself within the first 3 months.',
      speaker: 'You'
    },
    {
      type: 'ai',
      content: 'That\'s a good start addressing the pricing concern. You acknowledged their concern and focused on value rather than just defending the price. Consider asking a follow-up question to better understand their budget constraints or what price point they were expecting.',
      speaker: 'AI Coach'
    },
  ];
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPlaying) {
      const stepDuration = 4000; // 4 seconds per step
      
      // Update progress continuously
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min(100, (elapsed / stepDuration) * 100);
        setProgress(percent);
        
        if (percent < 100) {
          requestAnimationFrame(updateProgress);
        }
      };
      
      requestAnimationFrame(updateProgress);
      
      // Move to next step after duration
      timer = setTimeout(() => {
        if (currentStep < demoSteps.length - 1) {
          setCurrentStep(currentStep + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
        }
      }, stepDuration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStep, demoSteps.length]);
  
  const handleStart = () => {
    setIsPlaying(true);
  };
  
  const handleSkip = () => {
    setIsPlaying(false);
    if (onComplete) onComplete();
    onOpenChange(false);
  };
  
  const handleNextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
      if (onComplete) onComplete();
      onOpenChange(false);
    }
  };
  
  const currentStepData = demoSteps[currentStep];
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && onComplete) onComplete();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">PitchPerfect AI Demo</DialogTitle>
          <DialogDescription>
            See how our AI helps you practice handling objections in real conversations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 space-y-4">
          {!isPlaying ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <PlayCircle className="h-16 w-16 text-[#008D95] mb-4" />
              <h3 className="text-lg font-medium mb-2">Ready to see PitchPerfect AI in action?</h3>
              <p className="text-muted-foreground mb-6">
                Watch a 30-second demo of how our AI helps you handle sales objections.
              </p>
              <Button 
                onClick={handleStart} 
                className="bg-[#008D95] hover:bg-[#007A80] text-white"
              >
                Start Demo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                currentStepData.type === 'intro' ? 'bg-gray-50' :
                currentStepData.type === 'customer' ? 'bg-amber-50 border-l-4 border-amber-300' :
                currentStepData.type === 'user' ? 'bg-blue-50 border-l-4 border-blue-300' :
                'bg-green-50 border-l-4 border-green-300'
              }`}>
                {currentStepData.speaker && (
                  <div className="font-medium text-sm mb-1 text-gray-700">
                    {currentStepData.speaker}
                  </div>
                )}
                <p className="text-gray-800">{currentStepData.content}</p>
              </div>
              
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Step {currentStep + 1} of {demoSteps.length}</span>
                  <span>{Math.floor(progress)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
          >
            Skip Demo
          </Button>
          
          {isPlaying && (
            <Button
              type="button"
              onClick={handleNextStep}
              className="bg-[#008D95] hover:bg-[#007A80] text-white"
            >
              {currentStep < demoSteps.length - 1 ? "Next Step" : "Finish Demo"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuidedDemoModal;
