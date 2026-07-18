import { useEffect, useMemo, useState } from "react";
import ExportDialog from "../ExportDialog.jsx";
import NetworkDesktop from "./NetworkDesktop.jsx";
import OCForm from "../OCForm.jsx";
import TimelineDesktop from "./TimelineDesktop.jsx";
import { getWorldTitle } from "../OCList.jsx";
import InspirationModule from "../workspace/InspirationModule.jsx";
import ProfileModule from "../workspace/ProfileModule.jsx";
import SettingsModule, { getCustomFontCssForOC, getCustomizeStyleForOC } from "../workspace/SettingsModule.jsx";
import StoryWorkspace from "../workspace/StoryWorkspace.jsx";
import WorkspaceCustomizer from "../workspace/WorkspaceCustomizer.jsx";
import WorkspacePanel from "../workspace/WorkspacePanel.jsx";
import WorldModule from "../workspace/WorldModule.jsx";
import { getActiveWorkspaceTab, getWorkspaceConfigForOC, saveActiveWorkspaceTab } from "../../storage/workspaceRepository.js";

export default function CharacterWorkspaceDesktop({
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
  onWorkspaceConfigsChange,
  referenceItems,
  relationshipMaps,
  relationships,
  timelineData,
  workspaceConfigs
}) {
  const [activeTab, setActiveTab] = useState(() => getInitialWorkspaceTab(oc.id));
  const [editingProfile, setEditingProfile] = useState(false);
  const [customizingWorkspace, setCustomizingWorkspace] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const sections = useMemo(() => getWorkspaceConfigForOC(workspaceConfigs, oc.id), [oc.id, workspaceConfigs]);
  const visibleSections = sections.filter((section) => section.visible !== false);
  const banner = oc.bannerImageData || oc.bannerImageUrl;
  const profilePicture = oc.profilePictureData || oc.profilePictureUrl;
  const theme = getWorkspaceTheme(oc);
  const customizeStyle = getCustomizeStyleForOC(oc);
  const customFontCss = getCustomFontCssForOC(oc);

  useEffect(() => {
    const nextTab = getInitialWorkspaceTab(oc.id);
    setActiveTab(nextTab);
  }, [oc.id]);

  useEffect(() => {
    function handleHashChange() {
      const nextTab = getTabFromHash(oc.id);
      if (nextTab) requestWorkspaceNavigation(() => setActiveWorkspaceTab(nextTab));
    }
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [oc.id, onRequestNavigation]);

  useEffect(() => {
    if (!visibleSections.some((section) => section.id === activeTab)) {
      const nextTab = visibleSections[0]?.id || "Profile";
      setActiveWorkspaceTab(nextTab);
    }
  }, [activeTab, visibleSections, oc.id]);

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

  function setActiveWorkspaceTab(tab) {
    setActiveTab(tab);
    saveActiveWorkspaceTab(oc.id, tab);
    updateWorkspaceHash(oc.id, tab);
  }

  function switchTab(tab) {
    requestWorkspaceNavigation(() => setActiveWorkspaceTab(tab));
  }

  return (
    <section className={`workspace-shell theme-${theme.slug}`} style={{ ...theme.style, ...customizeStyle }}>
      {customFontCss ? <style>{customFontCss}</style> : null}
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

      <div className="workspace-nav-row">
        <nav className="workspace-tabs" aria-label="Character workspace sections">
          {visibleSections.map((tab) => <button className={activeTab === tab.id ? "workspace-tab active" : "workspace-tab"} key={tab.id} type="button" onClick={() => switchTab(tab.id)}>{tab.label}</button>)}
        </nav>
        <div className="workspace-action-buttons"><button className="secondary-button workspace-customize-button" type="button" onClick={() => setExportOpen(true)}>Export</button><button className="secondary-button workspace-customize-button" type="button" onClick={() => setCustomizingWorkspace(true)}>Customize Workspace</button></div>
      </div>

      {activeTab === "Profile" ? (
        editingProfile ? (
          <WorkspacePanel title="Edit Profile">
            <OCForm editingOC={oc} onCancelEdit={() => requestWorkspaceNavigation(() => setEditingProfile(false))} onCreateOC={() => {}} onOpenCharacterNetwork={() => switchTab("Network")} onUnsavedStateChange={onUnsavedStateChange} onUpdateOC={handleProfileUpdate} />
          </WorkspacePanel>
        ) : <ProfileModule oc={oc} onEdit={() => setEditingProfile(true)} />
      ) : null}

      {activeTab === "World" ? <WorldModule oc={oc} /> : null}
      {activeTab === "Network" ? <NetworkDesktop familyMembers={familyMembers} oc={oc} ocs={ocs} onBack={onBack} onFamilyMembersChange={onFamilyMembersChange} onRelationshipMapsChange={onRelationshipMapsChange} onRelationshipsChange={onRelationshipsChange} relationshipMaps={relationshipMaps} relationships={relationships} /> : null}
      {activeTab === "Timeline" ? <TimelineDesktop embedded ocs={ocs} onBack={onBack} onTimelineDataChange={onTimelineDataChange} timelineData={timelineData} workspaceOcId={oc.id} /> : null}
      {activeTab === "Story" ? <StoryWorkspace oc={oc} /> : null}
      {activeTab === "Inspiration" ? <InspirationModule inspirationItems={inspirationItems} oc={oc} onInspirationItemsChange={onInspirationItemsChange} onReferenceItemsChange={onReferenceItemsChange} referenceItems={referenceItems} /> : null}
      {activeTab === "Appearance" ? <SettingsModule mode="appearance" oc={oc} onDeleteOC={onDeleteOC} onUnsavedStateChange={onUnsavedStateChange} onUpdateOC={onOCUpdate} /> : null}
      {activeTab === "Settings" ? <SettingsModule mode="settings" oc={oc} onDeleteOC={onDeleteOC} onUnsavedStateChange={onUnsavedStateChange} onUpdateOC={onOCUpdate} /> : null}

      {customizingWorkspace ? <WorkspaceCustomizer configs={workspaceConfigs} ocId={oc.id} onChange={onWorkspaceConfigsChange} onClose={() => setCustomizingWorkspace(false)} sections={sections} /> : null}
      <ExportDialog context="character" data={{ familyMembers, inspirationItems, oc, ocs, relationshipMaps, relationships, timelineData }} open={exportOpen} onClose={() => setExportOpen(false)} />
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

function getInitialWorkspaceTab(ocId) {
  const hashTab = getTabFromHash(ocId);
  return hashTab || getActiveWorkspaceTab(ocId);
}

function getTabFromHash(ocId) {
  if (typeof window === "undefined") return "";
  const match = window.location.hash.match(/^#character\/([^/]+)\/([^/]+)$/);
  if (!match || match[1] !== ocId) return "";
  return fromRouteSlug(match[2]);
}

function updateWorkspaceHash(ocId, tab) {
  if (typeof window === "undefined") return;
  const nextHash = `#character/${ocId}/${toRouteSlug(tab)}`;
  if (window.location.hash !== nextHash) window.history.pushState(null, "", nextHash);
}

function toRouteSlug(tab) {
  return String(tab).toLowerCase().replace(/\s+/g, "-");
}

function fromRouteSlug(slug) {
  const knownTabs = ["Profile", "World", "Network", "Timeline", "Story", "Inspiration", "Appearance", "Settings"];
  return knownTabs.find((tab) => toRouteSlug(tab) === slug) || "";
}









