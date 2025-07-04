// localStorage Utility Functions
// Adapted from Event Cards storage-utils.js

export function isStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('Local storage is not available or disabled:', e.message);
    return false;
  }
}

export function saveState(key, state) {
  if (!isStorageAvailable()) {
    // Optionally, could throw an error or return a status
    return false;
  }
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn(`Error saving state for key "${key}":`, e.message);
    return false;
  }
}

export function loadState(key, defaultValue = null) {
  if (!isStorageAvailable()) {
    return defaultValue;
  }
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.warn(`Error loading state for key "${key}":`, e.message);
    // Corrupted data could cause JSON.parse to fail
    // Depending on strategy, might want to remove the corrupted item:
    // localStorage.removeItem(key);
    return defaultValue;
  }
}

export function removeItem(key) {
  if (!isStorageAvailable()) {
    return false;
  }
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`Error removing item for key "${key}":`, e.message);
    return false;
  }
}
