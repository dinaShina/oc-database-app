import { INITIAL_RELATIONSHIP } from "../data/relationshipSchema.js";
import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:relationships";

export function getRelationships() {
  return loadFromStorage(STORAGE_KEY, []).map((relationship) => ({
    ...INITIAL_RELATIONSHIP,
    ...relationship
  }));
}

export function saveRelationships(relationships) {
  return saveToStorage(STORAGE_KEY, relationships);
}

export function createRelationship(ownerOcId, formData) {
  const now = new Date().toISOString();

  return {
    ...INITIAL_RELATIONSHIP,
    ...normalize(formData),
    id: crypto.randomUUID(),
    fromOcId: ownerOcId,
    createdAt: now,
    updatedAt: now
  };
}

export function updateRelationship(relationships, id, formData) {
  return relationships.map((relationship) =>
    relationship.id === id
      ? { ...relationship, ...normalize(formData), updatedAt: new Date().toISOString() }
      : relationship
  );
}

export function deleteRelationship(relationships, id) {
  return relationships.filter((relationship) => relationship.id !== id);
}

export function deleteRelationshipsForOC(relationships, ownerOcId) {
  return relationships.filter(
    (relationship) => relationship.fromOcId !== ownerOcId && relationship.toCharacterId !== ownerOcId
  );
}

function normalize(formData) {
  return {
    ...formData,
    targetType: cleanToken(formData.targetType),
    toCharacterId: cleanToken(formData.toCharacterId),
    canonCharacterId: cleanToken(formData.canonCharacterId),
    canonCharacterPackId: cleanToken(formData.canonCharacterPackId),
    canonCharacterName: keepText(formData.canonCharacterName),
    characterName: keepText(formData.characterName),
    label: keepText(formData.label),
    direction: cleanToken(formData.direction),
    notes: keepText(formData.notes)
  };
}

function keepText(value) {
  return typeof value === "string" ? value : "";
}

function cleanToken(value) {
  return typeof value === "string" ? value.trim() : "";
}
