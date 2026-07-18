const FALLBACK_LIGHT = "#20252b";
const FALLBACK_DARK = "#fffdf8";

export const APP_PALETTES = {
  "Atlas Gold": {
    light: { bg: "#f7f1e4", surface: "#fffaf0", elevated: "#ffffff", accent: "#9b6b1f", accent2: "#365f4f", text: "#241f1a", muted: "#6d6254", border: "#dfcfb4", focus: "#b98226", danger: "#a84040", success: "#2f7a55" },
    dark: { bg: "#181510", surface: "#221d16", elevated: "#2d2519", accent: "#e3b45d", accent2: "#8ccdb7", text: "#f7efe2", muted: "#c4b69f", border: "#4a3b25", focus: "#f0c36d", danger: "#ff8c8c", success: "#8bd7ad" }
  },
  "Soft Neutral": {
    light: { bg: "#f6f3ee", surface: "#fffdf8", elevated: "#ffffff", accent: "#356b58", accent2: "#8a7664", text: "#20252b", muted: "#65707a", border: "#e5ddd3", focus: "#6aa58f", danger: "#a84040", success: "#2f7a55" },
    dark: { bg: "#15181b", surface: "#20252a", elevated: "#272d33", accent: "#8ccdb7", accent2: "#c3ae91", text: "#eff3f0", muted: "#aeb8b3", border: "#354049", focus: "#9be0c9", danger: "#ff8f8f", success: "#8bd7ad" }
  },
  "Midnight Blue": {
    light: { bg: "#eef3f8", surface: "#f9fcff", elevated: "#ffffff", accent: "#295b89", accent2: "#6a638d", text: "#172434", muted: "#5f6f80", border: "#d6e0ea", focus: "#4f84bd", danger: "#a84040", success: "#28785d" },
    dark: { bg: "#0f1520", surface: "#172132", elevated: "#1f2c41", accent: "#8ebced", accent2: "#b7a9ff", text: "#eef5ff", muted: "#adbad0", border: "#304059", focus: "#9fccff", danger: "#ff8f8f", success: "#8bd7bd" }
  },
  "Dusty Rose": {
    light: { bg: "#f8eff0", surface: "#fff9f8", elevated: "#ffffff", accent: "#a84f68", accent2: "#83614e", text: "#2b2024", muted: "#765f66", border: "#ead3d8", focus: "#c96f88", danger: "#9f363b", success: "#2f7a55" },
    dark: { bg: "#1b1418", surface: "#261b21", elevated: "#33232b", accent: "#ee9bb1", accent2: "#d5b09a", text: "#faeef2", muted: "#d2b6bf", border: "#51333d", focus: "#ffb0c4", danger: "#ff8f8f", success: "#8bd7ad" }
  },
  Forest: {
    light: { bg: "#eef4ec", surface: "#fbfff8", elevated: "#ffffff", accent: "#2f6f4f", accent2: "#7a703a", text: "#17251c", muted: "#5f705f", border: "#d4e2d2", focus: "#549970", danger: "#a84040", success: "#287a50" },
    dark: { bg: "#101811", surface: "#19241b", elevated: "#223126", accent: "#8fd3a5", accent2: "#d4c57b", text: "#edf7ee", muted: "#afc0b0", border: "#334538", focus: "#a4e8ba", danger: "#ff8f8f", success: "#9ee0b0" }
  },
  Lavender: {
    light: { bg: "#f3f0fa", surface: "#fcfaff", elevated: "#ffffff", accent: "#6953a3", accent2: "#8b658f", text: "#242032", muted: "#696176", border: "#ded5ef", focus: "#8d77c7", danger: "#a84040", success: "#317a5a" },
    dark: { bg: "#171420", surface: "#211b30", elevated: "#2d2540", accent: "#b9a4ff", accent2: "#e4a9dc", text: "#f3efff", muted: "#c4b9d8", border: "#44365c", focus: "#cbb9ff", danger: "#ff8f8f", success: "#8bd7ad" }
  },
  Burgundy: {
    light: { bg: "#f5eeee", surface: "#fffafa", elevated: "#ffffff", accent: "#823448", accent2: "#7a6348", text: "#2b1f21", muted: "#735e62", border: "#e3cfd2", focus: "#a94f65", danger: "#9b3030", success: "#2f7a55" },
    dark: { bg: "#1b1013", surface: "#26171b", elevated: "#352025", accent: "#e58aa0", accent2: "#d2b07f", text: "#faeef0", muted: "#d0b4ba", border: "#55313a", focus: "#f2a0b4", danger: "#ff8f8f", success: "#8bd7ad" }
  },
  Monochrome: {
    light: { bg: "#f4f4f2", surface: "#fbfbf8", elevated: "#ffffff", accent: "#30343a", accent2: "#77736b", text: "#1e2227", muted: "#63676d", border: "#ddddda", focus: "#676d78", danger: "#a84040", success: "#30735a" },
    dark: { bg: "#111315", surface: "#1d2023", elevated: "#282c30", accent: "#d7dde3", accent2: "#a9adb2", text: "#f2f4f6", muted: "#b4bac0", border: "#3a4046", focus: "#ffffff", danger: "#ff8f8f", success: "#8bd7ad" }
  },
  Custom: {
    light: { bg: "#f6f3ee", surface: "#fffdf8", elevated: "#ffffff", accent: "#356b58", accent2: "#8a7664", text: "#20252b", muted: "#65707a", border: "#e5ddd3", focus: "#6aa58f", danger: "#a84040", success: "#2f7a55" },
    dark: { bg: "#15181b", surface: "#20252a", elevated: "#272d33", accent: "#8ccdb7", accent2: "#c3ae91", text: "#eff3f0", muted: "#aeb8b3", border: "#354049", focus: "#9be0c9", danger: "#ff8f8f", success: "#8bd7ad" }
  }
};

export function isValidHex(value) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(value || "").trim());
}

export function normalizeHex(value, fallback = FALLBACK_LIGHT) {
  const raw = String(value || "").trim();
  if (!isValidHex(raw)) return fallback;
  if (raw.length === 4) return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  return raw.toLowerCase();
}

export function hexToRgb(value) {
  const hex = normalizeHex(value).slice(1);
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (component) => {
    const value = component / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground, background) {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isLightColor(hex) {
  return relativeLuminance(hex) > 0.45;
}

export function getReadableTextColor(background, preferred = "", target = 4.5) {
  const safeBg = normalizeHex(background, "#ffffff");
  const preferredColor = isValidHex(preferred) ? normalizeHex(preferred) : "";
  if (preferredColor && contrastRatio(preferredColor, safeBg) >= target) return preferredColor;
  const darkRatio = contrastRatio(FALLBACK_LIGHT, safeBg);
  const lightRatio = contrastRatio(FALLBACK_DARK, safeBg);
  return darkRatio >= lightRatio ? FALLBACK_LIGHT : FALLBACK_DARK;
}

export function ensureContrast(foreground, background, target = 4.5) {
  return getReadableTextColor(background, foreground, target);
}

export function getAppPalette(name = "Soft Neutral", mode = "light") {
  const palette = APP_PALETTES[name] || APP_PALETTES["Soft Neutral"];
  return palette[mode === "dark" ? "dark" : "light"];
}

export function getAppThemeStyle(settings = {}, resolvedMode = "light") {
  const palette = getAppPalette(settings.paletteName || "Soft Neutral", resolvedMode);
  const text = ensureContrast(palette.text, palette.bg, 4.5);
  const surfaceText = ensureContrast(palette.text, palette.surface, 4.5);
  const accentText = ensureContrast("#ffffff", palette.accent, 4.5);
  return {
    "--app-bg": palette.bg,
    "--app-surface": palette.surface,
    "--app-surface-strong": palette.elevated,
    "--app-surface-muted": resolvedMode === "dark" ? palette.surface : palette.bg,
    "--app-text": text,
    "--app-text-muted": ensureContrast(palette.muted, palette.bg, 3),
    "--app-text-soft": ensureContrast(palette.muted, palette.surface, 3),
    "--app-border": palette.border,
    "--app-border-strong": ensureContrast(palette.border, palette.surface, 3) === FALLBACK_LIGHT || ensureContrast(palette.border, palette.surface, 3) === FALLBACK_DARK ? palette.accent2 : palette.border,
    "--app-accent": palette.accent,
    "--app-accent-2": palette.accent2,
    "--app-accent-soft": resolvedMode === "dark" ? palette.surface : palette.bg,
    "--app-accent-text": accentText,
    "--app-focus": palette.focus,
    "--app-danger": palette.danger,
    "--app-success": palette.success,
    "--app-surface-text": surfaceText
  };
}

export function getSafeWorkspaceStyle(formData = {}, mode = "light") {
  const background = normalizeHex(formData.workspaceBackgroundColor || formData.paletteColorThree, mode === "dark" ? "#14181b" : "#f8f4ee");
  const card = normalizeHex(formData.workspaceCardColor || formData.paletteColorFive, mode === "dark" ? "#20252b" : "#ffffff");
  const accent = normalizeHex(formData.paletteColorOne || formData.accentColor, mode === "dark" ? "#8ccdb7" : "#356b58");
  const accent2 = normalizeHex(formData.paletteColorTwo, mode === "dark" ? "#b7a9ff" : "#8b5b40");
  const requestedText = formData.workspaceTextColor || "";
  const text = getReadableTextColor(card, requestedText, 4.5);
  const pageText = getReadableTextColor(background, requestedText || text, 4.5);
  const heading = getReadableTextColor(card, formData.paletteColorFour || accent2 || accent, 3);
  const accentText = getReadableTextColor(accent, "#ffffff", 4.5);
  const muted = getReadableTextColor(card, accent2, 3);
  const border = normalizeHex(formData.workspaceBorderColor, accent2);
  const corrections = [];
  if (requestedText && normalizeHex(requestedText, text) !== text) corrections.push("Text color adjusted for readability");
  if (contrastRatio(border, card) < 2.2) corrections.push("Border contrast softened safely");
  return {
    style: {
      "--workspace-bg": background,
      "--workspace-card": card,
      "--workspace-input": card,
      "--workspace-text": text,
      "--workspace-page-text": pageText,
      "--workspace-muted-text": muted,
      "--workspace-border": contrastRatio(border, card) >= 2.2 ? border : accent2,
      "--workspace-accent": accent,
      "--workspace-accent-2": accent2,
      "--workspace-accent-3": background,
      "--workspace-accent-4": heading,
      "--workspace-heading": heading,
      "--workspace-button-text": accentText,
      "--workspace-accent-text": accentText,
      "--workspace-card-bg": card,
      "--workspace-banner-text": getReadableTextColor(accent, "#ffffff", 3),
      "--workspace-banner-overlay": isLightColor(accent) ? "linear-gradient(90deg, rgba(255,255,255,.76), rgba(255,255,255,.18))" : "linear-gradient(90deg, rgba(0,0,0,.54), rgba(0,0,0,.16))",
      "--workspace-readable-shadow": isLightColor(card) ? "0 1px 2px rgba(0,0,0,.18)" : "0 1px 2px rgba(0,0,0,.45)"
    },
    corrections
  };
}
