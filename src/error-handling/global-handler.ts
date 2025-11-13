/**
 * Global Error Handler
 *
 * Catches and handles:
 * - Unhandled promise rejections
 * - Network errors
 * - Offline state changes
 * - Runtime errors
 */
import { captureException } from '@/monitoring/sentry';

export interface GlobalErrorHandlerConfig {
  enableConsoleLogging?: boolean;
  enableSentryReporting?: boolean;
  onNetworkError?: () => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

class GlobalErrorHandler {
  private config: Required<GlobalErrorHandlerConfig>;
  private isOnline: boolean = navigator.onLine;

  constructor(config: GlobalErrorHandlerConfig = {}) {
    this.config = {
      enableConsoleLogging: config.enableConsoleLogging ?? true,
      enableSentryReporting: config.enableSentryReporting ?? true,
      onNetworkError: config.onNetworkError ?? (() => {}),
      onOffline: config.onOffline ?? (() => {}),
      onOnline: config.onOnline ?? (() => {}),
    };
  }

  /**
   * Initialize global error handlers
   */
  initialize(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Handle global errors
    window.addEventListener('error', this.handleError);

    // Handle network status changes
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Log initialization
    if (this.config.enableConsoleLogging) {
      console.log('[GlobalErrorHandler] Initialized', {
        isOnline: this.isOnline,
        config: this.config,
      });
    }
  }

  /**
   * Clean up event listeners
   */
  cleanup(): void {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    event.preventDefault(); // Prevent default browser error logging

    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

    if (this.config.enableConsoleLogging) {
      console.error('[GlobalErrorHandler] Unhandled promise rejection:', error);
    }

    // Check if it's a network error
    if (this.isNetworkError(error)) {
      this.handleNetworkError(error);
      return;
    }

    // Report to Sentry
    if (this.config.enableSentryReporting) {
      captureException(error, {
        context: 'UnhandledPromiseRejection',
        isOnline: this.isOnline,
      });
    }
  };

  /**
   * Handle global errors
   */
  private handleError = (event: ErrorEvent): void => {
    event.preventDefault(); // Prevent default browser error logging

    const error = event.error || new Error(event.message);

    if (this.config.enableConsoleLogging) {
      console.error('[GlobalErrorHandler] Global error:', error);
    }

    // Check if it's a network error
    if (this.isNetworkError(error)) {
      this.handleNetworkError(error);
      return;
    }

    // Report to Sentry
    if (this.config.enableSentryReporting) {
      captureException(error, {
        context: 'GlobalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        isOnline: this.isOnline,
      });
    }
  };

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.isOnline = true;

    if (this.config.enableConsoleLogging) {
      console.log('[GlobalErrorHandler] Connection restored');
    }

    this.config.onOnline();

    // Show user notification
    this.showNotification('Connection restored', 'success');
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.isOnline = false;

    if (this.config.enableConsoleLogging) {
      console.warn('[GlobalErrorHandler] Connection lost');
    }

    this.config.onOffline();

    // Show user notification
    this.showNotification('You are offline. Some features may be unavailable.', 'warning');
  };

  /**
   * Handle network errors
   */
  private handleNetworkError(error: Error): void {
    if (this.config.enableConsoleLogging) {
      console.error('[GlobalErrorHandler] Network error:', error);
    }

    this.config.onNetworkError();

    // Show user notification
    if (!this.isOnline) {
      this.showNotification('Network error: You appear to be offline', 'error');
    } else {
      this.showNotification('Network error: Please check your connection', 'error');
    }

    // Report to Sentry with network context
    if (this.config.enableSentryReporting) {
      captureException(error, {
        context: 'NetworkError',
        isOnline: this.isOnline,
        connectionType: this.getConnectionType(),
      });
    }
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: Error): boolean {
    const networkErrorPatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /connection/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /Failed to fetch/i,
    ];

    return networkErrorPatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Get connection type (if available)
   */
  private getConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string } })
        .connection;
      return connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Show user notification
   */
  private showNotification(message: string, type: 'success' | 'warning' | 'error'): void {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
      ${
        type === 'success'
          ? 'background-color: #4caf50;'
          : type === 'warning'
            ? 'background-color: #ff9800;'
            : 'background-color: #f44336;'
      }
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 5000);
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// Create singleton instance
const globalErrorHandler = new GlobalErrorHandler();

/**
 * Initialize global error handling
 */
export function initializeGlobalErrorHandler(config?: GlobalErrorHandlerConfig): void {
  const handler = new GlobalErrorHandler(config);
  handler.initialize();
}

/**
 * Get online status
 */
export function isOnline(): boolean {
  return globalErrorHandler.getOnlineStatus();
}

export default globalErrorHandler;
