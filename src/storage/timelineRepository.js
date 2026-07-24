import { INITIAL_TIMELINE, INITIAL_TIMELINE_EVENT } from "../data/timelineSchema.js";
import { normalizeMonthInput, parseFlexibleDateInput, toIsoDate } from "../utils/dateFormat.js";
import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:timelines";
const EMPTY_DATA = { timelines: [], events: [] };

export function getTimelineData() {
  const data = loadFromStorage(STORAGE_KEY, EMPTY_DATA);
  return {
    timelines: Array.isArray(data.timelines) ? data.timelines.map(normalizeTimeline) : [],
    events: Array.isArray(data.events) ? data.events.map(normalizeEvent) : []
  };
}

export function saveTimelineData(data) {
  return saveToStorage(STORAGE_KEY, {
    timelines: Array.isArray(data.timelines) ? data.timelines.map(normalizeTimeline) : [],
    events: Array.isArray(data.events) ? data.events.map(normalizeEvent) : []
  });
}

export function createTimeline(formData) {
  const now = new Date().toISOString();
  return {
    ...normalizeTimeline(formData),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now
  };
}

export function updateTimeline(timelines, id, formData) {
  return timelines.map((timeline) =>
    timeline.id === id
      ? { ...timeline, ...normalizeTimeline(formData), id: timeline.id, createdAt: timeline.createdAt, updatedAt: new Date().toISOString() }
      : timeline
  );
}

export function deleteTimeline(data, id) {
  return {
    timelines: data.timelines.filter((timeline) => timeline.id !== id),
    events: data.events.filter((event) => event.timelineId !== id)
  };
}

export function createTimelineEvent(timelineId, formData, order) {
  const now = new Date().toISOString();
  return {
    ...normalizeEvent(formData),
    id: crypto.randomUUID(),
    timelineId,
    order,
    createdAt: now,
    updatedAt: now
  };
}

export function updateTimelineEvent(events, id, formData) {
  return events.map((event) =>
    event.id === id
      ? { ...event, ...normalizeEvent(formData), id: event.id, timelineId: event.timelineId, order: event.order, createdAt: event.createdAt, updatedAt: new Date().toISOString() }
      : event
  );
}

export function deleteTimelineEvent(events, id) {
  return events.filter((event) => event.id !== id);
}

export function reorderTimelineEvents(events, timelineId, draggedId, targetId) {
  if (draggedId === targetId) return events;

  const otherEvents = events.filter((event) => event.timelineId !== timelineId);
  const timelineEvents = events
    .filter((event) => event.timelineId === timelineId)
    .sort((a, b) => a.order - b.order);
  const dragged = timelineEvents.find((event) => event.id === draggedId);
  if (!dragged) return events;

  const withoutDragged = timelineEvents.filter((event) => event.id !== draggedId);
  const targetIndex = withoutDragged.findIndex((event) => event.id === targetId);
  const nextIndex = targetIndex >= 0 ? targetIndex : withoutDragged.length;
  withoutDragged.splice(nextIndex, 0, dragged);

  return [
    ...otherEvents,
    ...withoutDragged.map((event, index) => ({ ...event, order: index, updatedAt: new Date().toISOString() }))
  ];
}

export function deleteTimelineReferencesForOC(data, ocId) {
  return {
    timelines: data.timelines.filter((timeline) => timeline.connectedOcId !== ocId),
    events: data.events.map((event) => ({
      ...event,
      connectedCharacterIds: event.connectedCharacterIds.filter((id) => id !== ocId)
    }))
  };
}

function normalizeTimeline(timeline) {
  return {
    ...INITIAL_TIMELINE,
    ...timeline,
    title: keepText(timeline.title),
    description: keepText(timeline.description),
    connectedOcId: cleanToken(timeline.connectedOcId),
    connectedWorld: keepText(timeline.connectedWorld),
    type: cleanToken(timeline.type) || INITIAL_TIMELINE.type,
    notes: keepText(timeline.notes)
  };
}

function normalizeEvent(event) {
  const parsedDateInput = parseFlexibleDateInput(event.dateInput || event.dateFull);
  const normalizedMonth = normalizeMonthInput(event.dateMonth);
  const connectedCharacterIds = Array.isArray(event.connectedCharacterIds) ? event.connectedCharacterIds : [];

  return {
    ...INITIAL_TIMELINE_EVENT,
    ...event,
    title: keepText(event.title),
    description: keepText(event.description),
    dateDay: parsedDateInput?.day || cleanToken(event.dateDay),
    dateMonth: parsedDateInput?.month || normalizedMonth || cleanToken(event.dateMonth),
    dateYear: parsedDateInput?.year || cleanToken(event.dateYear),
    dateFull: parsedDateInput ? toIsoDate(parsedDateInput) : cleanToken(event.dateFull),
    dateInput: keepText(event.dateInput),
    time: cleanToken(event.time),
    connectedCharacterIds,
    connectedLocations: keepText(event.connectedLocations),
    connectedOrganizations: keepText(event.connectedOrganizations),
    connectedObjects: keepText(event.connectedObjects),
    connectedWorld: keepText(event.connectedWorld),
    chapterTitle: keepText(event.chapterTitle),
    sceneTitle: keepText(event.sceneTitle),
    notes: keepText(event.notes),
    order: Number.isFinite(Number(event.order)) ? Number(event.order) : 0
  };
}

function keepText(value) {
  return typeof value === "string" ? value : "";
}

function cleanToken(value) {
  return typeof value === "string" ? value.trim() : "";
}
