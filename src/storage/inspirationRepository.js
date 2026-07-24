import { getDefaultTypeForSection, getSectionForType, INITIAL_INSPIRATION_ITEM, INSPIRATION_TYPES } from "../data/inspirationSchema.js";
import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:inspiration-items";

export function getInspirationItems() {
  const items = loadFromStorage(STORAGE_KEY, []);
  return Array.isArray(items) ? items.map(normalizeItem) : [];
}

export function saveInspirationItems(items) {
  return saveToStorage(STORAGE_KEY, Array.isArray(items) ? items.map(normalizeItem) : []);
}

export function createInspirationItem(ocId, formData, order = 0) {
  const now = new Date().toISOString();
  return { ...normalizeItem({ ...formData, ocId, order }), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}

export function updateInspirationItem(items, id, formData) {
  return items.map((item) => item.id === id ? { ...item, ...normalizeItem(formData), id: item.id, ocId: item.ocId, createdAt: item.createdAt, updatedAt: new Date().toISOString() } : item);
}

export function deleteInspirationItem(items, id) {
  return items.filter((item) => item.id !== id);
}

export function reorderInspirationItem(items, ocId, id, direction) {
  const otherItems = items.filter((item) => item.ocId !== ocId);
  const ocItems = items.filter((item) => item.ocId === ocId).map(normalizeItem).sort((a, b) => a.order - b.order || String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  const index = ocItems.findIndex((item) => item.id === id);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= ocItems.length) return items;
  const nextItems = [...ocItems];
  const [moved] = nextItems.splice(index, 1);
  nextItems.splice(targetIndex, 0, moved);
  const now = new Date().toISOString();
  return [...otherItems, ...nextItems.map((item, order) => ({ ...item, order, updatedAt: item.id === id ? now : item.updatedAt }))];
}

export function deleteInspirationForOC(items, ocId) {
  return items.filter((item) => item.ocId !== ocId);
}

function normalizeItem(item) {
  const type = INSPIRATION_TYPES.includes(item.type) ? item.type : getDefaultTypeForSection(item.section);
  const section = item.section || getSectionForType(type);

  return {
    ...INITIAL_INSPIRATION_ITEM,
    ...item,
    type,
    section,
    title: keepText(item.title),
    url: keepText(item.url),
    sourceLink: keepText(item.sourceLink),
    imageData: keepText(item.imageData),
    images: Array.isArray(item.images) ? item.images.filter(Boolean) : [],
    quote: keepText(item.quote),
    author: keepText(item.author),
    artist: keepText(item.artist),
    description: keepText(item.description),
    category: keepText(item.category),
    content: keepText(item.content || item.notes),
    colors: normalizeColors(item.colors),
    notes: keepText(item.notes),
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : 0
  };
}

function normalizeColors(colors) {
  if (!Array.isArray(colors)) return [];
  return colors.slice(0, 8).map((color) => ({
    name: keepText(color?.name),
    hex: keepText(color?.hex) || "#2f6652"
  }));
}

function keepText(value) {
  return typeof value === "string" ? value.trim() : "";
}
