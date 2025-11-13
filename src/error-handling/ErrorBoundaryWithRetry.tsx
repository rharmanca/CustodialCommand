/**
 * Enhanced Error Boundary with Retry Capability
 *
 * Features:
 * - Retry button for recoverable errors
 * - Different fallbacks for different error types
 * - Automatic error reporting to Sentry
 * - User-friendly error messages
 * - Error context preservation
 */
import { Component, ReactNode } from 'react';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { captureException } from '@/monitoring/sentry';

export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  maxRetries?: number;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundaryWithRetry extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to Sentry
    captureException(error, {
      context: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      errorInfo,
    });

    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    const { maxRetries = 3, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn(`Maximum retry attempts (${maxRetries}) reached`);
      return;
    }

    // Call custom retry handler if provided
    if (onRetry) {
      onRetry();
    }

    // Reset error state and increment retry count
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
    });
  };

  getErrorType(error: Error): 'network' | 'render' | 'unknown' {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'network';
    }
    if (error.message.includes('render') || error.message.includes('component')) {
      return 'render';
    }
    return 'unknown';
  }

  getUserFriendlyMessage(error: Error): string {
    const errorType = this.getErrorType(error);

    switch (errorType) {
      case 'network':
        return "We're having trouble connecting to the server. Please check your internet connection and try again.";
      case 'render':
        return 'Something went wrong while displaying this content. Please try refreshing the page.';
      default:
        return 'An unexpected error occurred. Our team has been notified and is working on a fix.';
    }
  }

  renderDefaultFallback() {
    const { error, retryCount } = this.state;
    const { maxRetries = 3, showDetails = false } = this.props;

    if (!error) return null;

    const errorType = this.getErrorType(error);
    const userMessage = this.getUserFriendlyMessage(error);
    const canRetry = retryCount < maxRetries;

    return (
      <Box
        sx={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 600,
            width: '100%',
          }}
        >
          <Stack spacing={3}>
            {/* Error Icon */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {errorType === 'network' ? (
                <WarningIcon sx={{ fontSize: 64, color: 'warning.main' }} />
              ) : (
                <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
              )}
            </Box>

            {/* Error Message */}
            <Typography variant="h5" component="h2" align="center" gutterBottom>
              Oops! Something went wrong
            </Typography>

            <Alert severity={errorType === 'network' ? 'warning' : 'error'}>{userMessage}</Alert>

            {/* Retry Information */}
            {retryCount > 0 && (
              <Typography variant="body2" color="text.secondary" align="center">
                Retry attempt: {retryCount} of {maxRetries}
              </Typography>
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="center">
              {canRetry && (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  size="large"
                >
                  Try Again
                </Button>
              )}
              <Button variant="outlined" onClick={() => window.location.reload()} size="large">
                Reload Page
              </Button>
            </Stack>

            {/* Error Details (Development Only) */}
            {showDetails && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {error.message}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}

            {/* Maximum Retries Reached */}
            {!canRetry && (
              <Alert severity="info">
                Maximum retry attempts reached. Please reload the page or contact support if the
                problem persists.
              </Alert>
            )}
          </Stack>
        </Paper>
      </Box>
    );
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Use default fallback
      return this.renderDefaultFallback();
    }

    return children;
  }
}

/**
 * HOC to wrap components with ErrorBoundaryWithRetry
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundaryWithRetry {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundaryWithRetry>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
