import assert from "node:assert/strict";
import { formatSelection, getFormattingFallback, RELIABLE_STORY_FORMATS } from "../src/utils/storyFormatting.js";

assert.deepEqual(RELIABLE_STORY_FORMATS, ["heading", "italic", "bullet", "number"]);
assert.equal(formatSelection("heading", "Chapter One"), "## Chapter One");
assert.equal(formatSelection("italic", "quiet"), "*quiet*");
assert.equal(formatSelection("bullet", "one\ntwo"), "- one\n- two");
assert.equal(formatSelection("number", "one\ntwo"), "1. one\n2. two");
assert.equal(formatSelection("unknown", "plain"), "plain");
assert.equal(getFormattingFallback("heading"), "Heading");
assert.equal(getFormattingFallback("italic"), "text");

console.log("Story formatting controls passed.");
