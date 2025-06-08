
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/analytics';

export const usePageTracking = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Track page views
    const currentPath = location.pathname + location.search;
    trackPageView(currentPath);
    
    // Error tracking for detecting navigation issues
    const handleError = (error: ErrorEvent) => {
      console.error('Navigation error:', error);
      // You can send this to your error tracking service
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [location]);
};
