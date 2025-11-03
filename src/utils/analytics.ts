// Privacy-compliant Google Analytics implementation with enhanced debugging

const GA_ID = 'G-HVCRJT504Y';
const DEBUG_MODE = false; // Set to true for debugging
// Initialize Google Analytics with debug mode and consent validation
export const initGA = () => {
  try {
    console.log('🔧 Analytics: Attempting to initialize...');
    
    // Check if consent is valid (not expired)
    if (!hasValidConsent()) {
      console.log('❌ Analytics: Consent expired or not given, skipping initialization');
      return;
    }

    // Check if already initialized to prevent duplicate initialization
    if (window.dataLayer && window.gtag && document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      console.log('✅ Analytics: Already initialized');
      return;
    }

    // Use the global loadAnalytics function
    if (typeof window.loadAnalytics === 'function') {
      console.log('🔧 Analytics: Calling global loadAnalytics function');
      window.loadAnalytics();
    } else {
      console.warn('⚠️ Analytics: Global loadAnalytics function not available');
    }
    
    console.log('✅ Analytics: Successfully initialized with GA ID: G-HVCRJT504Y');
    
    // Test connection
    setTimeout(() => {
      checkAnalyticsConnection();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Analytics: Error during initialization:', error);
  }
};

// Enhanced consent validation with expiry
export const hasValidConsent = (): boolean => {
  const consent = localStorage.getItem('analytics-consent');
  const consentDate = localStorage.getItem('analytics-consent-date');
  
  console.log('🔍 Analytics: Checking consent...', { consent, consentDate });
  
  if (consent !== 'true') {
    console.log('❌ Analytics: No consent given');
    return false;
  }
  
  // Require fresh consent every 365 days
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const needsFreshConsent = !consentDate || 
    Date.now() - parseInt(consentDate) > oneYear;
  
  if (needsFreshConsent) {
    console.log('❌ Analytics: Consent expired, clearing...');
    // Clear expired consent
    localStorage.removeItem('analytics-consent');
    localStorage.removeItem('analytics-consent-date');
    return false;
  }
  
  console.log('✅ Analytics: Valid consent found');
  return true;
};

// Set consent with timestamp
export const setAnalyticsConsent = (granted: boolean) => {
  if (granted) {
    localStorage.setItem('analytics-consent', 'true');
    localStorage.setItem('analytics-consent-date', Date.now().toString());
    console.log('✅ Analytics: Consent granted and timestamped');
    
    // Initialize analytics immediately after consent using global function
    if (typeof window.loadAnalytics === 'function') {
      console.log('🔧 Analytics: Triggering loadAnalytics after consent');
      window.loadAnalytics();
    }
  } else {
    localStorage.removeItem('analytics-consent');
    localStorage.removeItem('analytics-consent-date');
    console.log('❌ Analytics: Consent revoked');
  }
};

// Page view tracking with consent check
export const trackPageView = (path: string) => {
  try {
    console.log('📄 Analytics: Attempting to track page view:', path);
    
    if (!hasValidConsent()) {
      console.log('❌ Analytics: No valid consent for page view tracking');
      return;
    }

    if (!window.dataLayer || !window.gtag) {
      console.warn('⚠️ Analytics: Not initialized, attempting to initialize...');
      initGA();
      
      // Retry after initialization
      setTimeout(() => {
        if (window.gtag) {
          trackPageView(path);
        } else {
          console.error('❌ Analytics: Still not initialized after retry');
        }
      }, 1500);
      return;
    }
    
    const pageData = {
      page_path: path,
      page_title: document.title,
      page_location: window.location.href,
      send_to: GA_ID
    };
    
    // Send pageview to GA4
    window.gtag('event', 'page_view', pageData);
    console.log('✅ Analytics: Page view tracked successfully:', pageData);
    
  } catch (error) {
    console.error('❌ Analytics: Error tracking page view:', error);
  }
};

// Event tracking with consent check
export const trackEvent = (
  eventName: string, 
  eventParams: Record<string, any> = {}
) => {
  try {
    console.log('🎯 Analytics: Attempting to track event:', eventName, eventParams);
    
    if (!hasValidConsent()) {
      console.log('❌ Analytics: No valid consent for event tracking');
      return;
    }

    if (!window.dataLayer || !window.gtag) {
      console.warn('⚠️ Analytics: Not initialized for event tracking');
      return;
    }
    
    const enhancedParams = {
      ...eventParams,
      send_to: GA_ID
    };
    
    // Send to GA4
    window.gtag('event', eventName, enhancedParams);
    console.log('✅ Analytics: Event tracked successfully:', eventName, enhancedParams);
    
  } catch (error) {
    console.error(`❌ Analytics: Error tracking event ${eventName}:`, error);
  }
};

// Helper function to check consent status (backwards compatibility)
export const hasAnalyticsConsent = (): boolean => {
  return hasValidConsent();
};

// Helper function to revoke consent
export const revokeAnalyticsConsent = () => {
  localStorage.removeItem('analytics-consent');
  localStorage.removeItem('analytics-consent-date');
  console.log('❌ Analytics: Consent revoked');
};

// Enhanced analytics connection checker
export const checkAnalyticsConnection = () => {
  try {
    console.log('🔍 Analytics: Connection Check Starting...');
    
    const status = {
      gtmLoaded: typeof window.dataLayer !== 'undefined',
      ga4Loaded: typeof window.gtag === 'function',
      consentValid: hasValidConsent(),
      scriptLoaded: !!document.querySelector('script[src*="googletagmanager.com/gtag/js"]'),
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Analytics Status:', status);
    
    // Test if GA4 is actually working
    if (status.ga4Loaded && status.consentValid) {
      console.log('🧪 Analytics: Sending test event...');
      trackEvent('analytics_connection_test', {
        timestamp: status.timestamp,
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 100) // Truncate for privacy
      });
    }
    
    return status;
  } catch (error) {
    console.error('❌ Analytics: Error during connection check:', error);
    return {
      gtmLoaded: false,
      ga4Loaded: false,
      consentValid: false,
      scriptLoaded: false,
      error: error
    };
  }
};

// Auto-initialize analytics if consent exists
export const autoInitAnalytics = () => {
  console.log('🚀 Analytics: Auto-initialization check...');
  
  if (hasValidConsent()) {
    console.log('✅ Analytics: Valid consent found, initializing...');
    initGA();
  } else {
    console.log('ℹ️ Analytics: No consent found, skipping initialization');
  }
};

// Define global loadAnalytics function after all dependencies are loaded
window.loadAnalytics = function() {
  console.log('🔧 Global loadAnalytics: Loading analytics after consent');
  
  if (!hasValidConsent()) {
    console.log('❌ Global loadAnalytics: No valid consent');
    return;
  }

  // Initialize dataLayer and gtag if not already done
  window.dataLayer = window.dataLayer || [];
  
  if (!window.gtag) {
    window.gtag = function() { 
      if (DEBUG_MODE) console.log('📊 GA4 Event:', arguments);
      window.dataLayer.push(arguments); 
    };
  }

  // Load GA script if not already loaded
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    console.log('🔧 Loading GA4 script...');
    const gaScript = document.createElement('script') as HTMLScriptElement;
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    gaScript.onload = () => {
      console.log('✅ GA4 script loaded successfully');
      configureGA4();
    };
    gaScript.onerror = () => {
      console.error('❌ Failed to load GA4 script');
    };
    document.head.appendChild(gaScript);
  } else {
    // Script already loaded, just configure
    configureGA4();
  }
};

// Configure GA4 after script loads
function configureGA4() {
  if (window.gtag) {
    console.log('🔧 Configuring GA4 with ID:', GA_ID);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      debug_mode: DEBUG_MODE,
      send_page_view: false,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    
    console.log('✅ GA4 configured successfully');
    
    // Track current page
    const currentPath = window.location.pathname + window.location.search;
    trackPageView(currentPath);
  } else {
    console.error('❌ gtag function not available after script load');
  }
}

// Type definitions are centralized in src/types/browser-apis.d.ts
