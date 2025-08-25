
export const STORAGE_KEYS = {
  CUSTODIAL_DRAFTS: 'custodial_inspection_drafts',
  BUILDING_FORM_DRAFTS: 'building_form_drafts',
  CUSTODIAL_NOTES_DRAFTS: 'custodial_notes_drafts',
  USER_PREFERENCES: 'user_preferences',
  APP_VERSION: 'app_version'
} as const;

export const setStorageItem = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
};

export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    return defaultValue;
  }
};

export const removeStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
    return false;
  }
};

export const clearOldDrafts = (key: string, maxAge: number = 7): void => {
  try {
    const drafts = getStorageItem(key, []);
    if (!Array.isArray(drafts)) {
      console.warn('Invalid drafts data, clearing storage');
      removeStorageItem(key);
      return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    const validDrafts = drafts.filter((draft: any) => {
      if (!draft || typeof draft !== 'object') return false;
      const draftDate = new Date(draft.lastModified || draft.createdAt);
      return !isNaN(draftDate.getTime()) && draftDate > cutoffDate;
    });

    if (validDrafts.length !== drafts.length) {
      setStorageItem(key, validDrafts);
    }
  } catch (error) {
    console.error('Failed to clean old drafts:', error);
    // Clear corrupted data
    removeStorageItem(key);
  }
};
