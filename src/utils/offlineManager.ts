import type { PhotoStorageItem, PhotoCaptureData, SyncQueueItem } from '@/types/photo';
import { photoStorage } from './photoStorage';
import {
  checkStorageQuota,
  pruneOldItems,
  type StorageQuotaInfo,
  QUOTA_WARNING_THRESHOLD,
  QUOTA_CRITICAL_THRESHOLD,
  MIN_RETENTION_COUNT
} from './storageQuota';
import {
  saveSyncState,
  getSyncState,
  clearSyncState,
  buildInitialSyncState,
  type SyncState
} from './syncState';

export interface OfflineStorageConfig {
  maxStorageSize?: number;
  maxAge?: number;
  autoCleanup?: boolean;
  compressionQuality?: number;
  syncRetryAttempts?: number;
  syncRetryDelay?: number;
  backgroundSync?: boolean;
  /** Fraction of total quota that triggers a warning event (default 0.8) */
  quotaWarningThreshold?: number;
  /** Fraction of total quota that triggers auto-prune (default 0.95) */
  quotaCriticalThreshold?: number;
  /** Minimum items retained when pruning (default 50) */
  minRetentionCount?: number;
}

export interface OfflineStats {
  totalPhotos: number;
  pendingSync: number;
  syncedPhotos: number;
  failedSync: number;
  storageUsed: number;
  storageAvailable: number;
  lastSyncTime?: Date;
  networkStatus: 'online' | 'offline';
}

export interface SyncResult {
  success: boolean;
  syncedItems: string[];
  failedItems: Array<{ id: string; error: string }>;
  retryCount: number;
}

class OfflineManager {
  private config: Required<OfflineStorageConfig>;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private backgroundSyncInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: OfflineStorageConfig = {}) {
    this.config = {
      maxStorageSize: config.maxStorageSize || 100 * 1024 * 1024, // 100MB
      maxAge: config.maxAge || 7 * 24 * 60 * 60 * 1000, // 7 days
      autoCleanup: config.autoCleanup !== false,
      compressionQuality: config.compressionQuality || 0.8,
      syncRetryAttempts: config.syncRetryAttempts || 3,
      syncRetryDelay: config.syncRetryDelay || 5000,
      backgroundSync: config.backgroundSync !== false,
      quotaWarningThreshold: config.quotaWarningThreshold ?? QUOTA_WARNING_THRESHOLD,
      quotaCriticalThreshold: config.quotaCriticalThreshold ?? QUOTA_CRITICAL_THRESHOLD,
      minRetentionCount: config.minRetentionCount ?? MIN_RETENTION_COUNT
    };

    this.initializeEventListeners();
    this.startBackgroundSync();
  }

  // Initialize event listeners for network status changes
  private initializeEventListeners(): void {
    const handleOnline = () => {
      this.isOnline = true;
      this.emit('online');
      if (this.config.backgroundSync) {
        this.syncPendingItems();
      }
    };

    const handleOffline = () => {
      this.isOnline = false;
      this.emit('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  // Event emitter methods
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Initialize offline storage
  async initialize(): Promise<void> {
    try {
      await photoStorage.initDB();

      if (this.config.autoCleanup) {
        await this.cleanup();
      }

      // Auto-prune old synced items on startup to reclaim space.
      const pruneResult = await pruneOldItems(this.config.maxAge);
      if (pruneResult.prunedCount > 0) {
        this.emit('pruned', pruneResult);
      }

      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check current storage quota and emit 'storageWarning' or 'storageCritical'
   * events as appropriate.  Returns the current quota info so callers can act
   * on it without performing a second async call.
   */
  public async checkQuota(): Promise<StorageQuotaInfo> {
    const quota = await checkStorageQuota();

    if (quota.critical) {
      this.emit('storageCritical', quota);
    } else if (quota.warning) {
      this.emit('storageWarning', quota);
    }

    return quota;
  }

  // Save photo with offline support
  async savePhoto(
    photoData: PhotoCaptureData,
    inspectionId?: number
  ): Promise<string> {
    try {
      // ── Quota gate ──────────────────────────────────────────────────────
      // Note: Quick Capture uses a separate path (direct fetch intercepted by SW).
      // This quota gate protects the standalone photo upload pipeline only.
      const quota = await checkStorageQuota();

      if (quota.percentage >= this.config.quotaWarningThreshold) {
        this.emit('storageWarning', quota);
      }

      if (quota.percentage >= this.config.quotaCriticalThreshold) {
        // Attempt auto-prune to free space, then re-check.
        const pruneResult = await pruneOldItems(this.config.maxAge);
        this.emit('pruned', pruneResult);

        const quotaAfterPrune = await checkStorageQuota();
        if (quotaAfterPrune.percentage >= this.config.quotaCriticalThreshold) {
          // Storage is still critical — throw so callers can surface the error.
          throw new Error(
            `Storage quota exceeded (${Math.round(quotaAfterPrune.percentage * 100)}% used). ` +
            'Please delete some synced items to free space.'
          );
        }
      }
      // ── End quota gate ──────────────────────────────────────────────────

      const photoId = await photoStorage.savePhoto(photoData, inspectionId);

      this.emit('photoSaved', { photoId, photoData, inspectionId });

      // If online, try to sync immediately
      if (this.isOnline && !this.syncInProgress) {
        this.syncSingleItem(photoId);
      }

      return photoId;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Get photo by ID
  async getPhoto(id: string): Promise<PhotoStorageItem | null> {
    try {
      return await photoStorage.getPhoto(id);
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }

  // Get all photos with optional filtering
  async getPhotos(options: {
    inspectionId?: number;
    syncStatus?: 'pending' | 'synced' | 'failed';
    limit?: number;
    offset?: number;
  } = {}): Promise<PhotoStorageItem[]> {
    try {
      let photos: PhotoStorageItem[] = [];

      if (options.inspectionId) {
        photos = await photoStorage.getPhotosByInspection(options.inspectionId);
      } else if (options.syncStatus) {
        photos = await photoStorage.getPendingPhotos(); // This would need to be extended in PhotoStorage
      } else {
        // Get all photos - would need to be implemented in PhotoStorage
        photos = [];
      }

      // Apply filters
      if (options.syncStatus) {
        photos = photos.filter(p => p.syncStatus === options.syncStatus);
      }

      // Apply pagination
      if (options.offset) {
        photos = photos.slice(options.offset);
      }
      if (options.limit) {
        photos = photos.slice(0, options.limit);
      }

      return photos;
    } catch (error) {
      this.emit('error', error);
      return [];
    }
  }

  // Delete photo
  async deletePhoto(id: string): Promise<void> {
    try {
      await photoStorage.deletePhoto(id);
      this.emit('photoDeleted', { photoId: id });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Sync pending items
  async syncPendingItems(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return {
        success: false,
        syncedItems: [],
        failedItems: [],
        retryCount: 0
      };
    }

    this.syncInProgress = true;
    this.emit('syncStarted');

    const result: SyncResult = {
      success: true,
      syncedItems: [],
      failedItems: [],
      retryCount: 0
    };

    try {
      const pendingPhotos = await photoStorage.getPendingPhotos();

      // Check whether we are resuming an interrupted sync
      const existingState = await getSyncState();
      const isResuming = !!(existingState && existingState.inProgress);
      if (isResuming) {
        this.emit('syncResumed', existingState);
        console.log('[offlineManager] Resuming interrupted sync');
      }

      for (const photo of pendingPhotos) {
        // Skip items already completed in a previous run
        if (existingState?.completedItems?.includes(photo.id)) {
          result.syncedItems.push(photo.id);
          continue;
        }

        // Persist state before each item upload
        const currentState: SyncState = {
          id: 'current',
          inProgress: true,
          currentItemId: photo.id,
          itemType: 'photo',
          startedAt: existingState?.startedAt ?? Date.now(),
          completedItems: result.syncedItems,
          failedItems: result.failedItems.map(f => f.id),
          lastUpdated: Date.now()
        };
        await saveSyncState(currentState);

        try {
          await this.uploadPhoto(photo);
          await photoStorage.updatePhotoSyncStatus(photo.id, 'synced');
          result.syncedItems.push(photo.id);
          this.emit('photoSynced', { photoId: photo.id });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sync failed';
          result.failedItems.push({ id: photo.id, error: errorMessage });
          await photoStorage.updatePhotoSyncStatus(photo.id, 'failed');
          this.emit('photoSyncFailed', { photoId: photo.id, error: errorMessage });
        }
      }

      // All items processed — clear sync state
      await clearSyncState();
      this.syncInProgress = false;
      this.emit('syncCompleted', result);

      return result;
    } catch (error) {
      // Sync failed mid-run — state persists in IndexedDB for recovery
      this.syncInProgress = false;
      this.emit('syncInterrupted', { error, result });
      this.emit('syncError', error);

      return {
        success: false,
        syncedItems: result.syncedItems,
        failedItems: result.failedItems,
        retryCount: 0
      };
    }
  }

  /**
   * Check for an incomplete sync from a previous session and resume it.
   *
   * @returns true if a previous sync was detected and resumed, false otherwise.
   */
  async resumeInterruptedSync(): Promise<boolean> {
    try {
      const state = await getSyncState();
      if (!state || !state.inProgress) {
        return false;
      }

      console.log('[offlineManager] Interrupted sync found — resuming');
      this.emit('syncResumed', state);
      await this.syncPendingItems();
      return true;
    } catch (error) {
      console.error('[offlineManager] Failed to resume interrupted sync:', error);
      return false;
    }
  }

  /**
   * Resolve a conflict between local and server versions of an item.
   *
   * 'local'  — keep the local version (do nothing, local will be uploaded on next sync)
   * 'server' — discard local version (mark as synced so it is skipped)
   */
  async resolveConflict(
    itemId: string,
    strategy: 'local' | 'server'
  ): Promise<void> {
    try {
      if (strategy === 'server') {
        // Discard the local version by marking it as synced
        await photoStorage.updatePhotoSyncStatus(itemId, 'synced');
        this.emit('conflictResolved', { itemId, strategy });
        console.log(`[offlineManager] Conflict resolved for ${itemId}: server version kept`);
      } else {
        // Local version wins — it will be uploaded on next sync
        this.emit('conflictResolved', { itemId, strategy });
        console.log(`[offlineManager] Conflict resolved for ${itemId}: local version kept`);
      }
    } catch (error) {
      console.error(`[offlineManager] Failed to resolve conflict for ${itemId}:`, error);
      throw error;
    }
  }

  // Sync single item
  async syncSingleItem(photoId: string): Promise<boolean> {
    try {
      const photo = await photoStorage.getPhoto(photoId);
      if (!photo) {
        return false;
      }

      await this.uploadPhoto(photo);
      await photoStorage.updatePhotoSyncStatus(photoId, 'synced');

      this.emit('photoSynced', { photoId });
      return true;
    } catch (error) {
      await photoStorage.updatePhotoSyncStatus(photoId, 'failed');
      this.emit('photoSyncFailed', { photoId, error });
      return false;
    }
  }

  // Upload photo to server via /api/photos/upload (mirrors SW syncOfflinePhotos pattern)
  private async uploadPhoto(photo: PhotoStorageItem): Promise<void> {
    const formData = new FormData();

    // Convert blob to file for upload
    if (photo.blob instanceof Blob) {
      formData.append('photo', photo.blob, `photo_${photo.id}.jpg`);
    } else {
      // Fallback: if blob is somehow a string (base64 data URL)
      const blobStr = photo.blob as unknown as string;
      if (typeof blobStr === 'string' && blobStr.startsWith('data:')) {
        const response = await fetch(blobStr);
        const blob = await response.blob();
        formData.append('photo', blob, `photo_${photo.id}.jpg`);
      } else {
        throw new Error('Invalid photo data format');
      }
    }

    // Add metadata
    if (photo.metadata) {
      formData.append('metadata', JSON.stringify(photo.metadata));
    }

    // Add location data if available
    if (photo.location) {
      formData.append('location', JSON.stringify(photo.location));
    }

    // Add inspection ID if available
    if (photo.inspectionId) {
      formData.append('inspectionId', photo.inspectionId.toString());
    }

    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Photo upload failed with status ${response.status}`);
    }
  }

  // Get offline statistics
  async getStats(): Promise<OfflineStats> {
    try {
      const storageInfo = await photoStorage.getStorageUsage();
      const pendingPhotos = await photoStorage.getPendingPhotos();

      const stats: OfflineStats = {
        totalPhotos: storageInfo.photos,
        pendingSync: pendingPhotos.length,
        syncedPhotos: storageInfo.photos - pendingPhotos.length,
        failedSync: 0, // Would need to be implemented in PhotoStorage
        storageUsed: storageInfo.used,
        storageAvailable: storageInfo.available,
        networkStatus: this.isOnline ? 'online' : 'offline'
      };

      return stats;
    } catch (error) {
      this.emit('error', error);
      return {
        totalPhotos: 0,
        pendingSync: 0,
        syncedPhotos: 0,
        failedSync: 0,
        storageUsed: 0,
        storageAvailable: 0,
        networkStatus: this.isOnline ? 'online' : 'offline'
      };
    }
  }


  // Start background sync
  private startBackgroundSync(): void {
    if (!this.config.backgroundSync) {
      return;
    }

    // Sync every 30 seconds when online
    this.backgroundSyncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingItems();
      }
    }, 30000);
  }

  // Stop background sync
  stopBackgroundSync(): void {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }
  }

  // Force sync all pending items
  async forceSyncAll(): Promise<SyncResult> {
    return await this.syncPendingItems();
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      // This would need to be implemented in PhotoStorage
      this.emit('dataCleared');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Export data for backup
  async exportData(): Promise<string> {
    try {
      const photos = await this.getPhotos();
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        photos: photos.map(photo => ({
          ...photo,
          blob: null // Don't include blob in export
        }))
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Import data from backup
  async importData(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);

      // Validate import data
      if (!importData.version || !importData.photos) {
        throw new Error('Invalid import data format');
      }

      // Import photos (without blobs)
      for (const photoData of importData.photos) {
        // This would need to be implemented in PhotoStorage
        // Photos without blobs would be marked as needing manual photo upload
      }

      this.emit('dataImported', { count: importData.photos.length });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Get network status
  getNetworkStatus(): 'online' | 'offline' {
    return this.isOnline ? 'online' : 'offline';
  }

  // Check if online
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Get storage info
  async getStorageInfo(): Promise<{ used: number; available: number; total: number }> {
    try {
      const info = await photoStorage.getStorageUsage();
      return {
        used: info.used,
        available: info.available,
        total: info.used + info.available
      };
    } catch (error) {
      return { used: 0, available: 0, total: 0 };
    }
  }

  // Cleanup resources
  cleanup(): void {
    this.stopBackgroundSync();
    this.eventListeners.clear();
  }
}

// Create singleton instance
export const offlineManager = new OfflineManager();

export default OfflineManager;
