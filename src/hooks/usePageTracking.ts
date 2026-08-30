
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Consent state is handled inside gtag via Consent Mode v2, so events
    // are always sent — cookieless until the visitor grants consent.
    const timeoutId = window.setTimeout(() => {
      trackPageView(location.pathname + location.search);
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [location]);
};
