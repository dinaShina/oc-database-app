import { useState } from "react";
import OCForm from "../OCForm.jsx";
import { getWorldTitle } from "../OCList.jsx";
import InspirationModule from "../workspace/InspirationModule.jsx";
import ProfileModule from "../workspace/ProfileModule.jsx";
import SettingsModule from "../workspace/SettingsModule.jsx";
import StoryWorkspace from "../workspace/StoryWorkspace.jsx";
import WorkspacePanel from "../workspace/WorkspacePanel.jsx";
import WorldModule from "../workspace/WorldModule.jsx";
import NetworkMobile from "./NetworkMobile.jsx";
import TimelineMobile from "./TimelineMobile.jsx";

const WORKSPACE_TABS = ["Profile", "World", "Network", "Timeline", "Story", "Inspiration", "Settings"];

export default function CharacterWorkspaceMobile({
  familyMembers,
  inspirationItems,
  oc,
  ocs,
  onBack,
  onDeleteOC,
  onFamilyMembersChange,
  onInspirationItemsChange,
  onOCUpdate,
  onReferenceItemsChange,
  onRelationshipMapsChange,
  onRelationshipsChange,
  onRequestNavigation,
  onTimelineDataChange,
  onUnsavedStateChange,
  referenceItems,
  relationshipMaps,
  relationships,
  timelineData
}) {
  const [activeTab, setActiveTab] = useState("Profile");
  const [editingProfile, setEditingProfile] = useState(false);
  const banner = oc.bannerImageData || oc.bannerImageUrl;
  const profilePicture = oc.profilePictureData || oc.profilePictureUrl;

  function requestWorkspaceNavigation(action) {
    if (onRequestNavigation) onRequestNavigation(action);
    else action();
  }

  function handleProfileUpdate(formData) {
    onOCUpdate(oc.id, formData);
    setEditingProfile(false);
  }

  return (
    <section className="workspace-shell mobile-character-workspace">
      <button className="secondary-button" type="button" onClick={onBack}>Back</button>
      <header className="workspace-hero mobile-workspace-hero">
        <div className="workspace-banner">{banner ? <img src={banner} alt={`${oc.name} banner`} /> : <span className="workspace-banner-detail" />}</div>
        <div className="workspace-identity">
          <div className="profile-picture-preview workspace-avatar">{profilePicture ? <img src={profilePicture} alt={oc.name} /> : <span>No picture</span>}</div>
          <div>
            <p className="eyebrow">Character Workspace</p>
            <h2>{oc.name}</h2>
            <p>{getWorldTitle(oc)}</p>
            <p className="muted-text">{[oc.species, oc.currentAge ? `Current age: ${oc.currentAge}` : ""].filter(Boolean).join(" | ")}</p>
          </div>
        </div>
      </header>

      <nav className="workspace-tabs mobile-workspace-tabs" aria-label="Character workspace sections">
        {WORKSPACE_TABS.map((tab) => <button className={activeTab === tab ? "workspace-tab active" : "workspace-tab"} key={tab} type="button" onClick={() => requestWorkspaceNavigation(() => setActiveTab(tab))}>{tab}</button>)}
      </nav>

      {activeTab === "Profile" ? (
        editingProfile ? (
          <WorkspacePanel title="Edit Profile"><OCForm editingOC={oc} onCancelEdit={() => setEditingProfile(false)} onCreateOC={() => {}} onOpenCharacterNetwork={() => setActiveTab("Network")} onUnsavedStateChange={onUnsavedStateChange} onUpdateOC={handleProfileUpdate} /></WorkspacePanel>
        ) : <ProfileModule oc={oc} onEdit={() => setEditingProfile(true)} />
      ) : null}
      {activeTab === "World" ? <WorldModule oc={oc} /> : null}
      {activeTab === "Network" ? <NetworkMobile familyMembers={familyMembers} oc={oc} ocs={ocs} onBack={onBack} onFamilyMembersChange={onFamilyMembersChange} onRelationshipMapsChange={onRelationshipMapsChange} onRelationshipsChange={onRelationshipsChange} relationshipMaps={relationshipMaps} relationships={relationships} embedded /> : null}
      {activeTab === "Timeline" ? <TimelineMobile embedded ocs={ocs} onBack={onBack} onTimelineDataChange={onTimelineDataChange} timelineData={timelineData} workspaceOcId={oc.id} /> : null}
      {activeTab === "Story" ? <StoryWorkspace oc={oc} /> : null}
      {activeTab === "Inspiration" ? <InspirationModule inspirationItems={inspirationItems} oc={oc} onInspirationItemsChange={onInspirationItemsChange} onReferenceItemsChange={onReferenceItemsChange} referenceItems={referenceItems} /> : null}
      {activeTab === "Settings" ? <SettingsModule oc={oc} onDeleteOC={onDeleteOC} onUpdateOC={onOCUpdate} /> : null}
    </section>
  );
}
