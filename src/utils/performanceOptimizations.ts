
// Performance optimization utilities
export class PerformanceOptimizer {
  private static loadedModules = new Set<string>();
  private static observers = new Map<string, IntersectionObserver>();

  // Lazy load images with WebP support
  static setupLazyImages(): void {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      images.forEach((img: HTMLImageElement) => {
        img.src = img.dataset.src || '';
        img.loading = 'lazy';
      });
    } else {
      // Fallback intersection observer
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }

  // Preload critical resources
  static preloadCriticalResources(): void {
    const criticalImages = [
      '/assets/logo-pitchperfectai.png',
      '/assets/logo-pitchperfectai@2x.png'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  // Lazy load JavaScript modules
  static async lazyLoadModule<T>(
    moduleImporter: () => Promise<T>,
    moduleName: string
  ): Promise<T | null> {
    if (this.loadedModules.has(moduleName)) {
      return null;
    }

    try {
      const module = await moduleImporter();
      this.loadedModules.add(moduleName);
      return module;
    } catch (error) {
      console.error(`Failed to load module ${moduleName}:`, error);
      return null;
    }
  }

  // Setup intersection observer for sections
  static observeSection(
    selector: string,
    callback: () => void,
    threshold = 0.1
  ): void {
    const element = document.querySelector(selector);
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);
    this.observers.set(selector, observer);
  }

  // Cleanup observers
  static cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  // Defer non-critical CSS
  static loadNonCriticalCSS(href: string): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = () => {
      link.media = 'all';
    };
    document.head.appendChild(link);
  }

  // Check if WebP is supported
  static supportsWebP(): Promise<boolean> {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // Get optimized image source
  static getOptimizedImageSrc(baseSrc: string, format?: 'webp' | 'avif'): string {
    if (!format) return baseSrc;
    
    const extension = baseSrc.split('.').pop();
    return baseSrc.replace(`.${extension}`, `.${format}`);
  }
}

// Initialize performance optimizations
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    PerformanceOptimizer.setupLazyImages();
    PerformanceOptimizer.preloadCriticalResources();
  });
}

export default PerformanceOptimizer;
