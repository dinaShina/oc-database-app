import { useCallback, useEffect, useRef, useState } from "react";
import {
  APPEARANCE_FIELD_GROUPS,
  DIVERSE_GENDER_OPTIONS,
  INITIAL_OC_FORM,
  LINK_FIELDS,
  LONG_TEXT_FIELDS,
  NAME_DETAIL_FIELDS,
  WORLD_TYPE_FIELDS,
  WORLD_TYPES
} from "../data/ocFields.js";
import MediaInput from "./MediaInput.jsx";

const CLEAN_UNSAVED_STATE = { isDirty: false, save: null };
const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function createEmptyForm() {
  return { ...INITIAL_OC_FORM };
}

function serializeForm(formData) {
  return JSON.stringify(formData);
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable;
}

export default function OCForm({ editingOC, onCancelEdit, onCreateOC, onOpenCharacterNetwork, onUnsavedStateChange, onUpdateOC }) {
  const [formData, setFormData] = useState(() => createEmptyForm());
  const [formResetKey, setFormResetKey] = useState(0);
  const initialSnapshotRef = useRef(serializeForm(createEmptyForm()));
  const isDirty = serializeForm(formData) !== initialSnapshotRef.current;

  useEffect(() => {
    const nextFormData = editingOC ? { ...INITIAL_OC_FORM, ...editingOC } : createEmptyForm();
    initialSnapshotRef.current = serializeForm(nextFormData);
    setFormData(nextFormData);
    setFormResetKey((current) => current + 1);
    onUnsavedStateChange?.(CLEAN_UNSAVED_STATE);
  }, [editingOC, onUnsavedStateChange]);

  useEffect(() => {
    return () => onUnsavedStateChange?.(CLEAN_UNSAVED_STATE);
  }, [onUnsavedStateChange]);

  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function selectGender(gender) {
    setFormData((current) => ({
      ...current,
      gender: current.gender === gender ? "" : gender
    }));
  }

  function updateProfilePicture({ data, url }) {
    setFormData((current) => ({ ...current, profilePictureData: data, profilePictureUrl: url }));
  }

  function addCustomField() {
    setFormData((current) => ({
      ...current,
      customFields: [...getCustomFields(current), { id: crypto.randomUUID(), name: "", value: "" }]
    }));
  }

  function updateCustomField(id, key, value) {
    setFormData((current) => ({
      ...current,
      customFields: getCustomFields(current).map((field) => (field.id === id ? { ...field, [key]: value } : field))
    }));
  }

  function deleteCustomField(id) {
    setFormData((current) => ({ ...current, customFields: getCustomFields(current).filter((field) => field.id !== id) }));
  }

  function moveCustomField(id, direction) {
    setFormData((current) => ({ ...current, customFields: moveItem(getCustomFields(current), id, direction) }));
  }

  function addCustomSection() {
    setFormData((current) => ({
      ...current,
      customSections: [...getCustomSections(current), { id: crypto.randomUUID(), title: "", content: "" }]
    }));
  }

  function updateCustomSection(id, key, value) {
    setFormData((current) => ({
      ...current,
      customSections: getCustomSections(current).map((section) => (section.id === id ? { ...section, [key]: value } : section))
    }));
  }

  function deleteCustomSection(id) {
    setFormData((current) => ({ ...current, customSections: getCustomSections(current).filter((section) => section.id !== id) }));
  }

  function moveCustomSection(id, direction) {
    setFormData((current) => ({ ...current, customSections: moveItem(getCustomSections(current), id, direction) }));
  }
  const saveCurrentForm = useCallback(() => {
    if (!formData.name.trim()) {
      window.alert("Please add a character name before saving.");
      return false;
    }

    if (editingOC) {
      onUpdateOC(formData);
      initialSnapshotRef.current = serializeForm(formData);
    } else {
      onCreateOC(formData);
      const emptyForm = createEmptyForm();
      initialSnapshotRef.current = serializeForm(emptyForm);
      setFormData(emptyForm);
      setFormResetKey((current) => current + 1);
    }

    onUnsavedStateChange?.(CLEAN_UNSAVED_STATE);
    return true;
  }, [editingOC, formData, onCreateOC, onUnsavedStateChange, onUpdateOC]);

  useEffect(() => {
    onUnsavedStateChange?.({ isDirty, save: saveCurrentForm });
  }, [isDirty, onUnsavedStateChange, saveCurrentForm]);

  useEffect(() => {
    function handleKeyDown(event) {
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "s";
      if (!isSaveShortcut) return;
      if (!isEditableTarget(event.target) && event.target !== document.body) return;

      event.preventDefault();
      saveCurrentForm();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveCurrentForm]);

  function handleSubmit(event) {
    event.preventDefault();
    saveCurrentForm();
  }

  const profilePicture = formData.profilePictureData || formData.profilePictureUrl;
  const activeWorldFields = WORLD_TYPE_FIELDS[formData.worldType] || WORLD_TYPE_FIELDS[WORLD_TYPES[0]];

  return (
    <form className="panel form-panel" key={formResetKey} onSubmit={handleSubmit}>
      <div className="panel-heading form-heading">
        <div>
          <p className="eyebrow">{editingOC ? "Editing" : "New entry"}</p>
          <h2>{editingOC ? "Edit OC" : "Create OC"}</h2>
          {isDirty ? <p className="form-dirty-indicator">Editing...</p> : null}
        </div>
        {editingOC ? <button className="secondary-button" type="button" onClick={onCancelEdit}>Cancel</button> : null}
      </div>

      <MediaInput label="Profile Picture" dataValue={formData.profilePictureData} urlValue={formData.profilePictureUrl} onChange={updateProfilePicture} />

      <label className="field">
        <span>Character name *</span>
        <input name="name" type="text" value={formData.name} placeholder="e.g. Lyra Blackwood" onChange={updateField} required />
      </label>

      <CompactDetails label="Name details">
        <div className="field-grid nested-grid">
          {NAME_DETAIL_FIELDS.map(([name, label]) => <TextInput key={name} label={label} name={name} value={formData[name]} onChange={updateField} />)}
        </div>
      </CompactDetails>

      <div className="field-grid birth-grid">
        <NumberInput label="Day" name="birthDay" min="1" max="31" value={formData.birthDay} onChange={updateField} />
        <NumberInput label="Month" name="birthMonth" min="1" max="12" value={formData.birthMonth} onChange={updateField} />
        <NumberInput label="Year" name="birthYear" min="0" max="9999" value={formData.birthYear} onChange={updateField} />
      </div>

      <TextInput label="Current age" name="currentAge" value={formData.currentAge} placeholder="17, unknown, 200+, appears 25, immortal..." onChange={updateField} />

      <div className="field-group">
        <span className="group-label">Gender</span>
        <div className="segmented-control" role="group" aria-label="Gender">
          {["Female", "Male", "Diverse"].map((gender) => (
            <button className={formData.gender === gender ? "choice-button active" : "choice-button"} key={gender} type="button" onClick={() => selectGender(gender)}>
              {gender}
            </button>
          ))}
        </div>
      </div>

      {formData.gender ? (
        <CompactDetails label="Gender details">
          {formData.gender === "Diverse" ? (
            <label className="field">
              <span>Gender details</span>
              <select name="genderDetails" value={formData.genderDetails} onChange={updateField}>
                <option value="">No selection</option>
                {DIVERSE_GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ) : <TextInput label="Gender details" name="genderDetails" value={formData.genderDetails} onChange={updateField} />}
          <label className="field">
            <span>Gender notes</span>
            <textarea name="genderNotes" value={formData.genderNotes} placeholder="Optional notes about identity, presentation, pronouns, or context..." rows="3" onChange={updateField} />
          </label>
        </CompactDetails>
      ) : null}

      <div className="field-grid">
        <TextInput label="Species / Being" name="species" value={formData.species} placeholder="e.g. human, vampire, witch" onChange={updateField} />
        <TextInput label="Ethnicity / Ethnicities" name="ethnicities" value={formData.ethnicities} placeholder="Optional" onChange={updateField} />
      </div>

      <CompactDetails label="World connection">
        <label className="field">
          <span>World Type</span>
          <select name="worldType" value={formData.worldType} onChange={updateField}>
            {WORLD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <div className="field-grid nested-grid">
          {activeWorldFields.map(([name, label, placeholder]) => (
            <WorldField key={name} label={label} name={name} value={formData[name]} placeholder={placeholder} onChange={updateField} />
          ))}
        </div>
      </CompactDetails>

      <CompactDetails label="Appearance">
        {APPEARANCE_FIELD_GROUPS.map((group) => <FieldGroup key={group.title} title={group.title} fields={group.fields} formData={formData} onChange={updateField} />)}
      </CompactDetails>

      {LONG_TEXT_FIELDS.map(([name, label, placeholder]) => (
        <label className="field" key={name}>
          <span>{label}</span>
          <textarea name={name} value={formData[name]} placeholder={placeholder} rows="3" onChange={updateField} />
        </label>
      ))}

      <CompactDetails label="Links">
        <div className="field-grid nested-grid">
          {LINK_FIELDS.map(([name, label]) => (
            <label className="field" key={name}>
              <span>{label}</span>
              <input name={name} type="url" value={formData[name]} placeholder="https://..." onChange={updateField} />
            </label>
          ))}
        </div>
      </CompactDetails>

      <CompactDetails label="Additional Details">
        <div className="custom-detail-editor">
          <div className="section-heading-row">
            <div>
              <h3>Custom fields</h3>
              <p className="muted-text">Add any details that matter for this OC.</p>
            </div>
            <button className="secondary-button inline-primary" type="button" onClick={addCustomField}>Add field</button>
          </div>
          {getCustomFields(formData).length === 0 ? <p className="empty-state compact-empty-state">No custom fields yet.</p> : getCustomFields(formData).map((field, index) => (
            <div className="custom-detail-row" key={field.id}>
              <TextInput label="Field name" name={`custom-field-name-${field.id}`} value={field.name} onChange={(event) => updateCustomField(field.id, "name", event.target.value)} />
              <label className="field wide-field">
                <span>Field value</span>
                <textarea value={field.value} rows="2" onChange={(event) => updateCustomField(field.id, "value", event.target.value)} />
              </label>
              <div className="custom-detail-actions">
                <button className="secondary-button" type="button" onClick={() => moveCustomField(field.id, -1)} disabled={index === 0}>Up</button>
                <button className="secondary-button" type="button" onClick={() => moveCustomField(field.id, 1)} disabled={index === getCustomFields(formData).length - 1}>Down</button>
                <button className="delete-button" type="button" onClick={() => deleteCustomField(field.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="custom-detail-editor">
          <div className="section-heading-row">
            <div>
              <h3>Custom sections</h3>
              <p className="muted-text">Create longer sections for anything that needs room.</p>
            </div>
            <button className="secondary-button inline-primary" type="button" onClick={addCustomSection}>Add section</button>
          </div>
          {getCustomSections(formData).length === 0 ? <p className="empty-state compact-empty-state">No custom sections yet.</p> : getCustomSections(formData).map((section, index) => (
            <div className="custom-section-row" key={section.id}>
              <TextInput label="Section title" name={`custom-section-title-${section.id}`} value={section.title} onChange={(event) => updateCustomSection(section.id, "title", event.target.value)} />
              <label className="field wide-field">
                <span>Section content</span>
                <textarea value={section.content} rows="4" onChange={(event) => updateCustomSection(section.id, "content", event.target.value)} />
              </label>
              <div className="custom-detail-actions">
                <button className="secondary-button" type="button" onClick={() => moveCustomSection(section.id, -1)} disabled={index === 0}>Up</button>
                <button className="secondary-button" type="button" onClick={() => moveCustomSection(section.id, 1)} disabled={index === getCustomSections(formData).length - 1}>Down</button>
                <button className="delete-button" type="button" onClick={() => deleteCustomSection(section.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </CompactDetails>

      {editingOC ? (
        <div className="editor-shortcuts">
          <button className="secondary-button" type="button" onClick={() => onOpenCharacterNetwork(editingOC.id)}>
            Character Network
          </button>
        </div>
      ) : null}

      <button className="primary-button" type="submit">{editingOC ? "Save changes" : "Save OC"}</button>
    </form>
  );
}

function CompactDetails({ children, label }) {
  return <details className="compact-details"><summary>{label}</summary>{children}</details>;
}

function FieldGroup({ fields, formData, onChange, title }) {
  return (
    <section className="mini-group">
      <h3>{title}</h3>
      <div className="field-grid nested-grid">
        {fields.map(([name, label]) => <TextInput key={name} label={label} name={name} value={formData[name]} onChange={onChange} />)}
      </div>
    </section>
  );
}

function WorldField({ label, name, value, placeholder, onChange }) {
  const isLongField = name.toLowerCase().includes("notes") || name.toLowerCase().includes("description") || name.toLowerCase().includes("changes");

  return isLongField ? (
    <label className="field wide-field">
      <span>{label}</span>
      <textarea name={name} value={value} placeholder={placeholder} rows="3" onChange={onChange} />
    </label>
  ) : <TextInput label={label} name={name} value={value} placeholder={placeholder} onChange={onChange} />;
}

function TextInput({ label, name, value, placeholder = "", onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type="text" value={value} placeholder={placeholder} onChange={onChange} />
    </label>
  );
}

function NumberInput({ label, max, min, name, onChange, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type="number" min={min} max={max} value={value} placeholder={label} onChange={onChange} />
    </label>
  );
}




function getCustomFields(formData) {
  return Array.isArray(formData.customFields) ? formData.customFields : [];
}

function getCustomSections(formData) {
  return Array.isArray(formData.customSections) ? formData.customSections : [];
}

function moveItem(items, id, direction) {
  const next = [...items];
  const index = next.findIndex((item) => item.id === id);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= next.length) return next;
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
}