export const RELIABLE_STORY_FORMATS = ["heading", "italic", "bullet", "number"];

export function getFormattingFallback(type) {
  if (type === "heading") return "Heading";
  return "text";
}

export function formatSelection(type, value) {
  const selected = String(value || "");
  if (type === "italic") return `*${selected}*`;
  if (type === "bullet") return selected.split("\n").map((line) => `- ${line || "List item"}`).join("\n");
  if (type === "number") return selected.split("\n").map((line, index) => `${index + 1}. ${line || "List item"}`).join("\n");
  if (type === "heading") return `## ${selected}`;
  return selected;
}
