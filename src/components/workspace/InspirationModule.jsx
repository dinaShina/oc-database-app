import { useMemo, useState } from "react";
import { INSPIRATION_SECTIONS, INITIAL_INSPIRATION_ITEM } from "../../data/inspirationSchema.js";
import { INITIAL_REFERENCE_ITEM } from "../../data/referenceSchema.js";
import {
  createInspirationItem,
  deleteInspirationItem,
  saveInspirationItems,
  updateInspirationItem
} from "../../storage/inspirationRepository.js";
import {
  createReferenceItem,
  deleteReferenceItem,
  saveReferenceItems,
  updateReferenceItem
} from "../../storage/referenceRepository.js";
import WorkspacePanel from "./WorkspacePanel.jsx";

const REFERENCE_SECTIONS = new Set(["Reference Images", "Website Links", "Documents / Notes"]);

export default function InspirationModule({ inspirationItems, oc, onInspirationItemsChange, onReferenceItemsChange, referenceItems }) {
  const [activeSection, setActiveSection] = useState("Moodboard");
  const [formData, setFormData] = useState({ ...INITIAL_INSPIRATION_ITEM, section: activeSection });
  const [editingItem, setEditingItem] = useState(null);

  const mergedItems = useMemo(() => {
    const inspiration = inspirationItems
      .filter((item) => item.ocId === oc.id)
      .map((item) => ({ ...item, source: "inspiration", section: normalizeSection(item.section) }));
    const references = referenceItems
      .filter((item) => item.ocId === oc.id)
      .map((item) => ({ ...item, source: "reference", section: referenceTypeToSection(item.type) }));

    return [...inspiration, ...references].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }, [inspirationItems, oc.id, referenceItems]);

  const visibleItems = mergedItems.filter((item) => item.section === activeSection);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData((current) => ({ ...current, imageData: String(reader.result || ""), url: "" }));
    reader.readAsDataURL(file);
  }

  function persistInspiration(nextItems) {
    saveInspirationItems(nextItems);
    onInspirationItemsChange(nextItems);
  }

  function persistReferences(nextItems) {
    saveReferenceItems(nextItems);
    onReferenceItemsChange(nextItems);
  }

  function submit(event) {
    event.preventDefault();
    if (!formData.title.trim() && !formData.url.trim() && !formData.quote?.trim() && !formData.notes?.trim() && !formData.imageData) return;

    if (editingItem?.source === "reference" || (!editingItem && REFERENCE_SECTIONS.has(formData.section))) {
      const referencePayload = toReferencePayload(formData);
      if (editingItem) persistReferences(updateReferenceItem(referenceItems, editingItem.id, referencePayload));
      else persistReferences([createReferenceItem(oc.id, referencePayload), ...referenceItems]);
    } else {
      const inspirationPayload = { ...formData, section: normalizeSection(formData.section) };
      if (editingItem) persistInspiration(updateInspirationItem(inspirationItems, editingItem.id, inspirationPayload));
      else persistInspiration([createInspirationItem(oc.id, inspirationPayload), ...inspirationItems]);
    }

    resetForm(activeSection);
  }

  function startEdit(item) {
    setEditingItem(item);
    setActiveSection(item.section);
    setFormData({
      ...INITIAL_INSPIRATION_ITEM,
      ...item,
      section: item.section,
      quote: item.quote || ""
    });
  }

  function deleteItem(item) {
    if (item.source === "reference") persistReferences(deleteReferenceItem(referenceItems, item.id));
    else persistInspiration(deleteInspirationItem(inspirationItems, item.id));
    if (editingItem?.id === item.id) resetForm(activeSection);
  }

  function switchSection(section) {
    setActiveSection(section);
    resetForm(section);
  }

  function resetForm(section) {
    setEditingItem(null);
    setFormData({ ...INITIAL_INSPIRATION_ITEM, section });
  }

  return (
    <WorkspacePanel title="Inspiration">
      <section className="inspiration-workspace">
        <nav className="inspiration-section-tabs" aria-label="Inspiration sections">
          {INSPIRATION_SECTIONS.map((section) => (
            <button className={activeSection === section ? "inspiration-section-tab active" : "inspiration-section-tab"} key={section} type="button" onClick={() => switchSection(section)}>
              <span>{section}</span>
              <small>{mergedItems.filter((item) => item.section === section).length}</small>
            </button>
          ))}
        </nav>

        <form className="sub-form" onSubmit={submit}>
          <h3>{editingItem ? "Edit inspiration item" : `Add ${activeSection}`}</h3>
          <div className="field-grid">
            <label className="field">
              <span>Section</span>
              <select name="section" value={formData.section} onChange={updateField}>
                {INSPIRATION_SECTIONS.map((section) => <option key={section} value={section}>{section}</option>)}
              </select>
            </label>
            <TextInput label="Title" name="title" value={formData.title} onChange={updateField} />
            <TextInput label="Link URL" name="url" value={formData.url} onChange={updateField} />
            <label className="field"><span>Upload image</span><input type="file" accept="image/*" onChange={uploadImage} /></label>
          </div>
          <label className="field"><span>Quote</span><textarea name="quote" value={formData.quote || ""} rows="2" onChange={updateField} /></label>
          <label className="field"><span>Documents / Notes</span><textarea name="notes" value={formData.notes || ""} rows="3" onChange={updateField} /></label>
          <div className="form-actions">
            <button className="primary-button inline-primary" type="submit">{editingItem ? "Save item" : "Add item"}</button>
            {editingItem ? <button className="secondary-button" type="button" onClick={() => resetForm(activeSection)}>Cancel</button> : null}
          </div>
        </form>

        <div className="prepared-grid inspiration-grid">
          {visibleItems.length === 0 ? <p className="empty-state">No {activeSection.toLowerCase()} items yet.</p> : visibleItems.map((item) => (
            <article className="prepared-card inspiration-card" key={`${item.source}-${item.id}`}>
              {item.imageData || item.url ? <PreviewMedia item={item} /> : null}
              <p className="eyebrow">{item.section}</p>
              <h3>{item.title || item.quote || "Untitled"}</h3>
              {item.quote ? <blockquote>{item.quote}</blockquote> : null}
              {item.url ? <a href={item.url} target="_blank" rel="noreferrer">Open link</a> : null}
              {item.notes ? <p className="muted-text">{item.notes}</p> : null}
              <div className="card-actions">
                <button className="secondary-button" type="button" onClick={() => startEdit(item)}>Edit</button>
                <button className="delete-button" type="button" onClick={() => deleteItem(item)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </WorkspacePanel>
  );
}

function normalizeSection(section) {
  if (section === "Pinterest Link") return "Pinterest Links";
  if (section === "Playlist") return "Playlist Links";
  if (section === "Quote") return "Quotes";
  if (section === "Aesthetic") return "Moodboard";
  return INSPIRATION_SECTIONS.includes(section) ? section : "Moodboard";
}

function referenceTypeToSection(type) {
  if (type === "Pinterest") return "Pinterest Links";
  if (type === "Playlist" || type === "YouTube") return "Playlist Links";
  if (type === "Reference Image") return "Reference Images";
  if (type === "Document") return "Documents / Notes";
  return "Website Links";
}

function sectionToReferenceType(section) {
  if (section === "Reference Images") return "Reference Image";
  if (section === "Documents / Notes") return "Document";
  return "Website Link";
}

function toReferencePayload(item) {
  return {
    ...INITIAL_REFERENCE_ITEM,
    ...item,
    type: sectionToReferenceType(item.section)
  };
}

function PreviewMedia({ item }) {
  const source = item.imageData || item.url;
  return <div className="workspace-media-preview"><img src={source} alt={item.title || "Reference"} /></div>;
}

function TextInput({ label, name, onChange, value }) {
  return <label className="field"><span>{label}</span><input name={name} value={value || ""} onChange={onChange} /></label>;
}
