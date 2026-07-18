export const RELATIONSHIP_DIRECTIONS = ["one-way", "mutual"];

export const RELATIONSHIP_TARGET_TYPES = ["savedOC", "manualCharacter", "canonCharacter"];

export const RELATIONSHIP_LABELS = [
  "loves",
  "hates",
  "friend",
  "enemy",
  "rival",
  "mentor",
  "sibling",
  "ex-partner",
  "protects",
  "betrayed by",
  "complicated"
];

export const FAMILY_RELATION_TYPES = [
  "mother",
  "father",
  "parent",
  "child",
  "sibling",
  "spouse",
  "ancestor",
  "descendant",
  "adopted child",
  "half-sibling",
  "details"
];

export const INITIAL_FAMILY_MEMBER = {
  name: "",
  relationLabel: "",
  profilePictureUrl: "",
  profilePictureData: "",
  notes: ""
};

export const INITIAL_RELATIONSHIP_NODE = {
  type: "manualCharacter",
  savedOcId: "",
  canonCharacterId: "",
  canonCharacterPackId: "",
  name: "",
  profilePictureUrl: "",
  profilePictureData: "",
  notes: "",
  x: 460,
  y: 220
};

export const INITIAL_RELATIONSHIP_EDGE = {
  fromNodeId: "main",
  toNodeId: "",
  label: "",
  ocFeels: "",
  targetFeels: "",
  notes: "",
  direction: "mutual"
};

// Legacy record shape kept so older saved data still loads. New maps use nodes + edges.
export const INITIAL_RELATIONSHIP = {
  targetType: "savedOC",
  toCharacterId: "",
  characterName: "",
  canonCharacterId: "",
  canonCharacterPackId: "",
  canonCharacterName: "",
  label: "",
  category: "",
  notes: "",
  direction: "one-way"
};
