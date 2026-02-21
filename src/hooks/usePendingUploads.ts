import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineManager } from '@/utils/offlineManager';
import { photoStorage } from '@/utils/photoStorage';

export interface UploadItem {
  id: string;
  type: 'photo' | 'form';
  location: string;  // School name or "Quick Capture"
  timestamp: Date;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  retryCount: number;
  size?: number;     // For photos, in bytes
  error?: string;    // For failed items
}

export interface PendingUploadsState {
  items: UploadItem[];
  totalCount: number;
  pendingCount: number;
  failedCount: number;
  syncingCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  retryItem: (id: string) => Promise<void>;
  retryAll: () => Promise<void>;
}

// In-memory set to track which items are currently syncing
const syncingIds = new Set<string>();

/**
 * usePendingUploads
 *
 * Queries IndexedDB for photos and offline forms that are pending upload,
 * providing real-time visibility into the sync queue.
 *
 * Features:
 * - Polls every 5 seconds for updates
 * - Listens for service worker FORM_SYNC_SUCCESS / PHOTO_SYNC_SUCCESS messages
 * - Listens for offlineManager sync events (photoSynced, photoSyncFailed, syncStarted)
 * - Exposes retry methods for individual or all failed items
 * - Sorts items newest-first
 */
export function usePendingUploads(): PendingUploadsState {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track syncing status locally (not persisted to IDB)
  const [syncingItemIds, setSyncingItemIds] = useState<Set<string>>(new Set());

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      // Fetch pending + failed photos from IndexedDB
      const [pendingPhotos, failedPhotos] = await Promise.all([
        photoStorage.getPendingPhotos(),
        fetchFailedPhotos(),
      ]);

      // Also fetch offline forms from service worker
      const offlineForms = await fetchOfflineForms();

      const photoItems: UploadItem[] = [...pendingPhotos, ...failedPhotos].map(photo => {
        const isSyncing = syncingIds.has(photo.id);
        return {
          id: photo.id,
          type: 'photo' as const,
          location: extractPhotoLocation(photo),
          timestamp: photo.createdAt instanceof Date ? photo.createdAt : new Date(photo.createdAt),
          status: isSyncing ? 'syncing' : photo.syncStatus as 'pending' | 'failed',
          retryCount: 0, // photoStorage doesn't track per-item retryCount
          size: photo.blob?.size,
        };
      });

      const formItems: UploadItem[] = offlineForms.map(form => ({
        id: form.id,
        type: 'form' as const,
        location: form.data?.school || 'Quick Capture',
        timestamp: new Date(form.timestamp),
        status: form.status as 'pending' | 'failed',
        retryCount: form.retryCount || 0,
        error: form.status === 'failed' ? 'Sync failed' : undefined,
      }));

      // Deduplicate photo items (pending and failed may overlap if DB is queried separately)
      const seenIds = new Set<string>();
      const allItems: UploadItem[] = [];
      for (const item of [...photoItems, ...formItems]) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          // Apply in-memory syncing state
          if (syncingIds.has(item.id)) {
            allItems.push({ ...item, status: 'syncing' });
          } else {
            allItems.push(item);
          }
        }
      }

      // Sort newest first
      allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (mountedRef.current) {
        setItems(allItems);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[usePendingUploads] fetch error:', err);
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [syncingItemIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ────────────────────────────────────────────────────────────────

  function extractPhotoLocation(photo: { location?: { buildingName?: string; room?: string }; inspectionId?: number }): string {
    if (photo.location?.buildingName) {
      return photo.location.buildingName;
    }
    if (photo.inspectionId) {
      return `Inspection #${photo.inspectionId}`;
    }
    return 'Quick Capture';
  }

  async function fetchFailedPhotos() {
    try {
      // photoStorage.getPendingPhotos only returns 'pending'. We need 'failed' too.
      // Access the DB via a custom query on the syncStatus index.
      // Since photoStorage doesn't expose a getFailedPhotos, we use the IDB directly.
      return await getPhotosByStatus('failed');
    } catch {
      return [];
    }
  }

  async function getPhotosByStatus(status: 'pending' | 'failed') {
    // Re-use the same DB name / version from PhotoStorageManager
    return new Promise<Array<{
      id: string;
      inspectionId?: number;
      blob: Blob;
      location?: { buildingName?: string; room?: string };
      syncStatus: string;
      createdAt: Date;
    }>>((resolve) => {
      try {
        const req = indexedDB.open('CustodialCommandPhotos', 1);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('photos')) {
            db.close();
            resolve([]);
            return;
          }
          const tx = db.transaction(['photos'], 'readonly');
          const store = tx.objectStore('photos');
          const index = store.index('syncStatus');
          const getAllReq = index.getAll(status);
          getAllReq.onsuccess = () => {
            db.close();
            resolve(getAllReq.result || []);
          };
          getAllReq.onerror = () => {
            db.close();
            resolve([]);
          };
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async function fetchOfflineForms(): Promise<Array<{
    id: string;
    data: { school?: string };
    timestamp: string;
    retryCount: number;
    status: 'pending' | 'failed';
  }>> {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return [];
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve([]), 1500);

      try {
        const controller = navigator.serviceWorker.controller;
        if (!controller) {
          clearTimeout(timeout);
          resolve([]);
          return;
        }
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          if (event.data?.type === 'OFFLINE_FORMS_RESPONSE') {
            const forms = Object.values(event.data.forms || {}) as Array<{
              id: string;
              data: { school?: string };
              timestamp: string;
              retryCount: number;
              status: 'pending' | 'failed';
            }>;
            resolve(forms);
          } else {
            resolve([]);
          }
        };
        controller.postMessage(
          { type: 'GET_OFFLINE_FORMS' },
          [channel.port2]
        );
      } catch {
        clearTimeout(timeout);
        resolve([]);
      }
    });
  }

  // ── Service worker event listener ──────────────────────────────────────────

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleSWMessage = (event: MessageEvent) => {
      const { type, formId, photoId } = event.data || {};
      if (type === 'FORM_SYNC_SUCCESS' || type === 'PHOTO_SYNC_SUCCESS') {
        // Remove the syncing marker and trigger a refresh
        if (formId) syncingIds.delete(formId);
        if (photoId) syncingIds.delete(photoId);
        fetchItems();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    };
  }, [fetchItems]);

  // ── offlineManager event listeners ────────────────────────────────────────

  useEffect(() => {
    const handlePhotoSynced = ({ photoId }: { photoId: string }) => {
      syncingIds.delete(photoId);
      fetchItems();
    };

    const handlePhotoSyncFailed = ({ photoId }: { photoId: string }) => {
      syncingIds.delete(photoId);
      fetchItems();
    };

    const handleSyncStarted = () => {
      fetchItems();
    };

    const handleSyncCompleted = () => {
      fetchItems();
    };

    const handlePhotoSaved = () => {
      fetchItems();
    };

    offlineManager.on('photoSynced', handlePhotoSynced);
    offlineManager.on('photoSyncFailed', handlePhotoSyncFailed);
    offlineManager.on('syncStarted', handleSyncStarted);
    offlineManager.on('syncCompleted', handleSyncCompleted);
    offlineManager.on('photoSaved', handlePhotoSaved);

    return () => {
      offlineManager.off('photoSynced', handlePhotoSynced);
      offlineManager.off('photoSyncFailed', handlePhotoSyncFailed);
      offlineManager.off('syncStarted', handleSyncStarted);
      offlineManager.off('syncCompleted', handleSyncCompleted);
      offlineManager.off('photoSaved', handlePhotoSaved);
    };
  }, [fetchItems]);

  // ── Polling ────────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    fetchItems();

    pollingRef.current = setInterval(() => {
      if (mountedRef.current) {
        fetchItems();
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    await fetchItems();
  }, [fetchItems]);

  const retryItem = useCallback(async (id: string) => {
    syncingIds.add(id);
    setSyncingItemIds(prev => new Set([...prev, id]));
    // Refresh immediately to show syncing state
    await fetchItems();

    try {
      const success = await offlineManager.syncSingleItem(id);
      if (!success) {
        syncingIds.delete(id);
        setSyncingItemIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (err) {
      console.error('[usePendingUploads] retryItem failed:', err);
      syncingIds.delete(id);
      setSyncingItemIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }

    await fetchItems();
  }, [fetchItems]);

  const retryAll = useCallback(async () => {
    const failed = items.filter(i => i.status === 'failed');
    failed.forEach(i => syncingIds.add(i.id));
    setSyncingItemIds(new Set(failed.map(i => i.id)));
    await fetchItems();

    try {
      await offlineManager.forceSyncAll();
    } catch (err) {
      console.error('[usePendingUploads] retryAll failed:', err);
    } finally {
      failed.forEach(i => syncingIds.delete(i.id));
      setSyncingItemIds(new Set());
    }

    await fetchItems();
  }, [items, fetchItems]);

  // ── Derived counts ─────────────────────────────────────────────────────────

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const failedCount = items.filter(i => i.status === 'failed').length;
  const syncingCount = items.filter(i => i.status === 'syncing').length;

  return {
    items,
    totalCount: items.length,
    pendingCount,
    failedCount,
    syncingCount,
    isLoading,
    refresh,
    retryItem,
    retryAll,
  };
}
