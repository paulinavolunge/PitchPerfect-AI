import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to PitchPerfect AI! 🎉',
    description: 'Let\'s take a quick tour to help you get started with improving your sales conversations.',
    target: '[data-onboarding="welcome"]',
    placement: 'bottom'
  },
  {
    id: 'demo-button',
    title: 'Try the Demo',
    description: 'Start here to experience our AI-powered sales training. Practice your pitch and get instant feedback!',
    target: '[data-onboarding="demo-button"]',
    placement: 'bottom'
  },
  {
    id: 'features',
    title: 'Key Features',
    description: 'Explore voice training, real-time feedback, and progress tracking to master your sales techniques.',
    target: '[data-onboarding="features"]',
    placement: 'top'
  },
  {
    id: 'pricing',
    title: 'Choose Your Plan',
    description: 'Start with our free trial or upgrade to unlock advanced features and unlimited practice sessions.',
    target: '[data-onboarding="pricing"]',
    placement: 'top'
  },
  {
    id: 'testimonials',
    title: 'Success Stories',
    description: 'See how other sales professionals have improved their performance with PitchPerfect AI.',
    target: '[data-onboarding="testimonials"]',
    placement: 'top'
  }
];

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  const steps = onboardingSteps;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    checkIfShouldShowOnboarding();
  }, [user]);

  const checkIfShouldShowOnboarding = async () => {
    if (!user) return;

    try {
      // Use localStorage to track onboarding for now since profiles table doesn't have onboarding_completed
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
      
      // Show onboarding if user hasn't completed it
      if (!hasCompletedOnboarding) {
        // Wait a bit for the page to load
        setTimeout(() => {
          setIsActive(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const startOnboarding = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = async () => {
    setIsActive(false);
    await markOnboardingComplete();
  };

  const completeOnboarding = async () => {
    setIsActive(false);
    await markOnboardingComplete();
  };

  const markOnboardingComplete = async () => {
    if (!user) return;

    try {
      // Store completion in localStorage for now
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    } catch (error) {
      console.error('Error marking onboarding as complete:', error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startOnboarding,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding,
        isLastStep,
        isFirstStep
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};