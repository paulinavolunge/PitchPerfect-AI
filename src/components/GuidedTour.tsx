
import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, Step, ACTIONS, CallBackProps, EVENTS, TooltipRenderProps, Placement } from 'react-joyride';

interface GuidedTourProps {
  steps: Step[];
  run: boolean;
  onComplete: () => void;
  showSkipButton?: boolean;
  continuous?: boolean;
}

const GuidedTour = ({ 
  steps, 
  run, 
  onComplete, 
  showSkipButton = true,
  continuous = true 
}: GuidedTourProps) => {
  const [tourState, setTourState] = useState({
    run,
    steps,
    stepIndex: 0,
  });

  useEffect(() => {
    setTourState(prevState => ({
      ...prevState,
      run,
    }));
  }, [run]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    // Use explicit comparison with STATUS constants instead of array includes
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Tour is complete
      setTourState(prevState => ({ ...prevState, run: false }));
      onComplete();
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous={continuous}
      hideCloseButton
      run={tourState.run}
      scrollToFirstStep
      showProgress
      showSkipButton={showSkipButton}
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#16a34a', // brand-green
          backgroundColor: '#ffffff',
          textColor: '#334155', // brand-dark
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
      }}
    />
  );
};

export default GuidedTour;
