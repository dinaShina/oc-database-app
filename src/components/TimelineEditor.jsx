import { useMemo, useState } from "react";
import {
  INITIAL_TIMELINE,
  INITIAL_TIMELINE_EVENT,
  TIMELINE_EVENT_TYPES,
  TIMELINE_TYPES
} from "../data/timelineSchema.js";
import {
  createTimeline,
  createTimelineEvent,
  deleteTimelineEvent,
  saveTimelineData,
  updateTimelineEvent
} from "../storage/timelineRepository.js";
import { getWorldTitle } from "./OCList.jsx";
import { formatDateWithMonthName, formatMonthName } from "../utils/dateFormat.js";

const EVENTS_PER_ROW = 4;

export default function TimelineEditor({ embedded = false, ocs, onBack, onTimelineDataChange, timelineData, workspaceOcId = "", workspaceWorldName = "" }) {
  const visibleTimelines = workspaceWorldName
    ? timelineData.timelines.filter((timeline) => timeline.connectedWorld === workspaceWorldName)
    : workspaceOcId
      ? timelineData.timelines.filter((timeline) => timeline.connectedOcId === workspaceOcId || timeline.type !== "Character Timeline")
      : timelineData.timelines;

  const [activeTimelineId, setActiveTimelineId] = useState(visibleTimelines[0]?.id || "");
  const [timelineForm, setTimelineForm] = useState({ ...INITIAL_TIMELINE, type: workspaceWorldName ? "World Timeline" : INITIAL_TIMELINE.type, connectedOcId: workspaceOcId, connectedWorld: workspaceWorldName });
  const [eventForm, setEventForm] = useState(INITIAL_TIMELINE_EVENT);
  const [editingEventId, setEditingEventId] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(visibleTimelines.length === 0);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [expandedEventIds, setExpandedEventIds] = useState([]);
  const [yearSearch, setYearSearch] = useState("");

  const worlds = useMemo(() => ["All", ...Array.from(new Set([...ocs.map(getWorldTitle).filter(Boolean), workspaceWorldName].filter(Boolean))).sort()], [ocs, workspaceWorldName]);
  const activeTimeline = timelineData.timelines.find((timeline) => timeline.id === activeTimelineId) || visibleTimelines[0] || null;
  const activeTimelineIdSafe = activeTimeline?.id || "";

  const activeEvents = useMemo(() => timelineData.events.filter((event) => event.timelineId === activeTimelineIdSafe), [timelineData.events, activeTimelineIdSafe]);
  const datedEvents = useMemo(() => activeEvents.filter(hasSortableDate).sort(compareDatedEvents), [activeEvents]);
  const undatedEvents = useMemo(() => activeEvents.filter((event) => !hasSortableDate(event)).sort((a, b) => a.order - b.order), [activeEvents]);
  const orderedEvents = useMemo(() => [...datedEvents, ...undatedEvents], [datedEvents, undatedEvents]);
  const timelineRows = useMemo(() => chunkEvents(orderedEvents, EVENTS_PER_ROW), [orderedEvents]);
  const selectedEvent = activeEvents.find((event) => event.id === selectedEventId) || null;

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

  function openTimelineModal() {
    setTimelineForm({ ...INITIAL_TIMELINE, type: workspaceWorldName ? "World Timeline" : INITIAL_TIMELINE.type, connectedOcId: workspaceOcId, connectedWorld: workspaceWorldName });
    setIsTimelineModalOpen(true);
  }

  function closeTimelineModal() {
    if (visibleTimelines.length === 0) return;
    setTimelineForm({ ...INITIAL_TIMELINE, type: workspaceWorldName ? "World Timeline" : INITIAL_TIMELINE.type, connectedOcId: workspaceOcId, connectedWorld: workspaceWorldName });
    setIsTimelineModalOpen(false);
  }

  function handleTimelineSubmit(event) {
    event.preventDefault();
    if (!timelineForm.title.trim()) return;
    const nextTimeline = createTimeline(timelineForm);
    persist({ ...timelineData, timelines: [nextTimeline, ...timelineData.timelines] });
    setActiveTimelineId(nextTimeline.id);
    setTimelineForm({ ...INITIAL_TIMELINE, type: workspaceWorldName ? "World Timeline" : INITIAL_TIMELINE.type, connectedOcId: workspaceOcId, connectedWorld: workspaceWorldName });
    setIsTimelineModalOpen(false);
  }

  function openAddEventModal(year = "") {
    if (!activeTimelineIdSafe) return;
    setEditingEventId(null);
    setEventForm({
      ...INITIAL_TIMELINE_EVENT,
      dateYear: year ? String(year) : "",
      connectedCharacterIds: workspaceOcId ? [workspaceOcId] : [],
      connectedWorld: workspaceWorldName || activeTimeline?.connectedWorld || ""
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
    if (!activeTimelineIdSafe || !eventForm.title.trim()) return;

    if (editingEventId) {
      persist({ ...timelineData, events: updateTimelineEvent(timelineData.events, editingEventId, eventForm) });
      setSelectedEventId(editingEventId);
    } else {
      const order = timelineData.events.filter((item) => item.timelineId === activeTimelineIdSafe).length;
      const nextEvent = createTimelineEvent(activeTimelineIdSafe, eventForm, order);
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

  function handleDatedDrag(pointerEvent) {
    pointerEvent.preventDefault();
    window.alert("This timeline is sorted automatically by date. Change the event year or full date to reposition it.");
  }

  function moveUndatedEvent(eventId, direction) {
    const undatedIds = undatedEvents.map((event) => event.id);
    const currentIndex = undatedIds.indexOf(eventId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= undatedIds.length) return;
    reorderUndatedEvents(arrayMove(undatedIds, currentIndex, nextIndex));
  }

  function moveUndatedEventToTarget(eventId, targetId) {
    if (!eventId || !targetId || eventId === targetId) return;
    const undatedIds = undatedEvents.map((event) => event.id);
    const currentIndex = undatedIds.indexOf(eventId);
    const targetIndex = undatedIds.indexOf(targetId);
    if (currentIndex < 0 || targetIndex < 0) return;
    reorderUndatedEvents(arrayMove(undatedIds, currentIndex, targetIndex));
  }

  function reorderUndatedEvents(reorderedIds) {
    const orderMap = new Map(reorderedIds.map((id, index) => [id, index]));
    persist({
      ...timelineData,
      events: timelineData.events.map((event) => (
        event.timelineId === activeTimelineIdSafe && orderMap.has(event.id)
          ? { ...event, order: orderMap.get(event.id), updatedAt: new Date().toISOString() }
          : event
      ))
    });
  }

  function toggleExpandedEvent(eventId) {
    setExpandedEventIds((current) => current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId]);
  }

  function handleYearSearch(event) {
    event.preventDefault();
    const year = extractStartYear(yearSearch);
    if (!Number.isFinite(year)) return;
    document.querySelector(`[data-timeline-year="${year}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <section className={embedded ? "timeline-page timeline-focus-page timeline-simple-page" : "panel editor-page timeline-page timeline-focus-page timeline-simple-page"}>
      {!embedded ? (
        <div className="page-heading">
          <button className="secondary-button" type="button" onClick={onBack}>Back to OC list</button>
          <div>
            <p className="eyebrow">Core feature</p>
            <h2>Timeline</h2>
          </div>
        </div>
      ) : null}

      <header className="timeline-simple-header">
        <h2>Timeline</h2>
        <div className="timeline-simple-actions">
          {activeTimeline ? <button className="primary-button inline-primary" type="button" onClick={() => openAddEventModal()}>Add Event</button> : null}
          <button className="secondary-button" type="button" onClick={openTimelineModal}>Add Timeline</button>
          <form className="timeline-year-search" onSubmit={handleYearSearch}>
            <label className="sr-only" htmlFor="timeline-year-search">Search Year</label>
            <input id="timeline-year-search" inputMode="numeric" placeholder="Search Year" value={yearSearch} onChange={(event) => setYearSearch(event.target.value)} />
            <button className="secondary-button" type="submit">Go</button>
          </form>
        </div>
      </header>

      {visibleTimelines.length > 1 ? (
        <nav className="timeline-switcher compact-timeline-switcher" aria-label="Timeline selector">
          {visibleTimelines.map((timeline) => (
            <button className={timeline.id === activeTimelineIdSafe ? "timeline-switch active" : "timeline-switch"} key={timeline.id} type="button" onClick={() => setActiveTimelineId(timeline.id)}>
              <strong>{timeline.title}</strong>
              <span>{timeline.type}</span>
            </button>
          ))}
        </nav>
      ) : null}

      {activeTimeline ? (
        <>
          <section className="visual-timeline-card serpentine-timeline-card timeline-reading-card">
            {orderedEvents.length === 0 ? (
              <div className="timeline-empty-compact">
                <div className="empty-illustration" aria-hidden="true">+</div>
                <h3>No events yet.</h3>
                <p className="muted-text">Add the first event and your timeline will appear here.</p>
                <button className="primary-button inline-primary" type="button" onClick={() => openAddEventModal()}>Add Event</button>
              </div>
            ) : null}

            {orderedEvents.length > 0 ? (
              <div className="timeline-flow" style={{ "--events-per-row": EVENTS_PER_ROW }}>
                {timelineRows.map((row, rowIndex) => (
                  <div className={rowIndex % 2 === 0 ? "timeline-flow-row" : "timeline-flow-row reverse"} key={`row-${rowIndex}`}>
                    {row.map((event, index) => (
                      <TimelineFlowEvent
                        event={event}
                        index={index}
                        isExpanded={expandedEventIds.includes(event.id)}
                        isLastInRow={index === row.length - 1}
                        isSelected={selectedEvent?.id === event.id}
                        key={event.id}
                        onAutoDragNotice={handleDatedDrag}
                        onEdit={openEditEventModal}
                        onSelect={setSelectedEventId}
                        onToggleExpanded={toggleExpandedEvent}
                        ocs={ocs}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : null}

          </section>

          {selectedEvent ? (
            <section className="timeline-detail-panel">
              <TimelineDetails event={selectedEvent} ocs={ocs} onDelete={removeEvent} onEdit={openEditEventModal} />
            </section>
          ) : null}
        </>
      ) : (
        <div className="timeline-empty-compact timeline-no-timeline-state">
          <div className="empty-illustration" aria-hidden="true">+</div>
          <h3>No timeline yet.</h3>
          <p className="muted-text">Create one timeline, then the page will stay focused on the events.</p>
          <button className="primary-button inline-primary" type="button" onClick={openTimelineModal}>Add Timeline</button>
        </div>
      )}

      {isTimelineModalOpen ? (
        <TimelineModal
          formData={timelineForm}
          ocs={ocs}
          onChange={updateTimelineField}
          onClose={closeTimelineModal}
          onSubmit={handleTimelineSubmit}
          showClose={visibleTimelines.length > 0}
          worlds={worlds}
        />
      ) : null}

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

function TimelineModal({ formData, ocs, onChange, onClose, onSubmit, showClose, worlds }) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <form className="confirm-dialog timeline-event-modal timeline-create-modal" role="dialog" aria-modal="true" aria-labelledby="timeline-dialog-title" onSubmit={onSubmit}>
        <div className="modal-heading-row">
          <div>
            <p className="eyebrow">Timeline</p>
            <h2 id="timeline-dialog-title">Add Timeline</h2>
          </div>
          {showClose ? <button className="secondary-button" type="button" onClick={onClose}>Close</button> : null}
        </div>
        <div className="field-grid">
          <TextInput label="Timeline title" name="title" value={formData.title} onChange={onChange} required />
          <label className="field">
            <span>Timeline type</span>
            <select name="type" value={formData.type} onChange={onChange}>
              {TIMELINE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          {formData.type === "Character Timeline" ? (
            <label className="field">
              <span>Main character</span>
              <select name="connectedOcId" value={formData.connectedOcId} onChange={onChange}>
                <option value="">No character selected</option>
                {ocs.map((oc) => <option key={oc.id} value={oc.id}>{oc.name}</option>)}
              </select>
            </label>
          ) : null}
          <label className="field">
            <span>Connected world</span>
            <select name="connectedWorld" value={formData.connectedWorld} onChange={onChange}>
              <option value="">No world selected</option>
              {worlds.filter((world) => world !== "All").map((world) => <option key={world} value={world}>{world}</option>)}
            </select>
          </label>
          <label className="field wide-field">
            <span>Description</span>
            <textarea name="description" value={formData.description} rows="3" onChange={onChange} />
          </label>
        </div>
        <div className="dialog-actions horizontal-actions">
          <button className="primary-button" type="submit">Add Timeline</button>
          {showClose ? <button className="secondary-button" type="button" onClick={onClose}>Cancel</button> : null}
        </div>
      </form>
    </div>
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
          <TextInput label="Year or approximate range" name="dateYear" placeholder="1899 or c. 1895-1896" value={eventForm.dateYear} onChange={onChange} />
          <label className="field">
            <span>Optional full date</span>
            <input name="dateFull" type="date" value={eventForm.dateFull} onChange={onChange} />
          </label>
          <label className="field">
            <span>Month if known</span>
            <select name="dateMonth" value={eventForm.dateMonth} onChange={onChange}>
              <option value="">No month selected</option>
              {Array.from({ length: 12 }, (_, index) => {
                const month = String(index + 1).padStart(2, "0");
                return <option key={month} value={month}>{formatMonthName(month)}</option>;
              })}
            </select>
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

function TimelineFlowEvent({ event, index, isExpanded, isLastInRow, isSelected, onAutoDragNotice, onEdit, onSelect, onToggleExpanded, ocs }) {
  const sortParts = getSortParts(event);
  const age = getEventAge(event, ocs);
  const description = event.description || event.notes || "";
  const isLong = description.length > 120;

  return (
    <article className={isSelected ? "timeline-flow-event selected" : "timeline-flow-event"} data-timeline-year={shouldMarkYear(event) ? sortParts.year : undefined}>
      <button className="timeline-node-button" type="button" draggable="true" onDragStart={onAutoDragNotice} onClick={() => onSelect(event.id)} aria-label={`Select ${event.title}`} title="This timeline is sorted automatically by date.">
        <span className="timeline-node-dot" />
        {!isLastInRow ? <span className="timeline-node-arrow" aria-hidden="true">-&gt;</span> : null}
      </button>
      <button className="timeline-event-card-button" type="button" onClick={() => onSelect(event.id)} onDoubleClick={() => onEdit(event)}>
        <span className={`date-precision-pill precision-${sortParts.precision}`}>{getPrecisionLabel(sortParts.precision)}</span>
        <strong>{formatDate(event)}</strong>
        <span className="timeline-flow-title">{event.title}</span>
        <TimelineMeta event={event} age={age} />
        {description ? (
          <span className={isExpanded ? "timeline-description-preview expanded" : "timeline-description-preview"}>
            {isExpanded || !isLong ? description : `${description.slice(0, 120).trim()}...`}
          </span>
        ) : null}
      </button>
      <div className="timeline-card-actions">
        {isLong ? <button className="secondary-button" type="button" onClick={() => onToggleExpanded(event.id)}>{isExpanded ? "Less" : "Read more"}</button> : null}
        <button className="secondary-button" type="button" onClick={() => onEdit(event)}>Edit</button>
      </div>
    </article>
  );
}

function TimelineUndatedEvent({ event, isExpanded, isFirst, isLast, isSelected, onEdit, onMove, onMoveToTarget, onSelect, onToggleExpanded, ocs }) {
  const description = event.description || event.notes || "";
  const isLong = description.length > 120;

  return (
    <article className={isSelected ? "undated-event-card selected" : "undated-event-card"} draggable="true" onDragStart={(dragEvent) => dragEvent.dataTransfer.setData("text/plain", event.id)} onDragOver={(dragEvent) => dragEvent.preventDefault()} onDrop={(dropEvent) => { dropEvent.preventDefault(); onMoveToTarget(dropEvent.dataTransfer.getData("text/plain"), event.id); }}>
      <button className="timeline-event-card-button" type="button" onClick={() => onSelect(event.id)} onDoubleClick={() => onEdit(event)}>
        <span className="date-precision-pill precision-unknown">Date unknown</span>
        <strong>{event.title}</strong>
        <TimelineMeta event={event} age={getEventAge(event, ocs)} />
        {description ? <span className={isExpanded ? "timeline-description-preview expanded" : "timeline-description-preview"}>{isExpanded || !isLong ? description : `${description.slice(0, 120).trim()}...`}</span> : null}
      </button>
      <div className="timeline-card-actions">
        {!isFirst ? <button className="secondary-button" type="button" onClick={() => onMove(event.id, -1)}>Up</button> : null}
        {!isLast ? <button className="secondary-button" type="button" onClick={() => onMove(event.id, 1)}>Down</button> : null}
        {isLong ? <button className="secondary-button" type="button" onClick={() => onToggleExpanded(event.id)}>{isExpanded ? "Less" : "Read more"}</button> : null}
        <button className="secondary-button" type="button" onClick={() => onEdit(event)}>Edit</button>
      </div>
    </article>
  );
}

function TimelineMeta({ age, event }) {
  const parts = [age ? `Age ${age}` : "", event.connectedLocations, event.eventType].filter(Boolean);
  if (!parts.length) return null;
  return <span className="timeline-meta-line">{parts.join(" | ")}</span>;
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

function Fact({ label, value }) {
  if (!value) return null;
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function compareDatedEvents(a, b) {
  const aParts = getSortParts(a);
  const bParts = getSortParts(b);
  return aParts.value - bParts.value || precisionRank(aParts.precision) - precisionRank(bParts.precision) || a.order - b.order;
}

function chunkEvents(events, size) {
  const chunks = [];
  for (let index = 0; index < events.length; index += size) chunks.push(events.slice(index, index + size));
  return chunks;
}

function arrayMove(items, fromIndex, toIndex) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function hasSortableDate(event) {
  return Number.isFinite(getSortParts(event).value);
}

function getSortParts(event) {
  if (event.dateFull) {
    const date = new Date(`${event.dateFull}T00:00:00Z`);
    if (!Number.isNaN(date.getTime())) {
      return { day: date.getUTCDate(), month: date.getUTCMonth() + 1, precision: "exact", value: Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()), year: date.getUTCFullYear() };
    }
  }

  const year = extractStartYear(event.dateYear);
  if (!Number.isFinite(year)) return { day: null, month: null, precision: "unknown", value: Number.POSITIVE_INFINITY, year: null };

  const month = Number(event.dateMonth);
  if (Number.isInteger(month) && month >= 1 && month <= 12) return { day: null, month, precision: "month", value: Date.UTC(year, month - 1, 1), year };
  return { day: null, month: null, precision: isApproximateValue(event.dateYear) ? "approximate" : "year", value: Date.UTC(year, 0, 1), year };
}

function extractStartYear(value) {
  const match = String(value || "").match(/-?\d{1,6}/);
  return match ? Number(match[0]) : Number.NaN;
}

function isApproximateValue(value) {
  return /c\.|circa|approx|~|about|around|-/.test(String(value || "").toLowerCase());
}

function precisionRank(precision) {
  return { exact: 0, month: 1, year: 2, approximate: 3, unknown: 4 }[precision] ?? 4;
}

function formatDate(event) {
  const parts = getSortParts(event);
  if (parts.precision === "exact" && event.dateFull) return formatDateWithMonthName(event.dateFull);
  if (parts.precision === "month") return `${formatMonthName(parts.month)} ${parts.year}`;
  if (parts.precision === "approximate") return `c. ${String(event.dateYear).replace(/^c\.\s*/i, "")}`;
  if (parts.precision === "year") return String(parts.year);
  return "Date unknown";
}

function getPrecisionLabel(precision) {
  return { exact: "Exact", month: "Month known", year: "Year known", approximate: "Approximate", unknown: "Unknown" }[precision] || "Unknown";
}

function shouldMarkYear(event) {
  return Number.isFinite(getSortParts(event).year);
}

function getEventAge(event, ocs) {
  if (!event.connectedCharacterIds?.length) return "";
  const character = ocs.find((oc) => oc.id === event.connectedCharacterIds[0]);
  const birthYear = extractStartYear(character?.birthDate || character?.birthYear || "");
  const eventYear = getSortParts(event).year;
  if (!Number.isFinite(birthYear) || !Number.isFinite(eventYear)) return "";
  return eventYear - birthYear;
}






