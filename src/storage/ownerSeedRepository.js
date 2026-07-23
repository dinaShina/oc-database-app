import { OWNER_CHARACTERS, OWNER_INSPIRATION_ITEMS, OWNER_RELATIONSHIPS, OWNER_SEED_TOKEN, OWNER_TIMELINE_EVENTS, OWNER_TIMELINES, OWNER_WORLDS, OWNER_WRITING_ENTRIES } from "../data/ownerCharacters.js";
import { getInspirationItems, saveInspirationItems } from "./inspirationRepository.js";
import { loadFromStorage, saveToStorage } from "./localStorage.js";
import { getWritingEntries, saveWritingEntries } from "./writingRepository.js";

export const OWNER_SEED_MODE_KEY = "atlasArchive.ownerSeedMode";
export const OWNER_SEED_RESTORE_KEY = "atlasArchive.ownerSeedRestores";
export const OWNER_SEED_INSTALLED_KEY = "atlasArchive.ownerSeedInstalled";

export function enableOwnerSeedModeFromUrl() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search || "");
  const enabledForThisLoad = Boolean(OWNER_SEED_TOKEN) && params.get("owner") === OWNER_SEED_TOKEN;
  if (!enabledForThisLoad) {
    saveToStorage(OWNER_SEED_MODE_KEY, { enabled: false, disabledAt: new Date().toISOString(), reason: "Seed restore requires an explicit owner URL token." });
    return false;
  }
  saveToStorage(OWNER_SEED_MODE_KEY, { enabled: true, enabledAt: new Date().toISOString(), scope: "current-url-token" });
  return true;
}

export function isOwnerSeedModeEnabled() {
  const value = loadFromStorage(OWNER_SEED_MODE_KEY, { enabled: false });
  return Boolean(value?.enabled);
}

export function shouldInstallOwnerSeeds() {
  return hasOwnerSeedData() && !loadFromStorage(OWNER_SEED_INSTALLED_KEY, null)?.installed;
}

export function markOwnerSeedsInstalled(result = {}) {
  saveToStorage(OWNER_SEED_INSTALLED_KEY, {
    installed: true,
    installedAt: new Date().toISOString(),
    result: summarizeResult(result)
  });
}

export function restoreMissingOwnerSeeds({ inspirationItems = getInspirationItems(), ocs, relationships, timelineData, worlds, writingEntries = getWritingEntries() }) {
  const nextOCs = mergeMissingById(ocs, OWNER_CHARACTERS);
  const nextWorlds = mergeMissingById(worlds, OWNER_WORLDS);
  const nextRelationships = mergeMissingById(relationships, OWNER_RELATIONSHIPS);
  const nextInspirationItems = mergeMissingById(inspirationItems, OWNER_INSPIRATION_ITEMS);
  const nextWritingEntries = mergeMissingById(writingEntries, OWNER_WRITING_ENTRIES);
  const nextTimelineData = {
    timelines: mergeMissingById(timelineData.timelines || [], OWNER_TIMELINES),
    events: mergeMissingById(timelineData.events || [], OWNER_TIMELINE_EVENTS)
  };

  const result = {
    ocs: nextOCs,
    worlds: nextWorlds,
    relationships: nextRelationships,
    inspirationItems: nextInspirationItems,
    writingEntries: nextWritingEntries,
    timelineData: nextTimelineData,
    addedCharacters: nextOCs.length - ocs.length,
    addedWorlds: nextWorlds.length - worlds.length,
    addedRelationships: nextRelationships.length - relationships.length,
    addedInspirationItems: nextInspirationItems.length - inspirationItems.length,
    addedWritingEntries: nextWritingEntries.length - writingEntries.length,
    addedTimelines: nextTimelineData.timelines.length - (timelineData.timelines || []).length,
    addedTimelineEvents: nextTimelineData.events.length - (timelineData.events || []).length
  };

  saveWritingEntries(nextWritingEntries);
  saveInspirationItems(nextInspirationItems);

  const history = loadFromStorage(OWNER_SEED_RESTORE_KEY, []);
  saveToStorage(OWNER_SEED_RESTORE_KEY, [{ restoredAt: new Date().toISOString(), result: summarizeResult(result) }, ...history].slice(0, 10));
  return result;
}

function hasOwnerSeedData() {
  return [
    OWNER_CHARACTERS,
    OWNER_WORLDS,
    OWNER_RELATIONSHIPS,
    OWNER_INSPIRATION_ITEMS,
    OWNER_WRITING_ENTRIES,
    OWNER_TIMELINES,
    OWNER_TIMELINE_EVENTS
  ].some((items) => Array.isArray(items) && items.length > 0);
}
function mergeMissingById(currentItems = [], seedItems = []) {
  const existingIds = new Set(currentItems.map((item) => item?.id).filter(Boolean));
  const missing = seedItems.filter((item) => item?.id && !existingIds.has(item.id)).map(cloneSeed);
  return [...currentItems, ...missing];
}

function cloneSeed(item) {
  return JSON.parse(JSON.stringify(item));
}

function summarizeResult(result) {
  return {
    addedCharacters: result.addedCharacters || 0,
    addedWorlds: result.addedWorlds || 0,
    addedRelationships: result.addedRelationships || 0,
    addedTimelines: result.addedTimelines || 0,
    addedTimelineEvents: result.addedTimelineEvents || 0,
    addedInspirationItems: result.addedInspirationItems || 0,
    addedWritingEntries: result.addedWritingEntries || 0
  };
}
