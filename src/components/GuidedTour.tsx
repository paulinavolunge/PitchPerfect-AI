
import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, Step, ACTIONS, CallBackProps, EVENTS, TooltipRenderProps, Placement } from 'react-joyride';

interface GuidedTourProps {
  steps: Step[];
  run: boolean;
  onComplete: () => void;
  showSkipButton?: boolean;
  continuous?: boolean;
  stepIndex?: number;
  spotlightClicks?: boolean;
  styles?: any;
}

const GuidedTour = ({ 
  steps, 
  run, 
  onComplete, 
  showSkipButton = true,
  continuous = true,
  stepIndex = 0,
  spotlightClicks = false,
  styles = {}
}: GuidedTourProps) => {
  const [tourState, setTourState] = useState({
    run,
    steps,
    stepIndex,
  });

  useEffect(() => {
    setTourState(prevState => ({
      ...prevState,
      run,
      stepIndex,
    }));
  }, [run, stepIndex]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index } = data;
    
    // Fix: Check the status against the STATUS enum values directly
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Tour is complete
      setTourState(prevState => ({ ...prevState, run: false }));
      onComplete();
    } else if (action === ACTIONS.NEXT && index === steps.length - 1) {
      // Last step
      setTourState(prevState => ({ ...prevState, run: false }));
      onComplete();
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous={continuous}
      hideCloseButton={false}
      run={tourState.run}
      scrollToFirstStep
      showProgress
      showSkipButton={showSkipButton}
      stepIndex={tourState.stepIndex}
      steps={steps}
      spotlightClicks={spotlightClicks}
      disableScrolling={false}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#16a34a', // brand-green
          backgroundColor: '#ffffff',
          textColor: '#334155', // brand-dark
          arrowColor: '#ffffff',
        },
        buttonSkip: {
          color: '#334155',
          fontSize: '14px',
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          padding: '8px 16px',
          backgroundColor: 'transparent',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
        spotlight: {
          backgroundColor: 'transparent',
        },
        ...styles,
      }}
    />
  );
};

export default GuidedTour;
