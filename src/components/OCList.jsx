import EmptyState from "./EmptyState.jsx";
import { getBirthLabel } from "../utils/age.js";

export default function OCList({
  fandomFilter,
  fandoms,
  ocs,
  searchTerm,
  totalCount,
  onCreateCharacter,
  onFandomFilterChange,
  onOpenWorkspace,
  onSearchTermChange
}) {
  return (
    <section className="panel list-panel character-library-panel library-page-panel">
      <div className="library-topbar library-topbar-integrated">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Characters</h2>
          <p className="muted-text">Browse your OCs, open a workspace, or start building someone new.</p>
        </div>
        <button className="primary-button inline-primary library-create-button" type="button" onClick={onCreateCharacter}>+ New Character</button>
      </div>

      <div className="list-controls library-controls compact-library-controls">
        <label className="filter-field">
          <span>Search characters</span>
          <input value={searchTerm} placeholder="Search by name, world, nickname..." onChange={(event) => onSearchTermChange(event.target.value)} />
        </label>

        <label className="filter-field">
          <span>World</span>
          <select value={fandomFilter} onChange={(event) => onFandomFilterChange(event.target.value)}>
            {fandoms.map((fandom) => <option key={fandom} value={fandom}>{fandom}</option>)}
          </select>
        </label>
      </div>

      {ocs.length > 0 ? <p className="count-line">{ocs.length} of {totalCount} characters visible</p> : null}

      {ocs.length === 0 ? (
        <EmptyState actionLabel="Create your first OC" icon="character" title="No characters yet." message="Create your first OC to begin your universe." onAction={onCreateCharacter} />
      ) : (
        <div className="library-grid compact-character-grid">
          {ocs.map((oc) => <OCLibraryCard key={oc.id} oc={oc} onOpenWorkspace={onOpenWorkspace} />)}
        </div>
      )}
    </section>
  );
}

function OCLibraryCard({ oc, onOpenWorkspace }) {
  const profilePicture = oc.profilePictureData || oc.profilePictureUrl;
  const meta = [getWorldTitle(oc), oc.species, oc.currentAge ? `Age ${oc.currentAge}` : ""].filter(Boolean).join(" | ");

  return (
    <button className="library-card compact-character-card polished-character-card" type="button" onClick={() => onOpenWorkspace(oc.id)}>
      <div className="profile-picture-preview card-picture compact-card-picture">
        {profilePicture ? <img src={profilePicture} alt={oc.name} /> : <span>No picture</span>}
      </div>
      <div className="card-copy">
        <h3 title={oc.name}>{oc.name || "Untitled Character"}</h3>
        <p title={meta}>{meta || "No world connected yet"}</p>
        <small>{getBirthLabel(oc)}</small>
      </div>
    </button>
  );
}

export function getWorldTitle(oc) {
  if (oc.worldType === "Own World") return oc.worldOwnName || "Own World";
  if (oc.worldType === "Alternative Universe / AU") return [oc.worldOriginalUniverse, oc.worldAuTitle].filter(Boolean).join(" - ") || "Alternative Universe / AU";
  if (oc.worldType === "Crossover") return [oc.worldUniverseOne, oc.worldUniverseTwo].filter(Boolean).join(" x ") || "Crossover";
  return oc.worldCanonName || oc.fandom || "No world connected";
}

export function getBirthSummary(oc) {
  return getBirthLabel(oc);
}
