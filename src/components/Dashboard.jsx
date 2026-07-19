import { getWorldTitle } from "./OCList.jsx";
import { formatDateWithMonthName } from "../utils/dateFormat.js";
import { buildWorldSummaries } from "./WorldLibrary.jsx";

export default function Dashboard({ ocs, onCreateOC, onCreateTimeline, onCreateWorld, onCreateStory, onOpenOC, timelineData, worlds }) {
  const recentlyEditedOCs = [...ocs].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 4);
  const favoriteOCs = ocs.filter((oc) => oc.isFavorite).slice(0, 4);
  const recentlyOpened = [...ocs].filter((oc) => oc.lastOpenedAt).sort((a, b) => String(b.lastOpenedAt).localeCompare(String(a.lastOpenedAt))).slice(0, 3);
  const recentEvents = [...timelineData.events].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 4);
  const recentWorlds = buildWorldSummaries(ocs, timelineData, worlds).slice(0, 4);
  const continueItems = recentlyOpened.length > 0 ? recentlyOpened : recentlyEditedOCs.slice(0, 3);

  return (
    <section className="dashboard-home">
      <section className="dashboard-hero-card panel">
        <div>
          <p className="eyebrow">Creative desk</p>
          <h2>Pick up where your worlds left off.</h2>
          <p className="muted-text">Characters, timelines, stories, and world notes stay close without putting every form on the table at once.</p>
        </div>
        <div className="quick-create-grid compact-quick-create">
          <QuickCreateButton label="New Character" onClick={onCreateOC} />
          <QuickCreateButton label="New World" onClick={onCreateWorld} />
          <QuickCreateButton label="New Timeline" onClick={onCreateTimeline} />
          <QuickCreateButton label="New Story" onClick={onCreateStory} />
        </div>
      </section>

      <DashboardSection className="wide-dashboard-section" title="Continue Working" empty="Open or create a character to start your workspace." items={continueItems} render={(oc) => <CharacterCard oc={oc} onOpenOC={onOpenOC} />} />
      <DashboardSection title="Recent Characters" empty="No characters yet." items={recentlyEditedOCs} render={(oc) => <CharacterCard oc={oc} onOpenOC={onOpenOC} />} />
      <DashboardSection title="Recent Worlds" empty="No worlds yet." items={recentWorlds} render={(world) => <WorldCard world={world} />} />
      <DashboardSection title="Recent Timeline Events" empty="No timeline events yet." items={recentEvents} render={(event) => <EventCard event={event} />} />
      <DashboardSection title="Favorites" empty="No favorites yet." items={favoriteOCs} render={(oc) => <CharacterCard oc={oc} onOpenOC={onOpenOC} />} />

      <section className="panel dashboard-panel quick-create-panel">
        <div className="section-heading-row"><div><p className="eyebrow">Make something</p><h2>Quick Create</h2></div></div>
        <div className="quick-create-grid">
          <QuickCreateButton label="New Character" onClick={onCreateOC} />
          <QuickCreateButton label="New World" onClick={onCreateWorld} />
          <QuickCreateButton label="New Timeline" onClick={onCreateTimeline} />
          <QuickCreateButton label="New Story" onClick={onCreateStory} />
        </div>
      </section>
    </section>
  );
}

function DashboardSection({ className = "", empty, items, render, title }) {
  return (
    <section className={`panel dashboard-panel ${className}`}>
      <div className="section-heading-row"><h2>{title}</h2></div>
      <div className="dashboard-card-grid">{items.length === 0 ? <p className="empty-state">{empty}</p> : items.map(render)}</div>
    </section>
  );
}

function CharacterCard({ oc, onOpenOC }) {
  const image = oc.profilePictureData || oc.profilePictureUrl;
  return (
    <button className="desk-card character-desk-card" type="button" onClick={() => onOpenOC(oc.id)}>
      <div className="profile-picture-preview desk-card-picture">{image ? <img src={image} alt={oc.name} /> : <span>No picture</span>}</div>
      <div><strong>{oc.name}</strong><span>{getWorldTitle(oc)}</span><small>{[oc.species, oc.currentAge].filter(Boolean).join(" • ")}</small></div>
    </button>
  );
}

function WorldCard({ world }) {
  return <article className="desk-card"><strong>{world.name}</strong><span>{world.worldType}</span><small>{world.ocCount} characters • {world.timelineCount} timelines</small></article>;
}

function EventCard({ event }) {
  return <article className="desk-card"><strong>{event.title}</strong><span>{formatTimelineDate(event)}</span><small>{event.connectedWorld || event.eventType || "event"}</small></article>;
}

function QuickCreateButton({ label, onClick }) {
  return <button className="quick-create-card" type="button" onClick={onClick}><span>+</span><strong>{label}</strong></button>;
}

function formatTimelineDate(event) {
  if (event.dateFull) return formatDateWithMonthName(event.dateFull);
  return event.dateYear || event.eventType || "Timeline event";
}


