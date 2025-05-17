
// Google Analytics 4 Implementation

// Initialize Google Analytics
export const initGA = () => {
  try {
    // Check if already initialized to prevent duplicate initialization
    if (window.dataLayer) {
      console.log('Google Analytics already initialized');
      return;
    }

    // Create script elements for Google Analytics
    const createGAScript = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="googletagmanager"]')) {
        return;
      }

      const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
      
      if (!measurementId) {
        console.error('Google Analytics Measurement ID is missing. Set VITE_GA_MEASUREMENT_ID in your environment variables');
        return;
      }

      // Google Analytics 4 script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);

      // Initialize dataLayer and gtag function
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
        send_page_view: false // We'll handle this manually for better control
      });
      
      console.log('Google Analytics initialized with ID:', measurementId);
    };

    // Initialize GA when document is ready
    if (document.readyState === 'complete') {
      createGAScript();
    } else {
      window.addEventListener('load', createGAScript);
    }
  } catch (error) {
    console.error('Error initializing Google Analytics:', error);
  }
};

// Page view tracking
export const trackPageView = (path: string) => {
  try {
    if (!window.gtag) {
      console.warn('Google Analytics not initialized, cannot track page view');
      return;
    }
    
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    
    if (!measurementId) {
      console.error('Google Analytics Measurement ID is missing');
      return;
    }
    
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
      page_location: window.location.href,
      send_to: measurementId
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
    if (!window.gtag) {
      console.warn('Google Analytics not initialized, cannot track event');
      return;
    }
    
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
