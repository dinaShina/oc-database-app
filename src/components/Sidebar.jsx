import atlasLoreLogo from "../assets/atlas-lore-logo-original.png";

const NAV_ITEMS = [
  ["dashboard", "Dashboard", DashboardIcon],
  ["library", "Characters", CharacterIcon],
  ["worlds", "Worlds", WorldsIcon],
  ["favorites", "Favorites", FavoritesIcon],
  ["account", "Account", AccountIcon],
  ["settings", "Settings", SettingsIcon]
];

export default function Sidebar({ activeSection, hasUnsavedChanges = false, onNavigate }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand"><span className="sidebar-brand-mark atlas-logo-mark" aria-hidden="true"><img className="atlas-logo-image" src={atlasLoreLogo} alt="" /></span><div className="sidebar-brand-copy"><p className="eyebrow">Atlas Lore</p><h2>Atlas Lore</h2></div></div>
      {hasUnsavedChanges ? <p className="sidebar-unsaved-indicator">Unsaved Changes</p> : null}
      <nav className="sidebar-nav" aria-label="Workspace navigation">
        {NAV_ITEMS.map(([id, label, Icon]) => (
          <button className={activeSection === id ? "sidebar-link active" : "sidebar-link"} key={id} type="button" onClick={() => onNavigate(id)}>
            <span className="sidebar-icon" aria-hidden="true"><Icon /></span>
            <span className="sidebar-link-label">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <rect x="18" y="5" width="9" height="9" rx="1.5" />
      <rect x="5" y="18" width="9" height="9" rx="1.5" />
      <rect x="18" y="18" width="9" height="9" rx="1.5" />
    </svg>
  );
}

function CharacterIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img">
      <path d="M16 4.5c-4.2 0-7.2 3.1-7.2 7.7 0 3.4 1.6 6.2 4 7.4-4.9 1.2-8 4.4-8.8 8.9h24c-.8-4.5-3.9-7.7-8.8-8.9 2.4-1.2 4-4 4-7.4 0-4.6-3-7.7-7.2-7.7Z" />
    </svg>
  );
}

function WorldsIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img">
      <path d="M5 8.5 13.5 5l9 3.5L27 6v19.5l-8.5 3.5-9-3.5L5 28V8.5Z" />
      <path d="M13.5 5v20.5" />
      <path d="M22.5 8.5V29" />
      <path d="m9 15 2 2 3-4" />
      <path d="m19 17 5 5" />
      <path d="m24 17-5 5" />
    </svg>
  );
}

function FavoritesIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img">
      <path d="m16 3.8 3.8 7.8 8.6 1.2-6.2 6.1 1.5 8.6L16 23.4l-7.7 4.1 1.5-8.6-6.2-6.1 8.6-1.2L16 3.8Z" />
    </svg>
  );
}


function AccountIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img">
      <circle cx="16" cy="11" r="5.8" />
      <path d="M6.2 27c1.2-5.7 4.7-8.7 9.8-8.7s8.6 3 9.8 8.7" />
      <path d="M22.8 6.5c1.9 1.4 3.1 3.6 3.1 6.1" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img">
      <path d="M18.8 3.8 20 7.2c.7.2 1.4.5 2 .8l3.3-1.5 2.7 4.6-2.9 2.1c.1.8.1 1.5 0 2.3l2.9 2.1-2.7 4.6-3.3-1.5c-.6.4-1.3.7-2 .8l-1.2 3.4h-5.4l-1.2-3.4c-.7-.2-1.4-.5-2-.8l-3.3 1.5-2.7-4.6 2.9-2.1a10 10 0 0 1 0-2.3l-2.9-2.1 2.7-4.6L10 8c.6-.4 1.3-.7 2-.8l1.2-3.4h5.6Z" />
      <circle cx="16" cy="14.4" r="4.2" />
    </svg>
  );
}


