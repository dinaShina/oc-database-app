import { formatDateTime } from "../../utils/dateFormat.js";
import { useEffect, useMemo, useState } from "react";
import { INITIAL_STORY_ENTRY, STORY_CATEGORIES } from "../../data/writingSchema.js";
import {
  clearRecoveredDraft,
  createWritingEntry,
  deleteWritingEntry,
  getRecoveredDraft,
  getWritingEntries,
  saveRecoveredDraft,
  saveWritingEntries,
  updateWritingEntry
} from "../../storage/writingRepository.js";
import WorkspacePanel from "./WorkspacePanel.jsx";

const AUTOSAVE_LABEL_DELAY = 1400;
const STORY_FONT_OPTIONS = [
  { label: "Notebook", value: "Georgia, 'Times New Roman', serif" },
  { label: "Clean Sans", value: "Inter, Segoe UI, Arial, sans-serif" },
  { label: "Classic Serif", value: "Cambria, Georgia, serif" },
  { label: "Typewriter", value: "'Courier New', Courier, monospace" },
  { label: "System", value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }
];
const STORY_FONT_SIZES = ["15", "16", "18", "20", "22"];

export default function StoryWorkspace({ oc }) {
  const [entries, setEntries] = useState(() => getWritingEntries());
  const [activeCategory, setActiveCategory] = useState("stories");
  const [activeEntryId, setActiveEntryId] = useState("");
  const [saveState, setSaveState] = useState("Saved");
  const [recoveredDraft, setRecoveredDraft] = useState(() => getRecoveredDraft(oc.id));
  const [editorStyle, setEditorStyle] = useState(() => getStoryEditorStyle(oc.id));

  const characterEntries = useMemo(
    () => entries.filter((entry) => entry.connectedOcId === oc.id),
    [entries, oc.id]
  );

  const activeEntries = useMemo(
    () => characterEntries.filter((entry) => entry.category === activeCategory).sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))),
    [activeCategory, characterEntries]
  );

  const activeEntry = entries.find((entry) => entry.id === activeEntryId) || activeEntries[0] || null;
  const customFontFamily = `atlas-story-font-${oc.id}`;
  const editorFontFamily = editorStyle.customFontData ? customFontFamily : editorStyle.fontFamily;
  const stats = getWritingStats(activeEntry?.content || "");

  useEffect(() => {
    if (activeEntryId && activeEntry?.category !== activeCategory) {
      setActiveEntryId("");
    }
  }, [activeCategory, activeEntry, activeEntryId]);

  function persist(nextEntries) {
    const saved = saveWritingEntries(nextEntries);
    if (!saved) {
      setSaveState("Save failed");
      window.alert("Atlas Lore could not save this story locally. Your browser storage may be full or blocked.");
      return false;
    }
    setEntries(nextEntries);
    setSaveState("Autosaved");
    window.clearTimeout(persist.statusTimer);
    persist.statusTimer = window.setTimeout(() => setSaveState("Saved"), AUTOSAVE_LABEL_DELAY);
    return true;
  }

  function createEntry(category = activeCategory, seed = {}) {
    const nextEntry = createWritingEntry({
      ...INITIAL_STORY_ENTRY,
      ...seed,
      title: seed.title || getDefaultTitle(category),
      category,
      connectedOcId: oc.id
    });
    const nextEntries = [nextEntry, ...entries];
    persist(nextEntries);
    clearRecoveredDraft(oc.id);
    setRecoveredDraft(null);
    setActiveCategory(category);
    setActiveEntryId(nextEntry.id);
  }

  function updateActiveEntry(field, value) {
    if (!activeEntry) return;
    const nextEntry = { ...activeEntry, [field]: value };
    const nextEntries = updateWritingEntry(entries, activeEntry.id, nextEntry);
    persist(nextEntries);
    saveRecoveredDraft(oc.id, nextEntry);
  }

  function removeEntry(id) {
    if (!window.confirm("Delete this story entry? This action cannot be undone.")) return;
    const nextEntries = deleteWritingEntry(entries, id);
    persist(nextEntries);
    if (activeEntryId === id) setActiveEntryId("");
  }

  function updateEditorStyle(field, value) {
    setEditorStyle((current) => {
      const next = { ...current, [field]: value };
      saveStoryEditorStyle(oc.id, next);
      return next;
    });
  }

  function restoreDraft() {
    if (!recoveredDraft) return;
    createEntry(recoveredDraft.category || "drafts", recoveredDraft);
  }

  function discardDraft() {
    clearRecoveredDraft(oc.id);
    setRecoveredDraft(null);
  }

  if (characterEntries.length === 0 && !recoveredDraft) {
    return (
      <WorkspacePanel title="Story">
        <section className="story-welcome">
          <p className="eyebrow">Writing Workspace</p>
          <h2>Start your Story</h2>
          <button className="primary-button inline-primary" type="button" onClick={() => createEntry("stories", { title: "" })}>+ New Story</button>
        </section>
      </WorkspacePanel>
    );
  }

  return (
    <WorkspacePanel title="Story">
      <section className="story-workspace">
        <header className="story-toolbar">
          <div>
            <p className="eyebrow">Writing Workspace</p>
            <h3>{activeEntry ? activeEntry.title || "Untitled" : "Start your Story"}</h3>
          </div>
          <div className="story-toolbar-actions">
            <span className="story-save-state">{saveState}</span>
            <button className="primary-button inline-primary" type="button" onClick={() => createEntry(activeCategory, { title: "" })}>+ New Story</button>
          </div>
        </header>

        {recoveredDraft ? (
          <section className="recovery-banner">
            <div>
              <strong>Recovered draft available</strong>
              <p className="muted-text">A browser recovery copy exists for {recoveredDraft.title || "Untitled"}.</p>
            </div>
            <div className="card-actions">
              <button className="secondary-button" type="button" onClick={restoreDraft}>Restore</button>
              <button className="delete-button" type="button" onClick={discardDraft}>Discard</button>
            </div>
          </section>
        ) : null}

        <nav className="story-tabs" aria-label="Story categories">
          {STORY_CATEGORIES.map((category) => (
            <button className={activeCategory === category.id ? "story-tab active" : "story-tab"} key={category.id} type="button" onClick={() => setActiveCategory(category.id)}>
              <span>{category.label}</span>
              <small>{characterEntries.filter((entry) => entry.category === category.id).length}</small>
            </button>
          ))}
        </nav>

        <div className="story-layout">
          <aside className="story-entry-list">
            <div className="story-list-heading">
              <strong>{STORY_CATEGORIES.find((category) => category.id === activeCategory)?.label}</strong>
              <p className="muted-text">{STORY_CATEGORIES.find((category) => category.id === activeCategory)?.description}</p>
            </div>
            {activeEntries.length === 0 ? (
              <button className="empty-story-button" type="button" onClick={() => createEntry(activeCategory, { title: "" })}>+ Add {getSingularLabel(activeCategory)}</button>
            ) : activeEntries.map((entry) => (
              <button className={activeEntry?.id === entry.id ? "story-entry-card active" : "story-entry-card"} key={entry.id} type="button" onClick={() => setActiveEntryId(entry.id)}>
                <strong>{entry.title || "Untitled"}</strong>
                {entry.subtitle ? <span>{entry.subtitle}</span> : null}
                <small>{formatEditedDate(entry.updatedAt)}</small>
              </button>
            ))}
          </aside>

          {activeEntry ? (
            <section className="writing-editor" aria-label="Story editor">
              {editorStyle.customFontData ? <style>{`@font-face { font-family: "${customFontFamily}"; src: url("${editorStyle.customFontData}"); }`}</style> : null}
              <input className="writing-title-input" value={activeEntry.title} placeholder="Title" onChange={(event) => updateActiveEntry("title", event.target.value)} />
              <input className="writing-subtitle-input" value={activeEntry.subtitle} placeholder="Optional subtitle" onChange={(event) => updateActiveEntry("subtitle", event.target.value)} />
              <StoryFormatToolbar
                editorStyle={editorStyle}
                onStyleChange={updateEditorStyle}
              />
              <textarea
                className="writing-area"
                style={{ fontFamily: editorFontFamily, fontSize: `${editorStyle.fontSize}px` }}
                value={activeEntry.content}
                placeholder="Write here..."
                onChange={(event) => updateActiveEntry("content", event.target.value)}
              />

              <footer className="writing-stats">
                <span>{stats.words} words</span>
                <span>{stats.characters} characters</span>
                <span>{stats.readingTime} min read</span>
                <span>Last edited {formatEditedDate(activeEntry.updatedAt)}</span>
              </footer>

              <details className="future-story-tools">
                <summary>Future tools prepared</summary>
                <div className="prepared-grid compact-prepared-grid">
                  {['Chapters', 'Scene ordering', 'Comments', 'AI writing assistant', 'Spell checking', 'Export to PDF', 'Export to DOCX'].map((item) => <article className="prepared-card" key={item}><h3>{item}</h3></article>)}
                </div>
              </details>

              <div className="card-actions">
                <button className="delete-button" type="button" onClick={() => removeEntry(activeEntry.id)}>Delete</button>
              </div>
            </section>
          ) : (
            <section className="story-welcome compact-welcome">
              <h2>Start your Story</h2>
              <button className="primary-button inline-primary" type="button" onClick={() => createEntry(activeCategory, { title: "" })}>+ New Story</button>
            </section>
          )}
        </div>
      </section>
    </WorkspacePanel>
  );
}

function StoryFormatToolbar({ editorStyle, onStyleChange }) {
  return (
    <div className="story-format-toolbar" aria-label="Story style toolbar">
      <label className="compact-tool-field">
        <span>Font</span>
        <select value={editorStyle.fontFamily} onChange={(event) => onStyleChange("fontFamily", event.target.value)}>
          {STORY_FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
        </select>
      </label>
      <label className="compact-tool-field size-tool-field">
        <span>Size</span>
        <select value={editorStyle.fontSize} onChange={(event) => onStyleChange("fontSize", event.target.value)}>
          {STORY_FONT_SIZES.map((size) => <option key={size} value={size}>{size}px</option>)}
        </select>
      </label>
    </div>
  );
}

function getStoryEditorStyle(ocId) {
  try {
    const saved = window.localStorage.getItem(`atlas-story-editor-style-${ocId}`);
    return saved ? { ...getDefaultStoryEditorStyle(), ...JSON.parse(saved) } : getDefaultStoryEditorStyle();
  } catch (error) {
    return getDefaultStoryEditorStyle();
  }
}

function saveStoryEditorStyle(ocId, value) {
  try {
    window.localStorage.setItem(`atlas-story-editor-style-${ocId}`, JSON.stringify(value));
  } catch (error) {
    console.warn("Could not save story editor style", error);
  }
}

function getDefaultStoryEditorStyle() {
  return { customFontData: "", customFontName: "", fontFamily: STORY_FONT_OPTIONS[0].value, fontSize: "18" };
}
function getWritingStats(content) {
  const trimmed = content.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const characters = content.length;
  const readingTime = Math.max(1, Math.ceil(words / 220));
  return { words, characters, readingTime };
}

function getDefaultTitle(category) {
  if (category === "scenes") return "Untitled Scene";
  if (category === "drafts") return "Untitled Draft";
  if (category === "notes") return "Untitled Note";
  return "Untitled Story";
}

function getSingularLabel(category) {
  if (category === "scenes") return "Scene";
  if (category === "drafts") return "Draft";
  if (category === "notes") return "Story Note";
  return "Story";
}

function formatEditedDate(value) {
  if (!value) return "never";
  return formatDateTime(value);
}







