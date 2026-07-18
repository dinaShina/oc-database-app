import WorkspacePanel from "./WorkspacePanel.jsx";

export default function PreparedModule({ items, title }) {
  return (
    <WorkspacePanel title={title}>
      <div className="prepared-grid">
        {items.map((item) => <article className="prepared-card" key={item}><h3>{item}</h3><p className="muted-text">Prepared for the next build step.</p></article>)}
      </div>
    </WorkspacePanel>
  );
}
