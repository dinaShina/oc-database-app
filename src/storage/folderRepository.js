import { loadFromStorage, saveToStorage } from "./localStorage.js";
const STORAGE_KEY = "oc-database-app:folders";
export function getFolders() { return loadFromStorage(STORAGE_KEY, []); }
export function saveFolders(folders) { saveToStorage(STORAGE_KEY, Array.isArray(folders) ? folders : []); }
