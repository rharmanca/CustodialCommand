import type { PhotoStorageItem, PhotoCaptureData, SyncQueueItem } from '@/types/photo';
import { photoStorage } from './photoStorage';

export interface OfflineStorageConfig {
  maxStorageSize?: number;
  maxAge?: number;
  autoCleanup?: boolean;
  compressionQuality?: number;
  syncRetryAttempts?: number;
  syncRetryDelay?: number;
  backgroundSync?: boolean;
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
      backgroundSync: config.backgroundSync !== false
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

      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Save photo with offline support
  async savePhoto(
    photoData: PhotoCaptureData,
    inspectionId?: number
  ): Promise<string> {
    try {
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

    try {
      const pendingPhotos = await photoStorage.getPendingPhotos();
      const result: SyncResult = {
        success: true,
        syncedItems: [],
        failedItems: [],
        retryCount: 0
      };

      for (const photo of pendingPhotos) {
        try {
          // Simulate sync process - in real implementation, this would upload to server
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

      this.syncInProgress = false;
      this.emit('syncCompleted', result);

      return result;
    } catch (error) {
      this.syncInProgress = false;
      this.emit('syncError', error);

      return {
        success: false,
        syncedItems: [],
        failedItems: [],
        retryCount: 0
      };
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

  // Simulate photo upload (in real implementation, this would be actual server upload)
  private async uploadPhoto(photo: PhotoStorageItem): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulate occasional failures for testing
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Network error during upload');
    }

    // In real implementation, this would:
    // 1. Upload the blob to the server
    // 2. Upload metadata and location data
    // 3. Handle server response
    // 4. Update local status based on server response
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