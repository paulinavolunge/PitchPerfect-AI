
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only check onboarding status when we have user data and auth is not loading
    if (!loading && user) {
      const unifiedKey = `onboarding_completed_${user.id}`;
      const onboardingComplete = localStorage.getItem(unifiedKey);

      // Clean up legacy keys for consistency
      if (!onboardingComplete) {
        const legacyA = localStorage.getItem('onboardingComplete');
        const legacyB = localStorage.getItem(`user_${user.id}_onboarding_complete`);
        if (legacyA || legacyB) {
          localStorage.setItem(unifiedKey, 'true');
          localStorage.removeItem('onboardingComplete');
          localStorage.removeItem(`user_${user.id}_onboarding_complete`);
        }
      }

      if (!localStorage.getItem(unifiedKey)) {
        setShowOnboarding(true);
      }
    }
  }, [user, loading]);

  return { showOnboarding, setShowOnboarding };
};
