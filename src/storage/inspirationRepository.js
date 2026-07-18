import { INITIAL_INSPIRATION_ITEM } from "../data/inspirationSchema.js";
import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:inspiration-items";

export function getInspirationItems() {
  return loadFromStorage(STORAGE_KEY, []).map(normalizeItem);
}

export function saveInspirationItems(items) {
  saveToStorage(STORAGE_KEY, Array.isArray(items) ? items.map(normalizeItem) : []);
}

export function createInspirationItem(ocId, formData) {
  const now = new Date().toISOString();
  return { ...normalizeItem({ ...formData, ocId }), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}

export function updateInspirationItem(items, id, formData) {
  return items.map((item) => item.id === id ? { ...item, ...normalizeItem(formData), id: item.id, ocId: item.ocId, createdAt: item.createdAt, updatedAt: new Date().toISOString() } : item);
}

export function deleteInspirationItem(items, id) {
  return items.filter((item) => item.id !== id);
}

export function deleteInspirationForOC(items, ocId) {
  return items.filter((item) => item.ocId !== ocId);
}

function normalizeItem(item) {
  return Object.fromEntries(Object.entries({ ...INITIAL_INSPIRATION_ITEM, ...item }).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
}
