/**
 * Sync state persistence utilities.
 *
 * Stores the current sync progress in a dedicated IndexedDB database so that
 * if the app is closed mid-sync the state survives and can be detected on
 * next open.
 *
 * Lifecycle:
 *  START    → inProgress=true, currentItemId=item.id
 *  PROGRESS → append to completedItems on success; append to failedItems on error
 *  COMPLETE → clearSyncState() when every item processed
 *  INTERRUPT → record remains in IndexedDB until next open
 */

export interface SyncState {
  /** Unique record key — always 'current' */
  id: 'current';
  inProgress: boolean;
  currentItemId: string | null;
  itemType: 'photo' | 'form' | null;
  /** Unix ms timestamp when this sync run started */
  startedAt: number;
  /** IDs of items that were uploaded successfully in this run */
  completedItems: string[];
  /** IDs of items that failed in this run */
  failedItems: string[];
  /** Unix ms timestamp of last write */
  lastUpdated: number;
}

const DB_NAME = 'CustodialSyncState';
const DB_VERSION = 1;
const STORE_NAME = 'sync-state';
const RECORD_KEY = 'current';

// In-memory fallback when IndexedDB is not available
let memoryState: SyncState | null = null;
let idbAvailable: boolean | null = null; // null = unknown, true/false = tested

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as IDBDatabase);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Returns true when IndexedDB is available in the current browser context.
 * The result is memoised after the first test.
 */
async function checkIdbAvailable(): Promise<boolean> {
  if (idbAvailable !== null) return idbAvailable;
  try {
    if (typeof indexedDB === 'undefined') {
      idbAvailable = false;
      return false;
    }
    await openDB();
    idbAvailable = true;
  } catch {
    idbAvailable = false;
  }
  return idbAvailable;
}

/**
 * Persist the given sync state to IndexedDB (with memory fallback).
 */
export async function saveSyncState(state: SyncState): Promise<void> {
  try {
    const available = await checkIdbAvailable();
    if (!available) {
      memoryState = { ...state };
      return;
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ ...state, id: RECORD_KEY });
      request.onsuccess = () => {
        db.close();
        resolve();
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    // Log but don't fail — sync state is best-effort
    console.error('[syncState] Failed to save sync state:', error);
    memoryState = { ...state };
  }
}

/**
 * Retrieve the current sync state from IndexedDB.
 * Returns null if no state is stored or if storage is unavailable.
 */
export async function getSyncState(): Promise<SyncState | null> {
  try {
    const available = await checkIdbAvailable();
    if (!available) {
      return memoryState;
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(RECORD_KEY);
      request.onsuccess = () => {
        db.close();
        resolve((request.result as SyncState) ?? null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[syncState] Failed to get sync state:', error);
    return memoryState;
  }
}

/**
 * Delete the sync state record (call this on successful sync completion).
 */
export async function clearSyncState(): Promise<void> {
  try {
    memoryState = null;
    const available = await checkIdbAvailable();
    if (!available) return;

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(RECORD_KEY);
      request.onsuccess = () => {
        db.close();
        resolve();
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[syncState] Failed to clear sync state:', error);
  }
}

/**
 * Check whether there is an incomplete sync from a previous session.
 *
 * @returns true if an interrupted sync was found, false otherwise.
 */
export async function resumeSync(): Promise<boolean> {
  try {
    const state = await getSyncState();
    if (!state) return false;
    // A sync is considered interrupted if it was in progress but never cleared
    return state.inProgress === true;
  } catch (error) {
    console.error('[syncState] Failed to check resume state:', error);
    return false;
  }
}

/**
 * Build a fresh SyncState record for the start of a new sync run.
 */
export function buildInitialSyncState(
  itemId: string,
  itemType: 'photo' | 'form'
): SyncState {
  return {
    id: 'current',
    inProgress: true,
    currentItemId: itemId,
    itemType,
    startedAt: Date.now(),
    completedItems: [],
    failedItems: [],
    lastUpdated: Date.now()
  };
}
