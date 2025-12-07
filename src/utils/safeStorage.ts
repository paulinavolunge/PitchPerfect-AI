/**
 * Safe localStorage wrapper that handles private browsing mode
 * and other storage-related errors gracefully.
 */

const memoryStorage: Map<string, string> = new Map();
let storageAvailable: boolean | null = null;

function isStorageAvailable(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
    return true;
  } catch {
    storageAvailable = false;
    console.warn('[SafeStorage] localStorage not available, using memory fallback');
    return false;
  }
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (isStorageAvailable()) {
        return window.localStorage.getItem(key);
      }
      return memoryStorage.get(key) ?? null;
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      if (isStorageAvailable()) {
        window.localStorage.setItem(key, value);
      } else {
        memoryStorage.set(key, value);
      }
    } catch {
      memoryStorage.set(key, value);
    }
  },

  removeItem(key: string): void {
    try {
      if (isStorageAvailable()) {
        window.localStorage.removeItem(key);
      }
      memoryStorage.delete(key);
    } catch {
      memoryStorage.delete(key);
    }
  },

  clear(): void {
    try {
      if (isStorageAvailable()) {
        window.localStorage.clear();
      }
      memoryStorage.clear();
    } catch {
      memoryStorage.clear();
    }
  },

  isAvailable(): boolean {
    return isStorageAvailable();
  }
};

export default safeStorage;
