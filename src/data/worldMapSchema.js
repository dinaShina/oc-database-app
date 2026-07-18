export const WORLD_MAP_PLACE_TYPES = [
  "country",
  "region",
  "city",
  "town",
  "village",
  "district",
  "building",
  "landmark",
  "natural place",
  "travel route",
  "event location",
  "other"
];

export const WORLD_MAP_ROUTE_TYPES = [
  "road",
  "river",
  "sea route",
  "air route",
  "portal",
  "secret passage",
  "migration route",
  "trade route",
  "other"
];

export const WORLD_MAP_EVENT_LINK_TYPES = [
  "battle",
  "meeting",
  "birth",
  "death",
  "discovery",
  "travel stop",
  "turning point",
  "other"
];

export const WORLD_MAP_PLACE_EXAMPLE = {
  id: "place-1",
  worldId: "world-1",
  worldType: "Own World",
  name: "Example City",
  type: "city",
  parentPlaceId: "",
  description: "",
  coordinates: {
    x: 0,
    y: 0,
    latitude: "",
    longitude: ""
  },
  connectedOcIds: [],
  connectedLoreEntryIds: [],
  connectedTimelineEventIds: [],
  tags: [],
  notes: "",
  createdAt: "",
  updatedAt: ""
};

export const WORLD_MAP_ROUTE_EXAMPLE = {
  id: "route-1",
  worldId: "world-1",
  name: "Example Route",
  type: "road",
  fromPlaceId: "place-1",
  toPlaceId: "place-2",
  stops: [],
  description: "",
  connectedOcIds: [],
  connectedTimelineEventIds: [],
  notes: "",
  createdAt: "",
  updatedAt: ""
};
