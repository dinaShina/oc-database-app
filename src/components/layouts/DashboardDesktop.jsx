import { useState } from "react";
import { getWorldTitle } from "../OCList.jsx";
import { buildWorldSummaries } from "../WorldLibrary.jsx";

export default function DashboardDesktop({ ocs, onCreateOC, onCreateTimeline, onCreateWorld, onCreateStory, onOpenOC, timelineData, worlds }) {
  const [createOpen, setCreateOpen] = useState(false);
  const recentlyEditedOCs = [...ocs].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 4);
  const favoriteOCs = ocs.filter((oc) => oc.isFavorite).slice(0, 4);
  const recentlyOpened = [...ocs].filter((oc) => oc.lastOpenedAt).sort((a, b) => String(b.lastOpenedAt).localeCompare(String(a.lastOpenedAt))).slice(0, 3);
  const recentEvents = [...timelineData.events].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 4);
  const recentWorlds = buildWorldSummaries(ocs, timelineData, worlds).slice(0, 4);
  const continueItems = recentlyOpened.length > 0 ? recentlyOpened : recentlyEditedOCs.slice(0, 3);

  function runCreate(action) {
    setCreateOpen(false);
    action();
  }

  return (
    <section className="dashboard-home dashboard-home-clean">
      <section className="dashboard-topline">
        <div>
          <p className="eyebrow">Creative desk</p>
          <h2>Dashboard</h2>
          <p className="muted-text">A quiet starting point for characters, worlds, timelines, and stories.</p>
        </div>
        <div className="create-menu">
          <button className="primary-button inline-primary" type="button" onClick={() => setCreateOpen((open) => !open)}>+ Create</button>
          {createOpen ? (
            <div className="create-menu-popover">
              <button type="button" onClick={() => runCreate(onCreateOC)}>Character</button>
              <button type="button" onClick={() => runCreate(onCreateWorld)}>World</button>
              <button type="button" onClick={() => runCreate(onCreateTimeline)}>Timeline</button>
              <button type="button" onClick={() => runCreate(onCreateStory)}>Story</button>
            </div>
          ) : null}
        </div>
      </section>

      <DashboardSection className="wide-dashboard-section" title="Continue Working" empty="Open or create a character to start your workspace." items={continueItems} render={(oc) => <CharacterCard oc={oc} onOpenOC={onOpenOC} />} />
      <DashboardSection title="Recent Characters" empty="No characters yet." items={recentlyEditedOCs} render={(oc) => <CharacterCard oc={oc} onOpenOC={onOpenOC} />} />
      <DashboardSection title="Recent Worlds" empty="No worlds yet." items={recentWorlds} render={(world) => <WorldCard world={world} />} />
      <DashboardSection title="Favorites" empty="No favorites yet." items={favoriteOCs} render={(oc) => <CharacterCard oc={oc} onOpenOC={onOpenOC} />} />
      <DashboardSection title="Recent Activity" empty="No timeline activity yet." items={recentEvents} render={(event) => <EventCard event={event} />} />
    </section>
  );
}

function DashboardSection({ className = "", empty, items, render, title }) {
  return (
    <section className={`panel dashboard-panel ${className}`}>
      <div className="section-heading-row"><h2>{title}</h2></div>
      <div className="dashboard-card-grid">{items.length === 0 ? <p className="empty-state">{empty}</p> : items.map((item) => <div className="dashboard-section-item" key={item.id || item.key}>{render(item)}</div>)}</div>
    </section>
  );
}

function CharacterCard({ oc, onOpenOC }) {
  const image = oc.profilePictureData || oc.profilePictureUrl;
  const meta = [getWorldTitle(oc), oc.species, oc.currentAge ? `Age ${oc.currentAge}` : ""].filter(Boolean).join(" | ");
  return (
    <button className="desk-card character-desk-card" type="button" onClick={() => onOpenOC(oc.id)}>
      <div className="profile-picture-preview desk-card-picture">{image ? <img src={image} alt={oc.name} /> : <span>No picture</span>}</div>
      <div className="card-copy"><strong title={oc.name}>{oc.name}</strong><span title={meta}>{meta}</span><small>{oc.updatedAt ? `Last edited ${new Date(oc.updatedAt).toLocaleDateString()}` : "No recent edit"}</small></div>
    </button>
  );
}

function WorldCard({ world }) {
  return <article className="desk-card"><div className="card-copy"><strong title={world.name}>{world.name}</strong><span>{world.worldType}</span><small>{world.ocCount} characters | {world.timelineCount} timelines</small></div></article>;
}

function EventCard({ event }) {
  return <article className="desk-card"><div className="card-copy"><strong title={event.title}>{event.title}</strong><span>{event.dateFull || event.dateYear || event.eventType || "Timeline event"}</span><small>{event.connectedWorld || event.eventType || "event"}</small></div></article>;
}


