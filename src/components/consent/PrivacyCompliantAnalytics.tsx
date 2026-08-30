
import { useEffect } from 'react';
import { autoInitAnalytics, trackPageView } from '@/utils/analytics';

export const PrivacyCompliantAnalytics = () => {
  useEffect(() => {
    // Consent Mode v2: the tag always loads, but stays cookieless until
    // the visitor grants analytics consent via the banner.
    autoInitAnalytics();

    const currentPath = window.location.pathname + window.location.search;
    const timeoutId = window.setTimeout(() => {
      trackPageView(currentPath);
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
};
