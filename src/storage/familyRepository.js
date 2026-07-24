import { INITIAL_FAMILY_MEMBER } from "../data/relationshipSchema.js";
import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:family-members";

export function getFamilyMembers() {
  return loadFromStorage(STORAGE_KEY, []).map((member) => ({
    ...INITIAL_FAMILY_MEMBER,
    ...member
  }));
}

export function saveFamilyMembers(members) {
  return saveToStorage(STORAGE_KEY, members);
}

export function createFamilyMember(ownerOcId, formData) {
  const now = new Date().toISOString();

  return {
    ...INITIAL_FAMILY_MEMBER,
    ...normalize(formData),
    id: crypto.randomUUID(),
    ownerOcId,
    createdAt: now,
    updatedAt: now
  };
}

export function updateFamilyMember(members, id, formData) {
  return members.map((member) =>
    member.id === id
      ? { ...member, ...normalize(formData), updatedAt: new Date().toISOString() }
      : member
  );
}

export function deleteFamilyMember(members, id) {
  return members.filter((member) => member.id !== id);
}

export function deleteFamilyForOC(members, ownerOcId) {
  return members.filter((member) => member.ownerOcId !== ownerOcId);
}

function normalize(formData) {
  return {
    ...formData,
    name: keepText(formData.name),
    relationLabel: keepText(formData.relationLabel),
    profilePictureUrl: cleanToken(formData.profilePictureUrl),
    profilePictureData: formData.profilePictureData || "",
    notes: keepText(formData.notes)
  };
}

function keepText(value) {
  return typeof value === "string" ? value : "";
}

function cleanToken(value) {
  return typeof value === "string" ? value.trim() : "";
}
