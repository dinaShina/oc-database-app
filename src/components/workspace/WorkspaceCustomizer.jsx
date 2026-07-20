import { DEFAULT_WORKSPACE_SECTIONS, resetWorkspaceConfigForOC, updateWorkspaceConfigForOC } from "../../storage/workspaceRepository.js";

export default function WorkspaceCustomizer({ configs, ocId, onChange, onClose, sections }) {
  function updateSections(nextSections) {
    onChange(updateWorkspaceConfigForOC(configs, ocId, nextSections));
  }

  function toggleSection(sectionId) {
    updateSections(sections.map((section) => section.id === sectionId ? { ...section, visible: !section.visible } : section));
  }

  function moveSection(sectionId, direction) {
    const index = sections.findIndex((section) => section.id === sectionId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sections.length) return;
    const nextSections = [...sections];
    const [moved] = nextSections.splice(index, 1);
    nextSections.splice(targetIndex, 0, moved);
    updateSections(nextSections);
  }

  function restoreDefault() {
    onChange(resetWorkspaceConfigForOC(configs, ocId));
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="confirm-dialog workspace-customizer-dialog" role="dialog" aria-modal="true" aria-labelledby="workspace-customizer-title">
        <div className="modal-heading-row">
          <div>
            <p className="eyebrow">Workspace</p>
            <h2 id="workspace-customizer-title">Customize Workspace</h2>
            <p className="muted-text">Hide, show, or reorder sections for this character only.</p>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>Close</button>
        </div>

        <div className="workspace-section-editor">
          {sections.map((section, index) => (
            <article className="workspace-section-row" key={section.id}>
              <label className="inline-check">
                <input type="checkbox" checked={section.visible !== false} onChange={() => toggleSection(section.id)} />
                <span>{section.label}</span>
              </label>
              <div className="section-order-actions">
                {index > 0 ? <button className="secondary-button" type="button" onClick={() => moveSection(section.id, -1)}>Up</button> : null}
                {index < sections.length - 1 ? <button className="secondary-button" type="button" onClick={() => moveSection(section.id, 1)}>Down</button> : null}
              </div>
            </article>
          ))}
        </div>

        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={restoreDefault}>Restore Default</button>
          <button className="primary-button inline-primary" type="button" onClick={onClose}>Done</button>
        </div>
      </section>
    </div>
  );
}

export function getDefaultWorkspaceSections() {
  return DEFAULT_WORKSPACE_SECTIONS;
}
