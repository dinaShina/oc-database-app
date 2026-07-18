import { ASSET_OWNER_TYPES, ASSET_SOURCES, ASSET_TYPES } from "./assetTypes.js";

export const WORLD_ASSET_SECTIONS = {
  MAPS: "maps",
  LOCATIONS: "locations",
  RULES: "rules",
  MOOD: "mood",
  REFERENCES: "references",
  NOTES: "notes"
};

export const worldAssets = [];

export function createWorldAsset(worldId, asset) {
  return createAssetRecord({
    ...asset,
    ownerType: ASSET_OWNER_TYPES.WORLD,
    ownerId: worldId
  });
}

export function getWorldAssets(worldId, assets = worldAssets) {
  return assets.filter((asset) => asset.ownerType === ASSET_OWNER_TYPES.WORLD && asset.ownerId === worldId);
}

function createAssetRecord(asset) {
  const now = new Date().toISOString();
  return {
    id: asset.id || crypto.randomUUID(),
    ownerType: asset.ownerType,
    ownerId: asset.ownerId,
    type: asset.type || ASSET_TYPES.IMAGE,
    source: asset.source || ASSET_SOURCES.URL,
    section: asset.section || WORLD_ASSET_SECTIONS.MOOD,
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
