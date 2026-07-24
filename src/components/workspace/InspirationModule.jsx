import { useMemo, useState } from "react";
import { getSectionForType, INITIAL_COLOR_SWATCH, INITIAL_INSPIRATION_ITEM, MORE_INSPIRATION_TYPES, PRIMARY_INSPIRATION_TYPES } from "../../data/inspirationSchema.js";
import { createInspirationItem, deleteInspirationItem, reorderInspirationItem, saveInspirationItems, updateInspirationItem } from "../../storage/inspirationRepository.js";
import EmptyState from "../EmptyState.jsx";
import MediaInput from "../MediaInput.jsx";
import WorkspacePanel from "./WorkspacePanel.jsx";

export default function InspirationModule({ inspirationItems, oc, onInspirationItemsChange }) {
  const [selectingType, setSelectingType] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [moreSearch, setMoreSearch] = useState("");
  const [formData, setFormData] = useState(null);

  const visibleItems = useMemo(
    () => inspirationItems.filter((item) => item.ocId === oc.id).sort((a, b) => a.order - b.order || String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))),
    [inspirationItems, oc.id]
  );

  function persist(nextItems) {
    saveInspirationItems(nextItems);
    onInspirationItemsChange(nextItems);
  }

  function chooseType(type) {
    setSelectingType(false);
    setEditingItem(null);
    setFormData({ ...INITIAL_INSPIRATION_ITEM, type, section: getSectionForType(type), colors: type === "Color Palette" ? [{ ...INITIAL_COLOR_SWATCH }] : [] });
  }

  function startEdit(item) {
    setEditingItem(item);
    setSelectingType(false);
    setFormData({ ...INITIAL_INSPIRATION_ITEM, ...item, colors: item.colors?.length ? item.colors : (item.type === "Color Palette" ? [{ ...INITIAL_COLOR_SWATCH }] : []) });
  }

  function cancelForm() {
    setEditingItem(null);
    setFormData(null);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function updateColor(index, field, value) {
    setFormData((current) => ({
      ...current,
      colors: current.colors.map((color, colorIndex) => colorIndex === index ? { ...color, [field]: value } : color)
    }));
  }

  function addColor() {
    setFormData((current) => ({ ...current, colors: [...(current.colors || []), { ...INITIAL_COLOR_SWATCH }].slice(0, 8) }));
  }

  function removeColor(index) {
    setFormData((current) => ({ ...current, colors: current.colors.filter((_, colorIndex) => colorIndex !== index) }));
  }

  function updateMainImage({ data, url }) {
    setFormData((current) => ({ ...current, imageData: data, url }));
  }

  function addMoodboardImage({ data, url }) {
    const image = data || url;
    if (!image) return;
    setFormData((current) => ({ ...current, images: [...(current.images || []), image].slice(0, 12) }));
  }

  function submit(event) {
    event.preventDefault();
    if (!formData) return;
    const hasContent = [formData.title, formData.url, formData.imageData, formData.quote, formData.content, formData.notes, formData.description].some((value) => String(value || "").trim()) || formData.colors?.length || formData.images?.length;
    if (!hasContent) return;

    if (editingItem) persist(updateInspirationItem(inspirationItems, editingItem.id, formData));
    else persist([createInspirationItem(oc.id, formData, visibleItems.length), ...inspirationItems]);
    cancelForm();
  }

  function removeItem(item) {
    if (!window.confirm("Delete this inspiration item? This action cannot be undone.")) return;
    persist(deleteInspirationItem(inspirationItems, item.id));
    if (editingItem?.id === item.id) cancelForm();
  }

  function moveItem(item, direction) {
    persist(reorderInspirationItem(inspirationItems, oc.id, item.id, direction));
  }

  return (
    <WorkspacePanel title="Inspiration">
      <section className="inspiration-clean-workspace">
        <header className="inspiration-clean-header">
          <div>
            <p className="eyebrow">Creative References</p>
            <h2>Inspiration</h2>
            <p className="muted-text">Add only the pictures, links, songs, quotes, palettes, and notes you actually want for this character.</p>
          </div>
          <button className="primary-button inline-primary" type="button" onClick={() => { setSelectingType((open) => !open); setFormData(null); }}>+ Add Inspiration</button>
        </header>

        {selectingType ? <InspirationTypeMenu moreSearch={moreSearch} onSearchChange={setMoreSearch} onSelect={chooseType} /> : null}

        {formData ? <InspirationForm formData={formData} editing={Boolean(editingItem)} onAddColor={addColor} onCancel={cancelForm} onColorChange={updateColor} onImageChange={updateMainImage} onMoodboardImageAdd={addMoodboardImage} onRemoveColor={removeColor} onSubmit={submit} onUpdate={updateField} /> : null}

        {visibleItems.length === 0 && !formData && !selectingType ? (
          <EmptyState actionLabel="Add Inspiration" icon="spark" title="No inspiration yet." message="Start with one image, quote, song, link, or note. Only the things you add will appear here." onAction={() => setSelectingType(true)} />
        ) : null}

        {visibleItems.length > 0 ? (
          <div className="inspiration-item-grid">
            {visibleItems.map((item, index) => <InspirationCard item={item} key={item.id} onDelete={() => removeItem(item)} onEdit={() => startEdit(item)} onMoveDown={() => moveItem(item, 1)} onMoveUp={() => moveItem(item, -1)} isFirst={index === 0} isLast={index === visibleItems.length - 1} />)}
          </div>
        ) : null}
      </section>
    </WorkspacePanel>
  );
}

function InspirationTypeMenu({ moreSearch, onSearchChange, onSelect }) {
  const visibleMoreTypes = MORE_INSPIRATION_TYPES.filter((type) => type.toLowerCase().includes(moreSearch.trim().toLowerCase()));
  return (
    <section className="inspiration-type-menu two-level-inspiration-menu">
      <div className="primary-inspiration-types">
        {PRIMARY_INSPIRATION_TYPES.map((type) => <button className="inspiration-type-button" key={type} type="button" onClick={() => onSelect(type)}>{type}</button>)}
      </div>
      <details className="more-inspiration-types">
        <summary>More</summary>
        <label className="field"><span>Search more types</span><input value={moreSearch} placeholder="Search inspiration types..." onChange={(event) => onSearchChange(event.target.value)} /></label>
        <div className="more-inspiration-grid">
          {visibleMoreTypes.map((type) => <button className="inspiration-type-button" key={type} type="button" onClick={() => onSelect(type)}>{type}</button>)}
        </div>
      </details>
    </section>
  );
}

function InspirationForm({ editing, formData, onAddColor, onCancel, onColorChange, onImageChange, onMoodboardImageAdd, onRemoveColor, onSubmit, onUpdate }) {
  return (
    <form className="sub-form inspiration-focused-form" onSubmit={onSubmit}>
      <div className="modal-heading-row">
        <div><p className="eyebrow">{formData.type}</p><h3>{editing ? "Edit inspiration" : "Add inspiration"}</h3></div>
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
      </div>
      <div className="field-grid">
        <TextInput label={formData.type === "Song" ? "Song title" : formData.type === "Custom" ? "Custom title" : "Title"} name="title" value={formData.title} onChange={onUpdate} />
        {formData.type === "Song" ? <TextInput label="Artist" name="artist" value={formData.artist} onChange={onUpdate} /> : null}
        {formData.type === "Quote" ? <TextInput label="Author or source" name="author" value={formData.author} onChange={onUpdate} /> : null}
        {["Link", "Custom"].includes(formData.type) ? <TextInput label="URL" name="url" value={formData.url} onChange={onUpdate} /> : null}
        {formData.type === "Song" ? <TextInput label="Spotify, YouTube, or other URL" name="url" value={formData.url} onChange={onUpdate} /> : null}
        {formData.type === "Picture" ? <TextInput label="Source link" name="sourceLink" value={formData.sourceLink} onChange={onUpdate} /> : null}
        {formData.type === "Link" ? <TextInput label="Optional category" name="category" value={formData.category} onChange={onUpdate} /> : null}
      </div>

      {usesMediaInput(formData.type) ? <MediaInput label={formData.type === "Song" ? "Cover Image" : "Image"} dataValue={formData.imageData} urlValue={usesImageUrl(formData.type) ? formData.url : ""} onChange={onImageChange} /> : null}
      {formData.type === "Moodboard" ? <MediaInput label="Add Moodboard Image" onChange={onMoodboardImageAdd} /> : null}
      {formData.type === "Quote" ? <label className="field"><span>Quote text</span><textarea name="quote" value={formData.quote} rows="3" onChange={onUpdate} /></label> : null}
      {["Note", "Custom", "Font"].includes(formData.type) ? <label className="field"><span>{formData.type === "Note" ? "Text" : formData.type === "Font" ? "Preview text" : "Custom content"}</span><textarea name="content" value={formData.content} rows="4" onChange={onUpdate} /></label> : null}
      {["Link", "Font"].includes(formData.type) ? <label className="field"><span>{formData.type === "Font" ? "Source / font notes" : "Description"}</span><textarea name="description" value={formData.description} rows="3" onChange={onUpdate} /></label> : null}
      {formData.type === "Color Palette" ? <ColorPaletteEditor colors={formData.colors || []} onAddColor={onAddColor} onColorChange={onColorChange} onRemoveColor={onRemoveColor} /> : null}
      <label className="field"><span>Notes</span><textarea name="notes" value={formData.notes} rows="3" onChange={onUpdate} /></label>
      <div className="form-actions"><button className="primary-button inline-primary" type="submit">{editing ? "Save inspiration" : "Add inspiration"}</button></div>
    </form>
  );
}

function ColorPaletteEditor({ colors, onAddColor, onColorChange, onRemoveColor }) {
  return (
    <section className="palette-editor">
      <div className="section-heading-row"><h3>Colors</h3>{colors.length < 8 ? <button className="secondary-button" type="button" onClick={onAddColor}>+ Add Color</button> : <span className="coming-soon-pill">Palette full</span>}</div>
      <div className="palette-editor-grid">
        {colors.map((color, index) => (
          <article className="palette-editor-row" key={index}>
            <input aria-label="Color value" type="color" value={color.hex || "#2f6652"} onChange={(event) => onColorChange(index, "hex", event.target.value)} />
            <input aria-label="Color name" placeholder="Color name" value={color.name || ""} onChange={(event) => onColorChange(index, "name", event.target.value)} />
            <input aria-label="Hex value" value={color.hex || ""} onChange={(event) => onColorChange(index, "hex", event.target.value)} />
            <button className="delete-button" type="button" onClick={() => onRemoveColor(index)}>Remove</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function InspirationCard({ isFirst, isLast, item, onDelete, onEdit, onMoveDown, onMoveUp }) {
  const media = getInspirationMedia(item);
  return (
    <article className="inspiration-entry-card">
      {media && usesMediaInput(item.type) ? <div className="workspace-media-preview"><img src={media} alt={item.title || item.type} /></div> : null}
      {item.images?.length ? <div className="mini-moodboard-grid">{item.images.slice(0, 6).map((image, index) => <img src={image} alt={`${item.title || "Moodboard"} ${index + 1}`} key={index} />)}</div> : null}
      {item.colors?.length ? <div className="palette-strip">{item.colors.map((color, index) => <span title={`${color.name || "Color"} ${color.hex}`} style={{ background: color.hex }} key={`${color.hex}-${index}`} />)}</div> : null}
      <p className="eyebrow">{item.type}</p>
      <h3>{item.title || item.quote || item.content || "Untitled inspiration"}</h3>
      {item.artist ? <p className="muted-text">{item.artist}</p> : null}
      {item.author ? <p className="muted-text">{item.author}</p> : null}
      {item.quote ? <blockquote>{item.quote}</blockquote> : null}
      {item.description || item.content ? <p>{item.description || item.content}</p> : null}
      {item.notes ? <p className="muted-text">{item.notes}</p> : null}
      {item.url && !usesImageUrl(item.type) ? <a href={item.url} target="_blank" rel="noreferrer">Open link</a> : null}
      <div className="card-actions inspiration-card-actions">
        {!isFirst ? <button className="secondary-button" type="button" onClick={onMoveUp}>Up</button> : null}
        {!isLast ? <button className="secondary-button" type="button" onClick={onMoveDown}>Down</button> : null}
        <button className="secondary-button" type="button" onClick={onEdit}>Edit</button>
        <button className="delete-button" type="button" onClick={onDelete}>Delete</button>
      </div>
    </article>
  );
}

function TextInput({ label, name, onChange, value }) {
  return <label className="field"><span>{label}</span><input name={name} value={value || ""} onChange={onChange} /></label>;
}



function usesMediaInput(type) {
  return ["Picture", "Song", "Custom", "Outfit", "Pose", "Architecture", "Animal", "Object", "Location", "Character Reference", "Book", "Movie / Series", "Voice Actor", "Symbol", "Flower", "Fashion"].includes(type);
}


function usesImageUrl(type) {
  return ["Picture", "Outfit", "Pose", "Architecture", "Animal", "Object", "Location", "Character Reference", "Book", "Movie / Series", "Voice Actor", "Symbol", "Flower", "Fashion"].includes(type);
}

function getInspirationMedia(item) {
  if (item.imageData) return item.imageData;
  return usesImageUrl(item.type) ? item.url : "";
}
