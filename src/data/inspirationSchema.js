export const INSPIRATION_TYPES = [
  "Picture",
  "Link",
  "Song",
  "Quote",
  "Color Palette",
  "Note",
  "Moodboard",
  "Outfit",
  "Pose",
  "Architecture",
  "Animal",
  "Object",
  "Location",
  "Character Reference",
  "Book",
  "Movie / Series",
  "Voice Actor",
  "Font",
  "Symbol",
  "Flower",
  "Fashion",
  "Custom"
];

export const PRIMARY_INSPIRATION_TYPES = ["Picture", "Link", "Song", "Quote", "Color Palette", "Note"];
export const MORE_INSPIRATION_TYPES = INSPIRATION_TYPES.filter((type) => !PRIMARY_INSPIRATION_TYPES.includes(type));

export const INSPIRATION_SECTIONS = [
  "Moodboard",
  "Gallery",
  "Pinterest Links",
  "Playlist Links",
  "Quotes",
  "Reference Images",
  "Website Links",
  "Documents / Notes",
  "Color Palette"
];

export const INITIAL_COLOR_SWATCH = {
  name: "",
  hex: "#2f6652"
};

export const INITIAL_INSPIRATION_ITEM = {
  ocId: "",
  type: "Picture",
  section: "Moodboard",
  title: "",
  url: "",
  sourceLink: "",
  imageData: "",
  images: [],
  quote: "",
  author: "",
  artist: "",
  description: "",
  category: "",
  content: "",
  colors: [],
  notes: "",
  order: 0
};

export function getDefaultTypeForSection(section) {
  if (section === "Pinterest Links" || section === "Website Links") return "Link";
  if (section === "Playlist Links") return "Song";
  if (section === "Quotes") return "Quote";
  if (section === "Color Palette") return "Color Palette";
  if (section === "Moodboard") return "Moodboard";
  if (section === "Documents / Notes") return "Note";
  return "Picture";
}

export function getSectionForType(type) {
  if (type === "Link") return "Website Links";
  if (type === "Song") return "Playlist Links";
  if (type === "Quote") return "Quotes";
  if (type === "Color Palette") return "Color Palette";
  if (type === "Moodboard") return "Moodboard";
  if (type === "Note") return "Documents / Notes";
  return "Gallery";
}

