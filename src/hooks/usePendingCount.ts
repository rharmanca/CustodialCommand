import { useCallback, useEffect, useState } from 'react';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

interface UsePendingCountOptions {
  pollingMs?: number;
}

interface UsePendingCountResult {
  pendingCount: number;
  refreshPendingCount: () => Promise<void>;
}

export function usePendingCount(options: UsePendingCountOptions = {}): UsePendingCountResult {
  const pollingMs = options.pollingMs ?? FIVE_MINUTES_MS;
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
    return () => window.clearInterval(intervalId);
  }, [pollingMs, refreshPendingCount]);

  return {
    pendingCount,
    refreshPendingCount,
  };
}

export default usePendingCount;
