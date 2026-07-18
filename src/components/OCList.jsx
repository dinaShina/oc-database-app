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
    <section className="panel list-panel character-library-panel">
      <div className="library-topbar">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Characters</h2>
          <p className="muted-text">A calmer shelf for your OCs. Open a card to work inside the character workspace.</p>
        </div>
        <button className="primary-button inline-primary" type="button" onClick={onCreateCharacter}>+ New Character</button>
      </div>

      <div className="list-controls library-controls">
        <label className="filter-field">
          <span>Search</span>
          <input value={searchTerm} placeholder="Search characters or worlds..." onChange={(event) => onSearchTermChange(event.target.value)} />
        </label>

        <label className="filter-field">
          <span>Filter by World</span>
          <select value={fandomFilter} onChange={(event) => onFandomFilterChange(event.target.value)}>
            {fandoms.map((fandom) => <option key={fandom} value={fandom}>{fandom}</option>)}
          </select>
        </label>
      </div>

      <p className="count-line">{ocs.length} of {totalCount} characters visible</p>

      {ocs.length === 0 ? (
        <p className="empty-state">No matching characters yet.</p>
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

  return (
    <button className="library-card compact-character-card" type="button" onClick={() => onOpenWorkspace(oc.id)}>
      <div className="profile-picture-preview card-picture compact-card-picture">
        {profilePicture ? <img src={profilePicture} alt={oc.name} /> : <span>No picture</span>}
      </div>
      <div>
        <h3>{oc.name}</h3>
        <p>{getWorldTitle(oc)}</p>
        <p className="muted-text">{[oc.species, oc.currentAge ? `Current age: ${oc.currentAge}` : ""].filter(Boolean).join(" | ")}</p>
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
