
import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStep {
  id: string;
  title: string;
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  className
}) => {
  return (
    <div className={cn("progress-indicator", className)} role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={currentStep}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isInactive = stepNumber > currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className={cn(
              "progress-step",
              {
                "completed": isCompleted,
                "active": isActive,
                "inactive": isInactive
              }
            )}>
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 mr-3",
                {
                  "bg-green-500 border-green-500 text-white": isCompleted,
                  "bg-[#0055FF] border-[#0055FF] text-white": isActive,
                  "bg-white border-gray-300 text-gray-400": isInactive
                }
              )}>
                {isCompleted ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <span className="text-sm font-bold" aria-hidden="true">{stepNumber}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">{step.title}</span>
                {step.description && (
                  <span className="text-xs text-gray-500">{step.description}</span>
                )}
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "progress-connector",
                {
                  "completed": isCompleted,
                  "active": isActive && index + 1 === currentStep - 1
                }
              )} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
