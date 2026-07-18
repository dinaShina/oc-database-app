import EmptyState from "../EmptyState.jsx";
import { getWorldTitle } from "../OCList.jsx";
import { buildWorldSummaries } from "../WorldLibrary.jsx";

export default function DashboardMobile({ ocs, onCreateOC, onCreateTimeline, onCreateWorld, onCreateStory, onOpenOC, timelineData, worlds }) {
  const recentlyEditedOCs = [...ocs].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 6);
  const favoriteOCs = ocs.filter((oc) => oc.isFavorite).slice(0, 6);
  const recentlyOpened = [...ocs].filter((oc) => oc.lastOpenedAt).sort((a, b) => String(b.lastOpenedAt).localeCompare(String(a.lastOpenedAt))).slice(0, 4);
  const recentEvents = [...timelineData.events].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 5);
  const recentWorlds = buildWorldSummaries(ocs, timelineData, worlds).slice(0, 6);
  const continueItems = recentlyOpened.length > 0 ? recentlyOpened : recentlyEditedOCs.slice(0, 4);

  return (
    <section className="mobile-page mobile-dashboard-page polished-dashboard-mobile">
      <section className="panel mobile-hero-panel">
        <p className="eyebrow">Creative desk</p>
        <h2>Dashboard</h2>
        <p className="muted-text">Quick access to the characters, worlds, and story pieces you touched recently.</p>
      </section>

      <MobileSection title="Continue Working" empty="Nothing open yet." items={continueItems} render={(oc) => <CharacterCard oc={oc} onOpenOC={onOpenOC} />} />

      <section className="panel dashboard-panel mobile-quick-create">
        <h2>Quick Create</h2>
        <div className="quick-create-grid">
          <QuickCreateButton label="New Character" onClick={onCreateOC} />
          <QuickCreateButton label="New World" onClick={onCreateWorld} />
          <QuickCreateButton label="New Timeline" onClick={onCreateTimeline} />
          <QuickCreateButton label="New Story" onClick={onCreateStory} />
        </div>
      </section>

      <MobileSection title="Recent Characters" empty="No characters yet." items={recentlyEditedOCs} render={(oc) => <CharacterCard oc={oc} onOpenOC={onOpenOC} />} />
      <MobileSection title="Recent Worlds" empty="No worlds yet." items={recentWorlds} render={(world) => <WorldCard world={world} />} />
      <MobileSection title="Favorites" empty="Nothing bookmarked yet." items={favoriteOCs} render={(oc) => <CharacterCard oc={oc} onOpenOC={onOpenOC} />} />
      <MobileSection title="Recent Activity" empty="No timeline activity yet." items={recentEvents} render={(event) => <EventCard event={event} />} />
    </section>
  );
}

function MobileSection({ empty, items, render, title }) {
  return (
    <section className="panel dashboard-panel mobile-stack-section">
      <h2>{title}</h2>
      <div className="mobile-card-strip">{items.length === 0 ? <EmptyState icon="spark" title={empty} message="Create something new and this area will fill itself with your recent work." /> : items.map((item) => <div className="mobile-section-item" key={item.id || item.key}>{render(item)}</div>)}</div>
    </section>
  );
}

function CharacterCard({ oc, onOpenOC }) {
  const image = oc.profilePictureData || oc.profilePictureUrl;
  return (
    <button className="desk-card character-desk-card mobile-desk-card" type="button" onClick={() => onOpenOC(oc.id)}>
      <div className="profile-picture-preview desk-card-picture">{image ? <img src={image} alt={oc.name} /> : <span>No picture</span>}</div>
      <div className="card-copy"><strong title={oc.name}>{oc.name}</strong><span title={getWorldTitle(oc)}>{getWorldTitle(oc)}</span><small>{[oc.species, oc.currentAge ? `Age ${oc.currentAge}` : ""].filter(Boolean).join(" | ")}</small></div>
    </button>
  );
}

function WorldCard({ world }) {
  return <article className="desk-card mobile-desk-card"><div className="card-copy"><strong title={world.name}>{world.name}</strong><span>{world.worldType}</span><small>{world.ocCount} characters | {world.timelineCount} timelines</small></div></article>;
}

function EventCard({ event }) {
  return <article className="desk-card mobile-desk-card"><div className="card-copy"><strong title={event.title}>{event.title}</strong><span>{event.dateFull || event.dateYear || event.eventType || "Timeline event"}</span><small>{event.connectedWorld || event.eventType || "event"}</small></div></article>;
}

function QuickCreateButton({ label, onClick }) {
  return <button className="quick-create-card" type="button" onClick={onClick}><span>+</span><strong>{label}</strong></button>;
}
