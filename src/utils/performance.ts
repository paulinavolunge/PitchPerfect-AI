
// Performance utilities for Core Web Vitals optimization
export function preloadCriticalResources(): void {
  try {
    // Optionally preload fonts or critical assets
  } catch {}
}

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

export function measureWebVitals(): void {
  try {
    // Optionally hook into web-vitals
  } catch {}
}
