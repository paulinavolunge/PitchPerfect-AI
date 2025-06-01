
export class PerformanceMetrics {
  private static marks: Map<string, number> = new Map();
  private static measures: Map<string, number> = new Map();

  static mark(name: string): void {
    if ('performance' in window && performance.mark) {
      performance.mark(name);
    }
    this.marks.set(name, Date.now());
  }

  static measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : Date.now();
    
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = (endTime || Date.now()) - startTime;
    this.measures.set(name, duration);

    if ('performance' in window && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }

    return duration;
  }

  static getMetric(name: string): number | undefined {
    return this.measures.get(name);
  }

  static getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  static trackPageLoad(): void {
    if ('performance' in window && performance.timing) {
      const timing = performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoadedTime = timing.domContentLoadedEventEnd - timing.navigationStart;
      const firstPaintTime = timing.responseStart - timing.navigationStart;

      this.measures.set('pageLoad', pageLoadTime);
      this.measures.set('domContentLoaded', domContentLoadedTime);
      this.measures.set('firstPaint', firstPaintTime);
    }
  }

  static trackResourceLoad(resourceName: string, startTime: number): void {
    const loadTime = Date.now() - startTime;
    this.measures.set(`resource_${resourceName}`, loadTime);
  }

  static trackUserAction(actionName: string): void {
    this.mark(`action_${actionName}_start`);
  }

  static endUserAction(actionName: string): number {
    const startMarkName = `action_${actionName}_start`;
    return this.measure(`action_${actionName}`, startMarkName);
  }

  static getWebVitals(): Promise<any> {
    return new Promise((resolve) => {
      if ('web-vitals' in window) {
        // If web-vitals library is available
        resolve((window as any)['web-vitals']);
      } else {
        // Basic fallback metrics
        const vitals = {
          LCP: 0, // Largest Contentful Paint
          FID: 0, // First Input Delay
          CLS: 0  // Cumulative Layout Shift
        };

        if ('performance' in window && performance.getEntriesByType) {
          const paintEntries = performance.getEntriesByType('paint');
          const lcpEntry = paintEntries.find(entry => entry.name === 'largest-contentful-paint');
          if (lcpEntry) {
            vitals.LCP = lcpEntry.startTime;
          }
        }

        resolve(vitals);
      }
    });
  }

  static reportMetrics(): void {
    const metrics = this.getAllMetrics();
    
    // In production, send metrics to analytics service
    console.log('Performance Metrics:', metrics);
    
    // Optional: Send to analytics - check if gtag exists in window
    if (typeof window !== 'undefined' && 'gtag' in window && typeof window.gtag === 'function') {
      Object.entries(metrics).forEach(([name, value]) => {
        window.gtag('event', 'performance_metric', {
          metric_name: name,
          metric_value: value
        });
      });
    }
  }
}

// Auto-track page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    PerformanceMetrics.trackPageLoad();
  });
}

export default PerformanceMetrics;
