import { useState } from "react";
import CharacterNetworkEditor from "./CharacterNetworkEditor.jsx";
import OCForm from "./OCForm.jsx";
import TimelineEditor from "./TimelineEditor.jsx";
import { getWorldTitle } from "./OCList.jsx";
import InspirationModule from "./workspace/InspirationModule.jsx";
import ProfileModule from "./workspace/ProfileModule.jsx";
import SettingsModule from "./workspace/SettingsModule.jsx";
import StoryWorkspace from "./workspace/StoryWorkspace.jsx";
import WorkspacePanel from "./workspace/WorkspacePanel.jsx";
import WorldModule from "./workspace/WorldModule.jsx";

const PRIMARY_WORKSPACE_TABS = ["Profile", "World", "Network", "Timeline", "Story", "Inspiration"];

export default function CharacterWorkspace({
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
  const [moreOpen, setMoreOpen] = useState(false);
  const banner = oc.bannerImageData || oc.bannerImageUrl;
  const profilePicture = oc.profilePictureData || oc.profilePictureUrl;
  const theme = getWorkspaceTheme(oc);

  function requestWorkspaceNavigation(action) {
    if (onRequestNavigation) {
      onRequestNavigation(action);
      return;
    }

    action();
  }

  function handleProfileUpdate(formData) {
    onOCUpdate(oc.id, formData);
    setEditingProfile(false);
  }

  function switchTab(tab) {
    setMoreOpen(false);
    requestWorkspaceNavigation(() => setActiveTab(tab));
  }

  return (
    <section className={`workspace-shell theme-${theme.slug}`} style={theme.style}>
      <button className="secondary-button" type="button" onClick={onBack}>Back to OC Library</button>

      <header className="workspace-hero">
        <div className="workspace-banner">{banner ? <img src={banner} alt={`${oc.name} banner`} /> : <span className="workspace-banner-detail" />}</div>
        <div className="workspace-identity">
          <div className="profile-picture-preview workspace-avatar">{profilePicture ? <img src={profilePicture} alt={oc.name} /> : <span>No picture</span>}</div>
          <div>
            <p className="eyebrow">Character Workspace</p>
            <h2>{oc.name}</h2>
            <p>{getWorldTitle(oc)}</p>
            <p className="muted-text">{[oc.species, oc.ethnicities, oc.currentAge ? `Current age: ${oc.currentAge}` : ""].filter(Boolean).join(" | ")}</p>
          </div>
        </div>
      </header>

      <nav className="workspace-tabs workspace-tabs-polished" aria-label="Character workspace sections">
        {PRIMARY_WORKSPACE_TABS.map((tab) => <button className={activeTab === tab ? "workspace-tab active" : "workspace-tab"} key={tab} type="button" onClick={() => switchTab(tab)}>{tab}</button>)}
        <div className="workspace-more-menu-wrap">
          <button className={activeTab === "Settings" ? "workspace-tab active" : "workspace-tab"} aria-expanded={moreOpen} type="button" onClick={() => setMoreOpen((open) => !open)}>More</button>
          {moreOpen ? (
            <div className="workspace-more-menu">
              <button type="button" onClick={() => switchTab("Settings")}>Settings</button>
            </div>
          ) : null}
        </div>
      </nav>

      {activeTab === "Profile" ? (
        editingProfile ? (
          <WorkspacePanel title="Edit Profile">
            <OCForm
              editingOC={oc}
              onCancelEdit={() => requestWorkspaceNavigation(() => setEditingProfile(false))}
              onCreateOC={() => {}}
              onOpenCharacterNetwork={() => requestWorkspaceNavigation(() => setActiveTab("Network"))}
              onUnsavedStateChange={onUnsavedStateChange}
              onUpdateOC={handleProfileUpdate}
            />
          </WorkspacePanel>
        ) : <ProfileModule oc={oc} onEdit={() => setEditingProfile(true)} />
      ) : null}

      {activeTab === "World" ? <WorldModule oc={oc} /> : null}

      {activeTab === "Network" ? (
        <CharacterNetworkEditor
          familyMembers={familyMembers}
          oc={oc}
          ocs={ocs}
          onBack={onBack}
          onFamilyMembersChange={onFamilyMembersChange}
          onRelationshipMapsChange={onRelationshipMapsChange}
          onRelationshipsChange={onRelationshipsChange}
          relationshipMaps={relationshipMaps}
          relationships={relationships}
        />
      ) : null}

      {activeTab === "Timeline" ? <TimelineEditor embedded ocs={ocs} onBack={onBack} onTimelineDataChange={onTimelineDataChange} timelineData={timelineData} workspaceOcId={oc.id} /> : null}
      {activeTab === "Story" ? <StoryWorkspace oc={oc} /> : null}
      {activeTab === "Inspiration" ? <InspirationModule inspirationItems={inspirationItems} oc={oc} onInspirationItemsChange={onInspirationItemsChange} onReferenceItemsChange={onReferenceItemsChange} referenceItems={referenceItems} /> : null}
      {activeTab === "Settings" ? <SettingsModule oc={oc} onDeleteOC={onDeleteOC} onUpdateOC={onOCUpdate} /> : null}
    </section>
  );
}

function getWorkspaceTheme(oc) {
  const slug = slugifyTheme(oc.visualTheme || "Modern");
  const accentOne = oc.paletteColorOne || oc.accentColor || "#2f6652";
  const accentTwo = oc.paletteColorTwo || "#8b5b40";
  const accentThree = oc.paletteColorThree || "#f5f2ec";
  const accentFour = oc.paletteColorFour || accentTwo;

  return {
    slug,
    style: {
      "--workspace-accent": accentOne,
      "--workspace-accent-2": accentTwo,
      "--workspace-accent-3": accentThree,
      "--workspace-accent-4": accentFour
    }
  };
}

function slugifyTheme(theme) {
  return String(theme || "Modern").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "modern";
}





