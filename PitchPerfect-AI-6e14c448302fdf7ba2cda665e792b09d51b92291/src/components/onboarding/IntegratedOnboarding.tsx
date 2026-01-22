
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

interface OnboardingStep {
  title: string;
  description: string;
  action: React.ReactNode;
  completionCriteria: () => boolean;
}

export const IntegratedOnboarding: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const navigate = useNavigate();
  
  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Welcome to PitchPerfect AI",
      description: "Let's set up your experience in just a few steps. This will help us personalize your training.",
      action: (
        <Button onClick={() => setCurrentStepIndex(1)} className="w-full">
          Get Started
        </Button>
      ),
      completionCriteria: () => true
    },
    {
      title: "Select Your Industry",
      description: "We'll customize objection scenarios to your specific industry challenges.",
      action: (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => handleIndustrySelect('technology')}>Technology</Button>
          <Button variant="outline" onClick={() => handleIndustrySelect('finance')}>Finance</Button>
          <Button variant="outline" onClick={() => handleIndustrySelect('healthcare')}>Healthcare</Button>
          <Button variant="outline" onClick={() => handleIndustrySelect('retail')}>Retail</Button>
          <Button variant="outline" onClick={() => handleIndustrySelect('other')}>Other</Button>
        </div>
      ),
      completionCriteria: () => !!localStorage.getItem('selectedIndustry')
    },
    {
      title: "Your Top Sales Challenge",
      description: "What objection do you struggle with most? We'll focus your initial training here.",
      action: (
        <div className="space-y-3">
          <Button variant="outline" onClick={() => handleChallengeSelect('pricing')} className="w-full text-left justify-start">
            Handling pricing objections
          </Button>
          <Button variant="outline" onClick={() => handleChallengeSelect('competition')} className="w-full text-left justify-start">
            Differentiating from competitors
          </Button>
          <Button variant="outline" onClick={() => handleChallengeSelect('timing')} className="w-full text-left justify-start">
            Dealing with "not right now" responses
          </Button>
          <Button variant="outline" onClick={() => handleChallengeSelect('authority')} className="w-full text-left justify-start">
            Navigating decision-maker access
          </Button>
        </div>
      ),
      completionCriteria: () => !!localStorage.getItem('topChallenge')
    },
    {
      title: "Quick Voice Check",
      description: "Let's make sure your microphone is working properly for voice practice sessions.",
      action: (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-center h-32">
            {/* Microphone test component would go here */}
            <span className="text-gray-500">Microphone visualization placeholder</span>
          </div>
          <Button onClick={() => setCurrentStepIndex(4)} className="w-full">
            My Microphone Works
          </Button>
          <Button variant="link" onClick={() => setCurrentStepIndex(4)}>
            Skip for now, I'll use text input
          </Button>
        </div>
      ),
      completionCriteria: () => true
    },
    {
      title: "You're All Set!",
      description: "Your personalized training environment is ready. We recommend starting with a quick practice session.",
      action: (
        <div className="space-y-3">
          <Button onClick={() => navigateToPractice()} className="w-full">
            Start First Practice
          </Button>
          <Button variant="outline" onClick={() => completeOnboarding()} className="w-full">
            Explore Dashboard First
          </Button>
        </div>
      ),
      completionCriteria: () => true
    }
  ];
  
  const currentStep = onboardingSteps[currentStepIndex];
  const progress = ((currentStepIndex) / (onboardingSteps.length - 1)) * 100;
  
  // Check if onboarding should be shown
  useEffect(() => {
    const isComplete = localStorage.getItem('onboardingComplete');
    if (isComplete) {
      setShowOnboarding(false);
    }
  }, []);
  
  // Implementation functions
  const handleIndustrySelect = (industry: string) => {
    localStorage.setItem('selectedIndustry', industry);
    setCurrentStepIndex(2);
  };
  
  const handleChallengeSelect = (challenge: string) => {
    localStorage.setItem('topChallenge', challenge);
    setCurrentStepIndex(3);
  };
  
  const navigateToPractice = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/practice');
  };
  
  const completeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/dashboard');
  };

  const handleSkip = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboardingComplete', 'true');
  };
  
  if (!showOnboarding) {
    return null;
  }
  
  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="max-w-md">
        <div className="p-6">
          <Progress value={progress} className="mb-6" />
          
          <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
          <p className="text-gray-600 mb-6">{currentStep.description}</p>
          
          <div className="mb-6">
            {currentStep.action}
          </div>
          
          <div className="flex justify-between">
            {currentStepIndex > 0 ? (
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
              >
                Back
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                onClick={handleSkip}
              >
                Skip
              </Button>
            )}
            
            <span className="text-sm text-gray-500">
              {currentStepIndex + 1} of {onboardingSteps.length}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
