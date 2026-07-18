import { ASSET_OWNER_TYPES, ASSET_SOURCES, ASSET_TYPES } from "./assetTypes.js";

export const INSPIRATION_ASSET_SECTIONS = {
  MOODBOARD: "moodboard",
  GALLERY: "gallery",
  PINTEREST: "pinterest",
  PLAYLIST: "playlist",
  QUOTES: "quotes",
  REFERENCES: "references",
  WEBSITES: "websites",
  DOCUMENTS: "documents",
  COLORS: "colors"
};

export const inspirationAssets = [];

export function createInspirationAsset(inspirationId, asset) {
  return createAssetRecord({
    ...asset,
    ownerType: ASSET_OWNER_TYPES.INSPIRATION,
    ownerId: inspirationId
  });
}

export function getInspirationAssets(inspirationId, assets = inspirationAssets) {
  return assets.filter((asset) => asset.ownerType === ASSET_OWNER_TYPES.INSPIRATION && asset.ownerId === inspirationId);
}

function createAssetRecord(asset) {
  const now = new Date().toISOString();
  return {
    id: asset.id || crypto.randomUUID(),
    ownerType: asset.ownerType,
    ownerId: asset.ownerId,
    type: asset.type || ASSET_TYPES.IMAGE,
    source: asset.source || ASSET_SOURCES.URL,
    section: asset.section || INSPIRATION_ASSET_SECTIONS.MOODBOARD,
    title: asset.title || "",
    url: asset.url || "",
    data: asset.data || "",
    altText: asset.altText || "",
    notes: asset.notes || "",
    tags: Array.isArray(asset.tags) ? asset.tags : [],
    createdAt: asset.createdAt || now,
    updatedAt: now
  };
}
