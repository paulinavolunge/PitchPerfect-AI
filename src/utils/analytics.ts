// Privacy-compliant Google Analytics — minimal, no render-blocking

const GA_ID = 'G-HVCRJT504Y';
const PRODUCTION_HOSTNAME = 'pitchperfectai-02.lovable.app';

function stripInternalParams(url: string): string {
  try {
    if (url.startsWith('/')) {
      const u = new URL(url, 'https://x.com');
      u.searchParams.delete('__lovable_token');
      return u.pathname + (u.search || '') + (u.hash || '');
    }
    const u = new URL(url);
    u.searchParams.delete('__lovable_token');
    return u.toString();
  } catch {
    return url;
  }
}

function isProductionHost(): boolean {
  return window.location.hostname === PRODUCTION_HOSTNAME;
}

export const hasValidConsent = (): boolean => {
  const consent = localStorage.getItem('analytics-consent');
  const consentDate = localStorage.getItem('analytics-consent-date');
  if (consent !== 'true') return false;
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (!consentDate || Date.now() - parseInt(consentDate) > oneYear) {
    localStorage.removeItem('analytics-consent');
    localStorage.removeItem('analytics-consent-date');
    return false;
  }
  return true;
};

export const hasAnalyticsConsent = hasValidConsent;

export const setAnalyticsConsent = (granted: boolean) => {
  if (granted) {
    localStorage.setItem('analytics-consent', 'true');
    localStorage.setItem('analytics-consent-date', Date.now().toString());
    loadGAScript();
  } else {
    localStorage.removeItem('analytics-consent');
    localStorage.removeItem('analytics-consent-date');
  }
};

export const revokeAnalyticsConsent = () => {
  localStorage.removeItem('analytics-consent');
  localStorage.removeItem('analytics-consent-date');
};

function loadGAScript() {
  if (!hasValidConsent()) return;
  
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function() { window.dataLayer.push(arguments); };
  }

  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    s.onload = () => configureGA4();
    document.head.appendChild(s);
  } else {
    configureGA4();
  }
}

function configureGA4() {
  if (!window.gtag) return;
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    debug_mode: false,
    send_page_view: false,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  trackPageView(window.location.pathname + window.location.search);
}

export const initGA = () => {
  if (!hasValidConsent()) return;
  loadGAScript();
};

export const trackPageView = (path: string) => {
  if (!isProductionHost() || !hasValidConsent() || !window.gtag) return;
  const cleanPath = stripInternalParams(path);
  const cleanLocation = stripInternalParams(window.location.href);
  window.gtag('event', 'page_view', {
    page_path: cleanPath,
    page_title: document.title,
    page_location: cleanLocation,
    send_to: GA_ID,
  });
};

export const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (!isProductionHost() || !hasValidConsent() || !window.gtag) return;
  window.gtag('event', eventName, { ...eventParams, send_to: GA_ID });
};

export const autoInitAnalytics = () => {
  if (hasValidConsent()) initGA();
};

export const checkAnalyticsConnection = () => ({
  gtmLoaded: typeof window.dataLayer !== 'undefined',
  ga4Loaded: typeof window.gtag === 'function',
  consentValid: hasValidConsent(),
  scriptLoaded: !!document.querySelector('script[src*="googletagmanager.com/gtag/js"]'),
});

// Global loadAnalytics for consent banner
window.loadAnalytics = loadGAScript;
