// Export all monitoring utilities
export {
  initSentry,
  SentryErrorBoundary,
  captureException,
  captureMessage,
  setUser,
  setTag,
} from './sentry';
export {
  initPerformanceMonitoring,
  getPerformanceMetrics,
  usePerformanceMonitoring,
  checkPerformanceBudget,
  type PerformanceMetrics,
} from './performance';
export { default as PerformanceDashboard } from './PerformanceDashboard';
