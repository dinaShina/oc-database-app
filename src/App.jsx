import { useEffect, useMemo, useState } from "react";
import useIsMobile from "./hooks/useIsMobile.js";
import CharacterWorkspaceDesktop from "./components/layouts/CharacterWorkspaceDesktop.jsx";
import CharacterWorkspaceMobile from "./components/layouts/CharacterWorkspaceMobile.jsx";
import DashboardDesktop from "./components/layouts/DashboardDesktop.jsx";
import DashboardMobile from "./components/layouts/DashboardMobile.jsx";
import CharactersDesktop from "./components/layouts/CharactersDesktop.jsx";
import CharactersMobile from "./components/layouts/CharactersMobile.jsx";
import FavoritesView from "./components/FavoritesView.jsx";
import OCForm from "./components/OCForm.jsx";
import { getWorldTitle } from "./components/OCList.jsx";
import Sidebar from "./components/Sidebar.jsx";
import WorldLibrary from "./components/WorldLibrary.jsx";
import { getWorlds, saveWorlds, updateWorld } from "./storage/worldRepository.js";
import { deleteFamilyForOC, getFamilyMembers, saveFamilyMembers } from "./storage/familyRepository.js";
import { deleteInspirationForOC, getInspirationItems, saveInspirationItems } from "./storage/inspirationRepository.js";
import { createOC, deleteOC, getOCs, saveOCs, updateOC } from "./storage/ocRepository.js";
import { deleteReferencesForOC, getReferenceItems, saveReferenceItems } from "./storage/referenceRepository.js";
import { deleteRelationshipMapForOC, getRelationshipMaps, saveRelationshipMaps } from "./storage/relationshipMapRepository.js";
import { deleteRelationshipsForOC, getRelationships, saveRelationships } from "./storage/relationshipRepository.js";
import { deleteTimelineReferencesForOC, getTimelineData, saveTimelineData } from "./storage/timelineRepository.js";

const CLEAN_UNSAVED_STATE = { isDirty: false, save: null };
const APP_SETTINGS_KEY = "oc-database-app:app-settings";

export default function App() {
  const [ocs, setOcs] = useState(() => getOCs());
  const [familyMembers, setFamilyMembers] = useState(() => getFamilyMembers());
  const [relationships, setRelationships] = useState(() => getRelationships());
  const [relationshipMaps, setRelationshipMaps] = useState(() => getRelationshipMaps());
  const [timelineData, setTimelineData] = useState(() => getTimelineData());
  const [inspirationItems, setInspirationItems] = useState(() => getInspirationItems());
  const [referenceItems, setReferenceItems] = useState(() => getReferenceItems());
  const [worldRecords, setWorldRecords] = useState(() => getWorlds());
  const [editingOC, setEditingOC] = useState(null);
  const [activeOCId, setActiveOCId] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [fandomFilter, setFandomFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [unsavedEditor, setUnsavedEditor] = useState(CLEAN_UNSAVED_STATE);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [appSettings, setAppSettings] = useState(() => getAppSettings());
  const detectedMobile = useIsMobile();
  const isMobile = appSettings.previewMode === "mobile" || (appSettings.previewMode !== "desktop" && detectedMobile);
  const DashboardLayout = isMobile ? DashboardMobile : DashboardDesktop;
  const CharactersLayout = isMobile ? CharactersMobile : CharactersDesktop;
  const CharacterWorkspaceLayout = isMobile ? CharacterWorkspaceMobile : CharacterWorkspaceDesktop;

  useEffect(() => {
    if (!unsavedEditor.isDirty) return undefined;
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedEditor.isDirty]);

  function persistOCs(nextOCs) {
    setOcs(nextOCs);
    saveOCs(nextOCs);
  }

  function openCharacterCreation() {
    setEditingOC(null);
    setActiveSection("library");
    setActiveOCId(null);
    setShowCharacterForm(true);
  }

  function handleCreateOC(formData) {
    const nextOC = createOC(formData);
    persistOCs([nextOC, ...ocs]);
    setEditingOC(null);
    setShowCharacterForm(false);
    setUnsavedEditor(CLEAN_UNSAVED_STATE);
  }

  function handleUpdateOC(formData) {
    if (!editingOC) return;
    persistOCs(updateOC(ocs, editingOC.id, formData));
    setEditingOC(null);
    setShowCharacterForm(false);
    setUnsavedEditor(CLEAN_UNSAVED_STATE);
  }

  function updateOCById(id, formData) {
    persistOCs(updateOC(ocs, id, formData));
  }

  function openOCWorkspace(ocId) {
    const now = new Date().toISOString();
    setOcs((currentOCs) => {
      const oc = currentOCs.find((item) => item.id === ocId);
      const nextOCs = oc ? updateOC(currentOCs, ocId, { ...oc, lastOpenedAt: now }) : currentOCs;
      saveOCs(nextOCs);
      return nextOCs;
    });
    setActiveOCId(ocId);
    setShowCharacterForm(false);
  }

  function requestNavigation(action) {
    if (unsavedEditor.isDirty) {
      setPendingNavigation(() => action);
      return;
    }
    action();
  }

  function closeCharacterForm() {
    requestNavigation(() => {
      setEditingOC(null);
      setShowCharacterForm(false);
    });
  }

  function handleSaveAndContinue() {
    const saved = unsavedEditor.save?.();
    if (saved === false) return;
    const action = pendingNavigation;
    setPendingNavigation(null);
    setUnsavedEditor(CLEAN_UNSAVED_STATE);
    action?.();
  }

  function handleDiscardAndContinue() {
    const action = pendingNavigation;
    setPendingNavigation(null);
    setUnsavedEditor(CLEAN_UNSAVED_STATE);
    action?.();
  }

  function handleCancelNavigation() {
    setPendingNavigation(null);
  }

  function handleDeleteOC(id) {
    persistOCs(deleteOC(ocs, id));
    const nextFamilyMembers = deleteFamilyForOC(familyMembers, id);
    const nextRelationships = deleteRelationshipsForOC(relationships, id);
    const nextRelationshipMaps = deleteRelationshipMapForOC(relationshipMaps, id);
    const nextTimelineData = deleteTimelineReferencesForOC(timelineData, id);
    const nextInspirationItems = deleteInspirationForOC(inspirationItems, id);
    const nextReferenceItems = deleteReferencesForOC(referenceItems, id);
    setFamilyMembers(nextFamilyMembers);
    setRelationships(nextRelationships);
    setRelationshipMaps(nextRelationshipMaps);
    setTimelineData(nextTimelineData);
    setInspirationItems(nextInspirationItems);
    setReferenceItems(nextReferenceItems);
    saveFamilyMembers(nextFamilyMembers);
    saveRelationships(nextRelationships);
    saveRelationshipMaps(nextRelationshipMaps);
    saveTimelineData(nextTimelineData);
    saveInspirationItems(nextInspirationItems);
    saveReferenceItems(nextReferenceItems);
    if (editingOC?.id === id) setEditingOC(null);
    if (activeOCId === id) setActiveOCId(null);
  }

  function toggleOCFavorite(id) {
    const oc = ocs.find((item) => item.id === id);
    if (!oc) return;
    updateOCById(id, { ...oc, isFavorite: !oc.isFavorite });
  }

  function toggleWorldFavorite(worldName) {
    const world = worldRecords.find((item) => item.name === worldName);
    if (!world) return;
    const nextWorlds = updateWorld(worldRecords, world.id, { ...world, isFavorite: !world.isFavorite });
    setWorldRecords(nextWorlds);
    saveWorlds(nextWorlds);
  }

  const worlds = useMemo(() => {
    const uniqueWorlds = new Set(ocs.map((oc) => getWorldTitle(oc)).filter(Boolean));
    return ["All", ...Array.from(uniqueWorlds).sort()];
  }, [ocs]);

  const visibleOCs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return ocs.filter((oc) => {
      const worldTitle = getWorldTitle(oc);
      const matchesWorld = fandomFilter === "All" || worldTitle === fandomFilter;
      const searchableText = `${oc.name} ${oc.fullName} ${oc.firstName} ${oc.middleName} ${oc.secondName} ${oc.lastName} ${oc.nickname} ${worldTitle} ${oc.worldType} ${oc.fandom}`.toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      return matchesWorld && matchesSearch;
    });
  }, [ocs, fandomFilter, searchTerm]);

  const activeOC = ocs.find((oc) => oc.id === activeOCId);

  return (
    <div className={`${appSettings.nightMood ? "app-frame night-mood" : "app-frame"} ${isMobile ? "mobile-preview-active" : "desktop-preview-active"}`}>
      {!isMobile ? <Sidebar activeSection={activeSection} hasUnsavedChanges={unsavedEditor.isDirty} onNavigate={(section) => requestNavigation(() => { setActiveSection(section); setActiveOCId(null); setShowCharacterForm(false); })} /> : null}
      <main className="app-shell">
        <header className="app-header">
          <div>
            <p className="eyebrow">Creative Workspace</p>
            <div className="header-title-row">
              <h1>{activeOC ? activeOC.name : getSectionTitle(activeSection)}</h1>
              {unsavedEditor.isDirty ? <span className="unsaved-indicator">Unsaved Changes</span> : null}
            </div>
          </div>
          <p className="app-summary">A calmer studio for characters, worlds, timelines, and story planning.</p>
        </header>

        {activeOC ? (
          <CharacterWorkspaceLayout familyMembers={familyMembers} inspirationItems={inspirationItems} oc={activeOC} ocs={ocs} onBack={() => requestNavigation(() => setActiveOCId(null))} onDeleteOC={handleDeleteOC} onFamilyMembersChange={setFamilyMembers} onInspirationItemsChange={setInspirationItems} onOCUpdate={updateOCById} onReferenceItemsChange={setReferenceItems} onRelationshipMapsChange={setRelationshipMaps} onRelationshipsChange={setRelationships} onRequestNavigation={requestNavigation} onTimelineDataChange={setTimelineData} onUnsavedStateChange={setUnsavedEditor} referenceItems={referenceItems} relationshipMaps={relationshipMaps} relationships={relationships} timelineData={timelineData} />
        ) : activeSection === "dashboard" ? (
          <DashboardLayout ocs={ocs} onCreateOC={openCharacterCreation} onCreateStory={() => requestNavigation(() => setActiveSection("library"))} onCreateTimeline={() => requestNavigation(() => setActiveSection("library"))} onCreateWorld={() => requestNavigation(() => setActiveSection("worlds"))} onOpenOC={(ocId) => requestNavigation(() => openOCWorkspace(ocId))} timelineData={timelineData} worlds={worldRecords} />
        ) : activeSection === "worlds" ? (
          <WorldLibrary ocs={ocs} onWorldsChange={setWorldRecords} timelineData={timelineData} worlds={worldRecords} />
        ) : activeSection === "favorites" ? (
          <FavoritesView ocs={ocs} onOpenOC={(ocId) => requestNavigation(() => openOCWorkspace(ocId))} onToggleOCFavorite={toggleOCFavorite} onToggleWorldFavorite={toggleWorldFavorite} timelineData={timelineData} worlds={worldRecords} />
        ) : activeSection === "settings" ? (
          <GlobalSettings appSettings={appSettings} onSettingsChange={setAndSaveAppSettings} />
        ) : (
          <CharactersLayout fandomFilter={fandomFilter} fandoms={worlds} ocs={visibleOCs} searchTerm={searchTerm} totalCount={ocs.length} onCreateCharacter={() => setShowCharacterForm(true)} onFandomFilterChange={(nextFilter) => requestNavigation(() => setFandomFilter(nextFilter))} onOpenWorkspace={(ocId) => requestNavigation(() => openOCWorkspace(ocId))} onSearchTermChange={setSearchTerm} />
        )}
      </main>

      <DeveloperPreviewSwitch appSettings={appSettings} detectedMobile={detectedMobile} isMobile={isMobile} onSettingsChange={setAndSaveAppSettings} />

      {isMobile ? <MobileNavigation activeSection={activeSection} onNavigate={(section) => requestNavigation(() => { setActiveSection(section); setActiveOCId(null); setShowCharacterForm(false); })} /> : null}

      {showCharacterForm ? (
        <div className="dialog-backdrop" role="presentation"><section className={isMobile ? "large-modal mobile-fullscreen-modal" : "large-modal"} role="dialog" aria-modal="true" aria-labelledby="character-form-title"><div className="modal-heading-row"><div><p className="eyebrow">Characters</p><h2 id="character-form-title">New Character</h2></div><button className="secondary-button" type="button" onClick={closeCharacterForm}>Close</button></div><OCForm editingOC={editingOC} onCancelEdit={closeCharacterForm} onCreateOC={handleCreateOC} onOpenCharacterNetwork={(ocId) => requestNavigation(() => openOCWorkspace(ocId))} onUnsavedStateChange={setUnsavedEditor} onUpdateOC={handleUpdateOC} /></section></div>
      ) : null}

      <UnsavedChangesDialog open={Boolean(pendingNavigation)} onCancel={handleCancelNavigation} onDiscard={handleDiscardAndContinue} onSave={handleSaveAndContinue} />
    </div>
  );

  function setAndSaveAppSettings(nextSettings) {
    setAppSettings(nextSettings);
    saveAppSettings(nextSettings);
  }
}

function DeveloperPreviewSwitch({ appSettings, detectedMobile, isMobile, onSettingsChange }) {
  if (import.meta.env.PROD) return null;

  function updatePreviewMode(event) {
    onSettingsChange({ ...appSettings, previewMode: event.target.value });
  }

  return (
    <aside className="preview-switch dev-preview-toolbar" aria-label="Development preview mode">
      <label>
        <span>Preview</span>
        <select value={appSettings.previewMode || "auto"} onChange={updatePreviewMode}>
          <option value="auto">Auto</option>
          <option value="desktop">Desktop Preview</option>
          <option value="mobile">Mobile Preview</option>
        </select>
      </label>
      <small>{isMobile ? "Mobile layout" : "Desktop layout"} · detected {detectedMobile ? "mobile" : "desktop"}</small>
    </aside>
  );
}

function MobileNavigation({ activeSection, onNavigate }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const items = [["dashboard", "Dashboard", "grid"], ["library", "Characters", "user"], ["worlds", "Worlds", "map"], ["favorites", "Favorites", "star"]];

  return (
    <>
      {moreOpen ? (
        <div className="mobile-more-menu">
          <button type="button" onClick={() => { setMoreOpen(false); onNavigate("settings"); }}>Settings</button>
          <button type="button" disabled>Archive</button>
        </div>
      ) : null}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {items.map(([id, label, icon]) => <button className={activeSection === id ? "mobile-nav-link active" : "mobile-nav-link"} key={id} type="button" onClick={() => { setMoreOpen(false); onNavigate(id); }}><span className={`mobile-nav-icon ${icon}`} aria-hidden="true" /><span>{label}</span></button>)}
        <button className={activeSection === "settings" ? "mobile-nav-link active" : "mobile-nav-link"} type="button" onClick={() => setMoreOpen((open) => !open)}><span className="mobile-nav-icon more" aria-hidden="true" /><span>More</span></button>
      </nav>
    </>
  );
}

function UnsavedChangesDialog({ onCancel, onDiscard, onSave, open }) {
  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-dialog-title"><h2 id="unsaved-dialog-title">Unsaved Changes</h2><p>You have unsaved changes.</p><p>What would you like to do?</p><div className="dialog-actions"><button className="primary-button" type="button" onClick={onSave}>Save and Continue</button><button className="danger-outline-button" type="button" onClick={onDiscard}>Discard Changes</button><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button></div></section></div>;
}

function GlobalSettings({ appSettings, onSettingsChange }) {
  function updateNightMood(event) {
    onSettingsChange({ ...appSettings, nightMood: event.target.checked });
  }

  function updatePreviewMode(event) {
    onSettingsChange({ ...appSettings, previewMode: event.target.value });
  }

  return <section className="panel list-panel settings-page"><div className="library-topbar"><div><p className="eyebrow">App mood</p><h2>Settings</h2><p className="muted-text">Global app settings for the whole studio.</p></div></div><article className="settings-option-card"><div><h3>Night Mood</h3><p className="muted-text">A darker, calmer interface for late writing sessions.</p></div><label className="toggle-switch"><input type="checkbox" checked={Boolean(appSettings.nightMood)} onChange={updateNightMood} /><span>Night Mood</span></label></article><article className="settings-option-card"><div><h3>Development Preview</h3><p className="muted-text">Temporarily force desktop or mobile layouts while building.</p></div><label className="field settings-select-field"><span>Preview mode</span><select value={appSettings.previewMode || "auto"} onChange={updatePreviewMode}><option value="auto">Auto</option><option value="desktop">Desktop Preview</option><option value="mobile">Mobile Preview</option></select></label></article></section>;
}

function getSectionTitle(section) {
  if (section === "dashboard") return "Dashboard";
  if (section === "worlds") return "Worlds";
  if (section === "favorites") return "Favorites";
  if (section === "settings") return "Settings";
  return "Characters";
}

function getAppSettings() {
  try {
    const stored = localStorage.getItem(APP_SETTINGS_KEY);
    return stored ? { nightMood: false, previewMode: "auto", ...JSON.parse(stored) } : { nightMood: false, previewMode: "auto" };
  } catch (error) {
    console.error("Could not load app settings:", error);
    return { nightMood: false, previewMode: "auto" };
  }
}

function saveAppSettings(settings) {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Could not save app settings:", error);
  }
}





