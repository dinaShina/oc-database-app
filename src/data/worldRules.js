// Preparation for future world-specific fields.
// The minimal v1 form only uses the fandom/world name and Own World checkbox.
export const WORLD_RULES = {
  "Harry Potter": {
    fields: [
      "Hogwarts House",
      "Blood status",
      "Wand",
      "Patronus",
      "School year",
      "Magical profession"
    ]
  },
  DC: {
    fields: ["Alias", "Powers", "Weaknesses", "City", "Hero / Villain / Antihero"]
  },
  "Own World": {
    fields: ["Custom fields"]
  }
};
