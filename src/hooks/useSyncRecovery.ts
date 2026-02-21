/**
 * useSyncRecovery — React hook for detecting and recovering from interrupted syncs.
 *
 * On mount the hook reads the persisted sync state from IndexedDB.  If a sync
 * was in progress when the app last closed the hook sets needsRecovery=true and
 * surfaces information about the interrupted items.
 *
 * Behaviour:
 *  - Checks sync state on mount and every 10 seconds
 *  - Listens for SYNC_INTERRUPTED_DETECTED messages from the service worker
 *  - Exposes retryInterrupted() to kick off a new sync attempt
 *  - Exposes dismissRecovery() to hide the banner without retrying
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSyncState, clearSyncState } from '@/utils/syncState';
import { offlineManager } from '@/utils/offlineManager';

export interface SyncRecoveryState {
  /** Whether there is an interrupted sync that needs user attention */
  needsRecovery: boolean;
  /** The item that was being processed when the sync was interrupted */
  interruptedItem: { id: string; type: 'photo' | 'form' } | null;
  /** Number of items successfully uploaded in the interrupted run */
  completedCount: number;
  /** Number of items that failed in the interrupted run */
  failedCount: number;
  /** Human-readable message describing the recovery situation */
  recoveryMessage: string;
  /** Whether a retry is currently in progress */
  isRetrying: boolean;
  /** Error encountered during the last retry attempt, or null */
  retryError: string | null;
  /** Dismiss the recovery banner without retrying */
  dismissRecovery: () => void;
  /** Attempt to resume the interrupted sync */
  retryInterrupted: () => Promise<void>;
}

const POLL_INTERVAL_MS = 10_000; // 10 seconds

export function useSyncRecovery(): SyncRecoveryState {
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [interruptedItem, setInterruptedItem] = useState<{
    id: string;
    type: 'photo' | 'form';
  } | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Check sync state ───────────────────────────────────────────────────────
  const checkSyncState = useCallback(async () => {
    try {
      const state = await getSyncState();

      if (!state || !state.inProgress) {
        // No interrupted sync
        setNeedsRecovery(false);
        setInterruptedItem(null);
        setCompletedCount(0);
        setFailedCount(0);
        setRecoveryMessage('');
        return;
      }

      const completed = state.completedItems?.length ?? 0;
      const failed = state.failedItems?.length ?? 0;
      const total = completed + failed + (state.currentItemId ? 1 : 0);

      setNeedsRecovery(true);
      setInterruptedItem(
        state.currentItemId && state.itemType
          ? { id: state.currentItemId, type: state.itemType }
          : null
      );
      setCompletedCount(completed);
      setFailedCount(failed);

      // Build a human-readable message
      if (completed > 0 || failed > 0) {
        setRecoveryMessage(
          `Sync was interrupted. ${completed} of ${total} item${total !== 1 ? 's' : ''} uploaded before connection was lost.`
        );
      } else {
        setRecoveryMessage(
          'Sync was interrupted before any items could be uploaded.'
        );
      }
    } catch (err) {
      console.error('[useSyncRecovery] Error checking sync state:', err);
    }
  }, []);

  // ── Mount / polling ───────────────────────────────────────────────────────
  useEffect(() => {
    // Initial check
    checkSyncState();

    // Periodic poll
    pollTimerRef.current = setInterval(checkSyncState, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [checkSyncState]);

  // ── Service worker message listener ──────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_INTERRUPTED_DETECTED') {
        // SW detected interrupted sync on activate; re-check state
        checkSyncState();
      }
      if (
        event.data?.type === 'FORM_SYNC_SUCCESS' ||
        event.data?.type === 'PHOTO_SYNC_SUCCESS'
      ) {
        // An item completed — re-check in case all are done
        checkSyncState();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [checkSyncState]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const dismissRecovery = useCallback(() => {
    setNeedsRecovery(false);
    setInterruptedItem(null);
    setCompletedCount(0);
    setFailedCount(0);
    setRecoveryMessage('');
    setRetryError(null);
    // Clear persistent state so it doesn't reappear on next open
    clearSyncState().catch(err => {
      console.warn('[useSyncRecovery] Failed to clear sync state on dismiss:', err);
    });
  }, []);

  const retryInterrupted = useCallback(async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    setRetryError(null);

    try {
      await offlineManager.syncPendingItems();
      // Re-check state after sync attempt
      await checkSyncState();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setRetryError(message);
      console.error('[useSyncRecovery] Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, checkSyncState]);

  return {
    needsRecovery,
    interruptedItem,
    completedCount,
    failedCount,
    recoveryMessage,
    isRetrying,
    retryError,
    dismissRecovery,
    retryInterrupted
  };
}
