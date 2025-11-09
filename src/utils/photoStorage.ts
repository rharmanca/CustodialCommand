import type { PhotoStorageItem, PhotoCaptureData, LocationData, PhotoMetadata } from '@/types/photo';

export interface PhotoStorageConfig {
  maxStorageSize?: number; // in bytes
  maxAge?: number; // in milliseconds
  compressionQuality?: number;
  generateThumbnails?: boolean;
  thumbnailSize?: { width: number; height: number };
}

export class PhotoStorageManager {
  private config: Required<PhotoStorageConfig>;
  private dbName = 'CustodialCommandPhotos';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor(config: PhotoStorageConfig = {}) {
    this.config = {
      maxStorageSize: config.maxStorageSize || 100 * 1024 * 1024, // 100MB
      maxAge: config.maxAge || 7 * 24 * 60 * 60 * 1000, // 7 days
      compressionQuality: config.compressionQuality || 0.8,
      generateThumbnails: config.generateThumbnails !== false,
      thumbnailSize: config.thumbnailSize || { width: 200, height: 200 }
    };
  }

  // Initialize IndexedDB
  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create photos store
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('inspectionId', 'inspectionId', { unique: false });
          photoStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          photoStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
          syncStore.createIndex('nextRetryAt', 'nextRetryAt', { unique: false });
        }
      };
    });
  }

  // Generate thumbnail from image blob
  private async generateThumbnail(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = this.config.thumbnailSize.width;
      canvas.height = this.config.thumbnailSize.height;

      img.onload = () => {
        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;

        if (aspectRatio > canvas.width / canvas.height) {
          drawHeight = canvas.width / aspectRatio;
        } else {
          drawWidth = canvas.height * aspectRatio;
        }

        // Center the image
        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;

        // Draw and compress
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  // Save photo to IndexedDB
  async savePhoto(
    photoData: PhotoCaptureData,
    inspectionId?: number
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const id = this.generateId();
    const now = new Date();

    let thumbnailUrl: string | undefined;
    if (this.config.generateThumbnails) {
      try {
        thumbnailUrl = await this.generateThumbnail(photoData.blob);
      } catch (error) {
        console.warn('Failed to generate thumbnail:', error);
      }
    }

    const photoItem: PhotoStorageItem = {
      id,
      inspectionId,
      blob: photoData.blob,
      metadata: photoData.metadata,
      location: photoData.location,
      thumbnailUrl,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now
    };

    // Save to IndexedDB
    const transaction = this.db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');

    return new Promise((resolve, reject) => {
      const request = store.put(photoItem);

      request.onsuccess = () => {
        // Add to sync queue
        this.addToSyncQueue(id, 'photo_upload', {
          inspectionId,
          metadata: photoData.metadata,
          location: photoData.location
        }).then(() => resolve(id)).catch(reject);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Add item to sync queue
  private async addToSyncQueue(
    photoId: string,
    type: 'photo_upload' | 'inspection_update',
    data: any
  ): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    const syncItem = {
      id: this.generateId(),
      type,
      photoId,
      data: JSON.stringify(data),
      retryCount: 0,
      nextRetryAt: new Date(),
      createdAt: new Date()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(syncItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get photo by ID
  async getPhoto(id: string): Promise<PhotoStorageItem | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Get photos by inspection ID
  async getPhotosByInspection(inspectionId: number): Promise<PhotoStorageItem[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const index = store.index('inspectionId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(inspectionId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending photos
  async getPendingPhotos(): Promise<PhotoStorageItem[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const index = store.index('syncStatus');

    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Update photo sync status
  async updatePhotoSyncStatus(id: string, status: 'pending' | 'synced' | 'failed'): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const photo = getRequest.result;
        if (photo) {
          photo.syncStatus = status;
          photo.updatedAt = new Date();

          const updateRequest = store.put(photo);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Photo not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Delete photo
  async deletePhoto(id: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['photos', 'syncQueue'], 'readwrite');
    const photoStore = transaction.objectStore('photos');
    const syncStore = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const photoRequest = photoStore.delete(id);

      photoRequest.onsuccess = () => {
        // Also remove from sync queue
        const syncIndex = syncStore.index('photoId');
        const syncRequest = syncIndex.openCursor(IDBKeyRange.only(id));

        syncRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
      };

      photoRequest.onerror = () => reject(photoRequest.error);
    });
  }

  // Clean up old photos
  async cleanup(): Promise<void> {
    if (!this.db) return;

    const cutoffDate = new Date(Date.now() - this.config.maxAge);
    const transaction = this.db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');
    const index = store.index('createdAt');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; available: number; photos: number }> {
    if (!this.db) {
      return { used: 0, available: this.config.maxStorageSize, photos: 0 };
    }

    const transaction = this.db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const photos = request.result || [];
        const used = photos.reduce((total: number, photo: PhotoStorageItem) => {
          return total + photo.blob.size + (photo.thumbnailUrl?.length || 0);
        }, 0);

        resolve({
          used,
          available: this.config.maxStorageSize - used,
          photos: photos.length
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Generate unique ID
  private generateId(): string {
    return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Create singleton instance
export const photoStorage = new PhotoStorageManager();