import { INITIAL_STORY_ENTRY } from "../data/writingSchema.js";
import { loadFromStorage, removeFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:writing-entries";
const DRAFT_PREFIX = "oc-database-app:story-draft:";

export function getWritingEntries() {
  const entries = loadFromStorage(STORAGE_KEY, []);
  return Array.isArray(entries) ? entries.map(normalizeWritingEntry) : [];
}

export function saveWritingEntries(entries) {
  return saveToStorage(STORAGE_KEY, Array.isArray(entries) ? entries.map(normalizeWritingEntry) : []);
}

export function createWritingEntry(formData) {
  const now = new Date().toISOString();
  return {
    ...normalizeWritingEntry(formData),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now
  };
}

export function updateWritingEntry(entries, id, formData) {
  return entries.map((entry) =>
    entry.id === id
      ? {
          ...entry,
          ...normalizeWritingEntry(formData),
          id: entry.id,
          createdAt: entry.createdAt,
          updatedAt: new Date().toISOString()
        }
      : entry
  );
}

export function deleteWritingEntry(entries, id) {
  return entries.filter((entry) => entry.id !== id);
}

export function saveRecoveredDraft(ocId, draft) {
  return saveToStorage(`${DRAFT_PREFIX}${ocId}`, draft);
}

export function getRecoveredDraft(ocId) {
  return loadFromStorage(`${DRAFT_PREFIX}${ocId}`, null);
}

export function clearRecoveredDraft(ocId) {
  removeFromStorage(`${DRAFT_PREFIX}${ocId}`);
}

function normalizeWritingEntry(entry) {
  const content = keepText(entry.content ?? entry.draftText);
  const category = cleanToken(entry.category) || mapTypeToCategory(entry.type);

  return {
    ...INITIAL_STORY_ENTRY,
    ...entry,
    title: keepText(entry.title),
    subtitle: keepText(entry.subtitle),
    content,
    draftText: content,
    category,
    type: mapCategoryToType(category),
    connectedOcId: cleanToken(entry.connectedOcId),
    notes: keepText(entry.notes),
    summary: keepText(entry.summary),
    chapterIds: Array.isArray(entry.chapterIds) ? entry.chapterIds : [],
    sceneOrder: Array.isArray(entry.sceneOrder) ? entry.sceneOrder : [],
    comments: Array.isArray(entry.comments) ? entry.comments : [],
    connectedOcIds: Array.isArray(entry.connectedOcIds) ? entry.connectedOcIds : [],
    connectedPlaceIds: Array.isArray(entry.connectedPlaceIds) ? entry.connectedPlaceIds : [],
    connectedLoreEntryIds: Array.isArray(entry.connectedLoreEntryIds) ? entry.connectedLoreEntryIds : [],
    connectedTimelineEventIds: Array.isArray(entry.connectedTimelineEventIds) ? entry.connectedTimelineEventIds : [],
    tags: Array.isArray(entry.tags) ? entry.tags : []
  };
}

function mapCategoryToType(category) {
  if (category === "stories") return "story";
  if (category === "scenes") return "scene";
  if (category === "drafts") return "draft";
  if (category === "notes") return "story note";
  return "story";
}

function mapTypeToCategory(type) {
  if (type === "scene") return "scenes";
  if (type === "draft") return "drafts";
  if (type === "writing note" || type === "story note") return "notes";
  return "stories";
}

function keepText(value) {
  return typeof value === "string" ? value : "";
}

function cleanToken(value) {
  return typeof value === "string" ? value.trim() : "";
}

