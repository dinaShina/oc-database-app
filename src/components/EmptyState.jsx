export default function EmptyState({ actionLabel, icon = "spark", message, onAction, title }) {
  return (
    <section className="empty-state-card">
      <div className={`empty-state-illustration ${icon}`} aria-hidden="true">
        <span />
      </div>
      <div className="empty-state-copy">
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      {actionLabel && onAction ? (
        <button className="primary-button inline-primary" type="button" onClick={onAction}>{actionLabel}</button>
      ) : null}
    </section>
  );
}
