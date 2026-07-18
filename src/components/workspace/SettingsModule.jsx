import { useEffect, useState } from "react";
import WorkspacePanel from "./WorkspacePanel.jsx";

const THEME_OPTIONS = ["Dark", "Fantasy", "Gothic", "Royal", "Modern", "Sci-Fi", "Old Style"];
const COLOR_USAGE = [
  ["paletteColorOne", "Accent Color 1", "used for buttons and active tabs"],
  ["paletteColorTwo", "Accent Color 2", "used for borders and highlights"],
  ["paletteColorThree", "Accent Color 3", "used for soft backgrounds/cards"],
  ["paletteColorFour", "Accent Color 4", "used for headings or small details"]
];

export default function SettingsModule({ oc, onDeleteOC, onUpdateOC }) {
  const [formData, setFormData] = useState({ ...oc });

  useEffect(() => {
    setFormData({ ...oc });
  }, [oc]);

  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setFormData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function uploadImage(event, dataKey, urlKey) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData((current) => ({ ...current, [dataKey]: String(reader.result || ""), [urlKey]: "" }));
    reader.readAsDataURL(file);
  }

  function submit(event) {
    event.preventDefault();
    onUpdateOC(oc.id, { ...formData, accentColor: formData.paletteColorOne || formData.accentColor });
  }

  const previewStyle = {
    "--workspace-accent": formData.paletteColorOne || formData.accentColor || "#2f6652",
    "--workspace-accent-2": formData.paletteColorTwo || "#8b5b40",
    "--workspace-accent-3": formData.paletteColorThree || "#f5f2ec",
    "--workspace-accent-4": formData.paletteColorFour || formData.paletteColorTwo || "#8b5b40"
  };

  return (
    <WorkspacePanel title="Settings">
      <form className="sub-form" onSubmit={submit}>
        <div className="field-grid">
          <TextInput label="Banner image URL" name="bannerImageUrl" value={formData.bannerImageUrl} onChange={updateField} />
          <label className="field"><span>Upload banner</span><input type="file" accept="image/*" onChange={(event) => uploadImage(event, "bannerImageData", "bannerImageUrl")} /></label>
          <TextInput label="Profile picture URL" name="profilePictureUrl" value={formData.profilePictureUrl} onChange={updateField} />
          <label className="field"><span>Upload profile picture</span><input type="file" accept="image/*" onChange={(event) => uploadImage(event, "profilePictureData", "profilePictureUrl")} /></label>
          <ColorInput label="Accent Color 1" name="paletteColorOne" value={formData.paletteColorOne || formData.accentColor} onChange={updateField} />
          <ColorInput label="Accent Color 2" name="paletteColorTwo" value={formData.paletteColorTwo} onChange={updateField} />
          <ColorInput label="Accent Color 3" name="paletteColorThree" value={formData.paletteColorThree} onChange={updateField} />
          <ColorInput label="Accent Color 4" name="paletteColorFour" value={formData.paletteColorFour || formData.paletteColorTwo} onChange={updateField} />
          <ColorInput label="Extra palette color" name="paletteColorFive" value={formData.paletteColorFive} onChange={updateField} />
          <label className="field">
            <span>Optional visual theme</span>
            <select name="visualTheme" value={formData.visualTheme || "Modern"} onChange={updateField}>
              {THEME_OPTIONS.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
            </select>
          </label>
          <label className="inline-check"><input name="isFavorite" type="checkbox" checked={Boolean(formData.isFavorite)} onChange={updateField} /><span>Favorite OC</span></label>
        </div>

        <section className={`theme-preview-panel theme-${slugifyTheme(formData.visualTheme || "Modern")}`} style={previewStyle}>
          <div>
            <p className="eyebrow">Theme Preview</p>
            <h3>{formData.visualTheme || "Modern"}</h3>
          </div>
          <div className="theme-preview-surface">
            <button className="theme-preview-button" type="button">Button</button>
            <span className="theme-preview-tab">Active tab</span>
            <span className="theme-preview-card">Card</span>
          </div>
        </section>

        <section className="color-usage-grid">
          {COLOR_USAGE.map(([key, label, usage]) => {
            const color = formData[key] || fallbackColor(key, formData);
            return <ColorUsageCard color={color} key={key} label={label} usage={usage} />;
          })}
        </section>

        <button className="primary-button inline-primary" type="submit">Save settings</button>
      </form>
      <button className="delete-button inline-primary" type="button" onClick={() => onDeleteOC(oc.id)}>Delete this OC</button>
    </WorkspacePanel>
  );
}

function TextInput({ label, name, onChange, value }) {
  return <label className="field"><span>{label}</span><input name={name} value={value || ""} onChange={onChange} /></label>;
}

function ColorInput({ label, name, onChange, value }) {
  return <label className="field"><span>{label}</span><input name={name} type="color" value={value || "#2f6652"} onChange={onChange} /></label>;
}

function ColorUsageCard({ color, label, usage }) {
  return (
    <article className="color-usage-card">
      <span className="color-swatch" style={{ backgroundColor: color }} />
      <div>
        <strong>{label}</strong>
        <code>{color}</code>
        <p>{usage}</p>
      </div>
    </article>
  );
}

function slugifyTheme(theme) {
  return String(theme || "Modern").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "modern";
}

function fallbackColor(key, formData) {
  if (key === "paletteColorOne") return formData.accentColor || "#2f6652";
  if (key === "paletteColorTwo") return "#8b5b40";
  if (key === "paletteColorThree") return "#f5f2ec";
  return formData.paletteColorTwo || "#8b5b40";
}

