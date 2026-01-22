
import { useEffect } from 'react';
import { autoInitAnalytics, trackPageView, hasValidConsent, checkAnalyticsConnection } from '@/utils/analytics';

export const PrivacyCompliantAnalytics = () => {
  useEffect(() => {
    console.log('🔧 PrivacyCompliantAnalytics: Component mounted');
    
    // Auto-initialize analytics if consent exists
    autoInitAnalytics();
    
    // Track initial page view if analytics is ready and consent is valid
    if (hasValidConsent()) {
      const currentPath = window.location.pathname + window.location.search;
      console.log('📄 PrivacyCompliantAnalytics: Tracking initial page view:', currentPath);
      
      // Delay page view tracking to ensure analytics is loaded
      setTimeout(() => {
        trackPageView(currentPath);
      }, 2000); // Increased delay for reliability
    } else {
      console.log('ℹ️ PrivacyCompliantAnalytics: No consent found. Please accept analytics cookies to enable tracking.');
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
