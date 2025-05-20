// Google Analytics 4 Implementation with Google Tag Manager support

// Initialize Google Analytics
export const initGA = () => {
  try {
    // Check if already initialized to prevent duplicate initialization
    if (window.dataLayer) {
      console.log('Google Tag Manager already initialized');
      return;
    }

    // Initialize dataLayer for GTM
    window.dataLayer = window.dataLayer || [];
    
    // We don't need to create the GA script elements manually as GTM will handle this
    // But we'll keep the gtag function available for backward compatibility
    window.gtag = function() { window.dataLayer.push(arguments); };
    
    console.log('Analytics initialized with GTM');
  } catch (error) {
    console.error('Error initializing Analytics:', error);
  }
};

// Page view tracking
export const trackPageView = (path: string) => {
  try {
    if (!window.dataLayer) {
      console.warn('dataLayer not initialized, cannot track page view');
      return;
    }
    
    // Push pageview event to dataLayer for GTM
    window.dataLayer.push({
      event: 'page_view',
      page_path: path,
      page_title: document.title,
      page_location: window.location.href
    });
    
    console.log(`Page view tracked via GTM: ${path}`);
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
    if (!window.dataLayer) {
      console.warn('dataLayer not initialized, cannot track event');
      return;
    }
    
    // Push custom event to dataLayer for GTM
    window.dataLayer.push({
      event: eventName,
      ...eventParams
    });
    
    console.log(`Event tracked via GTM: ${eventName}`, eventParams);
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
