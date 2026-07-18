import { buildWorldSummaries } from "./WorldLibrary.jsx";
import { getWorldTitle } from "./OCList.jsx";

export default function FavoritesView({ ocs, onOpenOC, onToggleOCFavorite, onToggleWorldFavorite, timelineData, worlds }) {
  const favoriteOCs = ocs.filter((oc) => oc.isFavorite);
  const favoriteWorlds = buildWorldSummaries(ocs, timelineData, worlds).filter((world) => world.isFavorite);

  return (
    <section className="favorites-layout">
      <section className="panel list-panel">
        <h2>Favorite OCs</h2>
        <div className="library-grid">
          {favoriteOCs.length === 0 ? <p className="empty-state">No favorite OCs yet.</p> : favoriteOCs.map((oc) => (
            <article className="favorite-card" key={oc.id}>
              <button className="favorite-card-main" type="button" onClick={() => onOpenOC(oc.id)}>
                <strong>{oc.name}</strong>
                <span>{getWorldTitle(oc)}</span>
              </button>
              <button className="secondary-button" type="button" onClick={() => onToggleOCFavorite(oc.id)}>Unfavorite</button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel list-panel">
        <h2>Favorite Worlds</h2>
        <div className="world-grid">
          {favoriteWorlds.length === 0 ? <p className="empty-state">No favorite worlds yet.</p> : favoriteWorlds.map((world) => (
            <article className="world-card" key={world.name}>
              <h3>{world.name}</h3>
              <p>{world.worldType}</p>
              <button className="secondary-button" type="button" onClick={() => onToggleWorldFavorite(world.name)}>Unfavorite</button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

