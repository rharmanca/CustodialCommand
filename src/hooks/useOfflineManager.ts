import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineManager, type OfflineStats, type SyncResult } from '@/utils/offlineManager';
import type { PhotoCaptureData, PhotoStorageItem } from '@/types/photo';

interface UseOfflineManagerOptions {
  autoInitialize?: boolean;
  enableBackgroundSync?: boolean;
  syncInterval?: number;
  onPhotoSaved?: (photoId: string) => void;
  onPhotoSynced?: (photoId: string) => void;
  onPhotoSyncFailed?: (photoId: string, error: string) => void;
  onSyncCompleted?: (result: SyncResult) => void;
  onNetworkChange?: (online: boolean) => void;
}

interface OfflineManagerState {
  isOnline: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
  stats: OfflineStats | null;
  error: string | null;
  lastSyncTime?: Date;
}

export const useOfflineManager = (options: UseOfflineManagerOptions = {}) => {
  const {
    autoInitialize = true,
    enableBackgroundSync = true,
    syncInterval = 30000,
    onPhotoSaved,
    onPhotoSynced,
    onPhotoSyncFailed,
    onSyncCompleted,
    onNetworkChange
  } = options;

  const [state, setState] = useState<OfflineManagerState>({
    isOnline: offlineManager.isOnlineStatus(),
    isInitialized: false,
    isSyncing: false,
    stats: null,
    error: null,
    lastSyncTime: undefined
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Update state safely
  const updateState = useCallback((updates: Partial<OfflineManagerState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Handle offline manager events
  useEffect(() => {
    const handleInitialized = () => {
      updateState({ isInitialized: true, error: null });
    };

    const handleError = (error: any) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateState({ error: errorMessage });
    };

    const handleOnline = () => {
      updateState({ isOnline: true });
      onNetworkChange?.(true);
    };

    const handleOffline = () => {
      updateState({ isOnline: false });
      onNetworkChange?.(false);
    };

    const handlePhotoSaved = ({ photoId }: { photoId: string }) => {
      onPhotoSaved?.(photoId);
      refreshStats(); // Refresh stats after saving photo
    };

    const handlePhotoSynced = ({ photoId }: { photoId: string }) => {
      onPhotoSynced?.(photoId);
      refreshStats(); // Refresh stats after sync
    };

    const handlePhotoSyncFailed = ({ photoId, error }: { photoId: string; error: string }) => {
      onPhotoSyncFailed?.(photoId, error);
      refreshStats(); // Refresh stats after sync failure
    };

    const handleSyncStarted = () => {
      updateState({ isSyncing: true, error: null });
    };

    const handleSyncCompleted = (result: SyncResult) => {
      updateState({
        isSyncing: false,
        lastSyncTime: new Date(),
        error: result.failedItems.length > 0 ? 'Some items failed to sync' : null
      });
      onSyncCompleted?.(result);
      refreshStats(); // Refresh stats after sync completion
    };

    const handleSyncError = (error: any) => {
      updateState({ isSyncing: false, error: 'Sync failed' });
    };

    // Register event listeners
    offlineManager.on('initialized', handleInitialized);
    offlineManager.on('error', handleError);
    offlineManager.on('online', handleOnline);
    offlineManager.on('offline', handleOffline);
    offlineManager.on('photoSaved', handlePhotoSaved);
    offlineManager.on('photoSynced', handlePhotoSynced);
    offlineManager.on('photoSyncFailed', handlePhotoSyncFailed);
    offlineManager.on('syncStarted', handleSyncStarted);
    offlineManager.on('syncCompleted', handleSyncCompleted);
    offlineManager.on('syncError', handleSyncError);

    // Cleanup function
    return () => {
      offlineManager.off('initialized', handleInitialized);
      offlineManager.off('error', handleError);
      offlineManager.off('online', handleOnline);
      offlineManager.off('offline', handleOffline);
      offlineManager.off('photoSaved', handlePhotoSaved);
      offlineManager.off('photoSynced', handlePhotoSynced);
      offlineManager.off('photoSyncFailed', handlePhotoSyncFailed);
      offlineManager.off('syncStarted', handleSyncStarted);
      offlineManager.off('syncCompleted', handleSyncCompleted);
      offlineManager.off('syncError', handleSyncError);
    };
  }, [onPhotoSaved, onPhotoSynced, onPhotoSyncFailed, onSyncCompleted, onNetworkChange, updateState]);

  // Initialize offline manager
  const initialize = useCallback(async () => {
    try {
      await offlineManager.initialize();
    } catch (error) {
      console.error('Failed to initialize offline manager:', error);
    }
  }, []);

  // Refresh statistics
  const refreshStats = useCallback(async () => {
    try {
      const stats = await offlineManager.getStats();
      updateState({ stats });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  }, [updateState]);

  // Save photo
  const savePhoto = useCallback(async (
    photoData: PhotoCaptureData,
    inspectionId?: number
  ): Promise<string> => {
    try {
      const photoId = await offlineManager.savePhoto(photoData, inspectionId);
      return photoId;
    } catch (error) {
      console.error('Failed to save photo:', error);
      throw error;
    }
  }, []);

  // Get photos
  const getPhotos = useCallback(async (options?: {
    inspectionId?: number;
    syncStatus?: 'pending' | 'synced' | 'failed';
    limit?: number;
    offset?: number;
  }): Promise<PhotoStorageItem[]> => {
    try {
      return await offlineManager.getPhotos(options);
    } catch (error) {
      console.error('Failed to get photos:', error);
      return [];
    }
  }, []);

  // Get photo by ID
  const getPhoto = useCallback(async (id: string): Promise<PhotoStorageItem | null> => {
    try {
      return await offlineManager.getPhoto(id);
    } catch (error) {
      console.error('Failed to get photo:', error);
      return null;
    }
  }, []);

  // Delete photo
  const deletePhoto = useCallback(async (id: string): Promise<void> => {
    try {
      await offlineManager.deletePhoto(id);
      refreshStats();
    } catch (error) {
      console.error('Failed to delete photo:', error);
      throw error;
    }
  }, [refreshStats]);

  // Sync pending items
  const syncPendingItems = useCallback(async (): Promise<SyncResult> => {
    try {
      return await offlineManager.syncPendingItems();
    } catch (error) {
      console.error('Failed to sync items:', error);
      throw error;
    }
  }, []);

  // Force sync all items
  const forceSyncAll = useCallback(async (): Promise<SyncResult> => {
    try {
      return await offlineManager.forceSyncAll();
    } catch (error) {
      console.error('Failed to force sync:', error);
      throw error;
    }
  }, []);

  // Clear all data
  const clearAllData = useCallback(async (): Promise<void> => {
    try {
      await offlineManager.clearAllData();
      refreshStats();
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }, [refreshStats]);

  // Export data
  const exportData = useCallback(async (): Promise<string> => {
    try {
      return await offlineManager.exportData();
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }, []);

  // Import data
  const importData = useCallback(async (data: string): Promise<void> => {
    try {
      await offlineManager.importData(data);
      refreshStats();
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }, [refreshStats]);

  // Cleanup old data
  const cleanup = useCallback(async (): Promise<void> => {
    try {
      await offlineManager.cleanup();
      refreshStats();
    } catch (error) {
      console.error('Failed to cleanup:', error);
      throw error;
    }
  }, [refreshStats]);

  // Initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }

    // Initial stats refresh
    refreshStats();

    // Set up periodic stats refresh
    if (syncInterval > 0) {
      syncIntervalRef.current = setInterval(refreshStats, syncInterval);
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoInitialize, initialize, refreshStats, syncInterval]);

  // Format storage size
  const formatStorageSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }, []);

  // Get storage percentage
  const getStoragePercentage = useCallback((): number => {
    if (!state.stats) return 0;
    const total = state.stats.storageUsed + state.stats.storageAvailable;
    return total > 0 ? (state.stats.storageUsed / total) * 100 : 0;
  }, [state.stats]);

  return {
    // State
    isOnline: state.isOnline,
    isInitialized: state.isInitialized,
    isSyncing: state.isSyncing,
    stats: state.stats,
    error: state.error,
    lastSyncTime: state.lastSyncTime,

    // Computed values
    storagePercentage: getStoragePercentage(),
    formatStorageSize,

    // Actions
    initialize,
    refreshStats,
    savePhoto,
    getPhotos,
    getPhoto,
    deletePhoto,
    syncPendingItems,
    forceSyncAll,
    clearAllData,
    exportData,
    importData,
    cleanup
  };
};

export default useOfflineManager;