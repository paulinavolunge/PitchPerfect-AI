import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  MessageSquare, 
  Trophy, 
  Mic, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  ArrowLeft,
  Settings,
  Target,
  Headphones
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MicrophoneTestButton from '@/components/voice/MicrophoneTestButton';

interface NewUserOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  skipText?: string;
}

const NewUserOnboarding: React.FC<NewUserOnboardingProps> = ({ 
  open, 
  onOpenChange, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [microphoneReady, setMicrophoneReady] = useState(false);
  const navigate = useNavigate();
  const { user, startFreeTrial } = useAuth();

  // Handle closing the dialog
  const handleClose = (completed: boolean = false) => {
    if (completed) {
      // Mark onboarding as complete
      onComplete();
    }
    // Close the modal
    onOpenChange(false);
    // Reset state after a delay to prevent flashing
    setTimeout(() => {
      setCurrentStep(0);
      setSelectedIndustry('');
      setSelectedChallenge('');
      setMicrophoneReady(false);
    }, 300);
  };

  // Handle ESC key - only allow closing if on last step or explicitly skipping
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && currentStep === steps.length - 1) {
        handleClose(true);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, currentStep]);

  // Don't override onOpenChange - let the parent control the modal state
  // This prevents accidental closing when navigating between steps

  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'other', label: 'Other' }
  ];

  const challenges = [
    { value: 'pricing', label: 'Handling pricing objections', icon: '💰' },
    { value: 'competition', label: 'Differentiating from competitors', icon: '🏆' },
    { value: 'timing', label: 'Dealing with "not right now" responses', icon: '⏰' },
    { value: 'authority', label: 'Navigating decision-maker access', icon: '👔' },
    { value: 'trust', label: 'Building trust and credibility', icon: '🤝' },
    { value: 'closing', label: 'Closing deals effectively', icon: '✅' }
  ];

  const steps: OnboardingStep[] = [
    {
      title: "Welcome to PitchPerfect AI! 🎉",
      description: "Let's get you ready to master your sales pitch with AI-powered practice and feedback.",
      icon: <BookOpen className="w-12 h-12 text-primary-600" />,
      content: (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-br from-primary-50 to-vibrant-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-deep-navy mb-3">What you'll get:</h3>
            <ul className="space-y-2 text-left">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary-600" />
                <span>AI-powered pitch analysis</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary-600" />
                <span>Realistic objection handling practice</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary-600" />
                <span>Progress tracking and analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary-600" />
                <span>Personalized improvement suggestions</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "What's your industry?",
      description: "We'll customize scenarios to match your specific industry challenges.",
      icon: <Target className="w-12 h-12 text-vibrant-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {industries.map((industry) => (
              <Button
                key={industry.value}
                variant={selectedIndustry === industry.value ? "default" : "outline"}
                onClick={() => setSelectedIndustry(industry.value)}
                className={`text-left justify-start h-12 ${
                  selectedIndustry === industry.value 
                    ? 'bg-primary-600 text-white' 
                    : 'hover:bg-primary-50'
                }`}
              >
                {industry.label}
              </Button>
            ))}
          </div>
          {selectedIndustry && (
            <div className="mt-4 p-3 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-700">
                Great! We'll focus on {industries.find(i => i.value === selectedIndustry)?.label.toLowerCase()} scenarios.
              </p>
            </div>
          )}
        </div>
      ),
      skipText: "Skip for now"
    },
    {
      title: "Your biggest sales challenge?",
      description: "Tell us what you struggle with most so we can personalize your training.",
      icon: <MessageSquare className="w-12 h-12 text-purple-600" />,
      content: (
        <div className="space-y-3">
          {challenges.map((challenge) => (
            <Button
              key={challenge.value}
              variant={selectedChallenge === challenge.value ? "default" : "outline"}
              onClick={() => setSelectedChallenge(challenge.value)}
              className={`w-full text-left justify-start p-4 h-auto ${
                selectedChallenge === challenge.value 
                  ? 'bg-primary-600 text-white' 
                  : 'hover:bg-primary-50'
              }`}
            >
              <span className="mr-3 text-lg">{challenge.icon}</span>
              <span>{challenge.label}</span>
            </Button>
          ))}
          {selectedChallenge && (
            <div className="mt-4 p-3 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-700">
                Perfect! We'll start with scenarios focused on this challenge.
              </p>
            </div>
          )}
        </div>
      ),
      skipText: "Skip for now"
    },
    {
      title: "Quick microphone check",
      description: "Let's make sure your microphone works for voice practice sessions.",
      icon: <Headphones className="w-12 h-12 text-amber-500" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="mb-4">
              <MicrophoneTestButton 
                onTestComplete={(results) => setMicrophoneReady(results.some(r => r.supported))}
              />
            </div>
            {microphoneReady && (
              <div className="flex items-center justify-center gap-2 text-primary-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Microphone ready!</span>
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Voice practice gives you the most realistic experience, but you can always use text input too.
          </div>
        </div>
      ),
      skipText: "I'll test later"
    },
    {
      title: "You're all set! 🚀",
      description: "Your personalized training environment is ready. Here's what to do next:",
      icon: <Trophy className="w-12 h-12 text-amber-500" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary-50 to-vibrant-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-deep-navy mb-4">Recommended next steps:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary-100 text-primary-700 border-primary-200">1</Badge>
                <span>Start with a quick practice session</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary-100 text-primary-700 border-primary-200">2</Badge>
                <span>Try AI roleplay for objection handling</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary-100 text-primary-700 border-primary-200">3</Badge>
                <span>Review your progress in analytics</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={() => handleComplete('/practice')}
              className="bg-gradient-to-r from-primary-600 to-vibrant-blue-500 hover:from-primary-700 hover:to-vibrant-blue-600 text-white h-12"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start First Practice Session
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleComplete('/ai-roleplay')}
              className="border-primary-200 text-primary-700 hover:bg-primary-50 h-12"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Try AI Roleplay
            </Button>
          </div>
        </div>
      )
    }
  ];

  // Ensure we have valid step data
  if (!steps || steps.length === 0) {
    console.error('Onboarding steps not defined');
    return null;
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Debug logging
  console.log('Onboarding state:', {
    currentStep,
    totalSteps: steps.length,
    selectedIndustry,
    selectedChallenge,
    open
  });

  const handleNext = () => {
    console.log('handleNext called, currentStep:', currentStep);
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => {
        const newStep = prev + 1;
        console.log('Setting new step:', newStep);
        return newStep;
      });
    } else {
      // If on last step, complete onboarding
      handleComplete('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    // Mark as completed and close
    handleClose(true);
  };

  const handleComplete = async (redirectTo: string = '/dashboard') => {
    try {
      // Save user preferences
      if (selectedIndustry) {
        localStorage.setItem('userIndustry', selectedIndustry);
      }
      if (selectedChallenge) {
        localStorage.setItem('userChallenge', selectedChallenge);
      }

      // Mark onboarding as complete
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('onboardingCompletedAt', new Date().toISOString());

      // Start free trial if available
      if (user && !localStorage.getItem('trialStarted')) {
        try {
          const trialStarted = await startFreeTrial();
          if (trialStarted) {
            localStorage.setItem('trialStarted', 'true');
          }
        } catch (err) {
          // Silently handle trial start failure - don't block onboarding
          console.error('Failed to start trial:', err);
        }
      }

      // Close onboarding with completion flag
      handleClose(true);

      // Navigate after a small delay to ensure modal closes
      setTimeout(() => {
        navigate(redirectTo);
      }, 100);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Even if there's an error, close the modal
      handleClose(true);
      navigate(redirectTo);
    }
  };

  // Remove auto-advance - let user control the pace
  // This prevents the modal from advancing/closing unexpectedly

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Only allow closing via explicit actions (skip, complete, etc.)
      // Prevent closing when clicking outside or pressing X
      if (!newOpen && currentStep < steps.length - 1) {
        // If trying to close before completion, treat as skip
        handleSkip();
      } else if (!newOpen) {
        handleClose(true);
      }
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
              <Sparkles className="h-4 w-4 mr-1" />
              Getting Started
            </Badge>
            <div className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          <Progress value={progress} className="mb-6" />
          
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-100 to-vibrant-blue-100 rounded-2xl">
              {currentStepData.icon}
            </div>
          </div>
          
          <DialogTitle className="text-center text-xl font-bold text-deep-navy">
            {currentStepData.title}
          </DialogTitle>
          
          <p className="text-center text-muted-foreground mt-2">
            {currentStepData.description}
          </p>
        </DialogHeader>

        <div className="py-6">
          {currentStepData.content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex justify-between items-center">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            
            <div className="flex gap-2 ml-auto">
              {currentStepData.skipText && currentStep < steps.length - 1 && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  {currentStepData.skipText}
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-primary-600 to-vibrant-blue-500 hover:from-primary-700 hover:to-vibrant-blue-600 text-white"
                disabled={
                  (currentStep === 1 && !selectedIndustry) ||
                  (currentStep === 2 && !selectedChallenge)
                }
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewUserOnboarding;