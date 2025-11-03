
// Local storage utilities for offline functionality
import SafeLocalStorage from './SafeLocalStorage';

export const STORAGE_KEYS = {
  DRAFT_INSPECTION: 'custodial-draft-inspection',
  DRAFT_BUILDING_INSPECTION: 'custodial-draft-building-inspection',
  DRAFT_CUSTODIAL_NOTE: 'custodial-draft-custodial-note',
  USER_PREFERENCES: 'custodial-user-preferences',
  // Legacy keys for migration
  LEGACY_INSPECTION_DRAFTS: 'custodial_inspection_drafts',
  LEGACY_BUILDING_DRAFTS: 'building_form_drafts'
} as const;

// Storage limits to prevent memory issues
const STORAGE_LIMITS = {
  MAX_DRAFT_SIZE: 5 * 1024 * 1024, // 5MB per draft
  MAX_TOTAL_STORAGE: 8 * 1024 * 1024, // 8MB total across all drafts
  MAX_DRAFTS_PER_TYPE: 10, // Maximum drafts per inspection type
  IMAGE_QUALITY: 0.7, // JPEG compression quality
  MAX_IMAGE_DIMENSIONS: { width: 1200, height: 1200 } // Resize large images
} as const;

// Check storage usage
const getStorageSize = (): number => {
  let total = 0;
  const keys = SafeLocalStorage.keys();
  for (const key of keys) {
    const value = SafeLocalStorage.getItem(key);
    if (value) {
      total += value.length + key.length;
    }
  }
  return total;
};

// Compress images before storage
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const { width: maxWidth, height: maxHeight } = STORAGE_LIMITS.MAX_IMAGE_DIMENSIONS;
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', STORAGE_LIMITS.IMAGE_QUALITY);
      resolve(compressedDataUrl);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const saveDraft = (key: string, data: any): void => {
  try {
    const draftData = { data, timestamp: Date.now() };
    const serialized = JSON.stringify(draftData);
    
    // Check draft size limit
    if (serialized.length > STORAGE_LIMITS.MAX_DRAFT_SIZE) {
      console.warn(`Draft too large (${Math.round(serialized.length / 1024)}KB). Skipping save.`);
      return;
    }
    
    // Check total storage limit
    const currentSize = getStorageSize();
    if (currentSize + serialized.length > STORAGE_LIMITS.MAX_TOTAL_STORAGE) {
      // Try to clean up old drafts
      cleanupOldDrafts();
      
      // Check again after cleanup
      if (getStorageSize() + serialized.length > STORAGE_LIMITS.MAX_TOTAL_STORAGE) {
        console.warn('Storage limit reached. Cannot save draft.');
        return;
      }
    }
    
    SafeLocalStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error);
    // If quota exceeded, try cleaning up and retry once
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      cleanupOldDrafts();
      try {
        SafeLocalStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (retryError) {
        console.error('Failed to save draft even after cleanup:', retryError);
      }
    }
  }
};

export const loadDraft = (key: string): any | null => {
  try {
    const stored = SafeLocalStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    // Remove drafts older than 7 days
    if (Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
      SafeLocalStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error('Failed to load draft from localStorage:', error);
    return null;
  }
};

export const clearDraft = (key: string): void => {
  try {
    SafeLocalStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear draft from localStorage:', error);
  }
};

// Clean up old drafts and manage storage limits
export const cleanupOldDrafts = (): void => {
  try {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    const keysToRemove: string[] = [];

    // Find old drafts
    const allKeys = SafeLocalStorage.keys();
    for (const key of allKeys) {
      if (key.startsWith('custodial-')) {
        try {
          const stored = SafeLocalStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.timestamp && parsed.timestamp < cutoffTime) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          // Invalid JSON, remove it
          keysToRemove.push(key);
        }
      }
    }

    // Remove old drafts
    keysToRemove.forEach(key => SafeLocalStorage.removeItem(key));

    console.log(`Cleaned up ${keysToRemove.length} old drafts`);
  } catch (error) {
    console.error('Failed to cleanup old drafts:', error);
  }
};

// Migrate legacy draft storage to new system
export const migrateLegacyDrafts = (): void => {
  try {
    // Migrate old inspection drafts
    const oldInspectionDrafts = SafeLocalStorage.getItem(STORAGE_KEYS.LEGACY_INSPECTION_DRAFTS);
    if (oldInspectionDrafts) {
      console.log('Migrating legacy inspection drafts...');
      SafeLocalStorage.removeItem(STORAGE_KEYS.LEGACY_INSPECTION_DRAFTS);
    }

    // Migrate old building drafts
    const oldBuildingDrafts = SafeLocalStorage.getItem(STORAGE_KEYS.LEGACY_BUILDING_DRAFTS);
    if (oldBuildingDrafts) {
      console.log('Migrating legacy building inspection drafts...');
      SafeLocalStorage.removeItem(STORAGE_KEYS.LEGACY_BUILDING_DRAFTS);
    }

    // Run initial cleanup
    cleanupOldDrafts();
  } catch (error) {
    console.error('Failed to migrate legacy drafts:', error);
  }
};

// Image processing utilities for drafts
export const processImageForStorage = async (file: File): Promise<string> => {
  try {
    // If image is small enough, use original
    if (file.size < 500 * 1024) { // < 500KB
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    
    // Compress larger images
    return await compressImage(file);
  } catch (error) {
    console.error('Failed to process image for storage:', error);
    throw error;
  }
};

// Get storage statistics
export const getStorageStats = () => {
  const totalSize = getStorageSize();
  const draftCount = SafeLocalStorage.keys().filter(key => key.startsWith('custodial-')).length;

  return {
    totalSizeKB: Math.round(totalSize / 1024),
    totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
    draftCount,
    limitMB: Math.round(STORAGE_LIMITS.MAX_TOTAL_STORAGE / (1024 * 1024)),
    usagePercent: Math.round((totalSize / STORAGE_LIMITS.MAX_TOTAL_STORAGE) * 100)
  };
};

export const clearAllDrafts = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    clearDraft(key);
  });
};
