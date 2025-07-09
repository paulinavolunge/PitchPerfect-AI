import { lazy, Suspense } from 'react';
import { useInteractionBasedLoading } from '@/hooks/use-interaction-loading';

// Lazy load analytics components only after user interaction
const LazyPrivacyCompliantAnalytics = lazy(() => 
  import('@/components/consent/PrivacyCompliantAnalytics').then(module => ({
    default: module.PrivacyCompliantAnalytics
  }))
);

export const LazyAnalytics = () => {
  const shouldLoadAnalytics = useInteractionBasedLoading({
    loadOnScroll: true,
    loadOnClick: true,
    scrollThreshold: 0.1,
    delay: 3000 // Load after 3 seconds if no interaction
  });

  if (!shouldLoadAnalytics) {
    return null; // Don't load analytics until user interaction
  }

  return (
    <Suspense fallback={null}>
      <LazyPrivacyCompliantAnalytics />
    </Suspense>
  );
};