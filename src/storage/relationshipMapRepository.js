import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:relationship-maps";

export function getRelationshipMaps() {
  return loadFromStorage(STORAGE_KEY, []).map(normalizeMap);
}

export function saveRelationshipMaps(maps) {
  return saveToStorage(STORAGE_KEY, maps.map(normalizeMap));
}

export function upsertRelationshipMap(maps, ownerOcId, graph) {
  const now = new Date().toISOString();
  const normalizedGraph = normalizeMap({
    ...graph,
    ownerOcId,
    updatedAt: now,
    createdAt: graph.createdAt || now
  });

  const exists = maps.some((map) => map.ownerOcId === ownerOcId);
  return exists
    ? maps.map((map) => (map.ownerOcId === ownerOcId ? normalizedGraph : map))
    : [normalizedGraph, ...maps];
}

export function deleteRelationshipMapForOC(maps, ownerOcId) {
  return maps.filter((map) => map.ownerOcId !== ownerOcId);
}

function normalizeMap(map) {
  return {
    id: map.id || crypto.randomUUID(),
    ownerOcId: cleanToken(map.ownerOcId),
    nodes: Array.isArray(map.nodes) ? map.nodes.map(normalizeNode) : [],
    edges: Array.isArray(map.edges) ? map.edges.map(normalizeEdge) : [],
    createdAt: map.createdAt || "",
    updatedAt: map.updatedAt || ""
  };
}

function normalizeNode(node) {
  return {
    id: node.id || crypto.randomUUID(),
    type: cleanToken(node.type) || "manualCharacter",
    savedOcId: cleanToken(node.savedOcId),
    canonCharacterId: cleanToken(node.canonCharacterId),
    canonCharacterPackId: cleanToken(node.canonCharacterPackId),
    name: keepText(node.name),
    profilePictureUrl: cleanToken(node.profilePictureUrl),
    profilePictureData: node.profilePictureData || "",
    notes: keepText(node.notes),
    x: Number.isFinite(Number(node.x)) ? Number(node.x) : 460,
    y: Number.isFinite(Number(node.y)) ? Number(node.y) : 220
  };
}

function normalizeEdge(edge) {
  return {
    id: edge.id || crypto.randomUUID(),
    fromNodeId: cleanToken(edge.fromNodeId) || "main",
    toNodeId: cleanToken(edge.toNodeId),
    label: keepText(edge.label),
    ocFeels: keepText(edge.ocFeels),
    targetFeels: keepText(edge.targetFeels),
    notes: keepText(edge.notes),
    direction: cleanToken(edge.direction) || "mutual"
  };
}

function keepText(value) {
  return typeof value === "string" ? value : "";
}

function cleanToken(value) {
  return typeof value === "string" ? value.trim() : "";
}
