
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, Skip, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface OnboardingStepData {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  isOptional?: boolean;
  completionCriteria?: () => boolean;
}

const EnhancedOnboardingFlow: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  const steps: OnboardingStepData[] = [
    {
      id: 'welcome',
      title: 'Welcome to PitchPerfect AI',
      description: 'Let\'s get you started with personalized sales training',
      component: (
        <div className="text-center p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <Star className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2">Ready to improve your sales skills?</h3>
          <p className="text-gray-600">This quick setup will personalize your experience</p>
        </div>
      )
    },
    {
      id: 'industry',
      title: 'Select Your Industry',
      description: 'Help us customize scenarios for your field',
      component: (
        <div className="grid grid-cols-2 gap-3 p-4">
          {['Technology', 'Healthcare', 'Finance', 'Real Estate', 'Insurance', 'Other'].map((industry) => (
            <Button
              key={industry}
              variant="outline"
              onClick={() => handleIndustrySelect(industry)}
              className="h-12 text-left justify-start hover:bg-blue-50"
            >
              {industry}
            </Button>
          ))}
        </div>
      )
    },
    {
      id: 'goals',
      title: 'What\'s Your Main Goal?',
      description: 'We\'ll focus your training on what matters most',
      component: (
        <div className="space-y-3 p-4">
          {[
            'Handle price objections better',
            'Improve closing techniques',
            'Build rapport with prospects',
            'Overcome competitor comparisons'
          ].map((goal) => (
            <Button
              key={goal}
              variant="outline"
              onClick={() => handleGoalSelect(goal)}
              className="w-full text-left justify-start h-12 hover:bg-green-50"
            >
              {goal}
            </Button>
          ))}
        </div>
      )
    },
    {
      id: 'microphone',
      title: 'Test Your Microphone',
      description: 'Ensure voice features work properly',
      isOptional: true,
      component: (
        <div className="p-6 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-600 mb-4">Click "Test Microphone" to verify audio input</p>
          <div className="space-y-2">
            <Button onClick={() => handleMicrophoneTest()} className="w-full">
              Test Microphone
            </Button>
            <Button variant="ghost" onClick={() => skipStep()} className="w-full">
              Skip for now
            </Button>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    const isNewUser = !localStorage.getItem('user_visited_before');
    
    if (isNewUser && !hasCompletedOnboarding) {
      setShowOnboarding(true);
      localStorage.setItem('user_visited_before', 'true');
    }
  }, []);

  const handleIndustrySelect = (industry: string) => {
    setUserProgress(prev => ({ ...prev, industry }));
    markStepCompleted('industry');
    nextStep();
  };

  const handleGoalSelect = (goal: string) => {
    setUserProgress(prev => ({ ...prev, goal }));
    markStepCompleted('goals');
    nextStep();
  };

  const handleMicrophoneTest = () => {
    // Simulate microphone test
    setTimeout(() => {
      markStepCompleted('microphone');
      nextStep();
    }, 1000);
  };

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const skipStep = () => {
    nextStep();
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('user_progress', JSON.stringify(userProgress));
    setShowOnboarding(false);
    
    // Navigate to demo or dashboard based on progress
    navigate('/demo');
  };

  if (!showOnboarding) return null;

  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="max-w-md mx-auto">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Setup Progress</span>
              <span className="text-sm text-gray-500">
                {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">{currentStep.title}</h2>
              <p className="text-gray-600 text-sm">{currentStep.description}</p>
              {currentStep.isOptional && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                  Optional
                </span>
              )}
            </div>

            {currentStep.component}
          </motion.div>

          <div className="flex justify-between mt-6">
            {currentStepIndex > 0 && (
              <Button variant="ghost" onClick={() => setCurrentStepIndex(currentStepIndex - 1)}>
                Back
              </Button>
            )}
            
            <div className="flex gap-2 ml-auto">
              {currentStep.isOptional && (
                <Button variant="ghost" onClick={skipStep}>
                  <Skip className="w-4 h-4 mr-1" />
                  Skip
                </Button>
              )}
              
              {currentStepIndex === steps.length - 1 ? (
                <Button onClick={completeOnboarding} className="bg-green-600 hover:bg-green-700">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                completedSteps.has(currentStep.id) && (
                  <Button onClick={nextStep}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Continue
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedOnboardingFlow;
