import { loadFromStorage, saveToStorage } from "./localStorage.js";
const STORAGE_KEY = "oc-database-app:tags";
export function getTags() { return loadFromStorage(STORAGE_KEY, []); }
export function saveTags(tags) { saveToStorage(STORAGE_KEY, Array.isArray(tags) ? tags : []); }
