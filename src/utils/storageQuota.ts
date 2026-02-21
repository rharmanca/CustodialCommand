/**
 * Storage quota management utilities for offline data.
 *
 * Monitors IndexedDB + localStorage usage, warns at 80% capacity,
 * and prunes old synced items to prevent storage exhaustion.
 */

export interface StorageQuotaInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
  warning: boolean;
  critical: boolean;
}

export interface PruneResult {
  prunedCount: number;
  freedBytes: number;
}

/** Warning threshold — emit 'storageWarning' when exceeded */
export const QUOTA_WARNING_THRESHOLD = 0.8;

/** Critical threshold — trigger auto-prune and surface red alert */
export const QUOTA_CRITICAL_THRESHOLD = 0.95;

/** Minimum number of items to always retain after pruning */
export const MIN_RETENTION_COUNT = 50;

/** Maximum age (ms) of synced items before they are eligible for pruning */
export const DEFAULT_PRUNE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── IndexedDB helpers ──────────────────────────────────────────────────────

const DB_NAME = 'CustodialCommandPhotos';
const DB_VERSION = 1;

function openPhotoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    // If the DB doesn't exist yet let the upgrade handler create the store.
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('photos')) {
        const store = db.createObjectStore('photos', { keyPath: 'id' });
        store.createIndex('inspectionId', 'inspectionId', { unique: false });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        syncStore.createIndex('nextRetryAt', 'nextRetryAt', { unique: false });
      }
    };
  });
}

function getAllPhotos(db: IDBDatabase): Promise<Array<{ id: string; blob: Blob; thumbnailUrl?: string; syncStatus: string; createdAt: Date; updatedAt?: Date }>> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}

function deletePhotoFromDb(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Queries the Storage API quota and augments it with IndexedDB-based usage
 * estimates. Falls back gracefully when the API is unavailable (e.g. Firefox
 * private browsing, older browsers).
 */
export async function checkStorageQuota(): Promise<StorageQuotaInfo> {
  let used = 0;
  let total = 100 * 1024 * 1024; // 100 MB fallback

  // Prefer the modern Storage Quota API when available.
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      used = estimate.usage ?? 0;
      total = estimate.quota ?? total;
    } catch {
      // Fall through to IndexedDB estimate below.
    }
  }

  // If the API returned zero or is unavailable, estimate from IndexedDB data.
  if (used === 0) {
    const indexedDbUsage = await _estimateIndexedDbUsage();
    used = indexedDbUsage;
  }

  // Also factor in localStorage size estimate.
  const localStorageBytes = _estimateLocalStorageSize();
  used = Math.max(used, localStorageBytes);

  const available = Math.max(0, total - used);
  const percentage = total > 0 ? used / total : 0;

  return {
    used,
    available,
    total,
    percentage,
    warning: percentage >= QUOTA_WARNING_THRESHOLD,
    critical: percentage >= QUOTA_CRITICAL_THRESHOLD
  };
}

/**
 * Returns storage usage details computed from IndexedDB photo records.
 *
 * Unlike `checkStorageQuota()` this only looks at the photos object store,
 * giving a more granular picture of how much space our own data consumes.
 */
export async function getStorageUsage(): Promise<StorageQuotaInfo> {
  try {
    const db = await openPhotoDb();
    const photos = await getAllPhotos(db);
    db.close();

    const used = photos.reduce((total, photo) => {
      const blobSize = photo.blob ? photo.blob.size : 0;
      const thumbSize = photo.thumbnailUrl ? photo.thumbnailUrl.length : 0;
      return total + blobSize + thumbSize;
    }, 0);

    // For the total, prefer the browser quota; fall back to 100 MB.
    let total = 100 * 1024 * 1024;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        total = estimate.quota ?? total;
      } catch {
        // use fallback
      }
    }

    const available = Math.max(0, total - used);
    const percentage = total > 0 ? used / total : 0;

    return {
      used,
      available,
      total,
      percentage,
      warning: percentage >= QUOTA_WARNING_THRESHOLD,
      critical: percentage >= QUOTA_CRITICAL_THRESHOLD
    };
  } catch {
    return {
      used: 0,
      available: 100 * 1024 * 1024,
      total: 100 * 1024 * 1024,
      percentage: 0,
      warning: false,
      critical: false
    };
  }
}

/**
 * Removes old synced items from IndexedDB to free up space.
 *
 * Strategy: oldest synced items are removed first.
 * Retention rules:
 *   - Items younger than `maxAgeMs` are never pruned.
 *   - At least `MIN_RETENTION_COUNT` items are always kept.
 *
 * @param maxAgeMs  Maximum age in milliseconds before a synced item is
 *                  eligible for pruning. Defaults to 7 days.
 */
export async function pruneOldItems(
  maxAgeMs: number = DEFAULT_PRUNE_AGE_MS
): Promise<PruneResult> {
  let prunedCount = 0;
  let freedBytes = 0;

  try {
    const db = await openPhotoDb();
    const photos = await getAllPhotos(db);

    const cutoff = new Date(Date.now() - maxAgeMs);

    // Only consider synced items that are old enough.
    const eligible = photos
      .filter(p => p.syncStatus === 'synced' && new Date(p.createdAt) < cutoff)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Determine how many items we can safely delete while respecting minimum retention.
    const totalSynced = photos.filter(p => p.syncStatus === 'synced').length;
    const deletable = Math.max(0, totalSynced - MIN_RETENTION_COUNT);
    const toDelete = eligible.slice(0, deletable);

    for (const photo of toDelete) {
      const blobSize = photo.blob ? photo.blob.size : 0;
      const thumbSize = photo.thumbnailUrl ? photo.thumbnailUrl.length : 0;
      await deletePhotoFromDb(db, photo.id);
      prunedCount++;
      freedBytes += blobSize + thumbSize;
    }

    db.close();
  } catch (error) {
    console.warn('[storageQuota] pruneOldItems error:', error);
  }

  return { prunedCount, freedBytes };
}

/**
 * Requests persistent storage permission from the browser.
 *
 * When granted, the browser will not evict IndexedDB data under storage
 * pressure. Returns `true` if permission was granted.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    const persisted = await navigator.storage.persist();
    return persisted;
  } catch {
    return false;
  }
}

// ── Private helpers ────────────────────────────────────────────────────────

async function _estimateIndexedDbUsage(): Promise<number> {
  try {
    const db = await openPhotoDb();
    const photos = await getAllPhotos(db);
    db.close();

    return photos.reduce((total, photo) => {
      const blobSize = photo.blob ? photo.blob.size : 0;
      const thumbSize = photo.thumbnailUrl ? photo.thumbnailUrl.length : 0;
      return total + blobSize + thumbSize;
    }, 0);
  } catch {
    return 0;
  }
}

function _estimateLocalStorageSize(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? '';
      const value = localStorage.getItem(key) ?? '';
      // Each character is 2 bytes in UTF-16.
      total += (key.length + value.length) * 2;
    }
    return total;
  } catch {
    return 0;
  }
}
