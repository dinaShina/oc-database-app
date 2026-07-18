import { useState } from "react";
import FamilyTreeEditor from "./FamilyTreeEditor.jsx";
import RelationshipMapEditor from "./RelationshipMapEditor.jsx";

export default function CharacterNetworkEditor({
  familyMembers,
  oc,
  ocs,
  onBack,
  onFamilyMembersChange,
  onRelationshipMapsChange,
  onRelationshipsChange,
  relationshipMaps,
  relationships
}) {
  const [activeTab, setActiveTab] = useState("family");
  const profilePicture = oc.profilePictureData || oc.profilePictureUrl;

  return (
    <section className="panel editor-page character-network-page">
      <div className="page-heading">
        <button className="secondary-button" type="button" onClick={onBack}>Back to OC list</button>
        <div>
          <p className="eyebrow">Character Network</p>
          <h2>{oc.name}</h2>
        </div>
      </div>

      <div className="network-hero">
        <div className="profile-picture-preview small-preview">
          {profilePicture ? <img src={profilePicture} alt={oc.name} /> : <span>No picture</span>}
        </div>
        <div>
          <h3>{oc.name}</h3>
          <p className="muted-text">Family, relationships, and future canon-character connections for this OC.</p>
        </div>
      </div>

      <div className="tab-list" role="tablist" aria-label="Character Network tabs">
        <button className={activeTab === "family" ? "tab-button active" : "tab-button"} type="button" role="tab" aria-selected={activeTab === "family"} onClick={() => setActiveTab("family")}>Family Tree</button>
        <button className={activeTab === "relationships" ? "tab-button active" : "tab-button"} type="button" role="tab" aria-selected={activeTab === "relationships"} onClick={() => setActiveTab("relationships")}>Relationship Map</button>
      </div>

      {activeTab === "family" ? (
        <FamilyTreeEditor familyMembers={familyMembers} oc={oc} onFamilyMembersChange={onFamilyMembersChange} embedded />
      ) : (
        <RelationshipMapEditor
          oc={oc}
          ocs={ocs}
          onRelationshipMapsChange={onRelationshipMapsChange}
          onRelationshipsChange={onRelationshipsChange}
          relationshipMaps={relationshipMaps}
          relationships={relationships}
          embedded
        />
      )}
    </section>
  );
}
