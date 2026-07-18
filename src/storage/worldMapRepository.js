import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:world-map";
const EMPTY_WORLD_MAP = { places: [], routes: [] };

export function getWorldMapData() {
  const data = loadFromStorage(STORAGE_KEY, EMPTY_WORLD_MAP);
  return {
    places: Array.isArray(data.places) ? data.places : [],
    routes: Array.isArray(data.routes) ? data.routes : []
  };
}

export function saveWorldMapData(data) {
  saveToStorage(STORAGE_KEY, {
    places: Array.isArray(data.places) ? data.places : [],
    routes: Array.isArray(data.routes) ? data.routes : []
  });
}
