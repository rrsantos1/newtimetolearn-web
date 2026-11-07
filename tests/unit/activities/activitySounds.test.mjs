import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  areActivitySoundsEnabled,
  playActivitySound,
  setActivitySoundsEnabled,
} from "../../../src/modules/activities/utils/activitySounds.ts";

const storage = new Map();

beforeEach(() => {
  storage.clear();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

test("enables activity sounds by default", () => {
  assert.equal(areActivitySoundsEnabled(), true);
});

test("persists a disabled sound preference", () => {
  setActivitySoundsEnabled(false);

  assert.equal(areActivitySoundsEnabled(), false);
});

test("persists an enabled sound preference", () => {
  setActivitySoundsEnabled(false);
  setActivitySoundsEnabled(true);

  assert.equal(areActivitySoundsEnabled(), true);
});

test("does not attempt playback when sounds are disabled", () => {
  setActivitySoundsEnabled(false);

  assert.doesNotThrow(() => playActivitySound("success"));
});

test("does not fail during server-side rendering", () => {
  Reflect.deleteProperty(globalThis, "window");

  assert.equal(areActivitySoundsEnabled(), true);
  assert.doesNotThrow(() => setActivitySoundsEnabled(false));
  assert.doesNotThrow(() => playActivitySound("applause"));
});
