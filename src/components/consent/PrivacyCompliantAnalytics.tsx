
import { useEffect } from 'react';
import { autoInitAnalytics, trackPageView, hasValidConsent, checkAnalyticsConnection } from '@/utils/analytics';

export const PrivacyCompliantAnalytics = () => {
  useEffect(() => {
    
    // Auto-initialize analytics if consent exists
    autoInitAnalytics();
    
    // Track initial page view if analytics is ready and consent is valid
    if (hasValidConsent()) {
      const currentPath = window.location.pathname + window.location.search;
      
      // Delay page view tracking to ensure analytics is loaded
      setTimeout(() => {
        trackPageView(currentPath);
      }, 1500);
    }
    
    // Set up debug check
    setTimeout(() => {
      checkAnalyticsConnection();
    }, 3000);
    
    return () => {
      console.log('🔧 PrivacyCompliantAnalytics: Component unmounting');
    };
  }, []);

  return null;
};
