import { WORLD_TYPES } from "./ocFields.js";

export { WORLD_TYPES };

export const WORLD_DETAIL_CATEGORIES = [
  "Map",
  "Currency",
  "Language",
  "Government",
  "Religion",
  "Technology",
  "Magic / Powers",
  "World Rules",
  "Laws",
  "Climate",
  "Continents",
  "Kingdoms",
  "Species",
  "History",
  "Culture",
  "Economy"
];

export const WORLD_REFERENCE_TYPES = ["Image", "Link", "Book", "Movie", "Game", "Website", "Other"];

export const INITIAL_WORLD_DETAIL = {
  title: "",
  content: ""
};

export const INITIAL_WORLD_REFERENCE = {
  title: "",
  type: "Link",
  url: "",
  imageData: "",
  imageUrl: "",
  notes: ""
};

export const INITIAL_WORLD = {
  name: "",
  worldType: "Own World",
  description: "",
  coverImageData: "",
  coverImageUrl: "",
  notes: "",
  ideas: "",
  details: [],
  references: [],
  customSections: [],
  isFavorite: false
};
