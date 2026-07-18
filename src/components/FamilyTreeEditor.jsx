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

  function handleSubmit(event) {
    event.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) persist(updateFamilyMember(familyMembers, editingId, formData));
    else persist([createFamilyMember(oc.id, formData), ...familyMembers]);

    setEditingId(null);
    setFormData(INITIAL_FAMILY_MEMBER);
  }

  function startEdit(member) {
    setEditingId(member.id);
    setFormData({ ...INITIAL_FAMILY_MEMBER, ...member });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData(INITIAL_FAMILY_MEMBER);
  }

  const memberPicture = formData.profilePictureData || formData.profilePictureUrl;
  const ocPicture = oc.profilePictureData || oc.profilePictureUrl;
  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? "network-tab-panel" : "panel editor-page"}>
      {!embedded ? (
        <div className="page-heading">
          <button className="secondary-button" type="button" onClick={onBack}>Back to OC list</button>
          <div>
            <p className="eyebrow">Family Tree</p>
            <h2>{oc.name}</h2>
          </div>
        </div>
      ) : null}

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
            <p className="empty-state">No family members yet.</p>
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
                <button className="delete-button" type="button" onClick={() => persist(deleteFamilyMember(familyMembers, member.id))}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <form className="sub-form" onSubmit={handleSubmit}>
        <h3>{editingId ? "Edit family member" : "Add family member"}</h3>
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
        <div className="form-actions">
          <button className="primary-button inline-primary" type="submit">{editingId ? "Save member" : "Add member"}</button>
          {editingId ? <button className="secondary-button" type="button" onClick={cancelEdit}>Cancel</button> : null}
        </div>
      </form>
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

