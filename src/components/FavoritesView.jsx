import EmptyState from "./EmptyState.jsx";
import { buildWorldSummaries } from "./WorldLibrary.jsx";
import { getWorldTitle } from "./OCList.jsx";

export default function FavoritesView({ ocs, onOpenOC, onToggleOCFavorite, onToggleWorldFavorite, timelineData, worlds }) {
  const favoriteOCs = ocs.filter((oc) => oc.isFavorite);
  const favoriteWorlds = buildWorldSummaries(ocs, timelineData, worlds).filter((world) => world.isFavorite);
  const hasFavorites = favoriteOCs.length > 0 || favoriteWorlds.length > 0;

  if (!hasFavorites) {
    return (
      <section className="panel list-panel favorites-empty-page">
        <EmptyState
          icon="favorite"
          title="Nothing bookmarked yet."
          message="Favorite your most important characters and worlds so they always stay close."
        />
      </section>
    );
  }

  return (
    <section className="favorites-layout polished-favorites-layout">
      <section className="panel list-panel favorites-panel">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Pinned</p>
            <h2>Favorite Characters</h2>
          </div>
        </div>
        <div className="library-grid">
          {favoriteOCs.length === 0 ? (
            <EmptyState icon="character" title="No favorite characters yet." message="Mark a character as favorite to pin them here." />
          ) : favoriteOCs.map((oc) => (
            <article className="favorite-card polished-favorite-card" key={oc.id}>
              <button className="favorite-card-main" type="button" onClick={() => onOpenOC(oc.id)}>
                <strong title={oc.name}>{oc.name}</strong>
                <span>{getWorldTitle(oc)}</span>
              </button>
              <button className="secondary-button" type="button" onClick={() => onToggleOCFavorite(oc.id)}>Unfavorite</button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel list-panel favorites-panel">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Pinned</p>
            <h2>Favorite Worlds</h2>
          </div>
        </div>
        <div className="world-grid">
          {favoriteWorlds.length === 0 ? (
            <EmptyState icon="world" title="No favorite worlds yet." message="Mark a world as favorite to keep it within reach." />
          ) : favoriteWorlds.map((world) => (
            <article className="world-card polished-world-card" key={world.name}>
              <div>
                <h3 title={world.name}>{world.name}</h3>
                <p className="muted-text">{world.worldType}</p>
              </div>
              <small>{world.ocCount} characters | {world.timelineCount} timelines</small>
              <button className="secondary-button" type="button" onClick={() => onToggleWorldFavorite(world.name)}>Unfavorite</button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
