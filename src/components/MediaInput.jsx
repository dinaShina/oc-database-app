import { useEffect, useId, useState } from "react";

const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"];

export default function MediaInput({ dataValue = "", label = "Image", onChange, urlValue = "" }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("upload");
  const [draftUrl, setDraftUrl] = useState(urlValue || "");
  const [error, setError] = useState("");
  const fileInputId = useId();
  const source = dataValue || urlValue;

  useEffect(() => {
    setDraftUrl(urlValue || "");
  }, [urlValue]);

  function chooseFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setError("Unsupported image file. Use PNG, JPG, GIF, WEBP, or SVG.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setError("");
      onChange({ data: String(reader.result || ""), url: "" });
      setOpen(false);
    };
    reader.readAsDataURL(file);
  }

  function applyUrl() {
    const cleanedUrl = draftUrl.trim();
    if (!cleanedUrl) {
      onChange({ data: "", url: "" });
      setOpen(false);
      return;
    }
    if (!isValidImageUrl(cleanedUrl)) {
      setError("Please paste a valid image link.");
      return;
    }
    setError("");
    onChange({ data: "", url: cleanedUrl });
    setOpen(false);
  }

  function removeImage() {
    setDraftUrl("");
    setError("");
    onChange({ data: "", url: "" });
  }

  return (
    <section className="media-input">
      <div className="media-input-preview">
        {source ? <img src={source} alt={`${label} preview`} onError={() => setError("This image could not be loaded.")} /> : <span>No image</span>}
      </div>
      <div className="media-input-body">
        <div>
          <span className="media-input-label">{label}</span>
          {source ? <p className="muted-text">Image selected</p> : <p className="muted-text">Upload a file or paste an image link.</p>}
        </div>
        <div className="media-input-actions">
          <button className="secondary-button" type="button" onClick={() => setOpen((current) => !current)}>{source ? "Replace Image" : "Add Image"}</button>
          {source ? <button className="delete-button" type="button" onClick={removeImage}>Remove</button> : null}
        </div>
        {open ? (
          <div className="media-input-panel">
            <div className="segmented-control two-options compact-media-mode">
              <button className={mode === "upload" ? "choice-button active" : "choice-button"} type="button" onClick={() => setMode("upload")}>Upload File</button>
              <button className={mode === "link" ? "choice-button active" : "choice-button"} type="button" onClick={() => setMode("link")}>Paste Link</button>
            </div>
            {mode === "upload" ? (
              <label className="field compact-file-field" htmlFor={fileInputId}><span>Choose image file</span><input id={fileInputId} type="file" accept="image/*" onChange={chooseFile} /></label>
            ) : (
              <div className="field compact-link-field"><span>Image link</span><div className="media-link-row"><input type="url" value={draftUrl} placeholder="https://..." onChange={(event) => setDraftUrl(event.target.value)} /><button className="primary-button inline-primary" type="button" onClick={applyUrl}>Use Link</button></div></div>
            )}
            {error ? <p className="form-error-text">{error}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function isValidImageUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:", "data:"].includes(url.protocol);
  } catch {
    return false;
  }
}

