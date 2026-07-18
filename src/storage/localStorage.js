const STORAGE_MANIFEST_KEY = "oc-database-app:storage-manifest";
const STORAGE_BACKUP_PREFIX = "oc-database-app:storage-backup:";
export const APP_STORAGE_VERSION = 2;
export const STORAGE_ENGINE = "localStorage";

export function loadFromStorage(key, fallbackValue) {
  try {
    ensureStorageVersion();
    const storedValue = localStorage.getItem(key);
    if (!storedValue) return fallbackValue;
    touchStorageManifest(key, "read");
    return normalizeStoredValue(JSON.parse(storedValue));
  } catch (error) {
    console.error(`Could not load ${key}:`, error);
    return fallbackValue;
  }
}

export function saveToStorage(key, value) {
  try {
    ensureStorageVersion();
    localStorage.setItem(key, JSON.stringify(normalizeStoredValue(value)));
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
    version: APP_STORAGE_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: "",
    keys: {}
  };
}

function ensureStorageVersion() {
  try {
    const manifest = getStorageManifest();
    const currentVersion = Number(manifest.version || 1);
    if (currentVersion >= APP_STORAGE_VERSION) return;

    createMigrationBackup(currentVersion);
    const nextManifest = {
      ...manifest,
      engine: STORAGE_ENGINE,
      version: APP_STORAGE_VERSION,
      migratedFrom: currentVersion,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_MANIFEST_KEY, JSON.stringify(nextManifest));
  } catch (error) {
    console.error("Could not run storage migration:", error);
  }
}

function createMigrationBackup(fromVersion) {
  const backupKey = `${STORAGE_BACKUP_PREFIX}${new Date().toISOString()}`;
  const values = Object.fromEntries(
    Object.keys(localStorage)
      .filter((key) => key.startsWith("oc-database-app:") && !key.startsWith(STORAGE_BACKUP_PREFIX))
      .map((key) => [key, localStorage.getItem(key)])
  );

  localStorage.setItem(backupKey, JSON.stringify({
    appId: "oc-database-app",
    fromVersion,
    toVersion: APP_STORAGE_VERSION,
    createdAt: new Date().toISOString(),
    values
  }));
}

function normalizeStoredValue(value) {
  if (typeof value === "string") return normalizeStoredString(value);
  if (Array.isArray(value)) return value.map((item) => normalizeStoredValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeStoredValue(entry)]));
  }
  return value;
}

function normalizeStoredString(value) {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}
