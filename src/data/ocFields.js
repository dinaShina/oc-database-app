export const WORLD_TYPES = [
  "Canon Universe",
  "Own World",
  "Alternative Universe / AU",
  "Crossover"
];

export const WORLD_TYPE_FIELDS = {
  "Canon Universe": [
    ["worldCanonName", "Fandom / Universe name", "e.g. Harry Potter, DC, Red Dead Redemption"],
    ["worldCanonNotes", "Universe notes", "Canon rules, era, version, or notes..."]
  ],
  "Own World": [
    ["worldOwnName", "World name", "e.g. Elarion"],
    ["worldOwnDescription", "World description", "Short description of this world..."],
    ["worldOwnNotes", "World notes", "Lore notes, rules, species, places..."]
  ],
  "Alternative Universe / AU": [
    ["worldOriginalUniverse", "Original universe", "e.g. Harry Potter"],
    ["worldAuTitle", "AU title", "e.g. Modern AU, No Magic AU"],
    ["worldAuChanges", "What changed?", "What is different from canon?"],
    ["worldAuNotes", "AU notes", "Extra AU notes..."]
  ],
  Crossover: [
    ["worldUniverseOne", "Universe 1", "First universe"],
    ["worldUniverseTwo", "Universe 2", "Second universe"],
    ["worldCrossoverDescription", "Crossover description", "How do these worlds connect?"],
    ["worldCrossoverNotes", "Crossover notes", "Extra crossover notes..."]
  ]
};

export const INITIAL_OC_FORM = {
  name: "",
  profilePictureUrl: "",
  profilePictureData: "",
  bannerImageUrl: "",
  bannerImageData: "",
  accentColor: "#2f6652",
  paletteColorOne: "#2f6652",
  paletteColorTwo: "#8b5b40",
  paletteColorThree: "#f5f2ec",
  paletteColorFour: "",
  paletteColorFive: "",
  visualTheme: "",
  isFavorite: false,
  isWorldFavorite: false,
  lastOpenedAt: "",
  fullName: "",
  firstName: "",
  middleName: "",
  secondName: "",
  lastName: "",
  nickname: "",
  birthDay: "",
  birthMonth: "",
  birthYear: "",
  currentAge: "",
  gender: "",
  genderDetails: "",
  genderNotes: "",
  species: "",
  ethnicities: "",
  worldType: "Canon Universe",
  worldCanonName: "",
  worldCanonNotes: "",
  worldOwnName: "",
  worldOwnDescription: "",
  worldOwnNotes: "",
  worldOriginalUniverse: "",
  worldAuTitle: "",
  worldAuChanges: "",
  worldAuNotes: "",
  worldUniverseOne: "",
  worldUniverseTwo: "",
  worldCrossoverDescription: "",
  worldCrossoverNotes: "",
  fandom: "",
  ownWorld: false,
  hairColor: "",
  hairLength: "",
  hairTexture: "",
  hairDetails: "",
  beardColor: "",
  beardLength: "",
  beardStyle: "",
  beardDetails: "",
  faceShape: "",
  facialFeatures: "",
  expressionsRestingFace: "",
  eyeColor: "",
  eyeShape: "",
  eyeDetails: "",
  skinTone: "",
  skinDetails: "",
  height: "",
  bodyType: "",
  build: "",
  posture: "",
  scars: "",
  birthmarks: "",
  tattoos: "",
  piercings: "",
  clothingStyle: "",
  accessories: "",
  signatureItem: "",
  voice: "",
  scent: "",
  auraPresence: "",
  appearanceNotes: "",
  personality: "",
  backstory: "",
  skillsPowers: "",
  weaknesses: "",
  pinterestLink: "",
  playlistLink: "",
  referenceLink: "",
  otherLink: "",
  notes: ""
};

export const NAME_DETAIL_FIELDS = [
  ["fullName", "Full name"],
  ["firstName", "First name"],
  ["middleName", "Middle name"],
  ["secondName", "Second name"],
  ["lastName", "Last name"],
  ["nickname", "Nickname"]
];

export const APPEARANCE_FIELD_GROUPS = [
  { title: "Hair", fields: [["hairColor", "Color"], ["hairLength", "Length"], ["hairTexture", "Type / Texture"], ["hairDetails", "Details"]] },
  { title: "Beard", fields: [["beardColor", "Color"], ["beardLength", "Length"], ["beardStyle", "Style"], ["beardDetails", "Details"]] },
  { title: "Face", fields: [["faceShape", "Face shape"], ["facialFeatures", "Facial features"], ["expressionsRestingFace", "Expressions / resting face"]] },
  { title: "Eyes", fields: [["eyeColor", "Color"], ["eyeShape", "Shape"], ["eyeDetails", "Details"]] },
  { title: "Skin", fields: [["skinTone", "Skin tone"], ["skinDetails", "Details"]] },
  { title: "Body", fields: [["height", "Height"], ["bodyType", "Body type"], ["build", "Build"], ["posture", "Posture"]] },
  { title: "Marks", fields: [["scars", "Scars"], ["birthmarks", "Birthmarks"], ["tattoos", "Tattoos"], ["piercings", "Piercings"]] },
  { title: "Style", fields: [["clothingStyle", "Clothing style"], ["accessories", "Accessories"], ["signatureItem", "Signature item"]] },
  { title: "Other", fields: [["voice", "Voice"], ["scent", "Scent"], ["auraPresence", "Aura / presence"], ["appearanceNotes", "General appearance notes"]] }
];

export const LONG_TEXT_FIELDS = [
  ["personality", "Personality", "Personality notes..."],
  ["backstory", "Backstory", "Where do they come from? What shaped them?"],
  ["skillsPowers", "Skills / Powers", "Normal skills, magic, powers, talents..."],
  ["weaknesses", "Weaknesses", "Limits, flaws, vulnerabilities..."],
  ["notes", "General Notes", "Anything else you want to remember..."]
];

export const LINK_FIELDS = [
  ["pinterestLink", "Pinterest link"],
  ["playlistLink", "Playlist link"],
  ["referenceLink", "Reference link"],
  ["otherLink", "Other link"]
];

export const DIVERSE_GENDER_OPTIONS = [
  "Non-binary",
  "Genderfluid",
  "Agender",
  "Specific description"
];




