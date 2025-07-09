import { useState, useEffect, useRef } from 'react';

interface UseInteractionBasedLoadingOptions {
  loadOnScroll?: boolean;
  loadOnClick?: boolean;
  loadOnMouseMove?: boolean;
  scrollThreshold?: number;
  delay?: number;
}

export const useInteractionBasedLoading = (options: UseInteractionBasedLoadingOptions = {}) => {
  const {
    loadOnScroll = true,
    loadOnClick = true,
    loadOnMouseMove = false,
    scrollThreshold = 0.2,
    delay = 1000
  } = options;

  const [shouldLoad, setShouldLoad] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hasInteracted = useRef(false);

  useEffect(() => {
    if (shouldLoad) return;

    const triggerLoad = () => {
      if (hasInteracted.current) return;
      hasInteracted.current = true;
      setShouldLoad(true);
    };

    const handleScroll = () => {
      if (!loadOnScroll) return;
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = scrolled / total;

      if (scrollPercentage >= scrollThreshold) {
        triggerLoad();
      }
    };

    const handleInteraction = () => {
      if (loadOnClick || loadOnMouseMove) {
        // Add small delay to avoid triggering on accidental interactions
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(triggerLoad, 100);
      }
    };

    // Auto-load after delay if no interaction
    const autoLoadTimer = setTimeout(() => {
      if (!hasInteracted.current) {
        triggerLoad();
      }
    }, delay);

    // Event listeners for interactions
    if (loadOnScroll) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    if (loadOnClick) {
      document.addEventListener('click', handleInteraction, { passive: true });
    }
    if (loadOnMouseMove) {
      document.addEventListener('mousemove', handleInteraction, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('mousemove', handleInteraction);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearTimeout(autoLoadTimer);
    };
  }, [loadOnScroll, loadOnClick, loadOnMouseMove, scrollThreshold, delay, shouldLoad]);

  return shouldLoad;
};