export default function WorkspacePanel({ children, title }) {
  return <section className="panel workspace-panel"><h2>{title}</h2>{children}</section>;
}
