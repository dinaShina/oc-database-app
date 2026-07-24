import { useEffect, useMemo, useState } from "react";
import ExportDialog from "../ExportDialog.jsx";
import OCForm from "../OCForm.jsx";
import { getWorldTitle } from "../OCList.jsx";
import InspirationModule from "../workspace/InspirationModule.jsx";
import ProfileModule from "../workspace/ProfileModule.jsx";
import SettingsModule, { getCustomFontCssForOC, getCustomizeStyleForOC } from "../workspace/SettingsModule.jsx";
import StoryWorkspace from "../workspace/StoryWorkspace.jsx";
import WorkspaceCustomizer from "../workspace/WorkspaceCustomizer.jsx";
import WorkspacePanel from "../workspace/WorkspacePanel.jsx";
import WorldModule from "../workspace/WorldModule.jsx";
import NetworkMobile from "./NetworkMobile.jsx";
import TimelineMobile from "./TimelineMobile.jsx";
import { getActiveWorkspaceTab, getWorkspaceConfigForOC, saveActiveWorkspaceTab } from "../../storage/workspaceRepository.js";

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
  const [moreOpen, setMoreOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const sections = useMemo(() => getWorkspaceConfigForOC(workspaceConfigs, oc.id), [oc.id, workspaceConfigs]);
  const visibleSections = sections.filter((section) => section.visible !== false);
  const banner = oc.bannerImageData || oc.bannerImageUrl;
  const profilePicture = oc.profilePictureData || oc.profilePictureUrl;
  const customizeStyle = getCustomizeStyleForOC(oc);
  const customFontCss = getCustomFontCssForOC(oc);
  const primarySectionIds = ["Profile", "Network", "Timeline", "Story", "Inspiration"];
  const primarySections = primarySectionIds.map((id) => visibleSections.find((section) => section.id === id)).filter(Boolean);

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
    if (onRequestNavigation) onRequestNavigation(action);
    else action();
  }

  async function handleProfileUpdate(formData) {
    const saved = await Promise.resolve(onOCUpdate(oc.id, formData));
    if (saved === false) return false;
    setEditingProfile(false);
    return true;
  }

  function setActiveWorkspaceTab(tab) {
    setActiveTab(tab);
    saveActiveWorkspaceTab(oc.id, tab);
    updateWorkspaceHash(oc.id, tab);
  }

  function switchTab(tab) {
    setMoreOpen(false);
    requestWorkspaceNavigation(() => setActiveWorkspaceTab(tab));
  }

  function openExport() {
    setMoreOpen(false);
    setExportOpen(true);
  }

  function deleteCharacter() {
    setMoreOpen(false);
    onDeleteOC(oc.id);
  }

  return (
    <section className={`workspace-shell mobile-character-workspace theme-${slugifyTheme(oc.visualTheme || "Modern")}`} style={customizeStyle}>
      {customFontCss ? <style>{customFontCss}</style> : null}
      <header className="mobile-character-header">
        <button className="secondary-button mobile-back-button" type="button" onClick={onBack}>Back</button>
        <div className="mobile-character-title-block">
          <div className="profile-picture-preview mobile-header-avatar">{profilePicture ? <img src={profilePicture} alt={oc.name} /> : <span>{getInitials(oc.name)}</span>}</div>
          <div>
            <p className="eyebrow">Character Workspace</p>
            <h2>{oc.name}</h2>
            <p className="muted-text">{[getWorldTitle(oc), oc.species, oc.currentAge ? `Age ${oc.currentAge}` : ""].filter(Boolean).join(" | ")}</p>
          </div>
        </div>
        <div className="mobile-character-menu-wrap">
          <button className="secondary-button icon-only-button" aria-expanded={moreOpen} aria-label="More character actions" type="button" onClick={() => setMoreOpen((open) => !open)}>...</button>
          {moreOpen ? (
            <div className="mobile-character-menu">
              <button type="button" onClick={() => switchTab("Appearance")}>Customize</button>
              <button type="button" onClick={openExport}>Export PDF</button>
              <span className="mobile-menu-note">Duplicate Character Coming Soon</span>
              <button type="button" onClick={() => switchTab("World")}>World</button>
              <button type="button" onClick={() => switchTab("Settings")}>Settings</button>
              <button type="button" onClick={() => { setMoreOpen(false); setCustomizingWorkspace(true); }}>Organize Tabs</button>
              <button className="danger-menu-item" type="button" onClick={deleteCharacter}>Delete Character</button>
            </div>
          ) : null}
        </div>
      </header>

      <nav className="mobile-primary-tabs" aria-label="Character workspace sections">
        {primarySections.map((tab) => <button className={activeTab === tab.id ? "workspace-tab active" : "workspace-tab"} key={tab.id} type="button" onClick={() => switchTab(tab.id)}>{tab.label === "Character Network" ? "Network" : tab.label}</button>)}
      </nav>

      {activeTab === "Profile" ? (editingProfile ? <WorkspacePanel title="Edit Profile"><OCForm editingOC={oc} onCancelEdit={() => requestWorkspaceNavigation(() => setEditingProfile(false))} onCreateOC={() => {}} onOpenCharacterNetwork={() => switchTab("Network")} onUnsavedStateChange={onUnsavedStateChange} onUpdateOC={handleProfileUpdate} /></WorkspacePanel> : <ProfileModule oc={oc} onEdit={() => setEditingProfile(true)} />) : null}
      {activeTab === "World" ? <WorldModule oc={oc} /> : null}
      {activeTab === "Network" ? <NetworkMobile familyMembers={familyMembers} oc={oc} ocs={ocs} onBack={onBack} onFamilyMembersChange={onFamilyMembersChange} onRelationshipMapsChange={onRelationshipMapsChange} onRelationshipsChange={onRelationshipsChange} relationshipMaps={relationshipMaps} relationships={relationships} embedded /> : null}
      {activeTab === "Timeline" ? <TimelineMobile embedded ocs={ocs} onBack={onBack} onTimelineDataChange={onTimelineDataChange} timelineData={timelineData} workspaceOcId={oc.id} /> : null}
      {activeTab === "Story" ? <StoryWorkspace oc={oc} /> : null}
      {activeTab === "Inspiration" ? <InspirationModule inspirationItems={inspirationItems} oc={oc} onInspirationItemsChange={onInspirationItemsChange} onReferenceItemsChange={onReferenceItemsChange} referenceItems={referenceItems} /> : null}
      {activeTab === "Appearance" ? <SettingsModule forceMobile mode="appearance" oc={oc} onDeleteOC={onDeleteOC} onUnsavedStateChange={onUnsavedStateChange} onUpdateOC={onOCUpdate} /> : null}
      {activeTab === "Settings" ? <SettingsModule forceMobile mode="settings" oc={oc} onDeleteOC={onDeleteOC} onUnsavedStateChange={onUnsavedStateChange} onUpdateOC={onOCUpdate} /> : null}

      {customizingWorkspace ? <WorkspaceCustomizer configs={workspaceConfigs} ocId={oc.id} onChange={onWorkspaceConfigsChange} onClose={() => setCustomizingWorkspace(false)} sections={sections} /> : null}
      <ExportDialog context="character" data={{ familyMembers, inspirationItems, oc, ocs, relationshipMaps, relationships, timelineData }} open={exportOpen} onClose={() => setExportOpen(false)} />
    </section>
  );
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






function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "?";
}

function slugifyTheme(theme) {
  return String(theme || "Modern").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "modern";
}

