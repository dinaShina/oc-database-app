import { INITIAL_WORLD, WORLD_TYPES } from "../data/worldSchema.js";
import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:worlds";

export function getWorlds() {
  return loadFromStorage(STORAGE_KEY, []).map(normalizeWorld);
}

export function saveWorlds(worlds) {
  saveToStorage(STORAGE_KEY, worlds.map(normalizeWorld));
}

export function createWorld(formData) {
  const now = new Date().toISOString();
  return { ...normalizeWorld(formData), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}

export function updateWorld(worlds, id, formData) {
  return worlds.map((world) => world.id === id ? { ...world, ...normalizeWorld(formData), id: world.id, createdAt: world.createdAt, updatedAt: new Date().toISOString() } : world);
}

export function deleteWorld(worlds, id) {
  return worlds.filter((world) => world.id !== id);
}

function normalizeWorld(world) {
  return {
    ...INITIAL_WORLD,
    ...world,
    name: typeof world.name === "string" ? world.name.trim() : "",
    worldType: WORLD_TYPES.includes(world.worldType) ? world.worldType : "Own World",
    description: typeof world.description === "string" ? world.description.trim() : "",
    notes: typeof world.notes === "string" ? world.notes.trim() : "",
    isFavorite: Boolean(world.isFavorite)
  };
}
