import { useEffect, useRef } from 'react';
import SafeLocalStorage from '@/utils/SafeLocalStorage';

/**
 * Storage quota threshold levels
 */
const QUOTA_THRESHOLDS = {
  WARNING: 80, // Show warning at 80% usage
  CRITICAL: 95, // Show critical warning at 95% usage
} as const;

/**
 * Configuration options for storage quota monitoring
 */
interface StorageQuotaMonitorOptions {
  /** Function to show warnings (e.g., toast notifications) */
  onWarning?: (message: string, percentage: number, level: 'warning' | 'critical') => void;
  /** Interval in milliseconds to check quota (default: 30000ms = 30 seconds) */
  checkInterval?: number;
  /** Whether to check quota on mount (default: true) */
  checkOnMount?: boolean;
}

/**
 * Custom hook to monitor localStorage quota usage
 *
 * Checks storage quota periodically and triggers warnings when thresholds are exceeded.
 * Designed to work with SafeLocalStorage and provide proactive warnings before
 * storage quota is exceeded.
 *
 * Based on Context7 React hooks best practices and browser Storage API patterns.
 *
 * @param options Configuration options for quota monitoring
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { toast } = useToast();
 *
 *   useStorageQuotaMonitor({
 *     onWarning: (message, percentage, level) => {
 *       toast({
 *         variant: level === 'critical' ? 'destructive' : 'default',
 *         title: level === 'critical' ? '⚠️ Storage Almost Full' : '⚡ Storage Warning',
 *         description: message,
 *         duration: 7000,
 *       });
 *     },
 *   });
 *
 *   return <YourComponent />;
 * }
 * ```
 */
export function useStorageQuotaMonitor(options: StorageQuotaMonitorOptions = {}) {
  const {
    onWarning,
    checkInterval = 30000, // Check every 30 seconds by default
    checkOnMount = true,
  } = options;

  // Track which warnings have been shown to avoid spam
  const warningsShownRef = useRef<Set<string>>(new Set());

  /**
   * Checks storage quota and triggers warnings if thresholds are exceeded
   */
  const checkQuota = async () => {
    try {
      const quotaInfo = await SafeLocalStorage.getQuotaInfo();

      if (!quotaInfo || quotaInfo.percentage === 0) {
        // Quota API not available or no usage data
        return;
      }

      const { percentage, usage, quota } = quotaInfo;

      // Format storage sizes for display
      const formatSize = (bytes: number): string => {
        const mb = bytes / (1024 * 1024);
        if (mb < 1) {
          return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${mb.toFixed(1)} MB`;
      };

      // Check for critical threshold (95%)
      if (percentage >= QUOTA_THRESHOLDS.CRITICAL) {
        const warningKey = `critical-${Math.floor(percentage)}`;

        if (!warningsShownRef.current.has(warningKey)) {
          console.warn(
            `[Storage Quota Monitor] CRITICAL: Storage at ${percentage.toFixed(1)}% capacity`
          );

          onWarning?.(
            `Your browser storage is nearly full (${percentage.toFixed(1)}% used). ` +
              `Using ${formatSize(usage)} of ${formatSize(quota)} available. ` +
              `Please clear old data or browser cache to continue using this feature.`,
            percentage,
            'critical'
          );

          warningsShownRef.current.add(warningKey);
        }
      }
      // Check for warning threshold (80%)
      else if (percentage >= QUOTA_THRESHOLDS.WARNING) {
        const warningKey = `warning-${Math.floor(percentage / 5) * 5}`; // Round to nearest 5%

        if (!warningsShownRef.current.has(warningKey)) {
          console.warn(
            `[Storage Quota Monitor] WARNING: Storage at ${percentage.toFixed(1)}% capacity`
          );

          onWarning?.(
            `Your browser storage is ${percentage.toFixed(1)}% full. ` +
              `Using ${formatSize(usage)} of ${formatSize(quota)} available. ` +
              `Consider clearing old data to ensure smooth operation.`,
            percentage,
            'warning'
          );

          warningsShownRef.current.add(warningKey);
        }
      }
    } catch (error) {
      console.error('[Storage Quota Monitor] Failed to check quota:', error);
    }
  };

  useEffect(() => {
    // Check on mount if enabled
    if (checkOnMount) {
      checkQuota();
    }

    // Set up periodic checking
    const intervalId = setInterval(checkQuota, checkInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [checkInterval, checkOnMount, onWarning]);

  // Expose checkQuota for manual checking (e.g., before large saves)
  return {
    checkQuota,
  };
}

/**
 * Hook to manually check storage quota before performing operations
 *
 * Useful for checking quota before large saves or uploads to prevent
 * QuotaExceededError during the operation.
 *
 * @returns Function to check current quota and return warning info
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { checkBeforeSave } = useStorageQuotaCheck();
 *
 *   const handleSubmit = async (data) => {
 *     const quotaCheck = await checkBeforeSave();
 *
 *     if (quotaCheck.shouldWarn) {
 *       // Show warning to user
 *       console.warn(quotaCheck.message);
 *     }
 *
 *     // Proceed with save
 *     await saveData(data);
 *   };
 * }
 * ```
 */
export function useStorageQuotaCheck() {
  const checkBeforeSave = async (): Promise<{
    shouldWarn: boolean;
    percentage: number;
    message: string;
    level: 'ok' | 'warning' | 'critical';
  }> => {
    try {
      const quotaInfo = await SafeLocalStorage.getQuotaInfo();

      if (!quotaInfo || quotaInfo.percentage === 0) {
        return {
          shouldWarn: false,
          percentage: 0,
          message: 'Quota information not available',
          level: 'ok',
        };
      }

      const { percentage } = quotaInfo;

      if (percentage >= QUOTA_THRESHOLDS.CRITICAL) {
        return {
          shouldWarn: true,
          percentage,
          message: `Storage is ${percentage.toFixed(1)}% full. Save may fail.`,
          level: 'critical',
        };
      }

      if (percentage >= QUOTA_THRESHOLDS.WARNING) {
        return {
          shouldWarn: true,
          percentage,
          message: `Storage is ${percentage.toFixed(1)}% full. Consider clearing old data.`,
          level: 'warning',
        };
      }

      return {
        shouldWarn: false,
        percentage,
        message: `Storage usage: ${percentage.toFixed(1)}%`,
        level: 'ok',
      };
    } catch (error) {
      console.error('[Storage Quota Check] Failed:', error);
      return {
        shouldWarn: false,
        percentage: 0,
        message: 'Failed to check storage quota',
        level: 'ok',
      };
    }
  };

  return {
    checkBeforeSave,
  };
}

export default useStorageQuotaMonitor;
