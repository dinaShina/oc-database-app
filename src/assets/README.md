# Assets Folder

This folder keeps asset definitions separated by app area.

The current app still stores user-created data in localStorage. These files are a clean structure for static/default assets and future asset records.

Asset records are connected by IDs:

- `ownerType`: character, world, timeline, story, or inspiration
- `ownerId`: the ID of the character/world/timeline/story/inspiration item
- `id`: the asset ID itself

Example:

```js
{
  id: "asset-1",
  ownerType: "character",
  ownerId: "character-id-here",
  type: "profile-image",
  section: "profile",
  title: "Main portrait",
  url: "https://example.com/image.png"
}
```

Files:

- `assetTypes.js`: shared asset types and owner types
- `characterAssets.js`: assets connected to characters
- `worldAssets.js`: assets connected to worlds
- `timelineAssets.js`: assets connected to timelines
- `storyAssets.js`: assets connected to stories
- `inspirationAssets.js`: moodboard/reference/link assets
- `index.js`: central export and lookup helpers
