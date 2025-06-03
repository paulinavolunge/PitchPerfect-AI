
import { useEffect } from 'react';
import { initGA, trackPageView } from '@/utils/analytics';

export const PrivacyCompliantAnalytics = () => {
  useEffect(() => {
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    
    if (hasConsent) {
      // Initialize analytics with privacy settings
      initGA();
      
      // Track initial page view
      const currentPath = window.location.pathname + window.location.search;
      trackPageView(currentPath);
    }
    
    // Set up global function for consent banner
    window.loadAnalytics = () => {
      if (localStorage.getItem('analytics-consent') === 'true') {
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
