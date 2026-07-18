import { INITIAL_REFERENCE_ITEM } from "../data/referenceSchema.js";
import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:reference-items";

export function getReferenceItems() {
  return loadFromStorage(STORAGE_KEY, []).map(normalizeItem);
}

export function saveReferenceItems(items) {
  saveToStorage(STORAGE_KEY, Array.isArray(items) ? items.map(normalizeItem) : []);
}

export function createReferenceItem(ocId, formData) {
  const now = new Date().toISOString();
  return { ...normalizeItem({ ...formData, ocId }), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}

export function updateReferenceItem(items, id, formData) {
  return items.map((item) => item.id === id ? { ...item, ...normalizeItem(formData), id: item.id, ocId: item.ocId, createdAt: item.createdAt, updatedAt: new Date().toISOString() } : item);
}

export function deleteReferenceItem(items, id) {
  return items.filter((item) => item.id !== id);
}

export function deleteReferencesForOC(items, ocId) {
  return items.filter((item) => item.ocId !== ocId);
}

function normalizeItem(item) {
  return Object.fromEntries(Object.entries({ ...INITIAL_REFERENCE_ITEM, ...item }).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
}
