
// Local storage utilities for offline functionality

export const STORAGE_KEYS = {
  DRAFT_INSPECTION: 'custodial-draft-inspection',
  DRAFT_BUILDING_INSPECTION: 'custodial-draft-building-inspection',
  DRAFT_CUSTODIAL_NOTE: 'custodial-draft-custodial-note',
  USER_PREFERENCES: 'custodial-user-preferences'
} as const;

export const saveDraft = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error);
  }
};

export const loadDraft = (key: string): any | null => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    // Remove drafts older than 7 days
    if (Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
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
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear draft from localStorage:', error);
  }
};

export const clearAllDrafts = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    clearDraft(key);
  });
};
