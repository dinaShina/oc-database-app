import { useMemo, useState } from "react";
import { INITIAL_WORLD, WORLD_TYPES } from "../data/worldSchema.js";
import { createWorld, deleteWorld, saveWorlds, updateWorld } from "../storage/worldRepository.js";
import { getWorldTitle } from "./OCList.jsx";

export default function WorldLibrary({ ocs, onWorldsChange, timelineData, worlds }) {
  const [formData, setFormData] = useState(INITIAL_WORLD);
  const [editingId, setEditingId] = useState(null);
  const [showWorldForm, setShowWorldForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const summaries = buildWorldSummaries(ocs, timelineData, worlds);
  const visibleWorlds = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return summaries;
    return summaries.filter((world) => `${world.name} ${world.worldType} ${world.description}`.toLowerCase().includes(query));
  }, [searchTerm, summaries]);

  function persist(nextWorlds) {
    saveWorlds(nextWorlds);
    onWorldsChange(nextWorlds);
  }

  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setFormData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!formData.name.trim()) return;
    if (editingId) persist(updateWorld(worlds, editingId, formData));
    else persist([createWorld(formData), ...worlds]);
    closeForm();
  }

  function startCreate() {
    setEditingId(null);
    setFormData(INITIAL_WORLD);
    setShowWorldForm(true);
  }

  function startEdit(world) {
    setEditingId(world.id);
    setFormData({ ...INITIAL_WORLD, ...world });
    setShowWorldForm(true);
  }

  function closeForm() {
    setEditingId(null);
    setFormData(INITIAL_WORLD);
    setShowWorldForm(false);
  }

  function toggleFavorite(world) {
    if (world.id) persist(updateWorld(worlds, world.id, { ...world, isFavorite: !world.isFavorite }));
  }

  return (
    <section className="panel list-panel world-library-panel">
      <div className="library-topbar">
        <div>
          <p className="eyebrow">Worlds</p>
          <h2>World Library</h2>
          <p className="muted-text">World cards gather characters, timelines, and lore/reference counts into one calm overview.</p>
        </div>
        <button className="primary-button inline-primary" type="button" onClick={startCreate}>+ New World</button>
      </div>

      <div className="list-controls library-controls">
        <label className="filter-field wide-field">
          <span>Search worlds</span>
          <input value={searchTerm} placeholder="Search by name, type, or description..." onChange={(event) => setSearchTerm(event.target.value)} />
        </label>
      </div>

      <div className="world-grid spacious-world-grid">
        {visibleWorlds.length === 0 ? <p className="empty-state">No worlds yet.</p> : visibleWorlds.map((world) => (
          <article className="world-card spacious-world-card" key={world.key}>
            <div><h3>{world.name}</h3><p className="muted-text">{world.worldType}</p></div>
            <p>{world.description || "No description yet."}</p>
            <dl className="fact-list compact-facts"><Fact label="Characters" value={world.ocCount} /><Fact label="Timelines" value={world.timelineCount} /><Fact label="Lore / References" value={world.loreCount} /></dl>
            <div className="card-actions">
              {world.id ? <button className="secondary-button" type="button" onClick={() => startEdit(world)}>Edit</button> : null}
              {world.id ? <button className="secondary-button" type="button" onClick={() => toggleFavorite(world)}>{world.isFavorite ? "Unfavorite" : "Favorite"}</button> : null}
              {world.id ? <button className="delete-button" type="button" onClick={() => persist(deleteWorld(worlds, world.id))}>Delete</button> : null}
            </div>
          </article>
        ))}
      </div>

      {showWorldForm ? (
        <div className="dialog-backdrop" role="presentation">
          <form className="large-modal" role="dialog" aria-modal="true" aria-labelledby="world-form-title" onSubmit={submit}>
            <div className="modal-heading-row"><div><p className="eyebrow">Worlds</p><h2 id="world-form-title">{editingId ? "Edit World" : "New World"}</h2></div><button className="secondary-button" type="button" onClick={closeForm}>Close</button></div>
            <label className="field"><span>Name</span><input name="name" value={formData.name} onChange={updateField} /></label>
            <label className="field"><span>World Type</span><select name="worldType" value={formData.worldType} onChange={updateField}>{WORLD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label className="field"><span>Description</span><textarea name="description" value={formData.description} rows="4" onChange={updateField} /></label>
            <label className="field"><span>Notes</span><textarea name="notes" value={formData.notes} rows="4" onChange={updateField} /></label>
            <label className="inline-check"><input name="isFavorite" type="checkbox" checked={formData.isFavorite} onChange={updateField} /><span>Favorite world</span></label>
            <div className="form-actions"><button className="primary-button inline-primary" type="submit">{editingId ? "Save world" : "Add world"}</button>{editingId ? <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button> : null}</div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

export function buildWorldSummaries(ocs, timelineData = { timelines: [], events: [] }, worlds = []) {
  const map = new Map();
  worlds.forEach((world) => map.set(`saved-${world.id}`, { ...world, key: `saved-${world.id}`, ocCount: 0, timelineCount: 0, loreCount: 0 }));
  ocs.forEach((oc) => {
    const name = getWorldTitle(oc);
    const key = `derived-${name}`;
    const saved = Array.from(map.values()).find((world) => world.name === name);
    const targetKey = saved ? saved.key : key;
    if (!map.has(targetKey)) map.set(targetKey, { key: targetKey, id: "", name, worldType: oc.worldType, description: getWorldDescription(oc), ocCount: 0, timelineCount: 0, loreCount: 0, isFavorite: false });
    map.get(targetKey).ocCount += 1;
  });
  timelineData.timelines.forEach((timeline) => {
    if (!timeline.connectedWorld) return;
    const saved = Array.from(map.values()).find((world) => world.name === timeline.connectedWorld);
    const key = saved ? saved.key : `derived-${timeline.connectedWorld}`;
    if (!map.has(key)) map.set(key, { key, id: "", name: timeline.connectedWorld, worldType: "World", description: "", ocCount: 0, timelineCount: 0, loreCount: 0, isFavorite: false });
    map.get(key).timelineCount += 1;
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getWorldDescription(oc) {
  return oc.worldOwnDescription || oc.worldCrossoverDescription || oc.worldAuChanges || oc.worldCanonNotes || "";
}

function Fact({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
