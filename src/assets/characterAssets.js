import { ASSET_OWNER_TYPES, ASSET_SOURCES, ASSET_TYPES } from "./assetTypes.js";

export const CHARACTER_ASSET_SECTIONS = {
  PROFILE: "profile",
  BANNER: "banner",
  APPEARANCE: "appearance",
  INSPIRATION: "inspiration",
  REFERENCES: "references",
  NOTES: "notes"
};

export const characterAssets = [];

export function createCharacterAsset(characterId, asset) {
  return createAssetRecord({
    ...asset,
    ownerType: ASSET_OWNER_TYPES.CHARACTER,
    ownerId: characterId
  });
}

export function getCharacterAssets(characterId, assets = characterAssets) {
  return assets.filter((asset) => asset.ownerType === ASSET_OWNER_TYPES.CHARACTER && asset.ownerId === characterId);
}

export function getCharacterAssetsBySection(characterId, section, assets = characterAssets) {
  return getCharacterAssets(characterId, assets).filter((asset) => asset.section === section);
}

function createAssetRecord(asset) {
  const now = new Date().toISOString();
  return {
    id: asset.id || crypto.randomUUID(),
    ownerType: asset.ownerType,
    ownerId: asset.ownerId,
    type: asset.type || ASSET_TYPES.IMAGE,
    source: asset.source || ASSET_SOURCES.URL,
    section: asset.section || CHARACTER_ASSET_SECTIONS.INSPIRATION,
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
