/**
 * Error Handling Test Page
 *
 * Demonstrates and tests all error handling features:
 * - Network retry with exponential backoff
 * - Error boundary with retry
 * - Circuit breaker
 * - Global error handler
 */
import { useState } from 'react';

import BugReportIcon from '@mui/icons-material/BugReport';
import ErrorIcon from '@mui/icons-material/Error';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import RefreshIcon from '@mui/icons-material/Refresh';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ErrorBoundaryWithRetry } from '@/error-handling/ErrorBoundaryWithRetry';
import { isOnline } from '@/error-handling/global-handler';
import {
  fetchWithRetry,
  getCircuitBreakerStatus,
  resetCircuitBreaker,
  retryWithBackoff,
} from '@/utils/network-retry';

// Component that throws an error for testing
function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error from component');
  }
  return <Alert severity="success">Component rendered successfully!</Alert>;
}

function ErrorTestPage() {
  const [throwError, setThrowError] = useState(false);
  const [networkTestResult, setNetworkTestResult] = useState<string>('');
  const [retryTestResult, setRetryTestResult] = useState<string>('');
  const [circuitStatus, setCircuitStatus] = useState(getCircuitBreakerStatus());
  const [onlineStatus, setOnlineStatus] = useState(isOnline());

  // Test network retry
  const testNetworkRetry = async () => {
    setNetworkTestResult('Testing...');
    try {
      // This will fail and retry 3 times
      await retryWithBackoff(() => fetch('https://httpstat.us/500').then((r) => r.json()), {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          setRetryTestResult(`Retry attempt ${attempt}: ${error.message}`);
        },
      });
      setNetworkTestResult('Success (unexpected)');
    } catch (error) {
      setNetworkTestResult(`Failed after retries: ${(error as Error).message}`);
    }
  };

  // Test successful retry
  const testSuccessfulRetry = async () => {
    setNetworkTestResult('Testing...');
    let attempts = 0;
    try {
      const result = await retryWithBackoff(
        async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Simulated failure');
          }
          return { success: true, attempts };
        },
        {
          maxAttempts: 3,
          onRetry: (attempt) => {
            setRetryTestResult(`Retry attempt ${attempt}`);
          },
        },
      );
      setNetworkTestResult(`Success after ${result.attempts} attempts`);
    } catch (error) {
      setNetworkTestResult(`Failed: ${(error as Error).message}`);
    }
  };

  // Test fetch with retry
  const testFetchWithRetry = async () => {
    setNetworkTestResult('Testing fetch with retry...');
    try {
      // This should succeed (httpstat.us/200 returns 200 OK)
      const response = await fetchWithRetry('https://httpstat.us/200', undefined, {
        maxAttempts: 3,
      });
      setNetworkTestResult(`Success: ${response.status} ${response.statusText}`);
    } catch (error) {
      setNetworkTestResult(`Failed: ${(error as Error).message}`);
    }
  };

  // Update circuit breaker status
  const updateCircuitStatus = () => {
    setCircuitStatus(getCircuitBreakerStatus());
    setOnlineStatus(isOnline());
  };

  // Reset circuit breaker
  const handleResetCircuit = () => {
    resetCircuitBreaker();
    updateCircuitStatus();
  };

  // Trigger component error
  const triggerComponentError = () => {
    setThrowError(true);
  };

  // Trigger unhandled promise rejection
  const triggerUnhandledRejection = () => {
    Promise.reject(new Error('Test unhandled promise rejection'));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Error Handling Test Suite
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Test all error handling features including retry logic, error boundaries, and circuit
        breakers.
      </Typography>

      <Stack spacing={3}>
        {/* Status Cards */}
        <Stack direction="row" spacing={2}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <NetworkCheckIcon color={onlineStatus ? 'success' : 'error'} />
                <Typography variant="h6">{onlineStatus ? 'Online' : 'Offline'}</Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6">Circuit Breaker:</Typography>
                <Chip
                  label={circuitStatus.state}
                  color={circuitStatus.isOpen ? 'error' : 'success'}
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Network Retry Tests */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Network Retry Tests
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={testNetworkRetry}>
                  Test Failed Request (3 retries)
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={testSuccessfulRetry}
                >
                  Test Successful Retry
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={testFetchWithRetry}>
                  Test Fetch with Retry
                </Button>
              </Stack>

              {networkTestResult && (
                <Alert severity="info">
                  <Typography variant="body2">{networkTestResult}</Typography>
                </Alert>
              )}

              {retryTestResult && (
                <Alert severity="warning">
                  <Typography variant="body2">{retryTestResult}</Typography>
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Error Boundary Tests */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Error Boundary Tests
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ErrorIcon />}
                onClick={triggerComponentError}
              >
                Trigger Component Error
              </Button>

              <ErrorBoundaryWithRetry
                maxRetries={3}
                showDetails={true}
                onRetry={() => setThrowError(false)}
              >
                <ErrorThrowingComponent shouldThrow={throwError} />
              </ErrorBoundaryWithRetry>
            </Stack>
          </CardContent>
        </Card>

        {/* Global Error Handler Tests */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Global Error Handler Tests
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<BugReportIcon />}
                onClick={triggerUnhandledRejection}
              >
                Trigger Unhandled Promise Rejection
              </Button>
              <Alert severity="info">
                Check the browser console for error handling logs. You should see a toast
                notification appear.
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* Circuit Breaker Controls */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Circuit Breaker Controls
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={updateCircuitStatus}>
                Refresh Status
              </Button>
              <Button variant="outlined" color="warning" onClick={handleResetCircuit}>
                Reset Circuit Breaker
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default ErrorTestPage;
