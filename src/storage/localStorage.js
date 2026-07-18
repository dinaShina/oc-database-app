const STORAGE_MANIFEST_KEY = "oc-database-app:storage-manifest";

export const STORAGE_ENGINE = "localStorage";

export function loadFromStorage(key, fallbackValue) {
  try {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) return fallbackValue;
    touchStorageManifest(key, "read");
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Could not load ${key}:`, error);
    return fallbackValue;
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    touchStorageManifest(key, "write");
  } catch (error) {
    console.error(`Could not save ${key}:`, error);
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    touchStorageManifest(key, "remove");
  } catch (error) {
    console.error(`Could not remove ${key}:`, error);
  }
}

export function getStorageManifest() {
  try {
    const storedValue = localStorage.getItem(STORAGE_MANIFEST_KEY);
    return storedValue ? JSON.parse(storedValue) : createEmptyManifest();
  } catch (error) {
    console.error("Could not load storage manifest:", error);
    return createEmptyManifest();
  }
}

export function getStorageSnapshot() {
  const manifest = getStorageManifest();
  const keys = Object.keys(localStorage).filter((key) => key.startsWith("oc-database-app:"));
  return {
    manifest,
    values: Object.fromEntries(keys.map((key) => [key, loadFromStorage(key, null)]))
  };
}

function touchStorageManifest(key, action) {
  if (key === STORAGE_MANIFEST_KEY) return;

  try {
    const now = new Date().toISOString();
    const manifest = getStorageManifest();
    const nextManifest = {
      ...manifest,
      engine: STORAGE_ENGINE,
      appId: "oc-database-app",
      updatedAt: now,
      keys: {
        ...manifest.keys,
        [key]: {
          key,
          action,
          updatedAt: now
        }
      }
    };
    localStorage.setItem(STORAGE_MANIFEST_KEY, JSON.stringify(nextManifest));
  } catch (error) {
    console.error("Could not update storage manifest:", error);
  }
}

function createEmptyManifest() {
  return {
    appId: "oc-database-app",
    engine: STORAGE_ENGINE,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: "",
    keys: {}
  };
}
