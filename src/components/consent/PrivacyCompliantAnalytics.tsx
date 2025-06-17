
import { useEffect } from 'react';
import { autoInitAnalytics, trackPageView, hasValidConsent } from '@/utils/analytics';

export const PrivacyCompliantAnalytics = () => {
  useEffect(() => {
    console.log('🔧 PrivacyCompliantAnalytics: Component mounted');
    
    // Auto-initialize analytics if consent exists
    autoInitAnalytics();
    
    // Track initial page view if analytics is ready
    if (hasValidConsent()) {
      const currentPath = window.location.pathname + window.location.search;
      console.log('📄 PrivacyCompliantAnalytics: Tracking initial page view:', currentPath);
      trackPageView(currentPath);
    }
    
    // Set up global function for consent banner
    window.loadAnalytics = () => {
      console.log('🔧 PrivacyCompliantAnalytics: loadAnalytics called');
      if (hasValidConsent()) {
        autoInitAnalytics();
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
