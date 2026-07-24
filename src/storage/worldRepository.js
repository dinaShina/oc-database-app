import { INITIAL_WORLD, WORLD_REFERENCE_TYPES, WORLD_TYPES } from "../data/worldSchema.js";
import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:worlds";

export function getWorlds() {
  const storedWorlds = loadFromStorage(STORAGE_KEY, []);
  const sourceWorlds = Array.isArray(storedWorlds) ? storedWorlds : [];
  const normalizedWorlds = sourceWorlds.map((world) => normalizeWorld(world, { ensureId: true }));
  if (hasMigrationChanges(sourceWorlds, normalizedWorlds)) saveWorlds(normalizedWorlds);
  return normalizedWorlds;
}

export function saveWorlds(worlds) {
  return saveToStorage(STORAGE_KEY, worlds.map((world) => normalizeWorld(world, { ensureId: true })));
}

export function createWorld(formData) {
  const now = new Date().toISOString();
  return { ...normalizeWorld(formData, { ensureId: true }), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}

export function duplicateWorldRecord(world) {
  const now = new Date().toISOString();
  const source = deepClone(world || {});
  const originalName = keepText(source.name).trim() || "Untitled World";
  return normalizeWorld({
    ...source,
    id: crypto.randomUUID(),
    name: `${originalName} - Copy`,
    ownerSeed: false,
    ownerSeedVersion: undefined,
    createdAt: now,
    updatedAt: now,
    details: rekeyItems(source.details),
    references: rekeyItems(source.references),
    customSections: rekeyItems(source.customSections)
  }, { ensureId: true });
}

export function updateWorld(worlds, id, formData) {
  return worlds.map((world) => world.id === id ? { ...world, ...normalizeWorld(formData, { ensureId: true }), id: world.id, createdAt: world.createdAt, updatedAt: new Date().toISOString() } : world);
}

export function deleteWorld(worlds, id) {
  return worlds.filter((world) => world.id !== id);
}

function normalizeWorld(world = {}, options = {}) {
  const now = new Date().toISOString();
  const normalized = {
    ...INITIAL_WORLD,
    ...world,
    name: keepText(world.name || world.title || world.worldName).trim(),
    worldType: getWorldType(world),
    description: keepText(world.description || world.summary || world.worldDescription).trim(),
    coverImageData: keepText(world.coverImageData || world.imageData),
    coverImageUrl: keepText(world.coverImageUrl || world.imageUrl || world.coverUrl),
    notes: keepText(world.notes || world.loreNotes || world.worldNotes),
    ideas: keepText(world.ideas || world.brainstorming),
    details: normalizeDetails(world.details || world.detailSections || world.loreDetails),
    references: normalizeReferences(world.references || world.referenceItems || world.inspirationReferences),
    customSections: normalizeDetails(world.customSections || world.sections || world.customDetails),
    isFavorite: Boolean(world.isFavorite),
    createdAt: keepText(world.createdAt) || now,
    updatedAt: keepText(world.updatedAt) || now
  };

  if (options.ensureId) normalized.id = cleanToken(world.id) || crypto.randomUUID();
  else normalized.id = cleanToken(world.id);

  return normalized;
}

function getWorldType(world = {}) {
  const rawType = keepText(world.worldType || world.type || world.category).trim();
  if (WORLD_TYPES.includes(rawType)) return rawType;
  return rawType || "Own World";
}

function normalizeDetails(details) {
  if (!Array.isArray(details)) return [];
  return details.map((detail) => ({
    ...detail,
    id: cleanToken(detail.id) || crypto.randomUUID(),
    title: keepText(detail.title || detail.name || detail.label),
    content: keepText(detail.content || detail.description || detail.notes || detail.value)
  })).filter((detail) => detail.title || detail.content);
}

function normalizeReferences(references) {
  if (!Array.isArray(references)) return [];
  return references.map((reference) => ({
    ...reference,
    id: cleanToken(reference.id) || crypto.randomUUID(),
    title: keepText(reference.title || reference.name || reference.label),
    type: WORLD_REFERENCE_TYPES.includes(reference.type) ? reference.type : "Link",
    url: keepText(reference.url || reference.link || reference.href),
    imageData: keepText(reference.imageData),
    imageUrl: keepText(reference.imageUrl || reference.image || reference.thumbnailUrl),
    notes: keepText(reference.notes || reference.description || reference.content)
  })).filter((reference) => reference.title || reference.url || reference.imageData || reference.imageUrl || reference.notes);
}

function rekeyItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({ ...deepClone(item), id: crypto.randomUUID() }));
}

function hasMigrationChanges(before, after) {
  try {
    return JSON.stringify(before) !== JSON.stringify(after);
  } catch {
    return true;
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function keepText(value) {
  return typeof value === "string" ? value : "";
}

function cleanToken(value) {
  return typeof value === "string" ? value.trim() : "";
}
