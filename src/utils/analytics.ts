// Privacy-compliant Google Analytics implementation

// Initialize Google Analytics with debug mode
export const initGA = () => {
  try {
    // Only initialize if consent is given
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    if (!hasConsent) {
      console.log('Analytics consent not given, skipping initialization');
      return;
    }

    // Check if already initialized to prevent duplicate initialization
    if (window.dataLayer && window.gtag) {
      console.log('Google Analytics already initialized');
      return;
    }

    // Initialize dataLayer for GTM
    window.dataLayer = window.dataLayer || [];
    
    // Setup gtag function for direct GA4 calls
    window.gtag = function() { 
      console.log('GA4 Event:', arguments);
      window.dataLayer.push(arguments); 
    };
    
    // Configure GA4 with privacy settings
    window.gtag('config', 'G-HVCRJT504Y', { 
      debug_mode: import.meta.env.DEV === true,
      send_page_view: false,
      anonymize_ip: true,
      allow_google_signals: false, // Disable Google Signals for privacy
      allow_ad_personalization_signals: false // Disable ad personalization
    });
    
    console.log('Privacy-compliant Analytics initialized');
  } catch (error) {
    console.error('Error initializing Analytics:', error);
  }
};

// Page view tracking with consent check
export const trackPageView = (path: string) => {
  try {
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    if (!hasConsent) {
      console.log('Analytics consent not given, skipping page view tracking');
      return;
    }

    if (!window.dataLayer || !window.gtag) {
      console.warn('Analytics not initialized, cannot track page view');
      return;
    }
    
    const pageData = {
      page_path: path,
      page_title: document.title,
      page_location: window.location.href,
      send_to: 'G-HVCRJT504Y'
    };
    
    // Send pageview to GA4
    window.gtag('event', 'page_view', pageData);
    
    console.log(`Privacy-compliant page view tracked: ${path}`);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Event tracking with consent check
export const trackEvent = (
  eventName: string, 
  eventParams: Record<string, any> = {}
) => {
  try {
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    if (!hasConsent) {
      console.log('Analytics consent not given, skipping event tracking');
      return;
    }

    if (!window.dataLayer || !window.gtag) {
      console.warn('Analytics not initialized, cannot track event');
      return;
    }
    
    const enhancedParams = {
      ...eventParams,
      send_to: 'G-HVCRJT504Y'
    };
    
    // Send to GA4
    window.gtag('event', eventName, enhancedParams);
    
    console.log(`Privacy-compliant event tracked: ${eventName}`, enhancedParams);
  } catch (error) {
    console.error(`Error tracking event ${eventName}:`, error);
  }
};

// Helper function to check consent status
export const hasAnalyticsConsent = (): boolean => {
  return localStorage.getItem('analytics-consent') === 'true';
};

// Helper function to revoke consent
export const revokeAnalyticsConsent = () => {
  localStorage.setItem('analytics-consent', 'false');
  console.log('Analytics consent revoked');
};

// Helper function to check analytics connection
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
