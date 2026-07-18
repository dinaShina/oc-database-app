export const CONSISTENCY_WARNING_TYPES = [
  "missing-birth-year",
  "missing-birthdate",
  "missing-world",
  "duplicate-name",
  "timeline-before-birth",
  "event-before-birthdate",
  "same-oc-same-time-different-place",
  "contradictory-appearance-details",
  "relationship-without-label",
  "relationship-node-without-name",
  "oc-connected-to-wrong-world",
  "missing-backstory",
  "missing-personality",
  "lore-entry-without-world",
  "place-without-world",
  "scene-without-summary"
];

export const CONSISTENCY_SEVERITIES = ["info", "warning", "error"];

export const CONSISTENCY_WARNING_EXAMPLE = {
  id: "warning-1",
  type: "duplicate-name",
  severity: "info",
  message: "Two OCs use the same name.",
  relatedIds: ["oc-1", "oc-2"],
  module: "ocs",
  createdAt: ""
};

export const FUTURE_CONSISTENCY_CHECKS = [
  "Warn when an OC is missing a birth year.",
  "Warn when multiple OCs have the same or very similar names.",
  "Warn when a timeline event happens before a character's birth.",
  "Warn when appearance fields contradict each other.",
  "Warn when relationship lines have no label.",
  "Warn when an OC is connected to a world that does not match the event, place, or lore entry."
];
