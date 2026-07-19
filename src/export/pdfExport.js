import { getWritingEntries } from "../storage/writingRepository.js";
import { getWorldTitle, getBirthSummary } from "../components/OCList.jsx";
import { formatDateWithMonthName } from "../utils/dateFormat.js";

export const CHARACTER_EXPORT_OPTIONS = [
  ["coverPage", "Cover page"],
  ["toc", "Table of contents"],
  ["profile", "Profile"],
  ["story", "Story"],
  ["inspiration", "Inspiration"],
  ["timeline", "Timeline"],
  ["network", "Character Network"],
  ["images", "Images"],
  ["notes", "Notes"]
];

export const ARCHIVE_EXPORT_OPTIONS = [
  ["coverPage", "Cover page"],
  ["toc", "Table of contents"],
  ["profile", "Profile cards"],
  ["story", "Story"],
  ["inspiration", "Inspiration"],
  ["timeline", "Timeline"],
  ["network", "Character Network"],
  ["images", "Images"],
  ["notes", "Notes"]
];

export const DEFAULT_CHARACTER_EXPORT_OPTIONS = {
  coverPage: true,
  toc: true,
  profile: true,
  story: true,
  inspiration: true,
  timeline: false,
  network: true,
  images: true,
  notes: true
};

export const DEFAULT_ARCHIVE_EXPORT_OPTIONS = {
  coverPage: true,
  toc: true,
  profile: true,
  story: true,
  inspiration: true,
  timeline: true,
  network: true,
  images: true,
  notes: true
};

export function exportCharacterPdf({ familyMembers = [], inspirationItems = [], oc, ocs = [], options = DEFAULT_CHARACTER_EXPORT_OPTIONS, relationshipMaps = [], relationships = [], timelineData = { timelines: [], events: [] } }) {
  if (!oc) return;
  const writingEntries = getWritingEntries().filter((entry) => entry.connectedOcId === oc.id);
  const html = buildCharacterDocument({ familyMembers, inspirationItems, oc, ocs, options, relationshipMaps, relationships, timelineData, writingEntries });
  openPrintDocument(html, `${oc.name || "character"}-archive`);
}

export function exportCharacterArchivePdf(data) {
  const html = buildCompleteCharacterArchive(data);
  openPrintDocument(html, "complete-character-archive");
}

export function exportWorldArchivePdf(data) {
  const html = buildCompleteWorldArchive(data);
  openPrintDocument(html, "complete-world-archive");
}

export function printCurrentPageToPdf() {
  window.print();
}

function buildCharacterDocument({ familyMembers, inspirationItems, oc, ocs, options, relationshipMaps, relationships, timelineData, writingEntries }) {
  const title = `${oc.name || "Character"} Archive`;
  const sections = [];
  const image = getImage(oc.profilePictureData, oc.profilePictureUrl);
  const banner = getImage(oc.bannerImageData, oc.bannerImageUrl);

  if (options.coverPage) sections.push(renderCover({ banner, image, subtitle: getWorldTitle(oc), title }));
  if (options.toc) sections.push(renderToc(getIncludedCharacterSections(options)));
  if (options.profile) sections.push(renderCharacterProfile(oc, options));
  if (options.story) sections.push(renderStories(writingEntries));
  if (options.inspiration) sections.push(renderInspiration(inspirationItems.filter((item) => item.ocId === oc.id), options));
  if (options.timeline) sections.push(renderTimelinesForCharacter(oc, ocs, timelineData));
  if (options.network) sections.push(renderNetwork({ familyMembers: familyMembers.filter((item) => item.ownerOcId === oc.id), oc, ocs, relationshipMap: relationshipMaps.find((map) => map.ownerOcId === oc.id), relationships: relationships.filter((item) => item.fromOcId === oc.id || item.toCharacterId === oc.id) }));

  return renderDocumentShell({ body: sections.join(""), theme: getExportTheme(oc), title });
}

function buildCompleteCharacterArchive({ familyMembers = [], inspirationItems = [], ocs = [], options = DEFAULT_ARCHIVE_EXPORT_OPTIONS, relationshipMaps = [], relationships = [], timelineData = { timelines: [], events: [] } }) {
  const writingEntries = getWritingEntries();
  const body = [renderCover({ title: "Complete Character Archive", subtitle: `${ocs.length} characters` })]
    .concat(options.toc ? [renderToc(ocs.map((oc) => oc.name || "Unnamed Character"))] : [])
    .concat(ocs.map((oc) => buildCharacterDocument({ familyMembers, inspirationItems, oc, ocs, options: { ...options, coverPage: false, toc: false }, relationshipMaps, relationships, timelineData, writingEntries: writingEntries.filter((entry) => entry.connectedOcId === oc.id) }).replace(/^.*<body>|<\/body>.*$/gs, "")))
    .join("");
  return renderDocumentShell({ body, theme: getExportTheme({ visualTheme: "Notebook" }), title: "Complete Character Archive" });
}

function buildCompleteWorldArchive({ ocs = [], options = DEFAULT_ARCHIVE_EXPORT_OPTIONS, timelineData = { timelines: [], events: [] }, worlds = [] }) {
  const body = [renderCover({ title: "Complete World Archive", subtitle: `${worlds.length} worlds` })]
    .concat(options.toc ? [renderToc(worlds.map((world) => world.name || "Unnamed World"))] : [])
    .concat(worlds.map((world) => renderWorld(world, ocs, timelineData, options)))
    .join("");
  return renderDocumentShell({ body, theme: getExportTheme({ visualTheme: "Notebook" }), title: "Complete World Archive" });
}

function renderCover({ banner = "", image = "", subtitle = "", title }) {
  return `<section class="pdf-cover page-break-after">${banner ? `<img class="pdf-banner" src="${escapeAttr(banner)}" alt="">` : ""}<div class="pdf-cover-content">${image ? `<img class="pdf-avatar" src="${escapeAttr(image)}" alt="">` : ""}<p class="pdf-kicker">Atlas Archive Export</p><h1>${escapeHtml(title)}</h1>${subtitle ? `<p class="pdf-subtitle">${escapeHtml(subtitle)}</p>` : ""}<p class="pdf-date">Exported ${escapeHtml(formatDateWithMonthName(new Date()))}</p></div></section>`;
}

function renderToc(items) {
  return `<section class="pdf-section page-break-after"><p class="pdf-kicker">Contents</p><h2>Table of Contents</h2><ol class="pdf-toc">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></section>`;
}

function renderCharacterProfile(oc, options) {
  const image = getImage(oc.profilePictureData, oc.profilePictureUrl);
  const facts = [
    ["World", getWorldTitle(oc)], ["Birthdate", getBirthSummary(oc)], ["Current age", oc.currentAge], ["Gender", [oc.gender, oc.genderDetails].filter(Boolean).join(" / ")], ["Species", oc.species], ["Ethnicity", oc.ethnicities]
  ];
  const longFields = [["Personality", oc.personality], ["Backstory", oc.backstory], ["Appearance", oc.appearanceNotes || oc.appearance], ["Skills / Powers", oc.skillsPowers], ["Weaknesses", oc.weaknesses], ["Relationships", oc.relationships], ["Affiliation", oc.affiliation]];
  return `<section class="pdf-section page-break-after"><div class="pdf-heading-row"><div><p class="pdf-kicker">Character Profile</p><h2>${escapeHtml(oc.name || "Unnamed Character")}</h2></div>${options.images && image ? `<img class="pdf-small-avatar" src="${escapeAttr(image)}" alt="">` : ""}</div>${renderFactGrid(facts)}${renderTextSections(longFields)}${options.notes ? renderTextSections([["Notes", oc.notes]]) : ""}</section>`;
}

function renderStories(entries) {
  if (!entries.length) return `<section class="pdf-section page-break-after"><p class="pdf-kicker">Story</p><h2>Story</h2><p class="pdf-muted">No story entries yet.</p></section>`;
  return `<section class="pdf-section page-break-after"><p class="pdf-kicker">Story</p><h2>Story</h2>${entries.map((entry) => `<article class="pdf-card story-card"><h3>${escapeHtml(entry.title || "Untitled")}</h3>${entry.subtitle ? `<p class="pdf-muted">${escapeHtml(entry.subtitle)}</p>` : ""}<div class="pdf-prose">${paragraphs(entry.content)}</div></article>`).join("")}</section>`;
}

function renderInspiration(items, options) {
  if (!items.length) return `<section class="pdf-section page-break-after"><p class="pdf-kicker">Inspiration</p><h2>Inspiration</h2><p class="pdf-muted">No inspiration entries yet.</p></section>`;
  return `<section class="pdf-section page-break-after"><p class="pdf-kicker">Inspiration</p><h2>Inspiration</h2><div class="pdf-inspiration-grid">${items.map((item) => renderInspirationCard(item, options)).join("")}</div></section>`;
}

function renderInspirationCard(item, options) {
  const image = item.imageData || item.imageUrl || (isImageType(item.type) ? item.url : "");
  return `<article class="pdf-card inspiration-card">${options.images && image ? `<img class="pdf-card-image" src="${escapeAttr(image)}" alt="">` : ""}${item.images?.length && options.images ? `<div class="pdf-moodboard">${item.images.slice(0, 6).map((src) => `<img src="${escapeAttr(src)}" alt="">`).join("")}</div>` : ""}<p class="pdf-kicker">${escapeHtml(item.type || "Inspiration")}</p><h3>${escapeHtml(item.title || item.quote || item.content || "Untitled")}</h3>${item.quote ? `<blockquote>${escapeHtml(item.quote)}</blockquote>` : ""}${item.artist ? `<p>${escapeHtml(item.artist)}</p>` : ""}${item.description || item.content ? `<p>${escapeHtml(item.description || item.content)}</p>` : ""}${item.colors?.length ? `<div class="pdf-palette">${item.colors.map((color) => `<span style="background:${escapeAttr(color.hex || "#ccc")}"></span>`).join("")}</div>` : ""}${item.notes ? `<p class="pdf-muted">${escapeHtml(item.notes)}</p>` : ""}</article>`;
}

function renderTimelinesForCharacter(oc, ocs, timelineData) {
  const events = timelineData.events.filter((event) => event.connectedCharacterIds?.includes(oc.id) || timelineData.timelines.find((timeline) => timeline.id === event.timelineId)?.connectedOcId === oc.id).sort((a, b) => Number(a.dateYear || 0) - Number(b.dateYear || 0));
  if (!events.length) return `<section class="pdf-section page-break-after"><p class="pdf-kicker">Timeline</p><h2>Timeline</h2><p class="pdf-muted">No connected timeline events yet.</p></section>`;
  return `<section class="pdf-section page-break-after"><p class="pdf-kicker">Timeline</p><h2>Timeline</h2><div class="pdf-timeline">${events.map((event) => `<article><strong>${escapeHtml(formatTimelineDate(event))}</strong><h3>${escapeHtml(event.title)}</h3>${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}${event.connectedCharacterIds?.length ? `<p class="pdf-muted">Characters: ${escapeHtml(event.connectedCharacterIds.map((id) => ocs.find((item) => item.id === id)?.name).filter(Boolean).join(", "))}</p>` : ""}</article>`).join("")}</div></section>`;
}

function formatTimelineDate(event) {
  if (event.dateFull) return formatDateWithMonthName(event.dateFull);
  return event.dateYear || "No date";
}

function renderNetwork({ familyMembers, oc, ocs, relationshipMap, relationships }) {
  const nodes = relationshipMap?.nodes || [];
  return `<section class="pdf-section page-break-after"><p class="pdf-kicker">Character Network</p><h2>Character Network</h2>${familyMembers.length ? `<h3>Family Tree</h3>${renderFactGrid(familyMembers.map((item) => [item.relationLabel || "Relation", item.name]))}` : ""}${relationships.length ? `<h3>Relationships</h3>${renderFactGrid(relationships.map((item) => [item.label || "Relationship", item.characterName || ocs.find((ocItem) => ocItem.id === item.toCharacterId)?.name || "Unknown"]))}` : ""}${nodes.length ? `<h3>Relationship Map Nodes</h3>${renderFactGrid(nodes.map((node) => [node.name || "Unnamed", node.notes || node.type]))}` : ""}${!familyMembers.length && !relationships.length && !nodes.length ? `<p class="pdf-muted">No network entries yet.</p>` : ""}</section>`;
}

function renderWorld(world, ocs, timelineData, options) {
  const connectedCharacters = ocs.filter((oc) => getWorldTitle(oc) === world.name);
  const worldTimelines = timelineData.timelines.filter((timeline) => timeline.connectedWorld === world.name);
  return `<section class="pdf-section page-break-after"><p class="pdf-kicker">World</p><h2>${escapeHtml(world.name || "Unnamed World")}</h2>${renderFactGrid([["Type", world.worldType], ["Characters", connectedCharacters.length], ["Timelines", worldTimelines.length]])}${world.description ? `<div class="pdf-prose"><h3>Description</h3>${paragraphs(world.description)}</div>` : ""}${options.notes && world.notes ? `<div class="pdf-prose"><h3>Notes</h3>${paragraphs(world.notes)}</div>` : ""}${connectedCharacters.length ? `<h3>Connected Characters</h3>${renderFactGrid(connectedCharacters.map((oc) => [oc.name, oc.species || getWorldTitle(oc)]))}` : ""}</section>`;
}

function renderFactGrid(facts) {
  const rows = facts.filter(([, value]) => value || value === 0);
  if (!rows.length) return "";
  return `<dl class="pdf-fact-grid">${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`).join("")}</dl>`;
}

function renderTextSections(sections) {
  return sections.filter(([, value]) => value).map(([label, value]) => `<div class="pdf-prose"><h3>${escapeHtml(label)}</h3>${paragraphs(value)}</div>`).join("");
}

function renderDocumentShell({ body, theme, title }) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${getPrintCss(theme)}</style></head><body>${body}<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),250));<\/script></body></html>`;
}

function openPrintDocument(html, name) {
  const printWindow = window.open("", name, "noopener,noreferrer,width=1000,height=800");
  if (!printWindow) {
    window.alert("Please allow popups to export this PDF.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function getExportTheme(oc) {
  return {
    accent: oc.paletteColorOne || oc.accentColor || "#2f6652",
    accentTwo: oc.paletteColorTwo || "#8b5b40",
    background: oc.paletteColorThree || "#f8f4ee",
    paper: oc.paletteColorFive || "#ffffff",
    text: "#20252b",
    theme: oc.visualTheme || "Modern"
  };
}

function getPrintCss(theme) {
  return `@page{size:A4;margin:18mm}*{box-sizing:border-box}body{background:${theme.background};color:${theme.text};font:12pt/1.55 Georgia,"Times New Roman",serif;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1,h2,h3{break-after:avoid;color:${theme.accentTwo};font-family:Georgia,"Times New Roman",serif;line-height:1.15;margin:0 0 10px}h1{font-size:38pt}h2{font-size:24pt}h3{font-size:15pt}p{margin:0 0 10px}.pdf-cover,.pdf-section{background:${theme.paper};border:1px solid rgba(0,0,0,.1);border-radius:18px;box-shadow:0 12px 32px rgba(0,0,0,.08);margin:0 auto 18px;overflow:hidden;padding:22px}.page-break-after{break-after:page}.pdf-banner{height:190px;object-fit:cover;width:100%}.pdf-cover-content{padding:28px}.pdf-avatar,.pdf-small-avatar{border:4px solid ${theme.paper};border-radius:50%;height:128px;object-fit:cover;width:128px}.pdf-small-avatar{height:82px;width:82px}.pdf-heading-row{align-items:start;display:flex;justify-content:space-between;gap:20px}.pdf-kicker{color:${theme.accent};font:700 9pt Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}.pdf-subtitle,.pdf-muted,.pdf-date{color:#6d665f}.pdf-toc{columns:2}.pdf-fact-grid{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr));margin:14px 0}.pdf-fact-grid div,.pdf-card{background:rgba(255,255,255,.66);border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:12px;break-inside:avoid}.pdf-fact-grid dt{color:#766f67;font:700 8pt Arial,sans-serif;text-transform:uppercase}.pdf-fact-grid dd{margin:3px 0 0}.pdf-prose{break-inside:avoid;margin:18px 0;white-space:normal}.pdf-prose p{white-space:pre-wrap}.pdf-inspiration-grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}.pdf-card-image{border-radius:10px;height:160px;object-fit:cover;width:100%}.pdf-moodboard{display:grid;gap:6px;grid-template-columns:repeat(3,1fr)}.pdf-moodboard img{aspect-ratio:1;object-fit:cover;width:100%;border-radius:8px}.pdf-palette{display:flex;gap:6px;flex-wrap:wrap}.pdf-palette span{border:1px solid rgba(0,0,0,.15);border-radius:99px;height:28px;width:28px}.pdf-timeline{border-left:3px solid ${theme.accent};display:grid;gap:14px;margin-left:8px;padding-left:18px}.pdf-timeline article{break-inside:avoid}.story-card{margin-bottom:14px}@media print{body{background:white}.pdf-section,.pdf-cover{box-shadow:none}}`;
}

function getIncludedCharacterSections(options) {
  return [["profile", "Character Profile"], ["story", "Story"], ["inspiration", "Inspiration"], ["timeline", "Timeline"], ["network", "Character Network"], ["notes", "Notes"]].filter(([key]) => options[key]).map(([, label]) => label);
}

function paragraphs(value) {
  return escapeHtml(String(value || "")).split(/\n{2,}/).map((part) => `<p>${part.replace(/\n/g, "<br>")}</p>`).join("");
}

function getImage(data, url) {
  return data || url || "";
}

function isImageType(type) {
  return ["Picture", "Outfit", "Pose", "Architecture", "Animal", "Object", "Location", "Character Reference", "Book", "Movie / Series", "Voice Actor", "Symbol", "Flower", "Fashion"].includes(type);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}



