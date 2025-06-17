
// Privacy-compliant Google Analytics implementation with enhanced debugging

// Define global loadAnalytics function for dynamic consent updates
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
      console.log('📊 GA4 Event:', arguments);
      window.dataLayer.push(arguments); 
    };
  }

  // Load GA script if not already loaded
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    const gaScript = document.createElement('script') as HTMLScriptElement;
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-HVCRJT504Y';
    document.head.appendChild(gaScript);
  }

  // Load GTM if not already loaded
  if (!document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) {
    (function(w,d,s,l,i){
      w[l]=w[l]||[];
      w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
      const f=d.getElementsByTagName(s)[0];
      const j=d.createElement(s) as HTMLScriptElement;
      const dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-XXXXXXX');
  }

  // Configure GA4
  setTimeout(() => {
    if (window.gtag) {
      window.gtag('js', new Date());
      window.gtag('config', 'G-HVCRJT504Y', {
        debug_mode: true,
        send_page_view: false,
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
      
      // Track current page
      const currentPath = window.location.pathname + window.location.search;
      trackPageView(currentPath);
    }
  }, 500);
};

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
    if (window.dataLayer && window.gtag) {
      console.log('✅ Analytics: Already initialized');
      return;
    }

    // Use the global loadAnalytics function
    if (typeof window.loadAnalytics === 'function') {
      window.loadAnalytics();
    } else {
      console.warn('⚠️ Analytics: Global loadAnalytics function not available');
    }
    
    console.log('✅ Analytics: Successfully initialized with GA ID: G-HVCRJT504Y');
    
    // Test connection
    setTimeout(() => {
      checkAnalyticsConnection();
    }, 1000);
    
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
      }, 500);
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
    
    console.log('✅ Analytics: Page view tracked successfully:', path);
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
      send_to: 'G-HVCRJT504Y'
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

// Enhanced type definition for window object
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (command: string, ...args: any[]) => void;
    fbq: any;
    loadAnalytics?: () => void; // Made optional to match actual usage
  }
}
