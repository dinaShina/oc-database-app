import { ASSET_OWNER_TYPES, ASSET_SOURCES, ASSET_TYPES } from "./assetTypes.js";

export const TIMELINE_ASSET_SECTIONS = {
  EVENT_IMAGE: "event-image",
  LOCATION: "location",
  OBJECT: "object",
  DOCUMENTS: "documents",
  NOTES: "notes"
};

export const timelineAssets = [];

export function createTimelineAsset(timelineId, asset) {
  return createAssetRecord({
    ...asset,
    ownerType: ASSET_OWNER_TYPES.TIMELINE,
    ownerId: timelineId
  });
}

export function getTimelineAssets(timelineId, assets = timelineAssets) {
  return assets.filter((asset) => asset.ownerType === ASSET_OWNER_TYPES.TIMELINE && asset.ownerId === timelineId);
}

function createAssetRecord(asset) {
  const now = new Date().toISOString();
  return {
    id: asset.id || crypto.randomUUID(),
    ownerType: asset.ownerType,
    ownerId: asset.ownerId,
    type: asset.type || ASSET_TYPES.IMAGE,
    source: asset.source || ASSET_SOURCES.URL,
    section: asset.section || TIMELINE_ASSET_SECTIONS.EVENT_IMAGE,
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
