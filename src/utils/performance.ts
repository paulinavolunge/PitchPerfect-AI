// Performance utilities for optimizing app load times

export const preloadCriticalResources = () => {
  // Preload critical images
  const criticalImages = [
    '/assets/logo-pitchperfectai.webp',
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

export const deferNonCriticalCSS = () => {
  // Defer non-critical stylesheets
  const nonCriticalStyles = document.querySelectorAll('link[rel="stylesheet"][data-defer]');
  
  nonCriticalStyles.forEach(link => {
    if (link instanceof HTMLLinkElement) {
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
    }
  });
};

export const optimizeForWebVitals = () => {
  // Preload critical resources
  preloadCriticalResources();
  
  // Defer non-critical CSS
  deferNonCriticalCSS();
  
  // Remove unused event listeners after component unmount
  return () => {
    // Cleanup function
  };
};

// Intersection Observer for lazy loading
export const createLazyObserver = (callback: (entries: IntersectionObserverEntry[]) => void) => {
  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.1
  });
};