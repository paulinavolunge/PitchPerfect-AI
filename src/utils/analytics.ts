
// Google Analytics 4 and Meta Pixel Implementation with Google Tag Manager support

// Initialize Google Analytics and Meta Pixel with debug mode
export const initGA = () => {
  try {
    // Check if already initialized to prevent duplicate initialization
    if (window.dataLayer) {
      console.log('Google Tag Manager already initialized');
      return;
    }

    // Initialize dataLayer for GTM
    window.dataLayer = window.dataLayer || [];
    
    // Setup gtag function for direct GA4 calls
    window.gtag = function() { 
      console.log('GA4 Event:', arguments);
      window.dataLayer.push(arguments); 
    };
    
    // Enable debug mode in Google Analytics
    window.gtag('config', 'G-HVCRJT504Y', { 
      debug_mode: import.meta.env.DEV === true, // Enable debug mode in development
      send_page_view: false // We'll handle pageviews manually for better control
    });
    
    console.log('Analytics initialized with GTM and debug mode enabled');
  } catch (error) {
    console.error('Error initializing Analytics:', error);
  }
};

// Page view tracking with enhanced debugging
export const trackPageView = (path: string) => {
  try {
    if (!window.dataLayer) {
      console.warn('dataLayer not initialized, cannot track page view');
      return;
    }
    
    const pageData = {
      event: 'page_view',
      page_path: path,
      page_title: document.title,
      page_location: window.location.href,
      send_to: 'G-HVCRJT504Y' // Explicitly specify measurement ID
    };
    
    // Push pageview event to dataLayer for GTM
    window.dataLayer.push(pageData);
    
    // Also send directly to GA4 for redundancy
    window.gtag('event', 'page_view', pageData);
    
    // Track pageview with Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
    
    console.log(`Page view tracked via GTM: ${path}`, pageData);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Event tracking with enhanced debugging
export const trackEvent = (
  eventName: string, 
  eventParams: Record<string, any> = {}
) => {
  try {
    if (!window.dataLayer) {
      console.warn('dataLayer not initialized, cannot track event');
      return;
    }
    
    // Add send_to parameter to ensure proper routing
    const enhancedParams = {
      ...eventParams,
      send_to: 'G-HVCRJT504Y' // Explicitly specify measurement ID
    };
    
    // Push custom event to dataLayer for GTM
    window.dataLayer.push({
      event: eventName,
      ...enhancedParams
    });
    
    // Also send directly to GA4
    window.gtag('event', eventName, enhancedParams);
    
    // Track event with Meta Pixel for specific conversion events
    if (window.fbq) {
      // Map common events to Meta Pixel standard events
      const metaPixelEvents: Record<string, string> = {
        'signup': 'CompleteRegistration',
        'login': 'Lead',
        'purchase': 'Purchase',
        'start_trial': 'StartTrial',
        'demo_started': 'Lead',
        'subscription': 'Subscribe'
      };
      
      if (metaPixelEvents[eventName]) {
        window.fbq('track', metaPixelEvents[eventName], eventParams);
      } else {
        // Track custom event
        window.fbq('trackCustom', eventName, eventParams);
      }
    }
    
    console.log(`Event tracked via GTM: ${eventName}`, enhancedParams);
  } catch (error) {
    console.error(`Error tracking event ${eventName}:`, error);
  }
};

// Helper function to check if analytics is working
export const checkAnalyticsConnection = () => {
  try {
    // Log debug information
    console.log('Analytics Debug Information:');
    console.log('- GTM Loaded:', typeof window.dataLayer !== 'undefined');
    console.log('- GA4 Loaded:', typeof window.gtag === 'function');
    console.log('- Meta Pixel Loaded:', typeof window.fbq === 'function');
    
    // Send test event
    trackEvent('analytics_debug', {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
    
    return {
      gtmLoaded: typeof window.dataLayer !== 'undefined',
      ga4Loaded: typeof window.gtag === 'function',
      metaPixelLoaded: typeof window.fbq === 'function'
    };
  } catch (error) {
    console.error('Error checking analytics connection:', error);
    return {
      gtmLoaded: false,
      ga4Loaded: false,
      metaPixelLoaded: false,
      error: error
    };
  }
};

// Enhanced type definition for window object
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (command: string, ...args: any[]) => void;
    fbq: any;
  }
}
