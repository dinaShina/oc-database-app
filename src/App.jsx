import { Component, useEffect, useMemo, useState } from "react";
import useIsMobile from "./hooks/useIsMobile.js";
import CharacterWorkspaceDesktop from "./components/layouts/CharacterWorkspaceDesktop.jsx";
import CharacterWorkspaceMobile from "./components/layouts/CharacterWorkspaceMobile.jsx";
import DashboardDesktop from "./components/layouts/DashboardDesktop.jsx";
import DashboardMobile from "./components/layouts/DashboardMobile.jsx";
import CharactersDesktop from "./components/layouts/CharactersDesktop.jsx";
import CharactersMobile from "./components/layouts/CharactersMobile.jsx";
import BetaAuth from "./components/BetaAuth.jsx";
import ExportDialog from "./components/ExportDialog.jsx";
import FavoritesView from "./components/FavoritesView.jsx";
import OCForm from "./components/OCForm.jsx";
import { getWorldTitle } from "./components/OCList.jsx";
import Sidebar from "./components/Sidebar.jsx";
import WorldLibrary from "./components/WorldLibrary.jsx";
import { getWorlds, saveWorlds, updateWorld } from "./storage/worldRepository.js";
import { deleteFamilyForOC, getFamilyMembers, saveFamilyMembers } from "./storage/familyRepository.js";
import { deleteInspirationForOC, getInspirationItems, saveInspirationItems } from "./storage/inspirationRepository.js";
import { CHARACTER_STORAGE_KEY, createOC, deleteOC, discoverCharacterSources, getOCs, restoreCharactersFromSource, saveOCs, updateOC } from "./storage/ocRepository.js";
import { deleteReferencesForOC, getReferenceItems, saveReferenceItems } from "./storage/referenceRepository.js";
import { deleteRelationshipMapForOC, getRelationshipMaps, saveRelationshipMaps } from "./storage/relationshipMapRepository.js";
import { deleteRelationshipsForOC, getRelationships, saveRelationships } from "./storage/relationshipRepository.js";
import { deleteTimelineReferencesForOC, getTimelineData, saveTimelineData } from "./storage/timelineRepository.js";
import { getRecoverableStorageSources, getStorageManifest, getStorageSnapshot, getStorageStatusForKey, loadFromStorage, saveToStorage, STORAGE_ENGINE } from "./storage/localStorage.js";
import { getActiveWorkspaceTab, getWorkspaceConfigs, saveWorkspaceConfigs } from "./storage/workspaceRepository.js";
import { enableOwnerSeedModeFromUrl, markOwnerSeedsInstalled, restoreMissingOwnerSeeds, shouldInstallOwnerSeeds } from "./storage/ownerSeedRepository.js";
import { APP_PALETTES, getAppThemeStyle } from "./utils/themeContrast.js";
import atlasLoreLogo from "./assets/atlas-lore-logo-original.png";
import { formatDateTime } from "./utils/dateFormat.js";
import { clearSession, createUserCharacter, deleteUserCharacter, downloadJson, fetchUserCharacters, getCurrentUser, getStoredSession, isSupabaseConfigured, requestAccountDeletion, signOut, updateUserCharacter } from "./services/supabaseBeta.js";

const CLEAN_UNSAVED_STATE = { isDirty: false, save: null };
const APP_SETTINGS_KEY = "oc-database-app:app-settings";
const APP_BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  const betaEnabled = isSupabaseConfigured();
  const [authSession, setAuthSession] = useState(() => betaEnabled ? getStoredSession() : null);
  const [authReady, setAuthReady] = useState(!betaEnabled);
  const [betaStatus, setBetaStatus] = useState("");
  const [ocs, setOcs] = useState(() => getOCs());
  const [familyMembers, setFamilyMembers] = useState(() => getFamilyMembers());
  const [relationships, setRelationships] = useState(() => getRelationships());
  const [relationshipMaps, setRelationshipMaps] = useState(() => getRelationshipMaps());
  const [timelineData, setTimelineData] = useState(() => getTimelineData());
  const [inspirationItems, setInspirationItems] = useState(() => getInspirationItems());
  const [referenceItems, setReferenceItems] = useState(() => getReferenceItems());
  const [worldRecords, setWorldRecords] = useState(() => getWorlds());
  const [editingOC, setEditingOC] = useState(null);
  const [activeOCId, setActiveOCId] = useState(() => getInitialActiveOCId());
  const [activeSection, setActiveSection] = useState(() => getInitialAppSection());
  const [fandomFilter, setFandomFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [unsavedEditor, setUnsavedEditor] = useState(CLEAN_UNSAVED_STATE);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [pendingDeleteOCId, setPendingDeleteOCId] = useState(null);
  const [appSettings, setAppSettings] = useState(() => getAppSettings());
  const [ownerSeedMode] = useState(() => enableOwnerSeedModeFromUrl());
  const [workspaceConfigs, setWorkspaceConfigs] = useState(() => getWorkspaceConfigs());
  const [isStorageHydrated, setIsStorageHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState(null);
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => getSystemPrefersDark());
  const detectedMobile = useIsMobile();
  const resolvedThemeMode = appSettings.themeMode === "system" ? (systemPrefersDark ? "dark" : "light") : appSettings.themeMode || (appSettings.nightMood ? "dark" : "light");
  const appThemeStyle = useMemo(() => getAppThemeStyle(appSettings, resolvedThemeMode), [appSettings, resolvedThemeMode]);
  const isMobile = appSettings.previewMode === "mobile" || (appSettings.previewMode !== "desktop" && detectedMobile);
  const DashboardLayout = isMobile ? DashboardMobile : DashboardDesktop;
  const CharactersLayout = isMobile ? CharactersMobile : CharactersDesktop;
  const CharacterWorkspaceLayout = isMobile ? CharacterWorkspaceMobile : CharacterWorkspaceDesktop;

  useEffect(() => {
    setIsStorageHydrated(true);
  }, []);

  useEffect(() => {
    function handleStorageIssue(event) {
      setStorageWarning(event.detail || { message: "Atlas Lore could not save this change locally." });
    }
    window.addEventListener("atlas-storage-error", handleStorageIssue);
    return () => window.removeEventListener("atlas-storage-error", handleStorageIssue);
  }, []);
  useEffect(() => {
    if (!isStorageHydrated || !ownerSeedMode || betaEnabled || !shouldInstallOwnerSeeds()) return;
    const result = restoreMissingOwnerSeeds({ inspirationItems, ocs, relationships, timelineData, worlds: worldRecords });
    persistOCs(result.ocs);
    setWorldRecords(result.worlds);
    setRelationships(result.relationships);
    setTimelineData(result.timelineData);
    setInspirationItems(result.inspirationItems);
    saveWorlds(result.worlds);
    saveRelationships(result.relationships);
    saveTimelineData(result.timelineData);
    saveInspirationItems(result.inspirationItems);
    markOwnerSeedsInstalled(result);
  }, [isStorageHydrated, ownerSeedMode, betaEnabled]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function handleSystemThemeChange(event) {
      setSystemPrefersDark(event.matches);
    }
    media.addEventListener?.("change", handleSystemThemeChange);
    media.addListener?.(handleSystemThemeChange);
    return () => {
      media.removeEventListener?.("change", handleSystemThemeChange);
      media.removeListener?.(handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    if (!betaEnabled) return undefined;
    let cancelled = false;
    async function restoreSession() {
      if (!authSession?.access_token) {
        setAuthReady(true);
        return;
      }
      try {
        const user = await getCurrentUser(authSession);
        if (!user) throw new Error("Session expired");
        const nextSession = { ...authSession, user };
        const betaCharacters = await fetchUserCharacters(nextSession);
        if (!cancelled) {
          setAuthSession(nextSession);
          setOcs(betaCharacters.length > 0 ? betaCharacters : getOCs());
          setAuthReady(true);
        }
      } catch {
        clearSession();
        if (!cancelled) {
          setAuthSession(null);
          setOcs(getOCs());
          setAuthReady(true);
        }
      }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, [authSession?.access_token, betaEnabled]);

  useEffect(() => {
    function handleAppRouteChange() {
      setActiveSection(getInitialAppSection());
      setActiveOCId(getInitialActiveOCId());
      setShowCharacterForm(false);
    }
    window.addEventListener("hashchange", handleAppRouteChange);
    window.addEventListener("popstate", handleAppRouteChange);
    return () => {
      window.removeEventListener("hashchange", handleAppRouteChange);
      window.removeEventListener("popstate", handleAppRouteChange);
    };
  }, []);
  useEffect(() => {
    if (!unsavedEditor.isDirty) return undefined;
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedEditor.isDirty]);

  function persistOCs(nextOCs, options = {}) {
    setOcs(nextOCs);
    if (!betaEnabled && isStorageHydrated) saveOCs(nextOCs, options);
  }

  async function loadBetaCharacters(session = authSession) {
    if (!betaEnabled || !session) return;
    setBetaStatus("Loading private workspace...");
    try {
      const betaCharacters = await fetchUserCharacters(session);
      setOcs(betaCharacters.length > 0 ? betaCharacters : getOCs());
      setBetaStatus("");
    } catch (error) {
      setBetaStatus(error.message || "Could not load beta data.");
    }
  }

  function handleAuthenticated(session) {
    setAuthSession(session);
    loadBetaCharacters(session);
  }
  function navigateToSection(section, settingsCategory = "") {
    setActiveSection(section);
    setActiveOCId(null);
    setShowCharacterForm(false);
    updateAppRoute(section, settingsCategory);
  }
  function openCharacterCreation() {
    setEditingOC(null);
    navigateToSection("library");
    setShowCharacterForm(true);
  }

  async function handleCreateOC(formData) {
    const nextOC = createOC({ ...formData, user_id: authSession?.user?.id || "", visibility: "private" });
    if (betaEnabled) {
      try {
        const savedOC = await createUserCharacter(authSession, nextOC);
        persistOCs([savedOC, ...ocs]);
      } catch (error) {
        window.alert(error.message || "Could not save character.");
        return false;
      }
    } else {
      persistOCs([nextOC, ...ocs]);
    }
    setEditingOC(null);
    setShowCharacterForm(false);
    setUnsavedEditor(CLEAN_UNSAVED_STATE);
    return true;
  }

  async function handleUpdateOC(formData) {
    if (!editingOC) return false;
    const nextOCs = updateOC(ocs, editingOC.id, { ...formData, user_id: authSession?.user?.id || formData.user_id || "", visibility: formData.visibility || "private" });
    if (betaEnabled) {
      try {
        await updateUserCharacter(authSession, nextOCs.find((item) => item.id === editingOC.id));
      } catch (error) {
        window.alert(error.message || "Could not update character.");
        return false;
      }
    }
    persistOCs(nextOCs);
    setEditingOC(null);
    setShowCharacterForm(false);
    setUnsavedEditor(CLEAN_UNSAVED_STATE);
    return true;
  }

  async function updateOCById(id, formData) {
    const nextOCs = updateOC(ocs, id, { ...formData, user_id: authSession?.user?.id || formData.user_id || "", visibility: formData.visibility || "private" });
    persistOCs(nextOCs);
    if (betaEnabled) {
      try {
        await updateUserCharacter(authSession, nextOCs.find((item) => item.id === id));
      } catch (error) {
        window.alert(error.message || "Could not sync character update.");
        loadBetaCharacters();
      }
    }
  }

  function updateWorkspaceConfigs(nextConfigs) {
    setWorkspaceConfigs(nextConfigs);
    saveWorkspaceConfigs(nextConfigs);
  }

  function openOCWorkspace(ocId) {
    updateCharacterWorkspaceRoute(ocId);
    const now = new Date().toISOString();
    setOcs((currentOCs) => {
      const oc = currentOCs.find((item) => item.id === ocId);
      const nextOCs = oc ? updateOC(currentOCs, ocId, { ...oc, lastOpenedAt: now }) : currentOCs;
      if (!betaEnabled && isStorageHydrated) saveOCs(nextOCs);
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
    setPendingDeleteOCId(id);
  }

  async function confirmDeleteOC() {
    const id = pendingDeleteOCId;
    if (!id) return;
    setPendingDeleteOCId(null);
    if (betaEnabled) {
      try {
        await deleteUserCharacter(authSession, id);
      } catch (error) {
        window.alert(error.message || "Could not delete character.");
        return;
      }
    }
    persistOCs(deleteOC(ocs, id), { allowEmpty: true });
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

  function exportAccountData() {
    downloadJson("atlas-archive-account-data.json", {
      exportedAt: new Date().toISOString(),
      settings: appSettings,
      characters: ocs,
      worlds: worldRecords,
      timelines: timelineData,
      inspirationItems,
      referenceItems,
      relationships,
      relationshipMaps,
      familyMembers
    });
  }

  function downloadEmergencyBackup() {
    downloadJson("atlas-archive-emergency-backup.json", {
      exportedAt: new Date().toISOString(),
      storageSnapshot: getStorageSnapshot(),
      characterSources: discoverCharacterSources(),
      recoverableSources: getRecoverableStorageSources()
    });
  }

  function restoreMyCharacters() {
    const result = restoreMissingOwnerSeeds({ inspirationItems, ocs, relationships, timelineData, worlds: worldRecords });
    persistOCs(result.ocs);
    setWorldRecords(result.worlds);
    setRelationships(result.relationships);
    setTimelineData(result.timelineData);
    setInspirationItems(result.inspirationItems);
    saveWorlds(result.worlds);
    saveRelationships(result.relationships);
    saveTimelineData(result.timelineData);
    saveInspirationItems(result.inspirationItems);
    markOwnerSeedsInstalled(result);
    window.alert(`Restore complete. Added ${result.addedCharacters} characters, ${result.addedWorlds} worlds, ${result.addedTimelines} timelines, ${result.addedTimelineEvents} timeline events, ${result.addedRelationships} relationships, ${result.addedInspirationItems} inspiration items, and ${result.addedWritingEntries} story notes. Existing edited records were not overwritten.`);
  }
  function restoreLocalCharacters(sourceKey) {
    const confirmed = window.confirm(`Restore and merge characters from ${sourceKey}? A backup of current characters will be created first.`);
    if (!confirmed) return;
    const restored = restoreCharactersFromSource(sourceKey, ocs);
    setOcs(restored);
    window.alert(`Restore complete. Characters now in library: ${restored.length}`);
  }

  async function handleSignOut() {
    await signOut(authSession);
    setAuthSession(null);
    setOcs(getOCs());
    navigateToSection("dashboard");
  }

  async function handleAccountDeletionRequest() {
    const confirmed = window.confirm("Request account deletion? Export your data first if you want a copy.");
    if (!confirmed) return;
    try {
      await requestAccountDeletion(authSession);
      window.alert("Deletion request saved. Add your contact email in the legal/contact settings before beta launch.");
    } catch (error) {
      window.alert(error.message || "Could not save the account deletion request.");
    }
  }

  if (betaEnabled && !authReady) return <main className="beta-auth-page"><section className="beta-auth-card"><h1>Loading Atlas Lore...</h1></section></main>;
  if (betaEnabled && !authSession?.access_token) return <><BetaAuth onAuthenticated={handleAuthenticated} /><LegalFooter /></>;

  return (
    <div className={`${resolvedThemeMode === "dark" ? "app-frame night-mood" : "app-frame"} palette-${slugifyAppPalette(appSettings.paletteName || "Soft Neutral")} ${isMobile ? "mobile-preview-active" : "desktop-preview-active"}`} data-theme-mode={resolvedThemeMode} style={appThemeStyle}>
      {!isMobile ? <Sidebar activeSection={activeSection} hasUnsavedChanges={unsavedEditor.isDirty} onNavigate={(section) => requestNavigation(() => navigateToSection(section))} /> : null}
      <main className="app-shell">
        <header className="app-header">
          <div>
            <p className="eyebrow">Atlas Lore</p>
            <div className="header-title-row">
              <h1>{activeOC ? activeOC.name : getSectionTitle(activeSection)}</h1>
              {unsavedEditor.isDirty ? <span className="unsaved-indicator">Unsaved Changes</span> : null}
            </div>
          </div>
          <div className="app-header-side">
            <p className="app-summary">A focused lore studio for characters, worlds, timelines, and stories.</p>
            <div className="top-account-actions">
              <button className="secondary-button inline-primary" type="button" onClick={() => requestNavigation(() => navigateToSection("account"))}>Account</button>
              {betaEnabled && authSession?.access_token ? <button className="text-button" type="button" onClick={handleSignOut}>Sign out</button> : null}
            </div>
          </div>
          {betaStatus ? <p className="beta-status-line">{betaStatus}</p> : null}
        </header>

        {storageWarning ? <StorageWarningBanner message={storageWarning.message} onBackup={downloadEmergencyBackup} onDismiss={() => setStorageWarning(null)} /> : null}

        {activeOC ? (
          <CharacterWorkspaceLayout familyMembers={familyMembers} inspirationItems={inspirationItems} oc={activeOC} ocs={ocs} onBack={() => requestNavigation(() => { setActiveOCId(null); updateAppRoute(activeSection); })} onDeleteOC={handleDeleteOC} onFamilyMembersChange={setFamilyMembers} onInspirationItemsChange={setInspirationItems} onOCUpdate={updateOCById} onReferenceItemsChange={setReferenceItems} onRelationshipMapsChange={setRelationshipMaps} onRelationshipsChange={setRelationships} onRequestNavigation={requestNavigation} onTimelineDataChange={setTimelineData} onUnsavedStateChange={setUnsavedEditor} referenceItems={referenceItems} relationshipMaps={relationshipMaps} relationships={relationships} timelineData={timelineData} workspaceConfigs={workspaceConfigs} onWorkspaceConfigsChange={updateWorkspaceConfigs} />
        ) : activeSection === "dashboard" ? (
          <DashboardLayout ocs={ocs} onCreateOC={openCharacterCreation} onCreateStory={() => requestNavigation(() => navigateToSection("library"))} onCreateTimeline={() => requestNavigation(() => navigateToSection("library"))} onCreateWorld={() => requestNavigation(() => navigateToSection("worlds"))} onOpenOC={(ocId) => requestNavigation(() => openOCWorkspace(ocId))} timelineData={timelineData} worlds={worldRecords} />
        ) : activeSection === "worlds" ? (
          <WorldLibrary ocs={ocs} onTimelineDataChange={setTimelineData} onWorldsChange={setWorldRecords} timelineData={timelineData} worlds={worldRecords} />
        ) : activeSection === "favorites" ? (
          <FavoritesView ocs={ocs} onOpenOC={(ocId) => requestNavigation(() => openOCWorkspace(ocId))} onToggleOCFavorite={toggleOCFavorite} onToggleWorldFavorite={toggleWorldFavorite} timelineData={timelineData} worlds={worldRecords} />
        ) : activeSection === "account" ? (
          <AccountPage authSession={authSession} betaEnabled={betaEnabled} onNavigate={navigateToSection} onSignOut={handleSignOut} />
        ) : activeSection === "settings" ? (
          <SettingsErrorBoundary><GlobalSettings appSettings={appSettings} authSession={authSession} betaEnabled={betaEnabled} exportData={{ familyMembers, inspirationItems, ocs, relationshipMaps, relationships, timelineData, worlds: worldRecords }} onAccountDeletionRequest={handleAccountDeletionRequest} onEmergencyBackup={downloadEmergencyBackup} onExportAccountData={exportAccountData} onNavigate={navigateToSection} onRestoreCharacters={restoreLocalCharacters} onRestoreMyCharacters={restoreMyCharacters} ownerSeedMode={ownerSeedMode} onSettingsChange={setAndSaveAppSettings} onSignOut={handleSignOut} /></SettingsErrorBoundary>
        ) : (
          <CharactersLayout fandomFilter={fandomFilter} fandoms={worlds} ocs={visibleOCs} searchTerm={searchTerm} totalCount={ocs.length} onCreateCharacter={openCharacterCreation} onFandomFilterChange={(nextFilter) => requestNavigation(() => setFandomFilter(nextFilter))} onOpenWorkspace={(ocId) => requestNavigation(() => openOCWorkspace(ocId))} onSearchTermChange={setSearchTerm} />
        )}
      </main>

      <DeveloperPreviewSwitch appSettings={appSettings} detectedMobile={detectedMobile} isMobile={isMobile} onSettingsChange={setAndSaveAppSettings} />
      <MobileLayoutEscape appSettings={appSettings} detectedMobile={detectedMobile} onSettingsChange={setAndSaveAppSettings} />

      {isMobile ? <MobileNavigation activeSection={activeSection} onNavigate={(section) => requestNavigation(() => navigateToSection(section))} /> : null}

      {showCharacterForm ? (
        <div className="dialog-backdrop" role="presentation"><section className={isMobile ? "large-modal mobile-fullscreen-modal" : "large-modal"} role="dialog" aria-modal="true" aria-labelledby="character-form-title"><div className="modal-heading-row"><div><p className="eyebrow">Characters</p><h2 id="character-form-title">New Character</h2></div><button className="secondary-button" type="button" onClick={closeCharacterForm}>Close</button></div><OCForm editingOC={editingOC} onCancelEdit={closeCharacterForm} onCreateOC={handleCreateOC} onOpenCharacterNetwork={(ocId) => requestNavigation(() => openOCWorkspace(ocId))} onUnsavedStateChange={setUnsavedEditor} onUpdateOC={handleUpdateOC} /></section></div>
      ) : null}

      <UnsavedChangesDialog open={Boolean(pendingNavigation)} onCancel={handleCancelNavigation} onDiscard={handleDiscardAndContinue} onSave={handleSaveAndContinue} />
      <DeleteCharacterDialog character={ocs.find((item) => item.id === pendingDeleteOCId)} onCancel={() => setPendingDeleteOCId(null)} onDelete={confirmDeleteOC} open={Boolean(pendingDeleteOCId)} />
      <LegalFooter onNavigate={(section, category) => requestNavigation(() => navigateToSection(section, category))} />
    </div>
  );

  function setAndSaveAppSettings(nextSettings) {
    setAppSettings(nextSettings);
    saveAppSettings(nextSettings);
  }
}

function StorageWarningBanner({ message, onBackup, onDismiss }) {
  return (
    <section className="storage-warning-banner" role="alert">
      <div>
        <strong>Local storage needs attention</strong>
        <p>{message}</p>
      </div>
      <div className="storage-warning-actions">
        <button className="primary-button inline-primary" type="button" onClick={onBackup}>Download Backup</button>
        <button className="secondary-button" type="button" onClick={onDismiss}>Dismiss</button>
      </div>
    </section>
  );
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
      <small>{isMobile ? "Mobile layout" : "Desktop layout"} - detected {detectedMobile ? "mobile" : "desktop"}</small>
    </aside>
  );
}

function MobileLayoutEscape({ appSettings, detectedMobile, onSettingsChange }) {
  if (!detectedMobile || appSettings.previewMode !== "desktop") return null;

  return (
    <button
      className="mobile-layout-escape"
      type="button"
      onClick={() => onSettingsChange({ ...appSettings, previewMode: "mobile" })}
    >
      Switch to Mobile Layout
    </button>
  );
}
function MobileNavigation({ activeSection, onNavigate }) {
  const items = [["dashboard", "Dashboard", "grid"], ["library", "Characters", "user"], ["worlds", "Worlds", "map"], ["favorites", "Favorites", "star"], ["settings", "Settings", "settings"]];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map(([id, label, icon]) => {
        const isActive = activeSection === id;

        return (
          <button
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
            className={isActive ? "mobile-nav-link active" : "mobile-nav-link"}
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
          >
            <span className={`mobile-nav-icon ${icon}`} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function UnsavedChangesDialog({ onCancel, onDiscard, onSave, open }) {
  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-dialog-title"><h2 id="unsaved-dialog-title">Unsaved Changes</h2><p>You have unsaved changes.</p><p>What would you like to do?</p><div className="dialog-actions"><button className="primary-button" type="button" onClick={onSave}>Save and Continue</button><button className="danger-outline-button" type="button" onClick={onDiscard}>Discard Changes</button><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button></div></section></div>;
}

function AccountPage({ authSession, betaEnabled, onNavigate, onSignOut }) {
  const accountEmail = authSession?.user?.email || "Not connected yet";

  return (
    <section className="account-page">
      <header className="account-hero panel">
        <div className="atlas-logo-mark account-logo-mark" aria-hidden="true"><img className="atlas-logo-image" src={atlasLoreLogo} alt="" /></div>
        <div>
          <p className="eyebrow">Atlas Lore Account</p>
          <h2>Account</h2>
          <p className="muted-text">Future profile, login, cloud sync, and multi-device features will live here. Authentication is not implemented yet.</p>
        </div>
        <span className="coming-soon-pill">Coming Soon</span>
      </header>

      <div className="account-section-grid account-profile-grid">
        <section className="panel account-info-card">
          <p className="eyebrow">Profile</p>
          <h3>User Profile</h3>
          <dl className="account-fact-list">
            <div><dt>Email</dt><dd>{accountEmail}</dd></div>
            <div><dt>Username</dt><dd>Reserved for future profiles</dd></div>
            <div><dt>Avatar</dt><dd>Profile image upload planned</dd></div>
          </dl>
        </section>

        <section className="panel account-info-card">
          <p className="eyebrow">Cloud Sync</p>
          <h3>Multiple Devices</h3>
          <p className="muted-text">Cloud synchronization, backup history, device recovery, and account restore will connect here later.</p>
          <span className="coming-soon-pill">Cloud Sync Coming Soon</span>
        </section>

        <section className="panel account-info-card">
          <p className="eyebrow">Authentication</p>
          <h3>Login / Register</h3>
          <p className="muted-text">Login, registration, password reset, and email verification are prepared as interface areas only.</p>
          <div className="account-action-grid">
            <span className="coming-soon-pill">Login Coming Soon</span>
            <span className="coming-soon-pill">Register Coming Soon</span>
            <span className="coming-soon-pill">Password Reset Coming Soon</span>
          </div>
        </section>

        <section className="panel account-info-card">
          <p className="eyebrow">Account Data</p>
          <h3>Privacy and data tools</h3>
          <p className="muted-text">Data export, backup, restore, and deletion controls stay in Settings until account storage is connected.</p>
          <div className="account-action-grid">
            <button className="secondary-button inline-primary" type="button" onClick={() => onNavigate("settings", "data")}>Open Data & Storage</button>
            {betaEnabled && authSession?.access_token ? <button className="secondary-button inline-primary" type="button" onClick={onSignOut}>Sign out</button> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
function DeleteCharacterDialog({ character, onCancel, onDelete, open }) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="confirm-dialog delete-character-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-character-title">
        <h2 id="delete-character-title">Delete Character</h2>
        <p>Are you sure you want to permanently delete {character?.name || "this character"}?</p>
        <p className="muted-text">This action cannot be undone.</p>
        <div className="dialog-actions horizontal-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="delete-button" type="button" onClick={onDelete}>Delete</button>
        </div>
      </section>
    </div>
  );
}
class SettingsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="settings-page settings-grouped-page">
          <section className="panel settings-group-card settings-error-card">
            <p className="eyebrow">Settings</p>
            <h2>Settings could not load</h2>
            <p className="muted-text">The rest of the app is still safe. Try refreshing once; if it happens again, the Settings section has a local rendering error.</p>
          </section>
        </section>
      );
    }
    return this.props.children;
  }
}

function GlobalSettings({ appSettings, authSession, betaEnabled, exportData, onAccountDeletionRequest, onEmergencyBackup, onExportAccountData, onRestoreCharacters, onRestoreMyCharacters, onSettingsChange, onSignOut, ownerSeedMode }) {
  const isSettingsMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState(() => getSettingsCategoryFromLocation() || "appearance");
  const storageManifest = getStorageManifest();
  const storedAreaCount = Object.keys(storageManifest.keys || {}).length;
  const paletteNames = Object.keys(APP_PALETTES);
  const characterSources = discoverCharacterSources();
  const characterStorageStatus = getStorageStatusForKey(CHARACTER_STORAGE_KEY);

  useEffect(() => {
    function handleRouteChange() {
      setActiveCategory(getSettingsCategoryFromLocation() || "appearance");
    }
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  function openCategory(category) {
    setActiveCategory(category);
    updateAppRoute("settings", category);
  }

  function updateThemeMode(mode) {
    onSettingsChange({ ...appSettings, themeMode: mode, nightMood: mode === "dark" });
  }

  function updatePalette(event) {
    onSettingsChange({ ...appSettings, paletteName: event.target.value });
  }

  function updatePreviewMode(event) {
    onSettingsChange({ ...appSettings, previewMode: event.target.value });
  }

  const groups = [
    {
      id: "appearance",
      title: "Appearance",
      eyebrow: "Theme",
      summary: "Choose the global Atlas Lore mode and interface palette.",
      content: (
        <>
          <div className="theme-mode-grid" role="radiogroup" aria-label="Application theme mode">
            {[
              ["light", "Light", "Bright paper surfaces"],
              ["dark", "Dark", "Low-light writing"],
              ["system", "System", "Follow this device"]
            ].map(([mode, label, help]) => <button className={appSettings.themeMode === mode ? "theme-mode-card active" : "theme-mode-card"} key={mode} type="button" onClick={() => updateThemeMode(mode)}><span className={`theme-preview-dot ${mode}`} aria-hidden="true" /><strong>{label}</strong><small>{help}</small></button>)}
          </div>
          <label className="field settings-select-field"><span>App Color Palette</span><select value={appSettings.paletteName || "Soft Neutral"} onChange={updatePalette}>{paletteNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
          <div className="app-palette-preview-grid">
            {paletteNames.map((name) => {
              const light = APP_PALETTES[name].light;
              const dark = APP_PALETTES[name].dark;
              return <button className={appSettings.paletteName === name ? "palette-choice-card active" : "palette-choice-card"} key={name} type="button" onClick={() => onSettingsChange({ ...appSettings, paletteName: name })}><strong>{name}</strong><span><i style={{ background: light.bg }} /><i style={{ background: light.surface }} /><i style={{ background: light.accent }} /><i style={{ background: dark.bg }} /><i style={{ background: dark.accent }} /></span></button>;
            })}
          </div>
          <label className="field settings-select-field"><span>Development preview mode</span><select value={appSettings.previewMode || "auto"} onChange={updatePreviewMode}><option value="auto">Auto</option><option value="desktop">Desktop Preview</option><option value="mobile">Mobile Preview</option></select></label>
        </>
      )
    },
    {
      id: "data",
      title: "Data & Storage",
      eyebrow: "Storage",
      summary: "Export and storage status for your current workspace.",
      content: (
        <>
          <div className="storage-status-grid">
            <article><strong>{betaEnabled ? "Supabase + local recovery" : STORAGE_ENGINE}</strong><span>Current storage</span></article>
            <article><strong>{exportData?.ocs?.length || 0}</strong><span>Characters loaded now</span></article>
            <article><strong>{storedAreaCount}</strong><span>Saved app areas</span></article>
            <article><strong>{characterStorageStatus.lastSuccessfulSave ? formatDateTime(characterStorageStatus.lastSuccessfulSave) : "Not saved yet"}</strong><span>Last character save</span></article>
            <article><strong>{characterStorageStatus.lastBackup ? formatDateTime(characterStorageStatus.lastBackup) : "No backup yet"}</strong><span>Last character backup</span></article>
            <article><strong>{characterStorageStatus.error || "None"}</strong><span>Storage error</span></article>
          </div>
          <div className="account-action-grid"><button className="primary-button inline-primary" type="button" onClick={onExportAccountData}>Export data backup</button>{ownerSeedMode ? <button className="secondary-button inline-primary" type="button" onClick={onRestoreMyCharacters}>Restore My Characters</button> : null}<button className="secondary-button inline-primary" type="button" onClick={onEmergencyBackup}>Download Emergency Backup</button><span className="coming-soon-pill">Import from file Coming Soon</span><span className="coming-soon-pill">Recently Deleted Coming Soon</span><span className="coming-soon-pill danger-pill">Reset Data Coming Soon</span></div>
          <section className="recovery-panel">
            <div><h3>Recover Local Data</h3><p className="muted-text">Found Atlas Lore and legacy browser-storage sources. Restoring merges by character ID and creates a backup first.</p></div>
            <div className="recovery-source-list">
              {characterSources.length ? characterSources.map((source) => <article className="recovery-source-card" key={source.key}><div><strong>{source.key}</strong><span>{source.ok ? `${source.characterCount} characters found` : `Unreadable data preserved: ${source.error}`}</span></div>{source.ok && source.characterCount > 0 ? <button className="secondary-button" type="button" onClick={() => onRestoreCharacters(source.key)}>Restore / Merge</button> : <span className="coming-soon-pill">No restorable data</span>}</article>) : <p className="muted-text">No local character backups or legacy keys were found in this browser.</p>}
            </div>
          </section>
        </>
      )
    },
    {
      id: "account",
      title: "Account",
      eyebrow: "Profile",
      summary: betaEnabled ? "Sign-in and private beta account actions." : "Local development mode is active.",
      content: (
        <>
          <div className="storage-status-grid"><article><strong>{authSession?.user?.email || "Not signed in"}</strong><span>Current account</span></article><article><strong>{betaEnabled ? "Private beta" : "Local only"}</strong><span>Mode</span></article><article><strong>{exportData?.ocs?.length || 0}</strong><span>Characters</span></article></div>
          <div className="account-action-grid"><button className="primary-button inline-primary" type="button" onClick={onExportAccountData}>Export my data as JSON</button>{betaEnabled ? <button className="secondary-button inline-primary" type="button" onClick={onSignOut}>Sign out from current device</button> : null}<button className="danger-outline-button" type="button" onClick={onAccountDeletionRequest}>Delete account request</button></div>
        </>
      )
    },
    {
      id: "privacy",
      title: "Privacy & Legal",
      eyebrow: "Legal",
      summary: "Privacy, beta terms, contact, and account-data information.",
      content: <div className="legal-link-row"><a href={buildAppHref("privacy")}>Privacy Policy</a><a href={buildAppHref("terms")}>Beta Terms</a><a href={buildAppHref("contact")}>Contact</a><a href={buildAppHref("settings/data")}>Data & Backup</a></div>
    },
    {
      id: "about",
      title: "About",
      eyebrow: "Atlas Lore",
      summary: "What is ready now and what stays prepared for later.",
      content: <><div className="prepared-grid compact-prepared-grid">{["Notebook mode", "Fantasy themes", "Export formats", "Backend sync"].map((item) => <article className="prepared-card future-setting-card" key={item}><h3>{item}</h3><p className="muted-text">Prepared for a later step.</p></article>)}</div><div className="legal-link-row"><button className="secondary-button inline-primary" type="button" onClick={() => onNavigate("account")}>Open Account Page</button><a href={buildAppHref("privacy")}>Privacy Policy</a><a href={buildAppHref("terms")}>Beta Terms</a><a href={buildAppHref("contact")}>Contact</a></div></>
    }
  ];

  const settingsGroups = groups.filter((group) => ["appearance", "data", "about"].includes(group.id));
  const selectedGroup = settingsGroups.find((group) => group.id === activeCategory) || settingsGroups[0];

  return (
    <section className="settings-page settings-grouped-page settings-accordion-page">
      <header className="settings-clean-header">
        <p className="eyebrow">Application</p>
        <h2>Settings</h2>
        <p className="muted-text">Adjust appearance, data tools, and development options without crowding the page.</p>
      </header>
      {settingsGroups.map((group) => (
        <SettingsGroupCard
          defaultOpen={group.id === selectedGroup.id}
          group={group}
          key={group.id}
          onOpen={() => openCategory(group.id)}
        />
      ))}
    </section>
  );
}
function SettingsGroupCard({ defaultOpen = false, group, onOpen }) {
  function handleToggle(event) {
    if (event.currentTarget.open) onOpen?.();
  }

  return (
    <details className="panel settings-group-card settings-accordion-card" id={group.id === "data" ? "data-account" : undefined} open={defaultOpen} onToggle={handleToggle}>
      <summary>
        <span><p className="eyebrow">{group.eyebrow}</p><h2>{group.title}</h2><small>{group.summary}</small></span>
        <span className="settings-accordion-chevron" aria-hidden="true">&gt;</span>
      </summary>
      <div className="settings-accordion-content">{group.content}</div>
    </details>
  );
}
function getInitialActiveOCId() {
  if (typeof window === "undefined") return null;
  const match = window.location.hash.match(/^#character\/([^/]+)(?:\/[^/]+)?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function updateCharacterWorkspaceRoute(ocId) {
  if (typeof window === "undefined" || !ocId) return;
  const tab = getActiveWorkspaceTab(ocId) || "Profile";
  const nextPath = `${buildAppHref("")}#character/${encodeURIComponent(ocId)}/${toWorkspaceRouteSlug(tab)}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current !== nextPath) window.history.pushState(null, "", nextPath);
}

function toWorkspaceRouteSlug(tab) {
  return String(tab || "Profile").toLowerCase().replace(/\s+/g, "-");
}
function getInitialAppSection() {
  if (typeof window === "undefined") return "dashboard";
  const route = getCurrentAppRoute();
  if (route.startsWith("account") || route.startsWith("settings/account")) return "account";
  if (route.startsWith("settings")) return "settings";
  if (route.startsWith("character/")) return "library";
  if (route.startsWith("worlds")) return "worlds";
  if (route.startsWith("favorites")) return "favorites";
  if (route.startsWith("characters") || route.startsWith("library")) return "library";
  return "dashboard";
}

function getCurrentAppRoute() {
  const hashRoute = getHashRoute();
  if (hashRoute) return hashRoute;
  return stripBasePath(window.location.pathname);
}

function getHashRoute() {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash || "";
  if (!hash.startsWith("#/")) return "";
  return hash.slice(2).replace(/^\/+/, "").replace(/\/+$/, "");
}

function stripBasePath(pathname) {
  const normalizedBase = APP_BASE_PATH || "";
  let path = pathname || "/";
  if (normalizedBase && path.startsWith(normalizedBase)) path = path.slice(normalizedBase.length) || "/";
  return path.replace(/^\/+/, "").replace(/\/+$/, "");
}

function updateAppRoute(section, settingsCategory = "") {
  if (typeof window === "undefined") return;
  const routeMap = { dashboard: "", library: "characters", worlds: "worlds", favorites: "favorites", account: "account", settings: settingsCategory ? `settings/${settingsCategory}` : "settings" };
  const route = routeMap[section] ?? "characters";
  const nextPath = buildAppHref(route);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current !== nextPath) window.history.pushState(null, "", nextPath);
}

function getSettingsCategoryFromLocation() {
  if (typeof window === "undefined") return "";
  const route = getCurrentAppRoute();
  const match = route.match(/^settings\/(appearance|privacy|data|application|about)$/);
  if (match) return match[1];
  if (window.location.hash === "#data-account") return "data";
  return "";
}

function buildAppHref(route = "") {
  const base = `${APP_BASE_PATH}/`.replace(/\/+/g, "/") || "/";
  const cleanRoute = String(route || "").replace(/^\/+/, "").replace(/\/+$/, "");
  return cleanRoute ? `${base}#/${cleanRoute}` : base;
}
function getSectionTitle(section) {
  if (section === "dashboard") return "Dashboard";
  if (section === "worlds") return "Worlds";
  if (section === "favorites") return "Favorites";
  if (section === "settings") return "Settings";
  return "Characters";
}

function getSystemPrefersDark() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function slugifyAppPalette(name) {
  return String(name || "Soft Neutral").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "soft-neutral";
}
function getAppSettings() {
  const settings = loadFromStorage(APP_SETTINGS_KEY, { themeMode: "light", paletteName: "Soft Neutral", nightMood: false, previewMode: "auto" });
  return {
    themeMode: settings.themeMode || (settings.nightMood ? "dark" : "light"),
    paletteName: settings.paletteName || "Soft Neutral",
    nightMood: Boolean(settings.nightMood),
    previewMode: settings.previewMode || "auto"
  };
}
function saveAppSettings(settings) {
  saveToStorage(APP_SETTINGS_KEY, settings);
}










function LegalFooter({ onNavigate } = {}) {
  const [legalPage, setLegalPage] = useState(() => getLegalPageFromLocation());

  useEffect(() => {
    function handleRouteChange() {
      setLegalPage(getLegalPageFromLocation());
    }
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  function openLegalPage(event, page) {
    event.preventDefault();
    window.history.pushState(null, "", buildAppHref(page));
    setLegalPage(page);
  }

  function openDataSettings(event) {
    event.preventDefault();
    if (onNavigate) {
      onNavigate("settings", "data");
      return;
    }
    window.history.pushState(null, "", buildAppHref("settings/data"));
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function closeLegalPage() {
    window.history.pushState(null, "", buildAppHref(""));
    setLegalPage("");
  }

  return (
    <>
      <footer className="legal-footer">
        <a href={buildAppHref("privacy")} onClick={(event) => openLegalPage(event, "privacy")}>Privacy Policy</a>
        <a href={buildAppHref("terms")} onClick={(event) => openLegalPage(event, "terms")}>Terms / Beta Rules</a>
        <a href={buildAppHref("contact")} onClick={(event) => openLegalPage(event, "contact")}>Contact</a>
        <a href={buildAppHref("settings/data")} onClick={openDataSettings}>Data & Account Settings</a>
      </footer>
      {legalPage ? <LegalDialog page={legalPage} onClose={closeLegalPage} /> : null}
    </>
  );
}
function LegalDialog({ onClose, page }) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="legal-dialog" role="dialog" aria-modal="true" aria-labelledby="legal-dialog-title">
        <div className="modal-heading-row"><h2 id="legal-dialog-title">{getLegalTitle(page)}</h2><button className="secondary-button" type="button" onClick={onClose}>Close</button></div>
        {page === "privacy" ? <PrivacyPolicyPlaceholder /> : page === "terms" ? <TermsPlaceholder /> : <ContactPlaceholder />}
      </section>
    </div>
  );
}

function PrivacyPolicyPlaceholder() {
  const sections = [
    "Controller/contact details: TODO add site owner name, address if required, and contact email.",
    "Hosting: TODO describe GitHub Pages hosting and any domain provider.",
    "Supabase authentication and database: TODO add Supabase project region, processor details, and data processing agreement status.",
    "Account email: used for sign-in, password reset, and account security.",
    "Server and security logs: TODO define which logs exist and retention period.",
    "Uploaded character content and images: user-created OC data, worlds, timelines, stories, inspiration, and uploaded media may be stored.",
    "Purpose and legal basis: TODO choose valid legal basis before launch.",
    "Storage periods: TODO define retention for active accounts, deletion requests, backups, and logs.",
    "Recipients/processors: TODO list Supabase, GitHub, and any other processors.",
    "Possible third-country transfers: TODO describe transfer safeguards if applicable.",
    "User rights: TODO add rights applicable to your jurisdiction.",
    "Account and data deletion: users can export data and request deletion from Data & Account Settings.",
    "Data export: JSON export is available in Settings.",
    "Complaint rights: TODO add competent supervisory authority if applicable.",
    "Policy update date: TODO add date before launch."
  ];
  return <div className="legal-copy"><p className="muted-text">Placeholder for private beta. Complete all TODO fields before public launch.</p>{sections.map((section) => <p key={section}>{section}</p>)}</div>;
}

function TermsPlaceholder() {
  return <div className="legal-copy"><p>TODO: Add beta rules, acceptable use, content ownership, account responsibilities, tester expectations, and support limits before public launch.</p><p>Private beta defaults: no public profiles, no public search indexing, no shared demo account, and no editing another tester's content.</p></div>;
}

function ContactPlaceholder() {
  return <div className="legal-copy"><p>TODO: Add the site owner's contact email and response expectations for private beta testers.</p></div>;
}

function getLegalPageFromLocation() {
  if (typeof window === "undefined") return "";
  const path = stripBasePath(window.location.pathname);
  const pathMatch = path.match(/^(privacy|terms|contact)$/);
  if (pathMatch) return pathMatch[1];
  const hashMatch = window.location.hash.match(/^#legal\/(privacy|terms|contact)$/);
  return hashMatch?.[1] || "";
}

function getLegalTitle(page) {
  if (page === "privacy") return "Privacy Policy";
  if (page === "terms") return "Terms / Beta Rules";
  return "Contact";
}



















































