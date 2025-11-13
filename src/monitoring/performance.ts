import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

import { captureMessage, setTag } from './sentry';

// Performance metrics interface
export interface PerformanceMetrics {
  cls: number | null;
  fcp: number | null;
  inp: number | null;
  lcp: number | null;
  ttfb: number | null;
  bundleSize: number | null;
  loadTime: number | null;
}

// Store metrics globally
const performanceMetrics: PerformanceMetrics = {
  cls: null,
  fcp: null,
  inp: null,
  lcp: null,
  ttfb: null,
  bundleSize: null,
  loadTime: null,
};

// Send metric to analytics/monitoring service
const sendToAnalytics = (metric: Metric) => {
  // Update local metrics
  performanceMetrics[metric.name as keyof PerformanceMetrics] = metric.value;

  // Send to Sentry as custom metric
  setTag(`performance.${metric.name}`, metric.value.toString());

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Performance] ${metric.name}:`, metric.value);
  }

  // Send to external analytics if configured
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error);
  }
};

// Initialize Core Web Vitals monitoring
export const initPerformanceMonitoring = () => {
  // Core Web Vitals
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);

  // Custom metrics
  measureBundleSize();
  measureLoadTime();

  // Performance observer for additional metrics
  if ('PerformanceObserver' in window) {
    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          // Tasks longer than 50ms
          captureMessage(`Long task detected: ${entry.duration}ms`, 'warning');
        }
      });
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch {
      // longtask not supported
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memoryInfo = (performance as any).memory;
      if (memoryInfo && typeof memoryInfo === 'object') {
        setTag('memory.used', Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024).toString());
        setTag('memory.total', Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024).toString());
      }
    }
  }
};

// Measure bundle size from network requests
const measureBundleSize = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      let totalSize = 0;
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          totalSize += (entry as PerformanceResourceTiming).transferSize || 0;
        }
      });

      if (totalSize > 0) {
        performanceMetrics.bundleSize = totalSize;
        setTag('bundle.size', Math.round(totalSize / 1024).toString());
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch {
      // resource timing not supported
    }
  }
};

// Measure page load time
const measureLoadTime = () => {
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    performanceMetrics.loadTime = loadTime;
    setTag('page.loadTime', Math.round(loadTime).toString());
  });
};

// Get current performance metrics
export const getPerformanceMetrics = (): PerformanceMetrics => {
  return { ...performanceMetrics };
};

// Performance monitoring hook for React components
export const usePerformanceMonitoring = (componentName: string) => {
  const startTime = performance.now();

  return {
    markRender: () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16) {
        // Longer than one frame (60fps)
        captureMessage(`Slow render in ${componentName}: ${renderTime}ms`, 'warning');
      }
    },

    markInteraction: (interactionName: string) => {
      const interactionTime = performance.now() - startTime;
      setTag(
        `interaction.${componentName}.${interactionName}`,
        Math.round(interactionTime).toString(),
      );
    },
  };
};

// Bundle analysis utilities
export const analyzeBundlePerformance = () => {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

  const analysis = {
    scriptCount: scripts.length,
    styleCount: styles.length,
    totalResources: scripts.length + styles.length,
    largestScript: '',
    largestScriptSize: 0,
  };

  // This would need to be enhanced with actual size data from performance API
  return analysis;
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  const budgets = {
    lcp: 2500, // 2.5s
    fid: 100, // 100ms
    cls: 0.1, // 0.1
    bundleSize: 500 * 1024, // 500KB
  };

  const violations = [];

  if (performanceMetrics.lcp && performanceMetrics.lcp > budgets.lcp) {
    violations.push(`LCP: ${performanceMetrics.lcp}ms > ${budgets.lcp}ms`);
  }

  if (performanceMetrics.inp && performanceMetrics.inp > budgets.fid) {
    violations.push(`INP: ${performanceMetrics.inp}ms > ${budgets.fid}ms`);
  }

  if (performanceMetrics.cls && performanceMetrics.cls > budgets.cls) {
    violations.push(`CLS: ${performanceMetrics.cls} > ${budgets.cls}`);
  }

  if (performanceMetrics.bundleSize && performanceMetrics.bundleSize > budgets.bundleSize) {
    violations.push(
      `Bundle: ${Math.round(performanceMetrics.bundleSize / 1024)}KB > ${budgets.bundleSize / 1024}KB`,
    );
  }

  if (violations.length > 0) {
    captureMessage(`Performance budget violations: ${violations.join(', ')}`, 'warning');
  }

  return violations;
};
