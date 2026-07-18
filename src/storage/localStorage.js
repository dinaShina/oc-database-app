const STORAGE_MANIFEST_KEY = "atlasArchive.storageManifest";
const LEGACY_MANIFEST_KEY = "oc-database-app:storage-manifest";
const STORAGE_BACKUP_PREFIX = "atlasArchive.storageBackup.";
const STORAGE_RECOVERY_PREFIX = "atlasArchive.recovery.";
const MAX_ROTATING_BACKUPS = 3;

export const APP_STORAGE_VERSION = 3;
export const STORAGE_ENGINE = "localStorage";

export function loadFromStorage(key, fallbackValue) {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null || storedValue === undefined) return fallbackValue;
    const parsed = JSON.parse(storedValue);
    touchStorageManifest(key, "read");
    return normalizeStoredValue(parsed);
  } catch (error) {
    preserveCorruptStorage(key, error);
    console.error(`Could not load ${key}. Raw value was preserved for recovery.`, error);
    return fallbackValue;
  }
}

export function readRawStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function parseStoredValue(key) {
  const raw = readRawStorage(key);
  if (raw === null || raw === undefined) return { ok: true, value: null, raw: null };
  try {
    return { ok: true, value: normalizeStoredValue(JSON.parse(raw)), raw };
  } catch (error) {
    preserveCorruptStorage(key, error);
    return { ok: false, value: null, raw, error: error.message };
  }
}

export function saveToStorage(key, value, options = {}) {
  try {
    const normalized = normalizeStoredValue(value);
    const serialized = JSON.stringify(normalized);
    JSON.parse(serialized);
    const tempKey = `${key}.tmp`;
    localStorage.setItem(tempKey, serialized);
    JSON.parse(localStorage.getItem(tempKey));

    const previous = localStorage.getItem(key);
    if (previous !== null && previous !== undefined) rotateBackups(key, previous);

    localStorage.setItem(key, serialized);
    localStorage.removeItem(tempKey);
    touchStorageManifest(key, "write", { count: Array.isArray(normalized) ? normalized.length : undefined, error: "" });
    return true;
  } catch (error) {
    touchStorageManifest(key, "write-error", { error: error.message || "Unknown storage error" });
    console.error(`Could not save ${key}:`, error);
    return false;
  }
}

export function removeFromStorage(key, options = {}) {
  try {
    const previous = localStorage.getItem(key);
    if (previous !== null && previous !== undefined) rotateBackups(key, previous);
    localStorage.removeItem(key);
    touchStorageManifest(key, "remove");
    return true;
  } catch (error) {
    touchStorageManifest(key, "remove-error", { error: error.message || "Unknown storage error" });
    console.error(`Could not remove ${key}:`, error);
    return false;
  }
}

export function getStorageManifest() {
  try {
    const storedValue = localStorage.getItem(STORAGE_MANIFEST_KEY) || localStorage.getItem(LEGACY_MANIFEST_KEY);
    return storedValue ? { ...createEmptyManifest(), ...JSON.parse(storedValue) } : createEmptyManifest();
  } catch (error) {
    console.error("Could not load storage manifest:", error);
    return createEmptyManifest({ error: error.message });
  }
}

export function getStorageSnapshot() {
  const manifest = getStorageManifest();
  const keys = getAtlasStorageKeys();
  return {
    manifest,
    exportedAt: new Date().toISOString(),
    values: Object.fromEntries(keys.map((key) => [key, readRawStorage(key)]))
  };
}

export function getStorageStatusForKey(key) {
  const manifest = getStorageManifest();
  const entry = manifest.keys?.[key] || {};
  return {
    key,
    storageType: STORAGE_ENGINE,
    lastSuccessfulSave: entry.lastSuccessfulSave || entry.updatedAt || "",
    lastBackup: getBackupKeysForKey(key)[0]?.createdAt || "",
    error: entry.error || ""
  };
}

export function getRecoverableStorageSources() {
  return getAtlasStorageKeys().map((key) => {
    const parsed = parseStoredValue(key);
    const characterCount = countCharactersInValue(parsed.value, key);
    return {
      key,
      ok: parsed.ok,
      characterCount,
      lastModified: getStorageManifest().keys?.[key]?.updatedAt || getBackupTimestampFromKey(key) || "",
      raw: parsed.raw,
      value: parsed.value,
      error: parsed.error || ""
    };
  }).sort((a, b) => b.characterCount - a.characterCount || String(b.lastModified).localeCompare(String(a.lastModified)));
}

function touchStorageManifest(key, action, details = {}) {
  if (key === STORAGE_MANIFEST_KEY || key === LEGACY_MANIFEST_KEY) return;
  try {
    const now = new Date().toISOString();
    const manifest = getStorageManifest();
    const nextManifest = {
      ...manifest,
      engine: STORAGE_ENGINE,
      appId: "atlasArchive",
      version: APP_STORAGE_VERSION,
      updatedAt: now,
      keys: {
        ...manifest.keys,
        [key]: {
          ...(manifest.keys?.[key] || {}),
          key,
          action,
          updatedAt: now,
          lastSuccessfulSave: action === "write" ? now : manifest.keys?.[key]?.lastSuccessfulSave || "",
          ...details
        }
      }
    };
    localStorage.setItem(STORAGE_MANIFEST_KEY, JSON.stringify(nextManifest));
  } catch (error) {
    console.error("Could not update storage manifest:", error);
  }
}

function createEmptyManifest(extra = {}) {
  return { appId: "atlasArchive", engine: STORAGE_ENGINE, version: APP_STORAGE_VERSION, createdAt: new Date().toISOString(), updatedAt: "", keys: {}, ...extra };
}

function rotateBackups(key, rawValue) {
  const backupKeys = getBackupKeysForKey(key);
  for (let index = backupKeys.length - 1; index >= 0; index -= 1) {
    const backup = backupKeys[index];
    const nextIndex = index + 2;
    if (nextIndex > MAX_ROTATING_BACKUPS) localStorage.removeItem(backup.key);
    else localStorage.setItem(getBackupKey(key, nextIndex), localStorage.getItem(backup.key));
  }
  localStorage.setItem(getBackupKey(key, 1), JSON.stringify({ key, createdAt: new Date().toISOString(), rawValue }));
}

function getBackupKey(key, index) {
  return `${key}.backup.${index}`;
}

function getBackupKeysForKey(key) {
  return [1, 2, 3].map((index) => {
    const backupKey = getBackupKey(key, index);
    const parsed = parseBackupMetadata(backupKey);
    return parsed ? { key: backupKey, ...parsed } : null;
  }).filter(Boolean);
}

function parseBackupMetadata(backupKey) {
  try {
    const raw = localStorage.getItem(backupKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { createdAt: parsed.createdAt || "", rawValue: parsed.rawValue || "" };
  } catch {
    return null;
  }
}

function preserveCorruptStorage(key, error) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return;
    const recoveryKey = `${STORAGE_RECOVERY_PREFIX}${Date.now()}.${sanitizeKey(key)}`;
    localStorage.setItem(recoveryKey, JSON.stringify({ key, createdAt: new Date().toISOString(), error: error.message || String(error), rawValue: raw }));
    touchStorageManifest(key, "parse-error", { error: error.message || String(error) });
  } catch (recoveryError) {
    console.error("Could not preserve corrupt storage:", recoveryError);
  }
}

function getAtlasStorageKeys() {
  try {
    return Object.keys(localStorage).filter((key) => key.startsWith("atlasArchive") || key.startsWith("oc-database-app:") || ["ocs", "characters"].includes(key));
  } catch {
    return [];
  }
}

function countCharactersInValue(value, key) {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object" && (item.id || item.name || item.fullName)).length;
  if (value && typeof value === "object") {
    if (Array.isArray(value.characters)) return value.characters.length;
    if (value.rawValue && key.includes("backup")) {
      try { return countCharactersInValue(JSON.parse(value.rawValue), key); } catch { return 0; }
    }
    if (value.values) return Object.entries(value.values).reduce((total, [entryKey, raw]) => {
      try { return total + countCharactersInValue(JSON.parse(raw), entryKey); } catch { return total; }
    }, 0);
  }
  return 0;
}

function getBackupTimestampFromKey(key) {
  const match = key.match(/(\d{4}-\d{2}-\d{2}T[^.]+)/) || key.match(/recovery\.(\d+)/);
  if (!match) return "";
  if (/^\d+$/.test(match[1])) return new Date(Number(match[1])).toISOString();
  return match[1];
}

function sanitizeKey(key) {
  return key.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function normalizeStoredValue(value) {
  if (typeof value === "string") return normalizeStoredString(value);
  if (Array.isArray(value)) return value.map((item) => normalizeStoredValue(item));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeStoredValue(entry)]));
  return value;
}

function normalizeStoredString(value) {
  return value.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
