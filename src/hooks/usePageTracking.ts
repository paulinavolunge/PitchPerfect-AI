
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, hasValidConsent } from '@/utils/analytics';

export const usePageTracking = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('📍 Page tracking: Location changed to', location.pathname);
    
    // Only track if we have valid consent
    if (!hasValidConsent()) {
      console.log('❌ Page tracking: No valid consent, skipping');
      return;
    }
    
    // Track page views with a small delay to ensure the page has loaded
    const timeoutId = setTimeout(() => {
      const currentPath = location.pathname + location.search;
      console.log('📄 Page tracking: Tracking page view for:', currentPath);
      trackPageView(currentPath);
    }, 100);
    
    // Error tracking for detecting navigation issues
    const handleError = (error: ErrorEvent) => {
      console.error('❌ Page tracking: Navigation error:', error);
      // You can send this to your error tracking service
    };

    window.addEventListener('error', handleError);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('error', handleError);
    };
  }, [location]);
};
