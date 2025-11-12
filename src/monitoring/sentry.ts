import * as Sentry from '@sentry/react';

export const initSentry = () => {
  // Only initialize Sentry in production or when explicitly enabled
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY === 'true') {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration()],
      // Performance Monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development

      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with an error will be recorded

      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',

      // Additional configuration
      beforeSend(event) {
        // Filter out development errors in production
        if (import.meta.env.PROD && event.exception) {
          const error = event.exception.values?.[0];
          if (error?.value?.includes('ResizeObserver loop limit exceeded')) {
            return null; // Don't send this common, harmless error
          }
        }
        return event;
      },

      // Set user context
      initialScope: {
        tags: {
          component: 'custodial-command',
        },
      },
    });
  }
};

// Error boundary component
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Performance monitoring utilities
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, () => {});
};

export const addBreadcrumb = (
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

export const captureException = (error: Error, context?: Record<string, unknown>) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};
