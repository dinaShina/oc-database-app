import { useMemo, useState } from "react";
import EmptyState from "./EmptyState.jsx";
import MediaInput from "./MediaInput.jsx";
import TimelineEditor from "./TimelineEditor.jsx";
import {
  INITIAL_WORLD,
  INITIAL_WORLD_DETAIL,
  INITIAL_WORLD_REFERENCE,
  WORLD_DETAIL_CATEGORIES,
  WORLD_REFERENCE_TYPES,
  WORLD_TYPES
} from "../data/worldSchema.js";
import { createWorld, deleteWorld, duplicateWorldRecord, saveWorlds, updateWorld } from "../storage/worldRepository.js";
import { saveTimelineData } from "../storage/timelineRepository.js";
import { getWorldTitle } from "./OCList.jsx";

export default function WorldLibrary({ ocs, onTimelineDataChange, onWorldsChange, timelineData, worlds }) {
  const [formData, setFormData] = useState(INITIAL_WORLD);
  const [editingId, setEditingId] = useState(null);
  const [showWorldForm, setShowWorldForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeWorldId, setActiveWorldId] = useState("");
  const [pendingDeleteWorld, setPendingDeleteWorld] = useState(null);

  const summaries = buildWorldSummaries(ocs, timelineData, worlds);
  const visibleWorlds = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return summaries;
    return summaries.filter((world) => `${world.name} ${world.worldType} ${world.description}`.toLowerCase().includes(query));
  }, [searchTerm, summaries]);
  const activeWorld = worlds.find((world) => world.id === activeWorldId);

  function persist(nextWorlds) {
    saveWorlds(nextWorlds);
    onWorldsChange(nextWorlds);
  }

  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setFormData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updateCover({ data, url }) {
    setFormData((current) => ({ ...current, coverImageData: data, coverImageUrl: url }));
  }

  function submit(event) {
    event.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) {
      const previousWorld = worlds.find((world) => world.id === editingId);
      persist(updateWorld(worlds, editingId, formData));
      syncWorldTimelineName(previousWorld?.name, formData.name);
    } else {
      persist([createWorld(formData), ...worlds]);
    }

    closeForm();
  }

  function startCreate() {
    setEditingId(null);
    setFormData(INITIAL_WORLD);
    setShowWorldForm(true);
  }

  function startEdit(world) {
    const savedWorld = ensureSavedWorld(world);
    setEditingId(savedWorld.id);
    setFormData({ ...INITIAL_WORLD, ...savedWorld });
    setShowWorldForm(true);
  }

  function closeForm() {
    setEditingId(null);
    setFormData(INITIAL_WORLD);
    setShowWorldForm(false);
  }

  function toggleFavorite(world) {
    const savedWorld = ensureSavedWorld(world);
    persist(updateWorld(getLatestWorlds(savedWorld), savedWorld.id, { ...savedWorld, isFavorite: !savedWorld.isFavorite }));
  }

  function openWorld(world) {
    const savedWorld = ensureSavedWorld(world);
    setActiveWorldId(savedWorld.id);
  }

  function ensureSavedWorld(world) {
    if (world.id) return worlds.find((item) => item.id === world.id) || world;
    const nextWorld = createWorld({ name: world.name, worldType: world.worldType, description: world.description || "" });
    persist([nextWorld, ...worlds]);
    return nextWorld;
  }

  function getLatestWorlds(savedWorld) {
    return worlds.some((world) => world.id === savedWorld.id) ? worlds : [savedWorld, ...worlds];
  }

  function updateActiveWorld(nextWorld) {
    persist(updateWorld(worlds, nextWorld.id, nextWorld));
  }

  function syncWorldTimelineName(previousName, nextName) {
    const oldName = String(previousName || "").trim();
    const newName = String(nextName || "").trim();
    if (!oldName || !newName || oldName === newName) return;

    const nextTimelineData = {
      timelines: timelineData.timelines.map((timeline) => timeline.connectedWorld === oldName ? { ...timeline, connectedWorld: newName, updatedAt: new Date().toISOString() } : timeline),
      events: timelineData.events.map((event) => event.connectedWorld === oldName ? { ...event, connectedWorld: newName, updatedAt: new Date().toISOString() } : event)
    };
    saveTimelineData(nextTimelineData);
    onTimelineDataChange(nextTimelineData);
  }

  function duplicateWorld(world) {
    const savedWorld = ensureSavedWorld(world);
    const nextWorld = duplicateWorldRecord(savedWorld);
    const duplicatedTimelineData = duplicateWorldTimelineData(savedWorld.name, nextWorld.name, timelineData);
    persist([nextWorld, ...getLatestWorlds(savedWorld)]);
    if (duplicatedTimelineData !== timelineData) {
      saveTimelineData(duplicatedTimelineData);
      onTimelineDataChange(duplicatedTimelineData);
    }
    setActiveWorldId(nextWorld.id);
  }

  function requestDeleteWorld(world) {
    if (!world?.id) return;
    setPendingDeleteWorld(world);
  }

  function confirmDeleteWorld() {
    if (!pendingDeleteWorld?.id) return;
    persist(deleteWorld(worlds, pendingDeleteWorld.id));
    if (activeWorldId === pendingDeleteWorld.id) setActiveWorldId("");
    setPendingDeleteWorld(null);
  }

  if (activeWorld) {
    return (
      <>
        <WorldWikiPage onBack={() => setActiveWorldId("")} onDelete={() => requestDeleteWorld(activeWorld)} onDuplicate={() => duplicateWorld(activeWorld)} onEdit={() => startEdit(activeWorld)} onTimelineDataChange={onTimelineDataChange} onUpdateWorld={updateActiveWorld} ocs={ocs} timelineData={timelineData} world={activeWorld} />
        <DeleteWorldDialog onCancel={() => setPendingDeleteWorld(null)} onDelete={confirmDeleteWorld} open={Boolean(pendingDeleteWorld)} world={pendingDeleteWorld} />
      </>
    );
  }

  return (
    <section className="panel list-panel world-library-panel library-page-panel">
      <div className="library-topbar library-topbar-integrated">
        <div>
          <p className="eyebrow">Worlds</p>
          <h2>World Library</h2>
          <p className="muted-text">Browse your worlds as expandable worldbuilding wikis.</p>
        </div>
        <button className="primary-button inline-primary library-create-button" type="button" onClick={startCreate}>+ New World</button>
      </div>

      <div className="list-controls library-controls compact-library-controls">
        <label className="filter-field wide-field">
          <span>Search worlds</span>
          <input value={searchTerm} placeholder="Search by name, type, or description..." onChange={(event) => setSearchTerm(event.target.value)} />
        </label>
      </div>

      <div className="world-grid spacious-world-grid wiki-world-grid">
        {visibleWorlds.length === 0 ? <EmptyState actionLabel="Create your first world" icon="world" title="No worlds yet." message="Create a world to give your characters a place to belong." onAction={startCreate} /> : visibleWorlds.map((world) => (
          <article className="world-card spacious-world-card polished-world-card wiki-world-card" key={world.key} onClick={() => openWorld(world)}>
            <WorldCover world={world} />
            <div><h3>{world.name}</h3><p className="muted-text">{world.worldType}</p></div>
            <p className="world-card-description">{getShortDescription(world.description)}</p>
            <div className="card-actions" onClick={(event) => event.stopPropagation()}>
              <button className="secondary-button" type="button" onClick={() => openWorld(world)}>Open</button>
              <button className="secondary-button" type="button" onClick={() => startEdit(world)}>Edit</button>
              <button className="secondary-button" type="button" onClick={() => toggleFavorite(world)}>{world.isFavorite ? "Unfavorite" : "Favorite"}</button>
              <button className="secondary-button" type="button" onClick={() => duplicateWorld(world)}>Duplicate</button>
              {world.id ? <button className="delete-button" type="button" onClick={() => requestDeleteWorld(world)}>Delete</button> : null}
            </div>
          </article>
        ))}
      </div>

      <DeleteWorldDialog onCancel={() => setPendingDeleteWorld(null)} onDelete={confirmDeleteWorld} open={Boolean(pendingDeleteWorld)} world={pendingDeleteWorld} />

      {showWorldForm ? (
        <div className="dialog-backdrop" role="presentation">
          <form className="large-modal" role="dialog" aria-modal="true" aria-labelledby="world-form-title" onSubmit={submit}>
            <div className="modal-heading-row"><div><p className="eyebrow">Worlds</p><h2 id="world-form-title">{editingId ? "Edit World" : "New World"}</h2></div><button className="icon-close-button" type="button" onClick={closeForm} aria-label="Close">x</button></div>
            <label className="field"><span>Name</span><input name="name" value={formData.name} onChange={updateField} /></label>
            <label className="field"><span>World Type</span><select name="worldType" value={formData.worldType} onChange={updateField}>{!WORLD_TYPES.includes(formData.worldType) && formData.worldType ? <option value={formData.worldType}>{formData.worldType}</option> : null}{WORLD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <MediaInput label="Cover image" dataValue={formData.coverImageData} urlValue={formData.coverImageUrl} onChange={updateCover} />
            <label className="field"><span>Description</span><textarea name="description" value={formData.description} rows="4" onChange={updateField} /></label>
            <label className="field"><span>Notes</span><textarea name="notes" value={formData.notes} rows="4" onChange={updateField} /></label>
            <label className="inline-check"><input name="isFavorite" type="checkbox" checked={formData.isFavorite} onChange={updateField} /><span>Favorite world</span></label>
            <div className="form-actions horizontal-actions"><button className="secondary-button" type="button" onClick={closeForm}>Cancel</button><button className="primary-button inline-primary" type="submit">{editingId ? "Save world" : "Add world"}</button></div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function WorldWikiPage({ ocs, onBack, onDelete, onDuplicate, onEdit, onTimelineDataChange, onUpdateWorld, timelineData, world }) {
  function updateWorldField(field, value) {
    onUpdateWorld({ ...world, [field]: value });
  }

  function addDetail(title = "") {
    const nextDetail = { ...INITIAL_WORLD_DETAIL, id: crypto.randomUUID(), title };
    updateWorldField("details", [nextDetail, ...(world.details || [])]);
  }

  function updateDetail(id, field, value) {
    updateWorldField("details", (world.details || []).map((detail) => detail.id === id ? { ...detail, [field]: value } : detail));
  }

  function deleteDetail(id) {
    if (!window.confirm("Delete this detail section?")) return;
    updateWorldField("details", (world.details || []).filter((detail) => detail.id !== id));
  }

  function moveDetail(id, direction) {
    updateWorldField("details", moveWorldItem(world.details || [], id, direction));
  }

  function addReference() {
    updateWorldField("references", [{ ...INITIAL_WORLD_REFERENCE, id: crypto.randomUUID() }, ...(world.references || [])]);
  }

  function updateReference(id, field, value) {
    updateWorldField("references", (world.references || []).map((reference) => reference.id === id ? { ...reference, [field]: value } : reference));
  }

  function updateReferenceMedia(id, media) {
    updateWorldField("references", (world.references || []).map((reference) => reference.id === id ? { ...reference, imageData: media.data, imageUrl: media.url } : reference));
  }

  function deleteReference(id) {
    if (!window.confirm("Delete this reference?")) return;
    updateWorldField("references", (world.references || []).filter((reference) => reference.id !== id));
  }

  function moveReference(id, direction) {
    updateWorldField("references", moveWorldItem(world.references || [], id, direction));
  }

  function addCustomSection() {
    updateWorldField("customSections", [{ id: crypto.randomUUID(), title: "New Section", content: "" }, ...(world.customSections || [])]);
  }

  function updateCustomSection(id, field, value) {
    updateWorldField("customSections", (world.customSections || []).map((section) => section.id === id ? { ...section, [field]: value } : section));
  }

  function deleteCustomSection(id) {
    if (!window.confirm("Delete this custom section?")) return;
    updateWorldField("customSections", (world.customSections || []).filter((section) => section.id !== id));
  }

  function moveCustomSection(id, direction) {
    updateWorldField("customSections", moveWorldItem(world.customSections || [], id, direction));
  }

  function clearIdeas() {
    if (!world.ideas || !window.confirm("Clear all ideas for this world?")) return;
    updateWorldField("ideas", "");
  }

  return (
    <section className="world-wiki-page">
      <header className="world-wiki-hero panel">
        <button className="secondary-button inline-primary" type="button" onClick={onBack}>Back to Worlds</button>
        <WorldCover world={world} large />
        <div className="world-wiki-title-block">
          <p className="eyebrow">World Wiki</p>
          <h2>{world.name}</h2>
          <p>{world.worldType}</p>
          <p className="muted-text">{world.description || "No description yet."}</p>
        </div>
        <div className="world-hero-actions"><button className="secondary-button inline-primary" type="button" onClick={onEdit}>Edit</button><button className="secondary-button inline-primary" type="button" onClick={onDuplicate}>Duplicate</button><button className="delete-button inline-primary" type="button" onClick={onDelete}>Delete</button></div>
      </header>

      <div className="world-wiki-sections">
        <WikiSection title="Overview" defaultOpen>
          <div className="world-overview-card">
            <WorldCover world={world} large />
            <div><h3>{world.name}</h3><p className="muted-text">{world.worldType}</p><p>{world.description || "No description yet."}</p><button className="secondary-button inline-primary" type="button" onClick={onEdit}>Edit name, type, cover, and description</button></div>
          </div>
        </WikiSection>

        <WikiSection title="Notes" defaultOpen>
          <label className="field"><span>World notes</span><textarea value={world.notes || ""} rows="9" placeholder="Write anything about this world..." onChange={(event) => updateWorldField("notes", event.target.value)} /></label>
        </WikiSection>

        <WikiSection title="Details" defaultOpen>
          <div className="world-detail-presets">{WORLD_DETAIL_CATEGORIES.map((title) => <button className="secondary-button" key={title} type="button" onClick={() => addDetail(title)}>+ {title}</button>)}</div>
          <button className="primary-button inline-primary" type="button" onClick={() => addDetail("Custom Detail")}>+ Add Detail</button>
          <div className="world-detail-list">{(world.details || []).length ? world.details.map((detail, index) => <DetailEditor detail={detail} index={index} key={detail.id} onDelete={deleteDetail} onMove={moveDetail} onUpdate={updateDetail} total={(world.details || []).length} />) : <p className="empty-state">No details yet. Add a category or create your own detail section.</p>}</div>
        </WikiSection>

        <WikiSection title="Timeline" defaultOpen>
          <TimelineEditor embedded ocs={ocs} onTimelineDataChange={onTimelineDataChange} timelineData={timelineData} workspaceWorldName={world.name} />
        </WikiSection>

        <WikiSection title="References">
          <button className="primary-button inline-primary" type="button" onClick={addReference}>+ Add Reference</button>
          <div className="world-reference-grid">{(world.references || []).length ? world.references.map((reference, index) => <ReferenceEditor index={index} key={reference.id} onDelete={deleteReference} onMediaChange={updateReferenceMedia} onMove={moveReference} onUpdate={updateReference} reference={reference} total={(world.references || []).length} />) : <p className="empty-state">No references yet. Add images, links, books, games, websites, or inspiration.</p>}</div>
        </WikiSection>

        <WikiSection title="Ideas">
          <label className="field"><span>Brainstorming</span><textarea value={world.ideas || ""} rows="8" placeholder="Future concepts, loose thoughts, things to develop later..." onChange={(event) => updateWorldField("ideas", event.target.value)} /></label>
          <div className="world-editor-actions"><button className="delete-button inline-primary" type="button" disabled={!world.ideas} onClick={clearIdeas}>Clear Ideas</button></div>
        </WikiSection>

        {(world.customSections || []).map((section, index) => <WikiSection key={section.id} title={section.title || "Custom Section"}><DetailEditor detail={section} index={index} onDelete={deleteCustomSection} onMove={moveCustomSection} onUpdate={updateCustomSection} total={(world.customSections || []).length} /></WikiSection>)}
        <button className="secondary-button inline-primary add-world-section-button" type="button" onClick={addCustomSection}>+ Add Section</button>
      </div>
    </section>
  );
}

function WikiSection({ children, defaultOpen = false, title }) {
  return <details className="panel world-wiki-section" open={defaultOpen}><summary><h3>{title}</h3><span aria-hidden="true">&gt;</span></summary><div className="world-wiki-section-body">{children}</div></details>;
}

function DetailEditor({ detail, index = 0, onDelete, onMove, onUpdate, total = 1 }) {
  return (
    <article className="world-detail-editor">
      <label className="field"><span>Title</span><input value={detail.title} onChange={(event) => onUpdate(detail.id, "title", event.target.value)} /></label>
      <label className="field"><span>Content</span><textarea value={detail.content} rows="5" onChange={(event) => onUpdate(detail.id, "content", event.target.value)} /></label>
      <div className="world-editor-actions">
        <button className="secondary-button" type="button" disabled={index === 0} onClick={() => onMove(detail.id, -1)}>Move Up</button>
        <button className="secondary-button" type="button" disabled={index >= total - 1} onClick={() => onMove(detail.id, 1)}>Move Down</button>
        <button className="delete-button" type="button" onClick={() => onDelete(detail.id)}>Delete</button>
      </div>
    </article>
  );
}

function ReferenceEditor({ index = 0, onDelete, onMediaChange, onMove, onUpdate, reference, total = 1 }) {
  return (
    <article className="world-reference-card">
      <div className="field-grid"><label className="field"><span>Title</span><input value={reference.title} onChange={(event) => onUpdate(reference.id, "title", event.target.value)} /></label><label className="field"><span>Type</span><select value={reference.type} onChange={(event) => onUpdate(reference.id, "type", event.target.value)}>{WORLD_REFERENCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label></div>
      <MediaInput label="Image" dataValue={reference.imageData} urlValue={reference.imageUrl} onChange={(media) => onMediaChange(reference.id, media)} />
      <label className="field"><span>URL / Link</span><input value={reference.url} placeholder="https://..." onChange={(event) => onUpdate(reference.id, "url", event.target.value)} /></label>
      <label className="field"><span>Notes</span><textarea value={reference.notes} rows="3" onChange={(event) => onUpdate(reference.id, "notes", event.target.value)} /></label>
      <div className="world-editor-actions">
        <button className="secondary-button" type="button" disabled={index === 0} onClick={() => onMove(reference.id, -1)}>Move Up</button>
        <button className="secondary-button" type="button" disabled={index >= total - 1} onClick={() => onMove(reference.id, 1)}>Move Down</button>
        <button className="delete-button" type="button" onClick={() => onDelete(reference.id)}>Delete</button>
      </div>
    </article>
  );
}

function DeleteWorldDialog({ onCancel, onDelete, open, world }) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="confirm-dialog delete-world-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-world-title">
        <h2 id="delete-world-title">Delete World</h2>
        <p>Are you sure you want to permanently delete {world?.name || "this world"}?</p>
        <p className="muted-text">This action cannot be undone.</p>
        <div className="dialog-actions horizontal-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="delete-button" type="button" onClick={onDelete}>Delete</button>
        </div>
      </section>
    </div>
  );
}

function moveWorldItem(items, id, direction) {
  const currentIndex = items.findIndex((item) => item.id === id);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(currentIndex, 1);
  nextItems.splice(nextIndex, 0, movedItem);
  return nextItems;
}

function duplicateWorldTimelineData(sourceWorldName, copyWorldName, timelineData) {
  const sourceName = String(sourceWorldName || "").trim();
  const targetName = String(copyWorldName || "").trim();
  if (!sourceName || !targetName) return timelineData;
  const timelineIdMap = new Map();
  const copiedTimelines = [];

  timelineData.timelines.forEach((timeline) => {
    if (timeline.connectedWorld !== sourceName) return;
    const nextId = crypto.randomUUID();
    timelineIdMap.set(timeline.id, nextId);
    copiedTimelines.push({ ...timeline, id: nextId, title: `${timeline.title || sourceName} - Copy`, connectedWorld: targetName, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  });

  if (!copiedTimelines.length) return timelineData;

  const copiedEvents = timelineData.events
    .filter((event) => timelineIdMap.has(event.timelineId))
    .map((event) => ({ ...event, id: crypto.randomUUID(), timelineId: timelineIdMap.get(event.timelineId), connectedWorld: event.connectedWorld === sourceName ? targetName : event.connectedWorld, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));

  return { timelines: [...copiedTimelines, ...timelineData.timelines], events: [...copiedEvents, ...timelineData.events] };
}
function WorldCover({ large = false, world }) {
  const image = world.coverImageData || world.coverImageUrl;
  return <div className={large ? "world-cover world-cover-large" : "world-cover"}>{image ? <img src={image} alt={world.name || "World cover"} /> : <span>{getInitials(world.name)}</span>}</div>;
}

export function buildWorldSummaries(ocs, timelineData = { timelines: [], events: [] }, worlds = []) {
  const map = new Map();
  worlds.forEach((world) => map.set(`saved-${world.id}`, { ...world, key: `saved-${world.id}`, ocCount: 0, timelineCount: 0, loreCount: getWorldLoreCount(world) }));
  ocs.forEach((oc) => {
    const name = getWorldTitle(oc);
    const key = `derived-${name}`;
    const saved = Array.from(map.values()).find((world) => world.name === name);
    const targetKey = saved ? saved.key : key;
    if (!map.has(targetKey)) map.set(targetKey, { key: targetKey, id: "", name, worldType: oc.worldType, description: getWorldDescription(oc), coverImageData: "", coverImageUrl: "", ocCount: 0, timelineCount: 0, loreCount: 0, isFavorite: false });
    map.get(targetKey).ocCount += 1;
  });
  timelineData.timelines.forEach((timeline) => {
    if (!timeline.connectedWorld) return;
    const saved = Array.from(map.values()).find((world) => world.name === timeline.connectedWorld);
    const key = saved ? saved.key : `derived-${timeline.connectedWorld}`;
    if (!map.has(key)) map.set(key, { key, id: "", name: timeline.connectedWorld, worldType: "World", description: "", coverImageData: "", coverImageUrl: "", ocCount: 0, timelineCount: 0, loreCount: 0, isFavorite: false });
    map.get(key).timelineCount += 1;
  });
  return Array.from(map.values()).filter((world) => world.name).sort((a, b) => a.name.localeCompare(b.name));
}

function getWorldLoreCount(world) {
  return (world.details?.length || 0) + (world.references?.length || 0) + (world.customSections?.length || 0) + (world.notes ? 1 : 0) + (world.ideas ? 1 : 0);
}

function getWorldDescription(oc) {
  return oc.worldOwnDescription || oc.worldCrossoverDescription || oc.worldAuChanges || oc.worldCanonNotes || "";
}

function getShortDescription(value) {
  const text = String(value || "No description yet.").replace(/\s+/g, " ").trim();
  return text.length > 150 ? `${text.slice(0, 150).trim()}...` : text;
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "W";
}




