import { useState } from "react";
import MediaInput from "../MediaInput.jsx";
import WorkspacePanel from "./WorkspacePanel.jsx";

export default function WorkspaceItemsModule({ createItem, deleteItem, emptyItem, itemTypes, items, oc, onItemsChange, saveItems, title, typeKey, updateItem }) {
  const [formData, setFormData] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const visibleItems = items.filter((item) => item.ocId === oc.id);

  function persist(nextItems) {
    saveItems(nextItems);
    onItemsChange(nextItems);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function updateImage({ data, url }) {
    setFormData((current) => ({ ...current, imageData: data, imageUrl: url }));
  }

  function submit(event) {
    event.preventDefault();
    if (!formData.title.trim() && !formData.url.trim() && !formData.quote?.trim()) return;
    if (editingId) persist(updateItem(items, editingId, formData));
    else persist([createItem(oc.id, formData), ...items]);
    setEditingId(null);
    setFormData(emptyItem);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setFormData({ ...emptyItem, ...item });
  }

  return (
    <WorkspacePanel title={title}>
      <form className="sub-form" onSubmit={submit}>
        <h3>{editingId ? `Edit ${title} item` : `Add ${title} item`}</h3>
        <div className="field-grid">
          <label className="field"><span>Section / Type</span><select name={typeKey} value={formData[typeKey]} onChange={updateField}>{itemTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          <TextInput label="Title" name="title" value={formData.title} onChange={updateField} />
          <TextInput label="Link URL" name="url" value={formData.url} onChange={updateField} />
          <MediaInput label="Image" dataValue={formData.imageData} urlValue={formData.imageUrl} onChange={updateImage} />
        </div>
        <label className="field"><span>Quote</span><textarea name="quote" value={formData.quote || ""} rows="2" onChange={updateField} /></label>
        <label className="field"><span>Notes</span><textarea name="notes" value={formData.notes} rows="3" onChange={updateField} /></label>
        <div className="form-actions"><button className="primary-button inline-primary" type="submit">{editingId ? "Save item" : "Add item"}</button>{editingId ? <button className="secondary-button" type="button" onClick={() => { setEditingId(null); setFormData(emptyItem); }}>Cancel</button> : null}</div>
      </form>
      <div className="prepared-grid">{visibleItems.length === 0 ? <p className="empty-state">No items yet.</p> : visibleItems.map((item) => <article className="prepared-card" key={item.id}>{item.imageData || item.imageUrl ? <PreviewMedia item={item} /> : null}<p className="eyebrow">{item[typeKey]}</p><h3>{item.title || item.quote || "Untitled"}</h3>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">Open link</a> : null}{item.notes ? <p className="muted-text">{item.notes}</p> : null}<div className="card-actions"><button className="secondary-button" type="button" onClick={() => startEdit(item)}>Edit</button><button className="delete-button" type="button" onClick={() => persist(deleteItem(items, item.id))}>Delete</button></div></article>)}</div>
    </WorkspacePanel>
  );
}

function PreviewMedia({ item }) {
  const source = item.imageData || item.imageUrl;
  return <div className="workspace-media-preview"><img src={source} alt={item.title || "Reference"} /></div>;
}

function TextInput({ label, name, onChange, value }) {
  return <label className="field"><span>{label}</span><input name={name} value={value || ""} onChange={onChange} /></label>;
}

