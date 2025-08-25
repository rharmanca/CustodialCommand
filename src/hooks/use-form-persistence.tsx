import { useEffect, useCallback } from 'react';
import { saveDraft as setStorageItem, loadDraft as getStorageItem, clearDraft as removeStorageItem } from '@/utils/storage';

interface FormPersistenceOptions<T> {
  key: string;
  data: T;
  enabled?: boolean;
  debounceMs?: number;
}

export function useFormPersistence<T extends Record<string, any>>({
  key,
  data,
  enabled = true,
  debounceMs = 2000
}: FormPersistenceOptions<T>) {
  
  const saveData = useCallback(() => {
    if (!enabled) return;
    
    try {
      const dataToSave = {
        ...data,
        lastModified: new Date().toISOString(),
        version: '1.0'
      };
      setStorageItem(key, dataToSave);
    } catch (error) {
      console.error('Failed to persist form data:', error);
    }
  }, [key, data, enabled]);

  const loadData = useCallback((): T | null => {
    if (!enabled) return null;
    
    try {
      const savedData = getStorageItem(key);
      if (savedData && typeof savedData === 'object') {
        // Remove metadata before returning
        const { lastModified, version, ...formData } = savedData;
        return formData as T;
      }
    } catch (error) {
      console.error('Failed to load persisted form data:', error);
    }
    return null;
  }, [key, enabled]);

  const clearData = useCallback(() => {
    try {
      removeStorageItem(key);
    } catch (error) {
      console.error('Failed to clear persisted form data:', error);
    }
  }, [key]);

  // Auto-save with debouncing
  useEffect(() => {
    if (!enabled) return;
    
    const timeoutId = setTimeout(saveData, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [data, saveData, debounceMs, enabled]);

  return {
    saveData,
    loadData,
    clearData
  };
}