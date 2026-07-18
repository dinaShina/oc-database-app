import { INITIAL_OC_FORM, WORLD_TYPES } from "../data/ocFields.js";
import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:ocs";

// Keep OC-specific storage behavior here. Later this module can call Supabase,
// Firebase, or an API while the UI keeps using the same functions.
export function getOCs() {
  return loadFromStorage(STORAGE_KEY, []).map(migrateOC);
}

export function saveOCs(ocs) {
  saveToStorage(STORAGE_KEY, ocs);
}

export function createOC(formData) {
  const now = new Date().toISOString();

  return {
    ...normalizeOC(formData),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now
  };
}

export function updateOC(ocs, id, formData) {
  const updatedOC = normalizeOC(formData);

  return ocs.map((oc) =>
    oc.id === id
      ? {
          ...oc,
          ...updatedOC,
          updatedAt: new Date().toISOString()
        }
      : oc
  );
}

export function deleteOC(ocs, id) {
  return ocs.filter((oc) => oc.id !== id);
}

function normalizeOC(formData) {
  const normalized = Object.fromEntries(
    Object.entries({ ...INITIAL_OC_FORM, ...formData }).map(([key, value]) => [
      key,
      typeof value === "string" ? value : value
    ])
  );

  normalized.worldType = WORLD_TYPES.includes(normalized.worldType) ? normalized.worldType : "Canon Universe";
  normalized.fandom = getLegacyFandomValue(normalized);
  normalized.ownWorld = normalized.worldType === "Own World";

  return normalized;
}

function migrateOC(oc) {
  const worldType = getMigratedWorldType(oc);

  return normalizeOC({
    ...oc,
    profilePictureUrl: oc.profilePictureUrl || oc.imageUrl || "",
    profilePictureData: oc.profilePictureData || "",
    ethnicities: oc.ethnicities || "",
    birthDay: oc.birthDay || getDayFromLegacyDate(oc.birthDateExact || oc.birthDate),
    birthMonth: oc.birthMonth || getMonthFromLegacyDate(oc.birthDateExact || oc.birthDate),
    birthYear: oc.birthYear || getYearFromLegacyDate(oc.birthDateExact || oc.birthDate),
    currentAge: oc.currentAge || "",
    genderDetails: oc.genderDetails || oc.diverseGenderDetail || oc.diverseGenderCustom || "",
    secondName: oc.secondName || "",
    worldType,
    worldCanonName: oc.worldCanonName || (!oc.ownWorld ? oc.fandom : "") || "",
    worldCanonNotes: oc.worldCanonNotes || "",
    worldOwnName: oc.worldOwnName || (oc.ownWorld ? oc.fandom : "") || "",
    worldOwnDescription: oc.worldOwnDescription || "",
    worldOwnNotes: oc.worldOwnNotes || "",
    worldOriginalUniverse: oc.worldOriginalUniverse || "",
    worldAuTitle: oc.worldAuTitle || "",
    worldAuChanges: oc.worldAuChanges || "",
    worldAuNotes: oc.worldAuNotes || "",
    worldUniverseOne: oc.worldUniverseOne || "",
    worldUniverseTwo: oc.worldUniverseTwo || "",
    worldCrossoverDescription: oc.worldCrossoverDescription || "",
    worldCrossoverNotes: oc.worldCrossoverNotes || "",
    hairTexture: oc.hairTexture || oc.hairType || "",
    hairDetails: oc.hairDetails || oc.hairNotes || "",
    beardColor: oc.beardColor || "",
    beardLength: oc.beardLength || "",
    beardStyle: oc.beardStyle || "",
    beardDetails: oc.beardDetails || oc.beardNotes || "",
    faceShape: oc.faceShape || "",
    facialFeatures: oc.facialFeatures || oc.distinguishingFeatures || "",
    expressionsRestingFace: oc.expressionsRestingFace || "",
    eyeShape: oc.eyeShape || "",
    eyeDetails: oc.eyeDetails || oc.eyeNotes || "",
    skinDetails: oc.skinDetails || "",
    build: oc.build || "",
    posture: oc.posture || "",
    scars: oc.scars || oc.scarsMarks || "",
    birthmarks: oc.birthmarks || "",
    tattoos: oc.tattoos || "",
    piercings: oc.piercings || "",
    accessories: oc.accessories || "",
    signatureItem: oc.signatureItem || "",
    voice: oc.voice || "",
    scent: oc.scent || "",
    auraPresence: oc.auraPresence || "",
    skillsPowers: oc.skillsPowers || oc.abilities || "",
    pinterestLink: oc.pinterestLink || oc.moodboardLink || ""
  });
}

function getMigratedWorldType(oc) {
  if (WORLD_TYPES.includes(oc.worldType)) return oc.worldType;
  return oc.ownWorld ? "Own World" : "Canon Universe";
}

function getLegacyFandomValue(oc) {
  if (oc.worldType === "Own World") return oc.worldOwnName;
  if (oc.worldType === "Alternative Universe / AU") return [oc.worldOriginalUniverse, oc.worldAuTitle].filter(Boolean).join(" - ");
  if (oc.worldType === "Crossover") return [oc.worldUniverseOne, oc.worldUniverseTwo].filter(Boolean).join(" x ");
  return oc.worldCanonName || oc.fandom || "";
}

function getDayFromLegacyDate(date) {
  return date ? date.split("-")[2] || "" : "";
}

function getMonthFromLegacyDate(date) {
  return date ? date.split("-")[1] || "" : "";
}

function getYearFromLegacyDate(date) {
  return date ? date.split("-")[0] || "" : "";
}

