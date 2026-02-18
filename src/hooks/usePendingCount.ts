import { useCallback, useEffect, useState } from 'react';

const DEFAULT_POLLING_MS = 30 * 1000;
export const PENDING_COUNT_UPDATED_EVENT = 'pending-inspections-updated';

interface UsePendingCountOptions {
  pollingMs?: number;
}

interface UsePendingCountResult {
  pendingCount: number;
  refreshPendingCount: () => Promise<void>;
}

export function usePendingCount(options: UsePendingCountOptions = {}): UsePendingCountResult {
  const pollingMs = options.pollingMs ?? DEFAULT_POLLING_MS;
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    try {
      const response = await fetch('/api/inspections/pending?limit=1', {
        credentials: 'include',
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const total = data?.pagination?.totalCount ?? 0;
      setPendingCount(Number.isFinite(total) ? total : 0);
    } catch (error) {
      console.warn('[usePendingCount] failed to fetch pending count:', error);
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();

    const intervalId = window.setInterval(refreshPendingCount, pollingMs);
    const onFocus = () => {
      void refreshPendingCount();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshPendingCount();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener(PENDING_COUNT_UPDATED_EVENT, onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener(PENDING_COUNT_UPDATED_EVENT, onFocus);
    };
  }, [pollingMs, refreshPendingCount]);

  return {
    pendingCount,
    refreshPendingCount,
  };
}

export default usePendingCount;
