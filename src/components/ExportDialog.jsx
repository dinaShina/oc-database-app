import {
  ARCHIVE_EXPORT_OPTIONS,
  CHARACTER_EXPORT_OPTIONS,
  DEFAULT_ARCHIVE_EXPORT_OPTIONS,
  DEFAULT_CHARACTER_EXPORT_OPTIONS,
  exportCharacterArchivePdf,
  exportCharacterPdf,
  exportWorldArchivePdf,
  printCurrentPageToPdf
} from "../export/pdfExport.js";

export default function ExportDialog({ context, data, onClose, open }) {
  if (!open) return null;

  const isCharacter = context === "character";
  const isWorldArchive = context === "worldArchive";
  const optionList = isCharacter ? CHARACTER_EXPORT_OPTIONS : ARCHIVE_EXPORT_OPTIONS;
  const defaultOptions = isCharacter ? DEFAULT_CHARACTER_EXPORT_OPTIONS : DEFAULT_ARCHIVE_EXPORT_OPTIONS;

  function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const options = Object.fromEntries(optionList.map(([key]) => [key, formData.has(key)]));
    if (isCharacter) exportCharacterPdf({ ...data, options });
    else if (isWorldArchive) exportWorldArchivePdf({ ...data, options });
    else exportCharacterArchivePdf({ ...data, options });
    onClose();
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-dialog-title">
        <div className="modal-heading-row">
          <div>
            <p className="eyebrow">Export</p>
            <h2 id="export-dialog-title">{getTitle(context)}</h2>
            <p className="muted-text">Create a clean A4 print document, then choose Save as PDF in your browser print dialog.</p>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>Close</button>
        </div>

        <form className="export-form" onSubmit={submit}>
          <fieldset className="export-options-card">
            <legend>Include</legend>
            <div className="export-option-grid">
              {optionList.map(([key, label]) => (
                <label className="inline-check export-check" key={key}>
                  <input name={key} type="checkbox" defaultChecked={Boolean(defaultOptions[key])} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <section className="export-options-card">
            <h3>Export as</h3>
            <label className="inline-check export-check"><input type="radio" name="format" value="pdf" defaultChecked /><span>PDF</span></label>
            <p className="muted-text">Future formats prepared: Markdown, DOCX, JSON backup, and HTML.</p>
          </section>

          <div className="dialog-actions export-actions">
            <button className="primary-button" type="submit">Export PDF</button>
            <button className="secondary-button" type="button" onClick={printCurrentPageToPdf}>Print to PDF</button>
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function getTitle(context) {
  if (context === "character") return "Export Character";
  if (context === "worldArchive") return "Export World Archive";
  return "Export Character Archive";
}

