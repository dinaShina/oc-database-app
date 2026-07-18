import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:lore-entries";

export function getLoreEntries() {
  return loadFromStorage(STORAGE_KEY, []);
}

export function saveLoreEntries(entries) {
  saveToStorage(STORAGE_KEY, Array.isArray(entries) ? entries : []);
}
