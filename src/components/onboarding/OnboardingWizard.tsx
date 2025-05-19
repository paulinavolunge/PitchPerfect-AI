
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageSquare, Trophy, Mic, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ 
  open, 
  onOpenChange, 
  onStartTour 
}) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const steps = [
    {
      title: "Welcome to PitchPerfect AI",
      icon: <BookOpen className="w-12 h-12 text-brand-green" />,
      description: "Let's get you ready to improve your sales skills with AI-powered practice and feedback.",
    },
    {
      title: "Practice Makes Perfect",
      icon: <Mic className="w-12 h-12 text-brand-blue" />,
      description: "Record your sales pitches and get instant AI feedback on your delivery, content, and persuasiveness.",
    },
    {
      title: "Roleplay with AI",
      icon: <MessageSquare className="w-12 h-12 text-purple-600" />,
      description: "Simulate real customer interactions with our AI roleplay feature. Practice handling objections and closing deals.",
    },
    {
      title: "Track Your Progress",
      icon: <Trophy className="w-12 h-12 text-amber-500" />,
      description: "Earn badges, build streaks, and see your improvement over time with detailed analytics.",
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onOpenChange(false);
      
      // Set a flag in sessionStorage to indicate a new session
      sessionStorage.setItem('newSessionLogin', 'true');
      
      // Remove any existing tour completion flag to ensure the tour runs
      localStorage.removeItem('pitchperfect_tour_completed');
      
      // Start the guided tour
      onStartTour();
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('pitchperfect_tour_completed', 'true'); // Also mark tour as completed if skipped
  };

  const handleGoToFeature = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <Badge variant="outline" className="bg-brand-green/10 text-brand-green border-brand-green/30 px-2">
              New User
            </Badge>
          </div>
          <div className="flex justify-center mb-4">
            {steps[step].icon}
          </div>
          <DialogTitle className="text-center text-xl">
            {steps[step].title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-center text-muted-foreground">
            {steps[step].description}
          </p>
        </div>

        <div className="flex justify-center mt-2 mb-6">
          {steps.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 w-2 rounded-full mx-1 ${index === step ? 'bg-brand-green' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        
        {step === steps.length - 1 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2" 
              onClick={() => handleGoToFeature('/practice')}
            >
              <Mic className="h-4 w-4" />
              Try Practice
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2" 
              onClick={() => handleGoToFeature('/roleplay')}
            >
              <MessageSquare className="h-4 w-4" />
              Try Roleplay
            </Button>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between mt-2">
          <Button 
            variant="outline" 
            onClick={handleSkip}
          >
            Skip
          </Button>
          <Button 
            onClick={handleNext} 
            className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90"
          >
            {step === steps.length - 1 ? 'Take Tour' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
