import React from 'react';

/**
 * Props for LocalStorageErrorBoundary component
 */
interface LocalStorageErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * State shape for error boundary
 */
interface LocalStorageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component for localStorage failures
 *
 * Catches errors that occur during localStorage operations and prevents
 * the application from crashing. Provides recovery options including:
 * - Retry (reload page)
 * - Clear Saved Data (clear localStorage and reload)
 *
 * Based on Context7 React error boundary best practices.
 *
 * @example
 * ```tsx
 * <LocalStorageErrorBoundary>
 *   <YourComponent />
 * </LocalStorageErrorBoundary>
 * ```
 */
class LocalStorageErrorBoundary extends React.Component<
  LocalStorageErrorBoundaryProps,
  LocalStorageErrorBoundaryState
> {
  constructor(props: LocalStorageErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Updates state when an error is caught during rendering
   * This lifecycle method is called during the "render" phase,
   * so side-effects are not allowed.
   *
   * @param error - The error that was thrown
   * @returns New state object
   */
  static getDerivedStateFromError(error: Error): Partial<LocalStorageErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Logs error information for debugging and analytics
   * Called after an error has been thrown by a descendant component
   *
   * @param error - The error that was thrown
   * @param errorInfo - Information about the component stack
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console with component stack trace
    console.error('LocalStorage Error Boundary caught an error:', error);
    console.error('Component Stack:', errorInfo.componentStack);

    // Store error info in state for display
    this.setState({
      errorInfo,
    });

    // Future: Send to error tracking service
    // logErrorToAnalyticsService(error, errorInfo.componentStack);
  }

  /**
   * Handles retry action - reloads the page
   */
  handleRetry = (): void => {
    window.location.reload();
  };

  /**
   * Handles clear data action - clears localStorage and reloads
   */
  handleClearData = (): void => {
    try {
      localStorage.clear();
      console.log('LocalStorage cleared successfully');
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
    window.location.reload();
  };

  render(): React.ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If custom fallback provided, use it
      if (fallback) {
        return fallback;
      }

      // Default fallback UI with recovery options
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Something Went Wrong
            </h2>
            <p className="text-gray-600 text-center mb-6">
              We encountered an issue saving your preferences. This might happen if your browser's
              storage is full or if you're using private browsing mode.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Retry
              </button>
              <button
                onClick={this.handleClearData}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Clear Saved Data & Retry
              </button>
            </div>

            {/* Error Details (Development Mode Only) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  View Technical Details
                </summary>
                <div className="mt-3 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-48">
                  <div className="text-red-600 font-semibold mb-2">
                    {error.name}: {error.message}
                  </div>
                  {errorInfo && (
                    <div className="text-gray-600 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default LocalStorageErrorBoundary;
