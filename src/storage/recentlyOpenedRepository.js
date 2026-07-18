import { loadFromStorage, saveToStorage } from "./localStorage.js";
const STORAGE_KEY = "oc-database-app:recently-opened";
export function getRecentlyOpened() { return loadFromStorage(STORAGE_KEY, []); }
export function saveRecentlyOpened(items) { saveToStorage(STORAGE_KEY, Array.isArray(items) ? items : []); }
