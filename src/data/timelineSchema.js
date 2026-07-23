export const TIMELINE_TYPES = ["Character Timeline", "World Timeline", "Story Timeline"];

export const TIMELINE_EVENT_TYPES = [
  "birth",
  "death",
  "family history",
  "prophecy",
  "ancestor event",
  "war",
  "kingdom",
  "revolution",
  "disaster",
  "discovery",
  "political change",
  "magical event",
  "relationship",
  "travel",
  "chapter",
  "scene",
  "turning point",
  "legacy",
  "custom"
];

export const BIRTH_RELATIVE_OPTIONS = ["not specified", "before birth", "after birth", "after death"];

export const INITIAL_TIMELINE = {
  title: "",
  type: "Character Timeline",
  connectedOcId: "",
  connectedWorld: "",
  description: "",
  notes: ""
};

export const INITIAL_TIMELINE_EVENT = {
  title: "",
  description: "",
  dateDay: "",
  dateMonth: "",
  dateYear: "",
  dateFull: "",
  dateInput: "",
  time: "",
  birthRelative: "not specified",
  connectedCharacterIds: [],
  connectedLocations: "",
  connectedOrganizations: "",
  connectedObjects: "",
  connectedWorld: "",
  eventType: "turning point",
  chapterTitle: "",
  sceneTitle: "",
  notes: ""
};

export const TIMELINE_EVENT_EXAMPLE = {
  id: "timeline-event-1",
  timelineId: "timeline-1",
  order: 0,
  title: "Example event",
  description: "",
  dateDay: "",
  dateMonth: "",
  dateYear: "",
  dateFull: "",
  dateInput: "",
  time: "",
  birthRelative: "after birth",
  connectedCharacterIds: ["oc-1"],
  connectedLocations: "",
  connectedOrganizations: "",
  connectedObjects: "",
  connectedWorld: "",
  eventType: "turning point",
  chapterTitle: "",
  sceneTitle: "",
  notes: "",
  createdAt: "",
  updatedAt: ""
};

export const FUTURE_TIMELINE_CHECKS = [
  "Warn if an event happens before an OC's birthdate unless it is marked before birth.",
  "Calculate OC age during an event when birth year exists.",
  "Warn if the same OC is in two places at the same time.",
  "Warn if timeline dates contradict each other.",
  "Warn if a Story Timeline scene references an OC or location from the wrong world."
];
