
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only check onboarding status when we have user data and auth is not loading
    if (!loading && user) {
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      if (!onboardingComplete) {
        setShowOnboarding(true);
      }
    }
  }, [user, loading]);

  return { showOnboarding, setShowOnboarding };
};
