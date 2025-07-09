// Performance monitoring and optimization utilities

export const performanceMonitor = {
  // Measure Core Web Vitals
  measureWebVitals: () => {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const firstInput = entries[0] as any; // Type assertion for first-input entries
      if (firstInput && firstInput.processingStart) {
        console.log('FID:', firstInput.processingStart - firstInput.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShiftEntry = entry as any; // Type assertion for layout-shift entries
        if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
          clsValue += layoutShiftEntry.value;
        }
      }
      console.log('CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  },

  // Optimize image loading
  optimizeImages: () => {
    // Add intersection observer for lazy images
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  },

  // Preload critical resources
  preloadCriticalResources: () => {
    const criticalResources = [
      { href: '/assets/logo-pitchperfectai.webp', as: 'image', type: 'image/webp' },
      { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap', as: 'style' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      document.head.appendChild(link);
    });
  },

  // Measure bundle sizes
  analyzeBundleSize: () => {
    if ('PerformanceNavigationTiming' in window) {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      console.log('Total page load time:', navTiming.loadEventEnd - navTiming.fetchStart, 'ms');
      console.log('DOM content loaded:', navTiming.domContentLoadedEventEnd - navTiming.fetchStart, 'ms');
    }
  }
};

// Initialize performance monitoring in production
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    performanceMonitor.measureWebVitals();
    performanceMonitor.optimizeImages();
    performanceMonitor.analyzeBundleSize();
  });
}