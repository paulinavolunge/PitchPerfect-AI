import React, { useEffect, useRef } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OnboardingOverlay: React.FC = () => {
  const {
    isActive,
    currentStep,
    steps,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    isLastStep,
    isFirstStep
  } = useOnboarding();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const target = document.querySelector(steps[currentStep].target) as HTMLElement;
    if (target) {
      setTargetElement(target);
      updateTooltipPosition(target);
      
      // Scroll target into view
      target.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });

      // Add highlight class
      target.classList.add('onboarding-highlight');
    }

    return () => {
      if (target) {
        target.classList.remove('onboarding-highlight');
      }
    };
  }, [isActive, currentStep, steps]);

  const updateTooltipPosition = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const step = steps[currentStep];
    
    let top = 0;
    let left = 0;

    switch (step.placement) {
      case 'top':
        top = rect.top - 20;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 20;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 20;
        break;
    }

    setTooltipPosition({ top, left });
  };

  const handleSkip = () => {
    skipOnboarding();
  };

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  if (!isActive) return null;

  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-auto"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      >
        {/* Background overlay with cutout for highlighted element */}
        <div className="absolute inset-0">
          {targetElement && (
            <div
              className="absolute bg-background/90 rounded-lg shadow-2xl animate-pulse"
              style={{
                top: targetElement.getBoundingClientRect().top - 8,
                left: targetElement.getBoundingClientRect().left - 8,
                width: targetElement.getBoundingClientRect().width + 16,
                height: targetElement.getBoundingClientRect().height + 16,
                border: '3px solid rgb(59, 130, 246)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
              }}
            />
          )}
        </div>

        {/* Tooltip */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute pointer-events-auto"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: `translate(-50%, ${currentStepData.placement === 'top' ? '-100%' : '0%'})`
          }}
        >
          <Card className="w-80 shadow-xl border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Step {currentStep + 1} of {steps.length}
                  </Badge>
                  {currentStep === 0 && (
                    <Play className="h-4 w-4 text-primary" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {currentStepData.title}
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {currentStepData.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousStep}
                    disabled={isFirstStep}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="flex items-center gap-1 bg-primary hover:bg-primary/90"
                  >
                    {isLastStep ? 'Finish' : 'Next'}
                    {!isLastStep && <ArrowRight className="h-3 w-3" />}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip tour
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tooltip arrow */}
          <div
            className={`absolute w-0 h-0 border-l-8 border-r-8 border-transparent ${
              currentStepData.placement === 'top'
                ? 'border-t-8 border-t-background top-full left-1/2 transform -translate-x-1/2'
                : 'border-b-8 border-b-background bottom-full left-1/2 transform -translate-x-1/2'
            }`}
          />
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto"
        >
          <div className="bg-background/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index <= currentStep
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};