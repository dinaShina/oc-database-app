import { ASSET_OWNER_TYPES, ASSET_SOURCES, ASSET_TYPES } from "./assetTypes.js";

export const STORY_ASSET_SECTIONS = {
  COVER: "cover",
  CHAPTER_NOTES: "chapter-notes",
  SCENE_REFERENCES: "scene-references",
  EXPORTS: "exports",
  NOTES: "notes"
};

export const storyAssets = [];

export function createStoryAsset(storyId, asset) {
  return createAssetRecord({
    ...asset,
    ownerType: ASSET_OWNER_TYPES.STORY,
    ownerId: storyId
  });
}

export function getStoryAssets(storyId, assets = storyAssets) {
  return assets.filter((asset) => asset.ownerType === ASSET_OWNER_TYPES.STORY && asset.ownerId === storyId);
}

function createAssetRecord(asset) {
  const now = new Date().toISOString();
  return {
    id: asset.id || crypto.randomUUID(),
    ownerType: asset.ownerType,
    ownerId: asset.ownerId,
    type: asset.type || ASSET_TYPES.DOCUMENT,
    source: asset.source || ASSET_SOURCES.LOCAL_DATA,
    section: asset.section || STORY_ASSET_SECTIONS.NOTES,
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
