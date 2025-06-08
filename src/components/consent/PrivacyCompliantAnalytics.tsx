
import { useEffect } from 'react';
import { initGA, trackPageView, hasValidConsent } from '@/utils/analytics';

export const PrivacyCompliantAnalytics = () => {
  useEffect(() => {
    // Initialize analytics if valid consent exists
    if (hasValidConsent()) {
      initGA();
      
      // Track initial page view
      const currentPath = window.location.pathname + window.location.search;
      trackPageView(currentPath);
    }
    
    // Set up global function for consent banner
    window.loadAnalytics = () => {
      if (hasValidConsent()) {
        initGA();
        const currentPath = window.location.pathname + window.location.search;
        trackPageView(currentPath);
      }
    };
    
    return () => {
      delete window.loadAnalytics;
    };
  }, []);

  return null;
};
