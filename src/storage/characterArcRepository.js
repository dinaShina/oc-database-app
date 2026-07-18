import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:character-arcs";

export function getCharacterArcs() {
  return loadFromStorage(STORAGE_KEY, []);
}

export function saveCharacterArcs(arcs) {
  saveToStorage(STORAGE_KEY, Array.isArray(arcs) ? arcs : []);
}
