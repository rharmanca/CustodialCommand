import { useState, useEffect } from 'react';

/**
 * Return type for useLocalStorageAvailable hook
 */
interface LocalStorageAvailability {
  /** Whether localStorage is available and working */
  isAvailable: boolean;
  /** Whether the check is still in progress */
  isChecking: boolean;
  /** Error message if check failed */
  error: string | null;
  /** Storage quota information (if available) */
  quota: {
    usage: number;
    total: number;
    percentage: number;
  } | null;
}

/**
 * React hook to detect localStorage availability
 *
 * Checks if localStorage is available and working by attempting
 * to write and read a test value. Also provides storage quota
 * information if supported by the browser.
 *
 * Handles common scenarios:
 * - Private browsing mode (localStorage disabled)
 * - Storage quota exceeded
 * - localStorage disabled by user/policy
 * - Browser doesn't support localStorage
 *
 * @returns Object containing availability status and quota info
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAvailable, quota, error } = useLocalStorageAvailable();
 *
 *   if (!isAvailable) {
 *     return <div>Storage unavailable: {error}</div>;
 *   }
 *
 *   if (quota && quota.percentage > 90) {
 *     return <div>Warning: Storage almost full ({quota.percentage}%)</div>;
 *   }
 *
 *   return <div>Storage available</div>;
 * }
 * ```
 */
export function useLocalStorageAvailable(): LocalStorageAvailability {
  const [state, setState] = useState<LocalStorageAvailability>({
    isAvailable: false,
    isChecking: true,
    error: null,
    quota: null,
  });

  useEffect(() => {
    /**
     * Tests if localStorage is available by attempting read/write
     */
    const checkAvailability = (): { available: boolean; error: string | null } => {
      try {
        const testKey = '__storage_test__';
        const testValue = 'test';

        // Check if localStorage exists
        if (typeof localStorage === 'undefined') {
          return {
            available: false,
            error: 'localStorage is not supported in this browser',
          };
        }

        // Try to write
        localStorage.setItem(testKey, testValue);

        // Try to read
        const retrieved = localStorage.getItem(testKey);

        // Clean up
        localStorage.removeItem(testKey);

        // Verify read matches write
        if (retrieved !== testValue) {
          return {
            available: false,
            error: 'localStorage read/write verification failed',
          };
        }

        return {
          available: true,
          error: null,
        };
      } catch (e) {
        const error = e as Error;

        // Detect specific error types
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          return {
            available: false,
            error: 'Storage quota exceeded',
          };
        }

        if (error.name === 'SecurityError') {
          return {
            available: false,
            error: 'localStorage access denied (private browsing or security policy)',
          };
        }

        return {
          available: false,
          error: error.message || 'Unknown localStorage error',
        };
      }
    };

    /**
     * Gets storage quota information if available
     */
    const getQuotaInfo = async (): Promise<LocalStorageAvailability['quota']> => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          const usage = estimate.usage || 0;
          const quota = estimate.quota || 0;
          const percentage = quota > 0 ? Math.round((usage / quota) * 10000) / 100 : 0;

          return {
            usage,
            total: quota,
            percentage,
          };
        } catch (e) {
          console.warn('useLocalStorageAvailable: Unable to get quota info', e);
        }
      }
      return null;
    };

    /**
     * Performs the availability check and quota query
     */
    const performCheck = async () => {
      const { available, error } = checkAvailability();
      const quota = available ? await getQuotaInfo() : null;

      setState({
        isAvailable: available,
        isChecking: false,
        error,
        quota,
      });
    };

    performCheck();
  }, []);

  return state;
}

/**
 * Simplified hook that only returns a boolean
 *
 * @returns true if localStorage is available, false otherwise
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const storageAvailable = useIsLocalStorageAvailable();
 *
 *   return (
 *     <div>
 *       {storageAvailable ? 'Storage OK' : 'Storage unavailable'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsLocalStorageAvailable(): boolean {
  const { isAvailable } = useLocalStorageAvailable();
  return isAvailable;
}

export default useLocalStorageAvailable;
