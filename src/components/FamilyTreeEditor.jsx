import { useMemo, useState } from "react";
import { FAMILY_RELATION_TYPES, INITIAL_FAMILY_MEMBER } from "../data/relationshipSchema.js";
import MediaInput from "./MediaInput.jsx";
import {
  createFamilyMember,
  deleteFamilyMember,
  saveFamilyMembers,
  updateFamilyMember
} from "../storage/familyRepository.js";

export default function FamilyTreeEditor({ embedded = false, familyMembers, oc, onBack, onFamilyMembersChange }) {
  const [formData, setFormData] = useState(INITIAL_FAMILY_MEMBER);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const visibleMembers = useMemo(
    () => familyMembers.filter((member) => member.ownerOcId === oc.id),
    [familyMembers, oc.id]
  );

  function persist(nextMembers) {
    saveFamilyMembers(nextMembers);
    onFamilyMembersChange(nextMembers);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function updateMemberPicture({ data, url }) {
    setFormData((current) => ({ ...current, profilePictureData: data, profilePictureUrl: url }));
  }

  function openCreateForm() {
    setEditingId(null);
    setFormData(INITIAL_FAMILY_MEMBER);
    setIsFormOpen(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) persist(updateFamilyMember(familyMembers, editingId, formData));
    else persist([createFamilyMember(oc.id, formData), ...familyMembers]);

    closeForm();
  }

  function startEdit(member) {
    setEditingId(member.id);
    setFormData({ ...INITIAL_FAMILY_MEMBER, ...member });
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingId(null);
    setFormData(INITIAL_FAMILY_MEMBER);
    setIsFormOpen(false);
  }
  function requestDeleteMember(member) {
    if (!window.confirm(`Delete ${member.name || "this family member"}? This action cannot be undone.`)) return;
    persist(deleteFamilyMember(familyMembers, member.id));
  }


  const ocPicture = oc.profilePictureData || oc.profilePictureUrl;
  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? "network-tab-panel content-first-panel" : "panel editor-page content-first-panel"}>
      {!embedded ? (
        <div className="page-heading">
          <button className="secondary-button" type="button" onClick={onBack}>Back to OC list</button>
          <div>
            <p className="eyebrow">Family Tree</p>
            <h2>{oc.name}</h2>
          </div>
        </div>
      ) : null}

      <section className="tree-focus-wrap">
        <div className="tree-canvas">
          <div className="tree-center-node center-character">
            <div className="profile-picture-preview small-preview">
              {ocPicture ? <img src={ocPicture} alt={oc.name} /> : <span>No picture</span>}
            </div>
            <div>
              <h3>{oc.name}</h3>
              <p>Central character</p>
            </div>
          </div>

          <div className="tree-branches">
            {visibleMembers.length === 0 ? (
              <div className="tree-empty-state">
                <p className="empty-state">No family members yet.</p>
                <p className="muted-text">Use the add button to place relatives around this character.</p>
              </div>
            ) : visibleMembers.map((member) => (
              <article className="tree-node" key={member.id}>
                <ProfileImage item={member} />
                <div>
                  <h3>{member.name}</h3>
                  <p>{member.relationLabel || "No relation label"}</p>
                  {member.notes ? <p className="muted-text">{member.notes}</p> : null}
                </div>
                <div className="card-actions">
                  <button className="secondary-button" type="button" onClick={() => startEdit(member)}>Edit</button>
                  <button className="delete-button" type="button" onClick={() => requestDeleteMember(member)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </div>
        <button className="floating-add-button" type="button" onClick={openCreateForm} aria-label="Add family member">+</button>
      </section>

      {isFormOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <form className="confirm-dialog relationship-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="family-member-dialog-title" onSubmit={handleSubmit}>
            <div className="modal-heading-row">
              <div>
                <p className="eyebrow">Family Tree</p>
                <h2 id="family-member-dialog-title">{editingId ? "Edit Family Member" : "Add Family Member"}</h2>
              </div>
              <button className="icon-close-button" type="button" onClick={closeForm} aria-label="Close">x</button>
            </div>
            <div className="field-grid">
              <TextInput label="Name" name="name" value={formData.name} onChange={updateField} required />
              <label className="field">
                <span>Relation label</span>
                <input name="relationLabel" list="family-relations" value={formData.relationLabel} placeholder="mother, sibling, ancestor..." onChange={updateField} />
                <datalist id="family-relations">
                  {FAMILY_RELATION_TYPES.map((type) => <option key={type} value={type} />)}
                </datalist>
              </label>
              <MediaInput label="Profile Picture" dataValue={formData.profilePictureData} urlValue={formData.profilePictureUrl} onChange={updateMemberPicture} />
            </div>
            <label className="field">
              <span>Notes</span>
              <textarea name="notes" value={formData.notes} rows="3" onChange={updateField} />
            </label>
            <div className="dialog-actions horizontal-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-button" type="submit">{editingId ? "Save Member" : "Add Member"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </Wrapper>
  );
}

function ProfileImage({ item }) {
  const source = item.profilePictureData || item.profilePictureUrl;
  return <div className="profile-picture-preview tiny-preview">{source ? <img src={source} alt={item.name || "Preview"} /> : <span>No picture</span>}</div>;
}

function TextInput({ label, name, onChange, required = false, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} required={required} value={value} onChange={onChange} />
    </label>
  );
}
