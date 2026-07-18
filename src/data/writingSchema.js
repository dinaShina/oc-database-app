export const STORY_CATEGORIES = [
  { id: "stories", label: "Stories", description: "Completed or ongoing stories." },
  { id: "scenes", label: "Scenes", description: "Small scenes that can later be moved into stories." },
  { id: "drafts", label: "Drafts", description: "Unfinished ideas and incomplete writing." },
  { id: "notes", label: "Story Notes", description: "Ideas, dialogue, planning, reminders and brainstorming." }
];

export const INITIAL_STORY_ENTRY = {
  title: "",
  subtitle: "",
  content: "",
  category: "stories",
  connectedOcId: "",
  chapterIds: [],
  sceneOrder: [],
  comments: [],
  aiAssistantNotes: "",
  spellCheckLanguage: "",
  exportSettings: {
    pdf: {},
    docx: {}
  }
};

export const WRITING_ENTRY_TYPES = [
  "story",
  "scene",
  "draft",
  "story note",
  "chapter"
];

export const WRITING_STATUS_OPTIONS = [
  "idea",
  "outline",
  "drafting",
  "revising",
  "complete",
  "paused"
];

export const WRITING_ENTRY_EXAMPLE = {
  id: "writing-entry-1",
  type: "scene",
  category: "scenes",
  title: "Example Scene",
  subtitle: "",
  status: "idea",
  worldId: "",
  connectedOcId: "oc-1",
  chapterId: "",
  order: 0,
  summary: "",
  content: "",
  draftText: "",
  notes: "",
  connectedOcIds: [],
  connectedPlaceIds: [],
  connectedLoreEntryIds: [],
  connectedTimelineEventIds: [],
  tags: [],
  createdAt: "",
  updatedAt: ""
};

export const FUTURE_STORY_FEATURES = [
  "Chapters",
  "Scene ordering",
  "Comments",
  "AI writing assistant",
  "Spell checking",
  "Export to PDF",
  "Export to DOCX"
];
