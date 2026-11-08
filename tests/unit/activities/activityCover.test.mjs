import test from "node:test";
import assert from "node:assert/strict";
import { getActivityCoverImage } from "../../../src/modules/activities/utils/activityCover.ts";

test("returns the provided cover URL when present", () => {
  assert.equal(
    getActivityCoverImage("quiz", "https://cdn.example.com/cover.webp"),
    "https://cdn.example.com/cover.webp",
  );
});

test("uses the default image for each supported activity type", () => {
  const expected = new Map([
    ["word_search", "/images/activities/word-search.png"],
    ["crossword", "/images/activities/crossword.png"],
    ["quiz", "/images/activities/quiz.png"],
    ["memory", "/images/activities/memory.png"],
    ["listening", "/images/activities/listening.png"],
    ["word_matching", "/images/activities/word-matching.png"],
    ["sentence_completion", "/images/activities/sentence-completion.png"],
    ["multiple_choice", "/images/activities/multiple-choice.png"],
    ["mole_hit", "/images/activities/mole-hit.png"],
    ["hangman", "/images/activities/hangman.png"],
    ["roulette", "/images/activities/roulette.png"],
  ]);

  for (const [type, image] of expected) {
    assert.equal(getActivityCoverImage(type), image);
  }
});

test("falls back to the generic cover for an activity without a specific image", () => {
  assert.equal(
    getActivityCoverImage("cloze"),
    "/images/activities/default-cover.jpg",
  );
});

test("uses the default cover when the optional URL is null", () => {
  assert.equal(
    getActivityCoverImage("quiz", null),
    "/images/activities/quiz.png",
  );
});

test("uses the default cover when the optional URL is null", () => {
  assert.equal(
    getActivityCoverImage("mole_hit", null),
    "/images/activities/mole-hit.png",
  );
});

test("uses the default cover when the optional URL is null", () => {
  assert.equal(
    getActivityCoverImage("hangman", null),
    "/images/activities/hangman.png",
  );
});

test("uses the default cover when the optional URL is null", () => {
  assert.equal(
    getActivityCoverImage("roulette", null),
    "/images/activities/roulette.png",
  );
});