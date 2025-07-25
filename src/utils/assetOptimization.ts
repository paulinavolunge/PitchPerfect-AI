// Asset Optimization Utilities
export interface AssetOptimizationConfig {
  enableWebP: boolean;
  enableLazyLoading: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  enableCDN: boolean;
  cdnBaseUrl?: string;
}

const defaultConfig: AssetOptimizationConfig = {
  enableWebP: true,
  enableLazyLoading: true,
  compressionLevel: 'medium',
  enableCDN: false,
};

// Image optimization
export function optimizeImageUrl(
  originalUrl: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {},
  config: AssetOptimizationConfig = defaultConfig
): string {
export function optimizeImageUrl(
  originalUrl: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {},
  config: AssetOptimizationConfig = defaultConfig
): string {
  if (!originalUrl) return '';
  
  // Validate URL format
  try {
    new URL(originalUrl, window.location.origin);
  } catch {
    console.warn('Invalid URL provided to optimizeImageUrl:', originalUrl);
    return originalUrl;
  }
  
  // If CDN is enabled, use CDN URL with optimization parameters
  if (config.enableCDN && config.cdnBaseUrl) {
    const params = new URLSearchParams();
    
    if (options.width)  params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format && config.enableWebP) params.set('f', options.format);
    
    // Properly encode the path
    const encodedPath = encodeURIComponent(originalUrl);
    return `${config.cdnBaseUrl}/${encodedPath}?${params.toString()}`;
  }
  
  // For local development, return original URL
  return originalUrl;
}
}

// Generate responsive image URLs
export function generateResponsiveImageSet(
  baseUrl: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920],
  config: AssetOptimizationConfig = defaultConfig
): {
  srcSet: string;
  sizes: string;
  webpSrcSet?: string;
} {
  const srcSet = sizes
    .map(size => `${optimizeImageUrl(baseUrl, { width: size }, config)} ${size}w`)
    .join(', ');
  
  const webpSrcSet = config.enableWebP 
    ? sizes
        .map(size => `${optimizeImageUrl(baseUrl, { width: size, format: 'webp' }, config)} ${size}w`)
        .join(', ')
    : undefined;
  
  const sizesString = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  
  return {
    srcSet,
    sizes: sizesString,
    webpSrcSet
  };
}

// Preload critical assets
export function preloadCriticalAssets(assets: Array<{
  url: string;
  type: 'image' | 'font' | 'script' | 'style';
  crossorigin?: boolean;
}>) {
  if (typeof document === 'undefined') return;
  
  assets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = asset.url;
    
    switch (asset.type) {
      case 'image':
        link.as = 'image';
        break;
      case 'font':
        link.as = 'font';
        link.type = 'font/woff2';
        if (asset.crossorigin) link.crossOrigin = 'anonymous';
        break;
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
    }
    
    document.head.appendChild(link);
  });
}

// Font optimization
export function optimizeFontLoading(fontFamilies: string[]) {
  if (typeof document === 'undefined') return;
  
  fontFamilies.forEach(family => {
    // Create font-display: swap for better loading performance
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${family}';
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  });
}

// Resource hints
export function addResourceHints(domains: string[]) {
  if (typeof document === 'undefined') return;
  
  domains.forEach(domain => {
    // DNS prefetch
    const dnsLink = document.createElement('link');
    dnsLink.rel = 'dns-prefetch';
    dnsLink.href = `//${domain}`;
    document.head.appendChild(dnsLink);
    
    // Preconnect for critical domains
    const preconnectLink = document.createElement('link');
    preconnectLink.rel = 'preconnect';
    preconnectLink.href = `https://${domain}`;
    document.head.appendChild(preconnectLink);
  });
}

// Performance monitoring
export function measureAssetLoadTime(assetUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    if (assetUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      // Image loading
      const img = new Image();
      img.onload = () => resolve(performance.now() - startTime);
      img.onerror = () => resolve(-1);
      img.src = assetUrl;
    } else {
      // Other assets
      fetch(assetUrl)
        .then(() => resolve(performance.now() - startTime))
        .catch(() => resolve(-1));
    }
  });
}

// Critical CSS inlining
export function inlineCriticalCSS(criticalCSS: string) {
  if (typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  style.setAttribute('data-critical', 'true');
  document.head.appendChild(style);
}

// Service Worker for asset caching
export function registerAssetCacheServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw-assets.js')
      .then(registration => {
        console.log('Asset cache SW registered:', registration);
      })
      .catch(error => {
        console.log('Asset cache SW registration failed:', error);
      });
  }
}

// Bundle analysis helper
export function analyzeAssetSizes() {
  if (typeof performance === 'undefined') return null;
  
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return entries.map(entry => ({
    name: entry.name,
    size: entry.transferSize || 0,
    loadTime: entry.loadEnd - entry.loadStart,
    type: entry.initiatorType
  })).sort((a, b) => b.size - a.size);
}

// Image format detection
export function detectWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

// AVIF format detection
export function detectAVIFSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}