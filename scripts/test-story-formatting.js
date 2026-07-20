import assert from "node:assert/strict";
import { getVisibleStoryToolbarControls, RELIABLE_STORY_FORMATS } from "../src/utils/storyFormatting.js";

assert.deepEqual(RELIABLE_STORY_FORMATS, []);
assert.deepEqual(getVisibleStoryToolbarControls(), ["fontFamily", "fontSize"]);

console.log("Story editor exposes only supported style controls.");