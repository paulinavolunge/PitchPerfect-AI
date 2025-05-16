
// Google Analytics 4 Implementation

// Initialize Google Analytics
export const initGA = () => {
  // Create script elements for Google Analytics
  const createGAScript = () => {
    // Check if script already exists
    if (document.querySelector('script[src*="googletagmanager"]')) {
      return;
    }

    // Google Analytics 4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-MEASUREMENT_ID'}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-MEASUREMENT_ID');
    
    console.log('Google Analytics initialized');
  };

  // Initialize GA when document is ready
  if (document.readyState === 'complete') {
    createGAScript();
  } else {
    window.addEventListener('load', createGAScript);
  }
};

// Page view tracking
export const trackPageView = (path: string) => {
  try {
    if (!window.gtag) return;
    
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
      page_location: window.location.href
    });
    
    console.log(`Page view tracked: ${path}`);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Event tracking
export const trackEvent = (
  eventName: string, 
  eventParams: Record<string, any> = {}
) => {
  try {
    if (!window.gtag) return;
    
    window.gtag('event', eventName, eventParams);
    console.log(`Event tracked: ${eventName}`, eventParams);
  } catch (error) {
    console.error(`Error tracking event ${eventName}:`, error);
  }
};

// Enhanced type definition for window object
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (command: string, ...args: any[]) => void;
  }
}
