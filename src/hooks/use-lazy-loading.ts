
import { useState, useEffect } from 'react';

interface UseLazyLoadingOptions {
  threshold?: number; // Percentage of page scrolled (0-1)
  rootMargin?: string;
}

export const useLazyLoading = (options: UseLazyLoadingOptions = {}) => {
  const { threshold = 0.5 } = options;
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = scrolled / total;

      if (scrollPercentage >= threshold) {
        setShouldLoad(true);
      }
    };

    const handleInteraction = () => {
      setShouldLoad(true);
    };

    // Listen for scroll and interaction events
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [threshold]);

  return shouldLoad;
};

export const useLazyComponent = <T extends any>(
  componentImporter: () => Promise<{ default: React.ComponentType<T> }>,
  options?: UseLazyLoadingOptions
) => {
  const shouldLoad = useLazyLoading(options);
  const [Component, setComponent] = useState<React.ComponentType<T> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shouldLoad && !Component && !loading) {
      setLoading(true);
      componentImporter()
        .then(module => {
          setComponent(() => module.default);
        })
        .catch(error => {
          console.error('Failed to load component:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [shouldLoad, Component, loading, componentImporter]);

  return { Component, loading, shouldLoad };
};
