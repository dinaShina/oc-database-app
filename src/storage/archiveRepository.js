import { loadFromStorage, saveToStorage } from "./localStorage.js";
const STORAGE_KEY = "oc-database-app:archive";
export function getArchiveRecords() { return loadFromStorage(STORAGE_KEY, []); }
export function saveArchiveRecords(records) { saveToStorage(STORAGE_KEY, Array.isArray(records) ? records : []); }
