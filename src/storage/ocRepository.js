import { INITIAL_OC_FORM, WORLD_TYPES } from "../data/ocFields.js";
import { loadFromStorage, parseStoredValue, readRawStorage, saveToStorage } from "./localStorage.js";

export const CHARACTER_STORAGE_KEY = "atlasArchive.characters";
export const LEGACY_CHARACTER_KEYS = ["oc-database-app:ocs", "atlasArchive.ocs", "ocs", "characters"];

// Keep OC-specific storage behavior here. Later this module can call Supabase,
// Firebase, or an API while the UI keeps using the same functions.
export function getOCs() {
  return loadCharactersFromStableStorage().map(migrateOC);
}

export function saveOCs(ocs, options = {}) {
  if (!Array.isArray(ocs)) return false;
  const current = loadFromStorage(CHARACTER_STORAGE_KEY, []);
  if (!options.allowEmpty && ocs.length === 0 && Array.isArray(current) && current.length > 0) {
    console.warn("Blocked an empty character overwrite. Use allowEmpty only for an explicit user-confirmed reset.");
    return false;
  }
  return saveToStorage(CHARACTER_STORAGE_KEY, ocs.map(migrateOC));
}

export function getCharacterStorageStatus() {
  const sources = discoverCharacterSources();
  return {
    key: CHARACTER_STORAGE_KEY,
    characterCount: getOCs().length,
    sources
  };
}

export function discoverCharacterSources() {
  const keys = [CHARACTER_STORAGE_KEY, ...LEGACY_CHARACTER_KEYS, ...getCharacterBackupKeys()];
  return Array.from(new Set(keys)).map((key) => {
    const parsed = parseStoredValue(key);
    const characters = extractCharacters(parsed.value, key);
    return {
      key,
      exists: readRawStorage(key) !== null,
      ok: parsed.ok,
      characterCount: characters.length,
      characters,
      raw: parsed.raw,
      error: parsed.error || ""
    };
  }).filter((source) => source.exists || source.characterCount > 0);
}

export function restoreCharactersFromSource(sourceKey, currentCharacters = []) {
  const source = discoverCharacterSources().find((item) => item.key === sourceKey);
  if (!source || source.characterCount === 0) return currentCharacters;
  const merged = mergeCharacters(currentCharacters, source.characters);
  saveToStorage(`${CHARACTER_STORAGE_KEY}.restoreBackup.${Date.now()}`, currentCharacters);
  saveOCs(merged, { allowEmpty: false });
  return merged;
}

export function createOC(formData) {
  const now = new Date().toISOString();
  return { ...normalizeOC(formData), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}

export function updateOC(ocs, id, formData) {
  const updatedOC = normalizeOC(formData);
  return ocs.map((oc) => oc.id === id ? { ...oc, ...updatedOC, updatedAt: new Date().toISOString() } : oc);
}

export function deleteOC(ocs, id) {
  return ocs.filter((oc) => oc.id !== id);
}

function loadCharactersFromStableStorage() {
  const current = loadFromStorage(CHARACTER_STORAGE_KEY, null);
  if (Array.isArray(current)) return current;
  const legacy = getBestLegacyCharacters();
  if (legacy.length > 0) {
    saveToStorage(CHARACTER_STORAGE_KEY, legacy);
    return legacy;
  }
  return [];
}

function getBestLegacyCharacters() {
  return discoverCharacterSources()
    .filter((source) => source.key !== CHARACTER_STORAGE_KEY && source.characterCount > 0)
    .sort((a, b) => b.characterCount - a.characterCount)[0]?.characters || [];
}

function getCharacterBackupKeys() {
  try {
    return Object.keys(localStorage).filter((key) => key.includes("characters") || key.includes("ocs"));
  } catch {
    return [];
  }
}

function extractCharacters(value, key) {
  if (Array.isArray(value)) return value.filter(isCharacterLike).map(migrateOC);
  if (value && typeof value === "object") {
    if (Array.isArray(value.characters)) return value.characters.filter(isCharacterLike).map(migrateOC);
    if (value.rawValue) {
      try { return extractCharacters(JSON.parse(value.rawValue), key); } catch { return []; }
    }
    if (value.values) {
      return Object.entries(value.values).flatMap(([entryKey, raw]) => {
        try { return extractCharacters(JSON.parse(raw), entryKey); } catch { return []; }
      });
    }
  }
  return [];
}

function isCharacterLike(item) {
  return item && typeof item === "object" && (item.id || item.name || item.fullName || item.firstName || item.nickname);
}

function mergeCharacters(currentCharacters, restoredCharacters) {
  const merged = new Map();
  [...currentCharacters, ...restoredCharacters].forEach((character) => {
    const migrated = migrateOC(character);
    const key = migrated.id || `${migrated.name}-${migrated.createdAt}`;
    const existing = merged.get(key);
    if (!existing || String(migrated.updatedAt || "") > String(existing.updatedAt || "")) merged.set(key, migrated);
  });
  return Array.from(merged.values());
}

function normalizeOC(formData) {
  const normalized = Object.fromEntries(Object.entries({ ...INITIAL_OC_FORM, ...formData }).map(([key, value]) => [key, typeof value === "string" ? value : value]));
  normalized.worldType = WORLD_TYPES.includes(normalized.worldType) ? normalized.worldType : "Canon Universe";
  normalized.fandom = getLegacyFandomValue(normalized);
  normalized.ownWorld = normalized.worldType === "Own World";
  return normalized;
}

function migrateOC(oc) {
  const worldType = getMigratedWorldType(oc || {});
  return normalizeOC({
    ...oc,
    id: oc.id || crypto.randomUUID(),
    createdAt: oc.createdAt || new Date().toISOString(),
    updatedAt: oc.updatedAt || oc.lastEditedAt || oc.createdAt || new Date().toISOString(),
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
    pinterestLink: oc.pinterestLink || oc.moodboardLink || "",
    customFields: normalizeCustomFields(oc.customFields),
    customSections: normalizeCustomSections(oc.customSections)
  });
}

function normalizeCustomFields(fields) {
  if (!Array.isArray(fields)) return [];
  return fields
    .filter((field) => field && typeof field === "object")
    .map((field) => ({
      id: field.id || crypto.randomUUID(),
      name: typeof field.name === "string" ? field.name : "",
      value: typeof field.value === "string" ? field.value : ""
    }));
}

function normalizeCustomSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections
    .filter((section) => section && typeof section === "object")
    .map((section) => ({
      id: section.id || crypto.randomUUID(),
      title: typeof section.title === "string" ? section.title : "",
      content: typeof section.content === "string" ? section.content : ""
    }));
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

function getDayFromLegacyDate(date) { return date ? date.split("-")[2] || "" : ""; }
function getMonthFromLegacyDate(date) { return date ? date.split("-")[1] || "" : ""; }
function getYearFromLegacyDate(date) { return date ? date.split("-")[0] || "" : ""; }
