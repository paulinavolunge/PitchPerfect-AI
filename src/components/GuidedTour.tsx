
import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, Step } from 'react-joyride';

interface GuidedTourProps {
  steps: Step[];
  run: boolean;
  onComplete: () => void;
}

const GuidedTour = ({ steps, run, onComplete }: GuidedTourProps) => {
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

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour is complete
      setTourState(prevState => ({ ...prevState, run: false }));
      onComplete();
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={tourState.run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#16a34a', // brand-green
          backgroundColor: '#ffffff',
          textColor: '#334155', // brand-dark
        },
        spotlight: {
          backgroundColor: 'transparent',
        },
      }}
    />
  );
};

export default GuidedTour;
