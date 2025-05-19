
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
  scrollToSteps?: boolean;
}

const GuidedTour = ({ 
  steps, 
  run, 
  onComplete, 
  showSkipButton = true,
  continuous = true,
  stepIndex = 0,
  spotlightClicks = false,
  styles = {},
  scrollToSteps = true
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
    const { status, action, index, type } = data;
    
    // For debugging
    console.log('Tour callback:', { status, action, index, type, stepsLength: steps.length });
    
    // Handle tour step navigation
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Update step index for next step
      if (action === ACTIONS.NEXT) {
        // Only advance if we're not already on the last step
        if (index < steps.length - 1) {
          console.log(`Moving from step ${index} to step ${index + 1}`);
          setTourState(prevState => ({
            ...prevState,
            stepIndex: index + 1
          }));
        } else {
          // This is the last regular step, handle completion
          console.log('Last step reached, completing tour');
          setTourState(prevState => ({ ...prevState, run: false }));
          onComplete();
        }
      }
    } else if (action === ACTIONS.PREV) {
      // Handle going to previous step when the Back button is clicked
      const prevStepIndex = index - 1;
      
      if (prevStepIndex >= 0) {
        console.log(`Moving back from step ${index} to step ${prevStepIndex}`);
        setTourState(prevState => ({
          ...prevState,
          stepIndex: prevStepIndex
        }));
      }
    } else if (action === ACTIONS.CLOSE || status === STATUS.SKIPPED) {
      // Handle when close button is clicked or tour is skipped
      console.log('Tour closed or skipped');
      setTourState(prevState => ({ ...prevState, run: false }));
      onComplete();
    }
    
    // Handle tour completion
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Tour is complete
      console.log('Tour finished or skipped, status:', status);
      setTourState(prevState => ({ ...prevState, run: false }));
      onComplete();
    }
    
    // Also handle primary button clicks on the final step (for the custom Close button)
    if (index === steps.length - 1 && type === EVENTS.STEP_AFTER) {
      console.log('Final step action triggered');
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
      scrollToFirstStep={scrollToSteps}
      showProgress
      showSkipButton={showSkipButton}
      stepIndex={tourState.stepIndex}
      steps={steps}
      spotlightClicks={spotlightClicks}
      disableScrolling={!scrollToSteps}
      scrollOffset={100} // Add some padding when scrolling to elements
      disableOverlayClose={true} // Prevent closing by clicking on the overlay
      locale={{
        last: "Finish Tour",  // Change the text of the last button
        next: "Next",
        skip: "Skip",
        back: "Back"
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#16a34a', // brand-green
          backgroundColor: '#ffffff',
          textColor: '#334155', // brand-dark
          arrowColor: '#ffffff',
        },
        buttonNext: {
          backgroundColor: '#16a34a',
          color: '#ffffff',
          fontSize: '14px',
          borderRadius: '4px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#334155',
          fontSize: '14px',
          marginRight: '10px',
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
