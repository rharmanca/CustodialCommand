import { useState, useEffect, useRef, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean; // true for 3s after coming back online
  lastChecked: Date;
}

/**
 * useNetworkStatus - Reliable online/offline status with transition detection
 *
 * Handles:
 * - navigator.onLine tracking via online/offline events
 * - wasOffline flag: true for 3s after reconnect (drives "Back Online" animation)
 * - iOS Safari quirk: navigator.onLine can be unreliably true — polling fallback
 * - Polling every 5s to detect connectivity state on iOS/older browsers
 * - Cleanup on unmount to prevent memory leaks
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // SSR-safe: check navigator existence
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date>(() => new Date());

  // Ref to track the wasOffline reset timer
  const wasOfflineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to track the previous online state (for transition detection)
  const prevIsOnlineRef = useRef<boolean>(isOnline);

  const clearWasOfflineTimer = useCallback(() => {
    if (wasOfflineTimerRef.current !== null) {
      clearTimeout(wasOfflineTimerRef.current);
      wasOfflineTimerRef.current = null;
    }
  }, []);

  const handleOnline = useCallback(() => {
    const now = new Date();
    setLastChecked(now);

    // Only set wasOffline if we were actually offline before
    if (!prevIsOnlineRef.current) {
      setWasOffline(true);
      clearWasOfflineTimer();
      // Clear wasOffline after 3 seconds (transition animation window)
      wasOfflineTimerRef.current = setTimeout(() => {
        setWasOffline(false);
        wasOfflineTimerRef.current = null;
      }, 3000);
    }

    prevIsOnlineRef.current = true;
    setIsOnline(true);
  }, [clearWasOfflineTimer]);

  const handleOffline = useCallback(() => {
    setLastChecked(new Date());
    prevIsOnlineRef.current = false;
    setIsOnline(false);
    // Clear any pending wasOffline reset — we went offline again
    clearWasOfflineTimer();
    setWasOffline(false);
  }, [clearWasOfflineTimer]);

  /**
   * Polling fallback for iOS Safari where navigator.onLine is unreliable.
   * Performs a lightweight HEAD request to a known-reliable endpoint.
   * Falls back gracefully if fetch fails.
   */
  const pollConnectivity = useCallback(async () => {
    try {
      // Use a small cacheless resource to test actual connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const actuallyOnline = response.ok || response.status < 500;
      setLastChecked(new Date());

      if (actuallyOnline && !prevIsOnlineRef.current) {
        handleOnline();
      } else if (!actuallyOnline && prevIsOnlineRef.current) {
        handleOffline();
      }
    } catch {
      // AbortError or network error means offline
      setLastChecked(new Date());
      if (prevIsOnlineRef.current) {
        handleOffline();
      }
    }
  }, [handleOnline, handleOffline]);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Polling interval: 5 seconds for iOS Safari fallback
    const pollInterval = setInterval(pollConnectivity, 5000);

    // Initial poll to verify actual connectivity on mount
    pollConnectivity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pollInterval);
      clearWasOfflineTimer();
    };
  }, [handleOnline, handleOffline, pollConnectivity, clearWasOfflineTimer]);

  return { isOnline, wasOffline, lastChecked };
}
