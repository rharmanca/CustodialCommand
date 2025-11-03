/**
 * SafeLocalStorage - A wrapper around localStorage with automatic fallback to in-memory storage
 *
 * Handles common localStorage failure scenarios:
 * - Private browsing mode (localStorage unavailable)
 * - Storage quota exceeded (browser storage full)
 * - Disabled by user/corporate policy
 * - Browser doesn't support localStorage
 *
 * Falls back to an in-memory Map when localStorage operations fail,
 * ensuring the application continues to function without crashes.
 *
 * Based on Context7 localStorage error handling patterns.
 *
 * @example
 * ```typescript
 * const safeStorage = SafeLocalStorage.getInstance();
 * safeStorage.setItem('key', 'value');
 * const value = safeStorage.getItem('key');
 * ```
 */
class SafeLocalStorage {
  private static instance: SafeLocalStorage;
  private storage: Map<string, string> = new Map();
  private useLocalStorage: boolean;
  private warnings: Set<string> = new Set();

  private constructor() {
    this.useLocalStorage = this.checkLocalStorageAvailability();

    if (!this.useLocalStorage) {
      console.warn(
        'SafeLocalStorage: localStorage is unavailable. Using in-memory fallback storage. ' +
          'Data will not persist across page reloads.'
      );
    }
  }

  /**
   * Gets the singleton instance of SafeLocalStorage
   */
  static getInstance(): SafeLocalStorage {
    if (!SafeLocalStorage.instance) {
      SafeLocalStorage.instance = new SafeLocalStorage();
    }
    return SafeLocalStorage.instance;
  }

  /**
   * Checks if localStorage is available and working
   * Tests by attempting to write and read a test value
   *
   * CRITICAL: This method must handle SecurityError that can be thrown when
   * accessing the localStorage getter itself (e.g., in private browsing mode).
   * The getter access must happen INSIDE the try-catch block.
   *
   * @returns true if localStorage is available, false otherwise
   */
  private checkLocalStorageAvailability(): boolean {
    try {
      // Step 1: Check if window object exists (server-side rendering safety)
      if (typeof window === 'undefined') {
        return false;
      }

      // Step 2: Check if 'localStorage' property exists on window
      if (!('localStorage' in window)) {
        return false;
      }

      // Step 3: Try to ACCESS localStorage (this might throw SecurityError)
      // IMPORTANT: This line must be inside try-catch to catch getter errors
      const storage = window.localStorage;

      // Step 4: If we get here, localStorage is accessible - now test operations
      const testKey = '__safe_storage_test__';
      const testValue = 'test';

      storage.setItem(testKey, testValue);
      const retrieved = storage.getItem(testKey);
      storage.removeItem(testKey);

      return retrieved === testValue;
    } catch (e) {
      // Catches:
      // - SecurityError from accessing localStorage getter (private browsing)
      // - QuotaExceededError from storage.setItem()
      // - Any other localStorage-related errors
      return false;
    }
  }

  /**
   * Sets an item in storage
   *
   * @param key - The key under which to store the value
   * @param value - The value to store (will be converted to string)
   * @throws {QuotaExceededError} If storage quota is exceeded and fallback fails
   */
  setItem(key: string, value: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        this.handleStorageError(e as Error, 'setItem');
      }
    }

    // Fallback to in-memory storage
    this.storage.set(key, value);
  }

  /**
   * Gets an item from storage
   *
   * @param key - The key of the item to retrieve
   * @returns The stored value, or null if not found
   */
  getItem(key: string): string | null {
    if (this.useLocalStorage) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        this.handleStorageError(e as Error, 'getItem');
      }
    }

    // Fallback to in-memory storage
    return this.storage.get(key) || null;
  }

  /**
   * Removes an item from storage
   *
   * @param key - The key of the item to remove
   */
  removeItem(key: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.removeItem(key);
        return;
      } catch (e) {
        this.handleStorageError(e as Error, 'removeItem');
      }
    }

    // Fallback to in-memory storage
    this.storage.delete(key);
  }

  /**
   * Clears all items from storage
   */
  clear(): void {
    if (this.useLocalStorage) {
      try {
        localStorage.clear();
        return;
      } catch (e) {
        this.handleStorageError(e as Error, 'clear');
      }
    }

    // Fallback to in-memory storage
    this.storage.clear();
  }

  /**
   * Gets all keys from storage
   *
   * @returns Array of all storage keys
   */
  keys(): string[] {
    if (this.useLocalStorage) {
      try {
        return Object.keys(localStorage);
      } catch (e) {
        this.handleStorageError(e as Error, 'keys');
      }
    }

    // Fallback to in-memory storage
    return Array.from(this.storage.keys());
  }

  /**
   * Gets the number of items in storage
   *
   * @returns The count of stored items
   */
  get length(): number {
    if (this.useLocalStorage) {
      try {
        return localStorage.length;
      } catch (e) {
        this.handleStorageError(e as Error, 'length');
      }
    }

    // Fallback to in-memory storage
    return this.storage.size;
  }

  /**
   * Checks if localStorage is currently being used
   *
   * @returns true if using localStorage, false if using fallback
   */
  isUsingLocalStorage(): boolean {
    return this.useLocalStorage;
  }

  /**
   * Gets the current storage quota usage (if available)
   *
   * @returns Object with usage and quota, or null if unavailable
   */
  async getQuotaInfo(): Promise<{ usage: number; quota: number; percentage: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;

        return {
          usage,
          quota,
          percentage: Math.round(percentage * 100) / 100,
        };
      } catch (e) {
        console.warn('SafeLocalStorage: Unable to get quota info', e);
      }
    }
    return null;
  }

  /**
   * Handles storage errors and switches to fallback mode
   *
   * @param error - The error that occurred
   * @param operation - The operation that failed
   */
  private handleStorageError(error: Error, operation: string): void {
    const errorKey = `${operation}:${error.name}`;

    // Only log each unique error once to avoid spam
    if (!this.warnings.has(errorKey)) {
      console.warn(
        `SafeLocalStorage: ${operation} failed with ${error.name}. ` +
          'Switching to in-memory fallback storage.',
        error
      );
      this.warnings.add(errorKey);
    }

    // Check if this is a QuotaExceededError
    if (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    ) {
      console.error(
        'SafeLocalStorage: Storage quota exceeded. Consider clearing old data or ' +
          'increasing storage allocation.'
      );
    }

    // Disable localStorage usage and switch to fallback
    if (this.useLocalStorage) {
      this.useLocalStorage = false;
      console.warn(
        'SafeLocalStorage: Permanently switched to in-memory fallback mode for this session.'
      );
    }
  }
}

// Export singleton instance
export default SafeLocalStorage.getInstance();

// Also export the class for testing purposes
export { SafeLocalStorage };
