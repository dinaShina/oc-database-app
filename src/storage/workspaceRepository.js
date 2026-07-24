import { loadFromStorage, saveToStorage } from "./localStorage.js";

const STORAGE_KEY = "oc-database-app:workspace-configs";
const ACTIVE_TAB_KEY = "oc-database-app:active-workspace-tabs";

export const DEFAULT_WORKSPACE_SECTIONS = [
  { id: "Profile", label: "Profile", visible: true },
  { id: "World", label: "World", visible: true },
  { id: "Network", label: "Character Network", visible: true },
  { id: "Timeline", label: "Timeline", visible: true },
  { id: "Story", label: "Story", visible: true },
  { id: "Inspiration", label: "Inspiration", visible: true },
  { id: "Appearance", label: "Customize", visible: true },
  { id: "Settings", label: "Settings", visible: true }
];

export function getWorkspaceConfigs() {
  const stored = loadFromStorage(STORAGE_KEY, {});
  return normalizeConfigs(stored);
}

export function saveWorkspaceConfigs(configs) {
  return saveToStorage(STORAGE_KEY, normalizeConfigs(configs));
}

export function getWorkspaceConfigForOC(configs, ocId) {
  return normalizeSectionList(configs?.[ocId]?.sections || DEFAULT_WORKSPACE_SECTIONS);
}

export function updateWorkspaceConfigForOC(configs, ocId, sections) {
  return normalizeConfigs({
    ...configs,
    [ocId]: {
      ocId,
      sections: normalizeSectionList(sections),
      updatedAt: new Date().toISOString()
    }
  });
}

export function resetWorkspaceConfigForOC(configs, ocId) {
  return updateWorkspaceConfigForOC(configs, ocId, DEFAULT_WORKSPACE_SECTIONS);
}

export function getActiveWorkspaceTab(ocId) {
  const stored = loadFromStorage(ACTIVE_TAB_KEY, {});
  const tab = stored?.[ocId];
  return isKnownSection(tab) ? tab : "Profile";
}

export function saveActiveWorkspaceTab(ocId, tab) {
  if (!isKnownSection(tab)) return;
  const stored = loadFromStorage(ACTIVE_TAB_KEY, {});
  return saveToStorage(ACTIVE_TAB_KEY, { ...stored, [ocId]: tab });
}

function normalizeConfigs(configs) {
  if (!configs || typeof configs !== "object" || Array.isArray(configs)) return {};
  return Object.fromEntries(
    Object.entries(configs).map(([ocId, config]) => [
      ocId,
      {
        ocId,
        sections: normalizeSectionList(config?.sections || DEFAULT_WORKSPACE_SECTIONS),
        updatedAt: config?.updatedAt || ""
      }
    ])
  );
}

export function normalizeSectionList(sections) {
  const incoming = Array.isArray(sections) ? sections : [];
  const byId = new Map(incoming.map((section) => [section.id, section]));
  const ordered = incoming
    .filter((section) => isKnownSection(section.id))
    .map((section) => ({
      id: section.id,
      label: DEFAULT_WORKSPACE_SECTIONS.find((item) => item.id === section.id)?.label || section.label || section.id,
      visible: section.visible !== false
    }));

  DEFAULT_WORKSPACE_SECTIONS.forEach((section) => {
    if (!byId.has(section.id) && !ordered.some((item) => item.id === section.id)) ordered.push(section);
  });

  return ordered;
}

function isKnownSection(sectionId) {
  return DEFAULT_WORKSPACE_SECTIONS.some((section) => section.id === sectionId);
}

