import { useCallback, useEffect, useRef, useState } from "react";
import useIsMobile from "../../hooks/useIsMobile.js";
import { contrastRatio, getSafeWorkspaceStyle, isValidHex } from "../../utils/themeContrast.js";
import MediaInput from "../MediaInput.jsx";
import WorkspacePanel from "./WorkspacePanel.jsx";

const CLEAN_UNSAVED_STATE = { isDirty: false, save: null };
const FONT_OPTIONS = [
  ["Modern Sans", "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"],
  ["Elegant Serif", "Georgia, Cambria, Times New Roman, serif"],
  ["Classic Book", "Palatino Linotype, Palatino, Book Antiqua, Georgia, serif"],
  ["Typewriter", "Courier New, Courier, monospace"],
  ["Handwritten", "Segoe Print, Bradley Hand ITC, Comic Sans MS, cursive"],
  ["Gothic", "Copperplate, Georgia, serif"],
  ["Fantasy", "Papyrus, Georgia, fantasy"],
  ["Sci-Fi", "Trebuchet MS, Segoe UI, Arial, sans-serif"],
  ["Custom Uploaded", "var(--workspace-custom-font, inherit)"]
];
const FONT_MAP = Object.fromEntries(FONT_OPTIONS);
const FONT_TARGETS = [["heading", "Heading"], ["body", "Body"], ["handwriting", "Handwriting"]];
const SUPPORTED_FONT_TYPES = ["font/ttf", "font/otf", "font/woff", "font/woff2", "application/x-font-ttf", "application/x-font-otf", "application/font-woff", "application/font-woff2", "application/octet-stream"];
const SUPPORTED_FONT_EXTENSIONS = ["ttf", "otf", "woff", "woff2"];

const STYLE_PRESETS = {
  Minimal: { description: "Clean, quiet, flat", headingFont: "Modern Sans", bodyFont: "Modern Sans", handwritingFont: "Handwritten", paletteColorOne: "#2f6652", paletteColorTwo: "#9aa39b", workspaceBackgroundColor: "#f7f7f4", workspaceCardColor: "#ffffff", workspaceTextColor: "#20252b", workspaceBorderColor: "#e4e4dd", workspaceBorderRadius: "12", workspaceShadowStrength: "none", workspaceCardStyle: "flat", workspacePaperStyle: "clean paper" },
  Modern: { description: "Soft creative studio", headingFont: "Modern Sans", bodyFont: "Modern Sans", handwritingFont: "Handwritten", paletteColorOne: "#356b58", paletteColorTwo: "#547c8d", workspaceBackgroundColor: "#f6f4ef", workspaceCardColor: "#ffffff", workspaceTextColor: "#20252b", workspaceBorderColor: "#ded8cf", workspaceBorderRadius: "16", workspaceShadowStrength: "soft", workspaceCardStyle: "soft cards", workspacePaperStyle: "smooth studio" },
  Notebook: { description: "Warm paper workspace", headingFont: "Classic Book", bodyFont: "Elegant Serif", handwritingFont: "Handwritten", paletteColorOne: "#365f4f", paletteColorTwo: "#b07953", workspaceBackgroundColor: "#f4ecd9", workspaceCardColor: "#fffaf0", workspaceTextColor: "#2d2720", workspaceBorderColor: "#d8c5a3", workspaceBorderRadius: "10", workspaceShadowStrength: "soft", workspaceCardStyle: "paper sheets", workspacePaperStyle: "notebook paper" },
  "Old Journal": { description: "Aged pages and serif text", headingFont: "Classic Book", bodyFont: "Elegant Serif", handwritingFont: "Handwritten", paletteColorOne: "#694c2f", paletteColorTwo: "#9a6b3f", workspaceBackgroundColor: "#efe0bf", workspaceCardColor: "#fff2d0", workspaceTextColor: "#2d2117", workspaceBorderColor: "#b8945f", workspaceBorderRadius: "8", workspaceShadowStrength: "medium", workspaceCardStyle: "aged paper", workspacePaperStyle: "old journal" },
  Gothic: { description: "Deep dramatic panels", headingFont: "Gothic", bodyFont: "Elegant Serif", handwritingFont: "Handwritten", paletteColorOne: "#9d3d59", paletteColorTwo: "#5c5262", workspaceBackgroundColor: "#171419", workspaceCardColor: "#241c22", workspaceTextColor: "#f4e9ee", workspaceBorderColor: "#5d4250", workspaceBorderRadius: "10", workspaceShadowStrength: "deep", workspaceCardStyle: "dark panels", workspacePaperStyle: "velvet dark" },
  Fantasy: { description: "Elegant storybook feel", headingFont: "Fantasy", bodyFont: "Elegant Serif", handwritingFont: "Handwritten", paletteColorOne: "#4f7d54", paletteColorTwo: "#a17b39", workspaceBackgroundColor: "#eef0df", workspaceCardColor: "#fff8e8", workspaceTextColor: "#2f2a1d", workspaceBorderColor: "#c8b46f", workspaceBorderRadius: "18", workspaceShadowStrength: "soft", workspaceCardStyle: "storybook cards", workspacePaperStyle: "enchanted page" },
  Royal: { description: "Purple and gold stationery", headingFont: "Elegant Serif", bodyFont: "Classic Book", handwritingFont: "Handwritten", paletteColorOne: "#7047a6", paletteColorTwo: "#bf9245", workspaceBackgroundColor: "#f4edf8", workspaceCardColor: "#fff9f0", workspaceTextColor: "#241d2d", workspaceBorderColor: "#d5b66d", workspaceBorderRadius: "14", workspaceShadowStrength: "medium", workspaceCardStyle: "framed cards", workspacePaperStyle: "royal stationery" },
  "Sci-Fi": { description: "Clean technical panels", headingFont: "Sci-Fi", bodyFont: "Modern Sans", handwritingFont: "Typewriter", paletteColorOne: "#1f7f8a", paletteColorTwo: "#6a7cff", workspaceBackgroundColor: "#edf6f8", workspaceCardColor: "#f7fbff", workspaceTextColor: "#132733", workspaceBorderColor: "#9ccad5", workspaceBorderRadius: "6", workspaceShadowStrength: "soft", workspaceCardStyle: "clean panels", workspacePaperStyle: "data sheet" },
  "Research File": { description: "File notes and records", headingFont: "Typewriter", bodyFont: "Modern Sans", handwritingFont: "Typewriter", paletteColorOne: "#42515a", paletteColorTwo: "#8a6f45", workspaceBackgroundColor: "#efeee9", workspaceCardColor: "#fbfaf4", workspaceTextColor: "#22272b", workspaceBorderColor: "#c7c1b5", workspaceBorderRadius: "4", workspaceShadowStrength: "none", workspaceCardStyle: "file cards", workspacePaperStyle: "case file" },
  Scrapbook: { description: "Layered creative cards", headingFont: "Handwritten", bodyFont: "Modern Sans", handwritingFont: "Handwritten", paletteColorOne: "#c45f76", paletteColorTwo: "#4d8c7f", workspaceBackgroundColor: "#f4eadf", workspaceCardColor: "#fffdf8", workspaceTextColor: "#2c2722", workspaceBorderColor: "#dfb6a6", workspaceBorderRadius: "18", workspaceShadowStrength: "medium", workspaceCardStyle: "layered cards", workspacePaperStyle: "scrapbook page" },
  Dark: { description: "Readable night workspace", headingFont: "Modern Sans", bodyFont: "Modern Sans", handwritingFont: "Handwritten", paletteColorOne: "#7fc7ac", paletteColorTwo: "#9aa5ff", workspaceBackgroundColor: "#14181b", workspaceCardColor: "#20252b", workspaceTextColor: "#eff5f2", workspaceBorderColor: "#35424a", workspaceBorderRadius: "14", workspaceShadowStrength: "deep", workspaceCardStyle: "dark cards", workspacePaperStyle: "night page" },
  "Own Style": { description: "Your custom setup" }
};
const PRESET_NAMES = Object.keys(STYLE_PRESETS);

function serializeForm(formData) { return JSON.stringify(formData); }

export default function SettingsModule({ mode = "appearance", oc, onDeleteOC, onUnsavedStateChange, onUpdateOC }) {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState(() => normalizeCustomizeData(oc));
  const [fontError, setFontError] = useState("");
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState("light");
  const [openMobileSections, setOpenMobileSections] = useState([]);
  const initialSnapshotRef = useRef(serializeForm(normalizeCustomizeData(oc)));
  const isDirty = serializeForm(formData) !== initialSnapshotRef.current;

  useEffect(() => {
    const nextFormData = normalizeCustomizeData(oc);
    initialSnapshotRef.current = serializeForm(nextFormData);
    setFormData(nextFormData);
    setFontError("");
    onUnsavedStateChange?.(CLEAN_UNSAVED_STATE);
  }, [oc, onUnsavedStateChange]);

  useEffect(() => () => onUnsavedStateChange?.(CLEAN_UNSAVED_STATE), [onUnsavedStateChange]);

  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setFormData((current) => {
      const next = { ...current, [name]: type === "checkbox" ? checked : value };
      if (name === "customFontTarget" && current.customFontData) next[getFontFieldForTarget(value)] = "Custom Uploaded";
      return next;
    });
  }

  function updateColorField(event) {
    const { name, value } = event.target;
    if (!isValidHex(value)) return;
    updateField(event);
  }

  function updateMedia(dataKey, urlKey, media) { setFormData((current) => ({ ...current, [dataKey]: media.data, [urlKey]: media.url })); }

  function applyPresetName(preset) {
    const values = STYLE_PRESETS[preset] || {};
    const { description: _description, ...safeValues } = values;
    setFormData((current) => ({ ...current, visualTheme: preset, ...safeValues }));
  }

  function applyPreset(event) { applyPresetName(event.target.value); }
  function resetChanges() { setFormData(normalizeCustomizeData(oc)); setFontError(""); }
  function restoreDefault() { setFormData((current) => ({ ...current, visualTheme: "Modern", ...stripPresetMeta(STYLE_PRESETS.Modern), customFontData: "", customFontName: "", customFontFormat: "", customFontTarget: "handwriting" })); setFontError(""); }
  function cancelChanges() { resetChanges(); onUnsavedStateChange?.(CLEAN_UNSAVED_STATE); }

  function uploadCustomFont(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!SUPPORTED_FONT_EXTENSIONS.includes(extension) || (!SUPPORTED_FONT_TYPES.includes(file.type) && file.type)) { setFontError("Unsupported font file. Use TTF, OTF, WOFF, or WOFF2."); return; }
    const reader = new FileReader();
    reader.onload = () => { setFontError(""); setFormData((current) => ({ ...current, customFontData: String(reader.result || ""), customFontName: file.name, customFontFormat: extension, [getFontFieldForTarget(current.customFontTarget || "handwriting")]: "Custom Uploaded" })); };
    reader.onerror = () => setFontError("This font could not be loaded. The character will keep the fallback font.");
    reader.readAsDataURL(file);
  }

  function removeCustomFont() {
    setFormData((current) => ({ ...current, customFontData: "", customFontName: "", customFontFormat: "", headingFont: current.headingFont === "Custom Uploaded" ? "Modern Sans" : current.headingFont, bodyFont: current.bodyFont === "Custom Uploaded" ? "Modern Sans" : current.bodyFont, handwritingFont: current.handwritingFont === "Custom Uploaded" ? "Handwritten" : current.handwritingFont }));
    setFontError("");
  }

  const saveCurrentSettings = useCallback(() => {
    if (!areCustomColorsValid(formData)) { setFontError("One or more custom colors are invalid. Use valid hex colors before saving."); return false; }
    const nextFormData = { ...formData, accentColor: formData.paletteColorOne || formData.accentColor };
    onUpdateOC(oc.id, nextFormData);
    initialSnapshotRef.current = serializeForm(nextFormData);
    onUnsavedStateChange?.(CLEAN_UNSAVED_STATE);
    return true;
  }, [formData, oc.id, onUnsavedStateChange, onUpdateOC]);

  useEffect(() => { onUnsavedStateChange?.({ isDirty, save: saveCurrentSettings }); }, [isDirty, onUnsavedStateChange, saveCurrentSettings]);
  function submit(event) { event.preventDefault(); saveCurrentSettings(); }

  if (mode === "settings") {
    return <WorkspacePanel title="Settings"><form className="sub-form character-settings-panel" onSubmit={submit}><div><p className="eyebrow">Character Settings</p><h3>Technical Options</h3><p className="muted-text">Character-specific technical options live here. Visual customization is in Customize.</p></div><label className="inline-check"><input name="isFavorite" type="checkbox" checked={Boolean(formData.isFavorite)} onChange={updateField} /><span>Favorite OC</span></label><div className="form-actions"><button className="primary-button inline-primary" type="submit">Save settings</button></div></form><button className="delete-button inline-primary" type="button" onClick={() => onDeleteOC(oc.id)}>Delete this OC</button></WorkspacePanel>;
  }

  const previewResult = getPreviewStyle(formData, previewMode);
  const previewStyle = previewResult.style;
  const warnings = [...previewResult.corrections, ...getColorWarnings(formData)];

  const imageControls = <CustomizeCard title="Images"><MediaInput label="Banner" dataValue={formData.bannerImageData} urlValue={formData.bannerImageUrl} onChange={(media) => updateMedia("bannerImageData", "bannerImageUrl", media)} /><MediaInput label="Profile Picture" dataValue={formData.profilePictureData} urlValue={formData.profilePictureUrl} onChange={(media) => updateMedia("profilePictureData", "profilePictureUrl", media)} /></CustomizeCard>;
  const styleControls = <CustomizeCard title="Style"><label className="field desktop-preset-select"><span>Style preset</span><select name="visualTheme" value={formData.visualTheme || "Modern"} onChange={applyPreset}>{PRESET_NAMES.map((theme) => <option key={theme} value={theme}>{theme}</option>)}</select></label><div className="preset-card-grid">{PRESET_NAMES.map((preset) => <button className={formData.visualTheme === preset ? "preset-choice-card active" : "preset-choice-card"} key={preset} type="button" onClick={() => applyPresetName(preset)}><span className="preset-mini-preview" style={getPreviewStyle({ ...formData, ...stripPresetMeta(STYLE_PRESETS[preset]) }, previewMode).style} /><strong>{preset}</strong><small>{STYLE_PRESETS[preset].description || "Custom character style"}</small></button>)}</div><label className="field"><span>Workspace mode preference</span><select name="workspaceMode" value={formData.workspaceMode || "light"} onChange={updateField}><option value="light">Light</option><option value="dark">Dark</option><option value="auto">Auto</option></select></label><TextInput label="Background / Paper Style" name="workspacePaperStyle" value={formData.workspacePaperStyle} onChange={updateField} /><TextInput label="Card Style" name="workspaceCardStyle" value={formData.workspaceCardStyle} onChange={updateField} /></CustomizeCard>;
  const colorControls = <CustomizeCard title="Colors"><ColorInput label="Primary Accent" help="Used for active tabs and primary buttons." name="paletteColorOne" value={formData.paletteColorOne} onChange={updateColorField} background={formData.workspaceCardColor} /><ColorInput label="Secondary Accent" help="Used for highlights and small details." name="paletteColorTwo" value={formData.paletteColorTwo} onChange={updateColorField} background={formData.workspaceCardColor} /><ColorInput label="Background Color" help="Used for the workspace background." name="workspaceBackgroundColor" value={formData.workspaceBackgroundColor} onChange={updateColorField} background={formData.workspaceTextColor} /><ColorInput label="Card Background" help="Used for profile cards and content panels." name="workspaceCardColor" value={formData.workspaceCardColor} onChange={updateColorField} background={formData.workspaceTextColor} /><ColorInput label="Text Color" help="Used for main readable text." name="workspaceTextColor" value={formData.workspaceTextColor} onChange={updateColorField} background={formData.workspaceCardColor} /><ColorInput label="Border / Detail Color" help="Used for borders, dividers, and small details." name="workspaceBorderColor" value={formData.workspaceBorderColor} onChange={updateColorField} background={formData.workspaceCardColor} />{warnings.length ? <p className="contrast-warning">Some text colors were adjusted in the preview for readability.</p> : null}</CustomizeCard>;
  const typographyControls = <CustomizeCard title="Typography"><FontControl label="Heading Font" name="headingFont" value={formData.headingFont} onChange={updateField} sample={formData.name || "Character Name"} /><FontControl label="Body Font" name="bodyFont" value={formData.bodyFont} onChange={updateField} sample="This is how profile text will appear." /><FontControl label="Character Handwriting Font" name="handwritingFont" value={formData.handwritingFont} onChange={updateField} sample="A note written by this character." /><div className="font-upload-group"><label className="field"><span>Custom font upload</span><input type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" onChange={uploadCustomFont} /></label><label className="field"><span>Assign uploaded font as</span><select name="customFontTarget" value={formData.customFontTarget || "handwriting"} onChange={updateField}>{FONT_TARGETS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{formData.customFontName ? <div className="custom-font-status"><strong>{formData.customFontName}</strong><span>Saved for this character only.</span><button className="delete-button" type="button" onClick={removeCustomFont}>Remove font</button></div> : null}{fontError ? <p className="form-error-text">{fontError}</p> : null}</div></CustomizeCard>;
  const advancedControls = <CustomizeCard title="Shape and Depth"><label className="field"><span>Border radius</span><input name="workspaceBorderRadius" type="range" min="0" max="28" value={Number(formData.workspaceBorderRadius || 16)} onChange={updateField} /><small>{formData.workspaceBorderRadius}px</small></label><label className="field"><span>Shadow strength</span><select name="workspaceShadowStrength" value={formData.workspaceShadowStrength || "soft"} onChange={updateField}><option value="none">None</option><option value="soft">Soft</option><option value="medium">Medium</option><option value="deep">Deep</option></select></label></CustomizeCard>;
  const decorationControls = <CustomizeCard title="Decorations"><TextInput label="Background / Paper Style" name="workspacePaperStyle" value={formData.workspacePaperStyle} onChange={updateField} /><TextInput label="Card Style" name="workspaceCardStyle" value={formData.workspaceCardStyle} onChange={updateField} /><p className="muted-text">Stickers and decorative extras will live here later. For now these labels shape the mood of the workspace.</p></CustomizeCard>;

  if (isMobile) {
    const mobileSections = [["Style", styleControls], ["Colors", colorControls], ["Typography", typographyControls], ["Images", imageControls], ["Decorations", decorationControls], ["Advanced", advancedControls]];
    return <WorkspacePanel title="Customize"><form className="customize-mobile-flow" onSubmit={submit}><header className="customize-mobile-header"><div><p className="eyebrow">Customize</p><h3>{formData.name || "Character"}</h3></div><button className="primary-button inline-primary" type="submit">Save</button></header><div className="mobile-preview-mode-row"><button className={previewMode === "light" ? "theme-mode-card active" : "theme-mode-card"} type="button" onClick={() => setPreviewMode("light")}>Preview Light</button><button className={previewMode === "dark" ? "theme-mode-card active" : "theme-mode-card"} type="button" onClick={() => setPreviewMode("dark")}>Preview Dark</button></div><MobilePreviewCard formData={formData} style={previewStyle} warnings={warnings} /><button className="secondary-button mobile-full-preview-button" type="button" onClick={() => setFullscreenPreview(true)}>Open Full Preview</button><div className="mobile-customize-sections">{mobileSections.map(([title, content]) => <section className="mobile-customize-section" key={title}><button className="mobile-customize-section-toggle" type="button" onClick={() => toggleMobileSection(title, setOpenMobileSections)}><strong>{title}</strong><span>{openMobileSections.includes(title) ? "Close" : "Open"}</span></button>{openMobileSections.includes(title) ? <div className="mobile-customize-section-body">{content}</div> : null}</section>)}</div><div className="form-actions customize-actions mobile-customize-actions"><button className="primary-button inline-primary" type="submit">Save Changes</button><button className="secondary-button" type="button" onClick={cancelChanges}>Cancel</button><button className="secondary-button" type="button" onClick={resetChanges}>Reset</button><button className="danger-outline-button" type="button" onClick={restoreDefault}>Restore Default</button></div></form>{fullscreenPreview ? <div className="dialog-backdrop" role="presentation"><section className="customize-fullscreen-preview"><div className="modal-heading-row"><h2>Preview</h2><button className="secondary-button" type="button" onClick={() => setFullscreenPreview(false)}>Close</button></div><div className="mobile-preview-mode-row"><button className={previewMode === "light" ? "theme-mode-card active" : "theme-mode-card"} type="button" onClick={() => setPreviewMode("light")}>Light</button><button className={previewMode === "dark" ? "theme-mode-card active" : "theme-mode-card"} type="button" onClick={() => setPreviewMode("dark")}>Dark</button></div><LivePreview formData={formData} style={previewStyle} warnings={warnings} /></section></div> : null}</WorkspacePanel>;
  }

  return <WorkspacePanel title="Customize"><form className="customize-layout" onSubmit={submit}><div className="customize-controls">{imageControls}{styleControls}{colorControls}{typographyControls}{advancedControls}</div><aside className="customize-preview-column"><div className="mobile-preview-mode-row desktop-preview-mode-row"><button className={previewMode === "light" ? "theme-mode-card active" : "theme-mode-card"} type="button" onClick={() => setPreviewMode("light")}>Preview Light</button><button className={previewMode === "dark" ? "theme-mode-card active" : "theme-mode-card"} type="button" onClick={() => setPreviewMode("dark")}>Preview Dark</button></div><button className="secondary-button mobile-full-preview-button" type="button" onClick={() => setFullscreenPreview(true)}>Preview Fullscreen</button><LivePreview formData={formData} style={previewStyle} warnings={warnings} /><div className="form-actions customize-actions"><button className="primary-button inline-primary" type="submit">Save Changes</button><button className="secondary-button" type="button" onClick={cancelChanges}>Cancel</button><button className="secondary-button" type="button" onClick={resetChanges}>Reset Changes</button><button className="danger-outline-button" type="button" onClick={restoreDefault}>Restore Default</button></div></aside></form>{fullscreenPreview ? <div className="dialog-backdrop" role="presentation"><section className="customize-fullscreen-preview"><div className="modal-heading-row"><h2>Preview</h2><button className="secondary-button" type="button" onClick={() => setFullscreenPreview(false)}>Close</button></div><LivePreview formData={formData} style={previewStyle} warnings={warnings} /></section></div> : null}</WorkspacePanel>;
}

function CustomizeCard({ children, title }) { return <section className="customize-card"><h3>{title}</h3>{children}</section>; }
function TextInput({ label, name, onChange, value }) { return <label className="field"><span>{label}</span><input name={name} value={value || ""} onChange={onChange} /></label>; }
function ColorInput({ background, help, label, name, onChange, value }) {
  const ratio = isValidHex(value) && isValidHex(background) ? contrastRatio(value, background).toFixed(1) : "--";
  return <label className="field color-control"><span>{label}</span><input name={name} type="color" value={isValidHex(value) ? value : "#2f6652"} onChange={onChange} />{help ? <small>{help}</small> : null}<small className={Number(ratio) >= 3 ? "contrast-ok" : "contrast-warning-text"}>Contrast check: {ratio}:1</small></label>;
}
function FontSelect({ label, name, onChange, value }) { return <label className="field"><span>{label}</span><select name={name} value={value || "Modern Sans"} onChange={onChange}>{FONT_OPTIONS.map(([font]) => <option key={font} value={font}>{font}</option>)}</select></label>; }
function FontPreview({ label, sample, value }) { return <div className="font-preview"><small>{label}</small><p style={{ fontFamily: resolveFont(value) }}>{sample}</p></div>; }
function FontControl(props) { return <div className="font-control-block"><FontSelect {...props} /><FontPreview label={props.label} value={props.value} sample={props.sample} /></div>; }

function MobilePreviewCard({ formData, style, warnings = [] }) {
  const image = formData.profilePictureData || formData.profilePictureUrl;
  const banner = formData.bannerImageData || formData.bannerImageUrl;
  return (
    <section className={`mobile-style-preview-card theme-${slugifyTheme(formData.visualTheme || "Modern")}`} style={style} aria-label="Small style preview">
      {formData.customFontData ? <style>{`@font-face{font-family:${JSON.stringify(getCustomFontFamily(formData))};src:url(${JSON.stringify(formData.customFontData)});}`}</style> : null}
      <div className="mobile-style-preview-banner">
        {banner ? <img src={banner} alt="Preview banner" /> : null}
        <div className="mobile-style-preview-identity">
          <div className="preview-avatar mobile-preview-avatar">{image ? <img src={image} alt="Preview profile" /> : <span>{getInitials(formData.name)}</span>}</div>
          <div>
            <h3>{formData.name || "Character Name"}</h3>
            <p>{formData.visualTheme || "Modern"}</p>
          </div>
        </div>
      </div>
      <article className="mobile-style-preview-sample">
        <h4>Sample Heading</h4>
        <p>Short sample text for colors and fonts.</p>
        <button className="theme-preview-button" type="button">Button</button>
      </article>
      {warnings.length ? <p className="contrast-warning mobile-preview-warning">Adjusted for readability.</p> : null}
    </section>
  );
}
function LivePreview({ compact = false, formData, style, warnings = [] }) {
  const image = formData.profilePictureData || formData.profilePictureUrl;
  const banner = formData.bannerImageData || formData.bannerImageUrl;
  return <section className={`customize-live-preview ${compact ? "compact" : ""} theme-${slugifyTheme(formData.visualTheme || "Modern")}`} style={style}>{formData.customFontData ? <style>{`@font-face{font-family:${JSON.stringify(getCustomFontFamily(formData))};src:url(${JSON.stringify(formData.customFontData)});}`}</style> : null}<div className="preview-banner">{banner ? <img src={banner} alt="Preview banner" /> : <span>{formData.workspacePaperStyle || "Workspace Style"}</span>}<div className="preview-banner-title"><h3>{formData.name || "Character Name"}</h3></div></div><div className="preview-main"><div className="preview-avatar">{image ? <img src={image} alt="Preview profile" /> : <span>{getInitials(formData.name)}</span>}</div><div><p className="eyebrow">{formData.visualTheme || "Modern"}</p><h3>{formData.name || "Character Name"}</h3><p>A quiet preview of this character workspace style.</p><p className="muted-text">Muted text, dates, and labels stay readable.</p></div></div><div className="preview-tab-row"><span className="preview-tab active">Profile</span><span className="preview-tab">Story</span></div><article className="preview-card"><h4>Sample Heading</h4><p>This is how a profile card, story note, or notebook page will feel.</p><p className="preview-handwriting">A note written by this character.</p><button className="theme-preview-button" type="button">Sample Button</button></article>{warnings.length ? <p className="contrast-warning">Some text colors were adjusted in the preview for readability.</p> : null}<div className="preview-color-row"><span style={{ background: formData.paletteColorOne }} /><span style={{ background: formData.paletteColorTwo }} /><span style={{ background: formData.workspaceBackgroundColor }} /><span style={{ background: formData.workspaceCardColor }} /></div></section>;
}

function normalizeCustomizeData(oc) {
  return { ...oc, visualTheme: oc.visualTheme || "Modern", workspaceMode: oc.workspaceMode || "light", workspaceBackgroundColor: oc.workspaceBackgroundColor || oc.paletteColorThree || "#f8f4ee", workspaceCardColor: oc.workspaceCardColor || oc.paletteColorFive || "#ffffff", workspaceTextColor: oc.workspaceTextColor || "#20252b", workspaceBorderColor: oc.workspaceBorderColor || "#e5ddd3", workspaceBorderRadius: oc.workspaceBorderRadius || "16", workspaceShadowStrength: oc.workspaceShadowStrength || "soft", workspaceCardStyle: oc.workspaceCardStyle || "soft cards", workspacePaperStyle: oc.workspacePaperStyle || "clean paper", headingFont: oc.headingFont || "Modern Sans", bodyFont: oc.bodyFont || "Modern Sans", handwritingFont: oc.handwritingFont || "Handwritten", customFontData: oc.customFontData || "", customFontName: oc.customFontName || "", customFontFormat: oc.customFontFormat || "", customFontTarget: oc.customFontTarget || "handwriting" };
}
function getPreviewStyle(formData, forcedMode = "light") {
  const customFamily = getCustomFontFamily(formData);
  const safe = getSafeWorkspaceStyle(formData, forcedMode);
  return { corrections: safe.corrections, style: { ...safe.style, "--workspace-radius": `${Number(formData.workspaceBorderRadius || 16)}px`, "--workspace-shadow": getShadow(formData.workspaceShadowStrength), "--workspace-heading-font": resolveFont(formData.headingFont, customFamily), "--workspace-body-font": resolveFont(formData.bodyFont, customFamily), "--workspace-handwriting-font": resolveFont(formData.handwritingFont, customFamily), "--workspace-custom-font": customFamily } };
}
export function getCustomizeStyleForOC(oc) { return getPreviewStyle(normalizeCustomizeData(oc), oc?.workspaceMode === "dark" ? "dark" : "light").style; }
export function getCustomFontCssForOC(oc) { if (!oc?.customFontData) return ""; return `@font-face{font-family:${JSON.stringify(getCustomFontFamily(oc))};src:url(${JSON.stringify(oc.customFontData)});}`; }
function resolveFont(font, customFamily = "AtlasCustomFont") { if (font === "Custom Uploaded") return customFamily; return FONT_MAP[font] || FONT_MAP["Modern Sans"]; }
function getFontFieldForTarget(target) { if (target === "heading") return "headingFont"; if (target === "body") return "bodyFont"; return "handwritingFont"; }
function getShadow(strength) { if (strength === "none") return "none"; if (strength === "medium") return "0 14px 34px rgba(34, 27, 21, 0.13)"; if (strength === "deep") return "0 20px 48px rgba(0, 0, 0, 0.24)"; return "0 8px 24px rgba(34, 27, 21, 0.08)"; }
function getCustomFontFamily(formData) { return `AtlasCustomFont-${String(formData.id || formData.name || "oc").replace(/[^a-zA-Z0-9_-]/g, "")}`; }
function getInitials(name = "") { const parts = name.trim().split(/\s+/).filter(Boolean); return parts.length ? parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "?"; }
function slugifyTheme(theme) { return String(theme || "Modern").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "modern"; }
function stripPresetMeta(preset = {}) { const { description: _description, ...values } = preset; return values; }
function toggleMobileSection(title, setOpenMobileSections) { setOpenMobileSections((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current.slice(-1), title]); }
function areCustomColorsValid(formData) { return ["paletteColorOne", "paletteColorTwo", "workspaceBackgroundColor", "workspaceCardColor", "workspaceTextColor", "workspaceBorderColor"].every((key) => isValidHex(formData[key])); }
function getColorWarnings(formData) { const warnings = []; if (isValidHex(formData.workspaceTextColor) && isValidHex(formData.workspaceCardColor) && contrastRatio(formData.workspaceTextColor, formData.workspaceCardColor) < 4.5) warnings.push("Text contrast adjusted"); if (isValidHex(formData.workspaceBorderColor) && isValidHex(formData.workspaceCardColor) && contrastRatio(formData.workspaceBorderColor, formData.workspaceCardColor) < 3) warnings.push("Border contrast adjusted"); return warnings; }




