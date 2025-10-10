
/**
 * Utility for handling practice session completion
 * This marks the practice session as completed in sessionStorage
 * so the dashboard can detect it when the user returns
 */
export const markPracticeComplete = () => {
  try {
    sessionStorage.setItem('completedPractice', 'true');
    
    // Store completion timestamp
    const now = new Date();
    sessionStorage.setItem('practiceCompletionTime', now.toISOString());
  } catch (error) {
    console.error('Error storing practice completion status:', error);
  }
};

export const isPracticeCompleted = () => {
  return sessionStorage.getItem('completedPractice') === 'true';
};

export const clearPracticeCompletionStatus = () => {
  sessionStorage.removeItem('completedPractice');
  sessionStorage.removeItem('practiceCompletionTime');
};
