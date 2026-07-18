import { useMemo, useRef, useState } from "react";
import {
  INITIAL_TIMELINE,
  INITIAL_TIMELINE_EVENT,
  TIMELINE_EVENT_TYPES,
  TIMELINE_TYPES
} from "../data/timelineSchema.js";
import {
  createTimeline,
  createTimelineEvent,
  deleteTimeline,
  deleteTimelineEvent,
  saveTimelineData,
  updateTimeline,
  updateTimelineEvent
} from "../storage/timelineRepository.js";
import { getWorldTitle } from "./OCList.jsx";

const MIN_SPAN = 10;

export default function TimelineEditor({ embedded = false, ocs, onBack, onTimelineDataChange, timelineData, workspaceOcId = "" }) {
  const visibleTimelines = workspaceOcId
    ? timelineData.timelines.filter((timeline) => timeline.connectedOcId === workspaceOcId || timeline.type !== "Character Timeline")
    : timelineData.timelines;

  const [timelineForm, setTimelineForm] = useState({ ...INITIAL_TIMELINE, connectedOcId: workspaceOcId });
  const [editingTimelineId, setEditingTimelineId] = useState(null);
  const [activeTimelineId, setActiveTimelineId] = useState(visibleTimelines[0]?.id || "");
  const [eventForm, setEventForm] = useState(INITIAL_TIMELINE_EVENT);
  const [editingEventId, setEditingEventId] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [filters, setFilters] = useState({ characterId: "All", world: "All", eventType: "All", location: "" });
  const lineRef = useRef(null);

  const worlds = useMemo(() => ["All", ...Array.from(new Set(ocs.map(getWorldTitle).filter(Boolean))).sort()], [ocs]);
  const activeTimeline = timelineData.timelines.find((timeline) => timeline.id === activeTimelineId);

  const activeEvents = useMemo(() => {
    return timelineData.events
      .filter((event) => event.timelineId === activeTimelineId)
      .filter((event) => filters.characterId === "All" || event.connectedCharacterIds.includes(filters.characterId))
      .filter((event) => filters.world === "All" || event.connectedWorld === filters.world)
      .filter((event) => filters.eventType === "All" || event.eventType === filters.eventType)
      .filter((event) => !filters.location.trim() || event.connectedLocations.toLowerCase().includes(filters.location.trim().toLowerCase()))
      .sort(compareEvents);
  }, [timelineData.events, activeTimelineId, filters]);

  const range = useMemo(() => getYearRange(activeEvents), [activeEvents]);
  const selectedEvent = activeEvents.find((event) => event.id === selectedEventId) || activeEvents[0] || null;

  function persist(nextData) {
    saveTimelineData(nextData);
    onTimelineDataChange(nextData);
  }

  function updateTimelineField(event) {
    const { name, value } = event.target;
    setTimelineForm((current) => ({ ...current, [name]: value }));
  }

  function updateEventField(event) {
    const { name, value } = event.target;
    setEventForm((current) => ({ ...current, [name]: value }));
  }

  function toggleConnectedCharacter(ocId) {
    setEventForm((current) => {
      const exists = current.connectedCharacterIds.includes(ocId);
      return {
        ...current,
        connectedCharacterIds: exists
          ? current.connectedCharacterIds.filter((id) => id !== ocId)
          : [...current.connectedCharacterIds, ocId]
      };
    });
  }

  function handleTimelineSubmit(event) {
    event.preventDefault();
    if (!timelineForm.title.trim()) return;

    if (editingTimelineId) {
      persist({ ...timelineData, timelines: updateTimeline(timelineData.timelines, editingTimelineId, timelineForm) });
    } else {
      const nextTimeline = createTimeline(timelineForm);
      persist({ ...timelineData, timelines: [nextTimeline, ...timelineData.timelines] });
      setActiveTimelineId(nextTimeline.id);
    }

    cancelTimelineEdit();
  }

  function startTimelineEdit(timeline) {
    setEditingTimelineId(timeline.id);
    setTimelineForm({ ...INITIAL_TIMELINE, ...timeline });
  }

  function cancelTimelineEdit() {
    setEditingTimelineId(null);
    setTimelineForm({ ...INITIAL_TIMELINE, connectedOcId: workspaceOcId });
  }

  function removeTimeline(id) {
    const nextData = deleteTimeline(timelineData, id);
    persist(nextData);
    if (activeTimelineId === id) {
      const nextVisible = workspaceOcId
        ? nextData.timelines.find((timeline) => timeline.connectedOcId === workspaceOcId || timeline.type !== "Character Timeline")
        : nextData.timelines[0];
      setActiveTimelineId(nextVisible?.id || "");
    }
    if (editingTimelineId === id) cancelTimelineEdit();
  }

  function openAddEventModal(year = "") {
    if (!activeTimelineId) return;
    setEditingEventId(null);
    setEventForm({
      ...INITIAL_TIMELINE_EVENT,
      dateYear: year ? String(year) : "",
      connectedCharacterIds: workspaceOcId ? [workspaceOcId] : [],
      connectedWorld: activeTimeline?.connectedWorld || ""
    });
    setIsEventModalOpen(true);
  }

  function openEditEventModal(event) {
    setEditingEventId(event.id);
    setEventForm({ ...INITIAL_TIMELINE_EVENT, ...event });
    setIsEventModalOpen(true);
  }

  function closeEventModal() {
    setEditingEventId(null);
    setEventForm(INITIAL_TIMELINE_EVENT);
    setIsEventModalOpen(false);
  }

  function handleEventSubmit(event) {
    event.preventDefault();
    if (!activeTimelineId || !eventForm.title.trim() || !eventForm.dateYear.trim()) return;

    if (editingEventId) {
      persist({ ...timelineData, events: updateTimelineEvent(timelineData.events, editingEventId, eventForm) });
      setSelectedEventId(editingEventId);
    } else {
      const order = timelineData.events.filter((item) => item.timelineId === activeTimelineId).length;
      const nextEvent = createTimelineEvent(activeTimelineId, eventForm, order);
      persist({ ...timelineData, events: [...timelineData.events, nextEvent] });
      setSelectedEventId(nextEvent.id);
    }

    closeEventModal();
  }

  function removeEvent(id) {
    persist({ ...timelineData, events: deleteTimelineEvent(timelineData.events, id) });
    if (selectedEventId === id) setSelectedEventId("");
    if (editingEventId === id) closeEventModal();
  }

  function handleLineClick(event) {
    if (event.target !== event.currentTarget && event.target.dataset.lineClick !== "true") return;
    openAddEventModal(getYearFromPointer(event.clientX, lineRef.current, range));
  }

  function startEventDrag(pointerEvent, eventItem) {
    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();
    const point = pointerEvent.currentTarget;
    point.setPointerCapture?.(pointerEvent.pointerId);

    function handlePointerMove(moveEvent) {
      const year = getYearFromPointer(moveEvent.clientX, lineRef.current, range);
      point.style.left = `${getEventPosition({ ...eventItem, dateYear: String(year) }, range)}%`;
    }

    function handlePointerUp(upEvent) {
      const year = getYearFromPointer(upEvent.clientX, lineRef.current, range);
      persist({
        ...timelineData,
        events: updateTimelineEvent(timelineData.events, eventItem.id, { ...eventItem, dateYear: String(year) })
      });
      point.style.left = "";
      point.releasePointerCapture?.(pointerEvent.pointerId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <section className={embedded ? "timeline-page" : "panel editor-page timeline-page"}>
      {!embedded ? (
        <div className="page-heading">
          <button className="secondary-button" type="button" onClick={onBack}>Back to OC list</button>
          <div>
            <p className="eyebrow">Core feature</p>
            <h2>Timeline</h2>
          </div>
        </div>
      ) : null}

      <div className="timeline-layout visual-timeline-layout">
        <aside className="timeline-sidebar">
          <form className="sub-form" onSubmit={handleTimelineSubmit}>
            <h3>{editingTimelineId ? "Edit timeline" : "Create timeline"}</h3>
            <TextInput label="Timeline title" name="title" value={timelineForm.title} onChange={updateTimelineField} />
            <label className="field">
              <span>Timeline type</span>
              <select name="type" value={timelineForm.type} onChange={updateTimelineField}>
                {TIMELINE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>

            {timelineForm.type === "Character Timeline" ? (
              <label className="field">
                <span>Main character</span>
                <select name="connectedOcId" value={timelineForm.connectedOcId} onChange={updateTimelineField}>
                  <option value="">No character selected</option>
                  {ocs.map((oc) => <option key={oc.id} value={oc.id}>{oc.name}</option>)}
                </select>
              </label>
            ) : null}

            <label className="field">
              <span>Connected world</span>
              <select name="connectedWorld" value={timelineForm.connectedWorld} onChange={updateTimelineField}>
                <option value="">No world selected</option>
                {worlds.filter((world) => world !== "All").map((world) => <option key={world} value={world}>{world}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Description</span>
              <textarea name="description" value={timelineForm.description} rows="3" onChange={updateTimelineField} />
            </label>
            <label className="field">
              <span>Notes</span>
              <textarea name="notes" value={timelineForm.notes} rows="3" onChange={updateTimelineField} />
            </label>
            <div className="form-actions">
              <button className="primary-button inline-primary" type="submit">{editingTimelineId ? "Save timeline" : "Add timeline"}</button>
              {editingTimelineId ? <button className="secondary-button" type="button" onClick={cancelTimelineEdit}>Cancel</button> : null}
            </div>
          </form>

          <div className="timeline-list">
            {visibleTimelines.length === 0 ? <p className="empty-state">No timelines yet.</p> : visibleTimelines.map((timeline) => (
              <article className={timeline.id === activeTimelineId ? "timeline-list-item active" : "timeline-list-item"} key={timeline.id}>
                <button type="button" onClick={() => setActiveTimelineId(timeline.id)}>
                  <strong>{timeline.title}</strong>
                  <span>{timeline.type}</span>
                </button>
                <div className="card-actions">
                  <button className="secondary-button" type="button" onClick={() => startTimelineEdit(timeline)}>Edit</button>
                  <button className="delete-button" type="button" onClick={() => removeTimeline(timeline.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className="timeline-main">
          {activeTimeline ? (
            <>
              <div className="timeline-header-card">
                <div>
                  <p className="eyebrow">{activeTimeline.type}</p>
                  <h2>{activeTimeline.title}</h2>
                  {activeTimeline.description ? <p className="muted-text">{activeTimeline.description}</p> : null}
                </div>
                <button className="primary-button inline-primary" type="button" onClick={() => openAddEventModal()}>Add Event</button>
              </div>

              <div className="timeline-filters">
                <label className="filter-field">
                  <span>Character</span>
                  <select value={filters.characterId} onChange={(event) => setFilters((current) => ({ ...current, characterId: event.target.value }))}>
                    <option value="All">All</option>
                    {ocs.map((oc) => <option key={oc.id} value={oc.id}>{oc.name}</option>)}
                  </select>
                </label>
                <label className="filter-field">
                  <span>World</span>
                  <select value={filters.world} onChange={(event) => setFilters((current) => ({ ...current, world: event.target.value }))}>
                    {worlds.map((world) => <option key={world} value={world}>{world}</option>)}
                  </select>
                </label>
                <label className="filter-field">
                  <span>Event type</span>
                  <select value={filters.eventType} onChange={(event) => setFilters((current) => ({ ...current, eventType: event.target.value }))}>
                    <option value="All">All</option>
                    {TIMELINE_EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label className="filter-field">
                  <span>Location</span>
                  <input value={filters.location} placeholder="Filter location..." onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))} />
                </label>
              </div>

              <section className="visual-timeline-card">
                <div className="timeline-range-labels">
                  <span>{range.min}</span>
                  <span>{range.max}</span>
                </div>
                <div className="visual-timeline-line" ref={lineRef} style={{ "--timeline-count": Math.max(activeEvents.length, 4) }} onClick={handleLineClick} data-line-click="true">
                  {activeEvents.length === 0 ? <p className="timeline-line-empty">Click the line or use Add Event to place the first event.</p> : null}
                  {activeEvents.map((event, index) => (
                    <TimelinePoint
                      event={event}
                      index={index}
                      isSelected={selectedEvent?.id === event.id}
                      key={event.id}
                      onDragStart={startEventDrag}
                      onEdit={openEditEventModal}
                      onSelect={setSelectedEventId}
                      position={getEventPosition(event, range)}
                    />
                  ))}
                </div>
              </section>

              <section className="timeline-detail-panel">
                {selectedEvent ? (
                  <TimelineDetails event={selectedEvent} ocs={ocs} onDelete={removeEvent} onEdit={openEditEventModal} />
                ) : <p className="empty-state">Select an event point to see details.</p>}
              </section>
            </>
          ) : <p className="empty-state">Create a timeline to start adding events.</p>}
        </section>
      </div>

      {isEventModalOpen ? (
        <EventModal
          eventForm={eventForm}
          editingEventId={editingEventId}
          ocs={ocs}
          onChange={updateEventField}
          onClose={closeEventModal}
          onSubmit={handleEventSubmit}
          onToggleCharacter={toggleConnectedCharacter}
          worlds={worlds}
        />
      ) : null}
    </section>
  );
}

function EventModal({ eventForm, editingEventId, ocs, onChange, onClose, onSubmit, onToggleCharacter, worlds }) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <form className="confirm-dialog timeline-event-modal" role="dialog" aria-modal="true" aria-labelledby="event-dialog-title" onSubmit={onSubmit}>
        <div className="modal-heading-row">
          <div>
            <p className="eyebrow">Timeline event</p>
            <h2 id="event-dialog-title">{editingEventId ? "Edit Event" : "Add Event"}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>Close</button>
        </div>

        <div className="field-grid">
          <TextInput label="Title *" name="title" value={eventForm.title} onChange={onChange} required />
          <NumberInput label="Year *" name="dateYear" min="-9999" max="9999" value={eventForm.dateYear} onChange={onChange} required />
          <label className="field">
            <span>Optional full date</span>
            <input name="dateFull" type="date" value={eventForm.dateFull} onChange={onChange} />
          </label>
          <label className="field">
            <span>Event type</span>
            <select name="eventType" value={eventForm.eventType} onChange={onChange}>
              {TIMELINE_EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <TextInput label="Location" name="connectedLocations" value={eventForm.connectedLocations} onChange={onChange} />
          <TextInput label="Object / Item" name="connectedObjects" value={eventForm.connectedObjects} onChange={onChange} />
          <label className="field">
            <span>World</span>
            <select name="connectedWorld" value={eventForm.connectedWorld} onChange={onChange}>
              <option value="">No world selected</option>
              {worlds.filter((world) => world !== "All").map((world) => <option key={world} value={world}>{world}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="checkbox-panel">
          <legend>Connected characters</legend>
          {ocs.length === 0 ? <p className="muted-text">Create OCs first to connect them.</p> : ocs.map((oc) => (
            <label className="inline-check" key={oc.id}>
              <input type="checkbox" checked={eventForm.connectedCharacterIds.includes(oc.id)} onChange={() => onToggleCharacter(oc.id)} />
              <span>{oc.name}</span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>Description / what happened</span>
          <textarea name="description" value={eventForm.description} rows="4" onChange={onChange} />
        </label>
        <label className="field">
          <span>Notes</span>
          <textarea name="notes" value={eventForm.notes} rows="3" onChange={onChange} />
        </label>

        <div className="dialog-actions horizontal-actions">
          <button className="primary-button" type="submit">{editingEventId ? "Save Event" : "Add Event"}</button>
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function TimelinePoint({ event, index, isSelected, onDragStart, onEdit, onSelect, position }) {
  const sideClass = index % 2 === 0 ? "above" : "below";

  return (
    <button
      className={isSelected ? `timeline-point ${sideClass} selected` : `timeline-point ${sideClass}`}
      style={{ "--point-position": `${position}%`, left: `${position}%` }}
      type="button"
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onSelect(event.id);
      }}
      onDoubleClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onEdit(event);
      }}
      onPointerDown={(pointerEvent) => onDragStart(pointerEvent, event)}
      title="Drag to move year. Double-click to edit."
    >
      <span className="timeline-point-dot" />
      <span className="timeline-point-card">
        <strong>{formatDate(event)}</strong>
        <span>{event.title}</span>
      </span>
    </button>
  );
}

function TimelineDetails({ event, ocs, onDelete, onEdit }) {
  const connectedNames = event.connectedCharacterIds
    .map((id) => ocs.find((oc) => oc.id === id)?.name)
    .filter(Boolean);

  return (
    <article className="timeline-detail-card">
      <div className="timeline-event-heading">
        <div>
          <p className="eyebrow">{event.eventType}</p>
          <h3>{event.title}</h3>
        </div>
        <p className="muted-text">{formatDate(event)}</p>
      </div>
      {event.description ? <section className="text-block"><h4>Description</h4><p>{event.description}</p></section> : null}
      <dl className="fact-list compact-facts">
        <Fact label="Characters" value={connectedNames.join(", ")} />
        <Fact label="Location" value={event.connectedLocations} />
        <Fact label="Object / Item" value={event.connectedObjects} />
        <Fact label="World" value={event.connectedWorld} />
      </dl>
      {event.notes ? <section className="text-block"><h4>Notes</h4><p>{event.notes}</p></section> : null}
      <div className="card-actions">
        <button className="secondary-button" type="button" onClick={() => onEdit(event)}>Edit</button>
        <button className="delete-button" type="button" onClick={() => onDelete(event.id)}>Delete</button>
      </div>
    </article>
  );
}

function TextInput({ label, name, onChange, placeholder = "", required = false, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} value={value} placeholder={placeholder} required={required} onChange={onChange} />
    </label>
  );
}

function NumberInput({ label, max, min, name, onChange, required = false, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type="number" min={min} max={max} value={value} placeholder={label} required={required} onChange={onChange} />
    </label>
  );
}

function Fact({ label, value }) {
  if (!value) return null;
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function compareEvents(a, b) {
  const yearDifference = getEventYear(a) - getEventYear(b);
  if (yearDifference !== 0) return yearDifference;
  return String(a.dateFull || "").localeCompare(String(b.dateFull || "")) || a.order - b.order;
}

function getEventYear(event) {
  const year = Number(event.dateYear);
  return Number.isFinite(year) ? year : 0;
}

function getYearRange(events) {
  if (events.length === 0) {
    const currentYear = new Date().getFullYear();
    return { min: currentYear - 5, max: currentYear + 5 };
  }

  const years = events.map(getEventYear).filter(Number.isFinite);
  let min = Math.min(...years);
  let max = Math.max(...years);
  if (min === max) {
    min -= MIN_SPAN / 2;
    max += MIN_SPAN / 2;
  }

  if (max - min < MIN_SPAN) {
    const padding = (MIN_SPAN - (max - min)) / 2;
    min -= padding;
    max += padding;
  }

  return { min: Math.floor(min), max: Math.ceil(max) };
}

function getEventPosition(event, range) {
  const span = range.max - range.min || 1;
  const raw = ((getEventYear(event) - range.min) / span) * 100;
  return Math.min(96, Math.max(4, raw));
}

function getYearFromPointer(clientX, element, range) {
  if (!element) return new Date().getFullYear();
  const rect = element.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  return Math.round(range.min + ratio * (range.max - range.min));
}

function formatDate(event) {
  if (event.dateFull) return event.dateFull;
  return event.dateYear ? String(event.dateYear) : "No year";
}


