
// Performance utilities for Core Web Vitals optimization
import { secureLog } from './secureLog';
export const preloadCriticalResources = () => {
  // Critical resources are already preloaded via Google Fonts
  // No additional font preloading needed
};

export const optimizeImages = () => {
  // Add intersection observer for lazy loading images
  if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }
};

export const measureWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Measure Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
              secureLog.info('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Measure Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
              secureLog.info('CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
};
