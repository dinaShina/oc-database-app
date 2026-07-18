import { ASSET_OWNER_TYPES, ASSET_SOURCES, ASSET_TYPES } from "./assetTypes.js";
import { characterAssets, getCharacterAssets } from "./characterAssets.js";
import { getInspirationAssets, inspirationAssets } from "./inspirationAssets.js";
import { getStoryAssets, storyAssets } from "./storyAssets.js";
import { getTimelineAssets, timelineAssets } from "./timelineAssets.js";
import { getWorldAssets, worldAssets } from "./worldAssets.js";

export { ASSET_OWNER_TYPES, ASSET_SOURCES, ASSET_TYPES };
export * from "./characterAssets.js";
export * from "./worldAssets.js";
export * from "./timelineAssets.js";
export * from "./storyAssets.js";
export * from "./inspirationAssets.js";

export const assetRegistry = {
  characters: characterAssets,
  worlds: worldAssets,
  timelines: timelineAssets,
  stories: storyAssets,
  inspiration: inspirationAssets
};

export function getAssetsForOwner(ownerType, ownerId, registry = assetRegistry) {
  if (ownerType === ASSET_OWNER_TYPES.CHARACTER) return getCharacterAssets(ownerId, registry.characters);
  if (ownerType === ASSET_OWNER_TYPES.WORLD) return getWorldAssets(ownerId, registry.worlds);
  if (ownerType === ASSET_OWNER_TYPES.TIMELINE) return getTimelineAssets(ownerId, registry.timelines);
  if (ownerType === ASSET_OWNER_TYPES.STORY) return getStoryAssets(ownerId, registry.stories);
  if (ownerType === ASSET_OWNER_TYPES.INSPIRATION) return getInspirationAssets(ownerId, registry.inspiration);
  return [];
}

export function getAllAssets(registry = assetRegistry) {
  return Object.values(registry).flat();
}
