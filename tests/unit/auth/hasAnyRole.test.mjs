import test from "node:test";
import assert from "node:assert/strict";
import { hasAnyRole } from "../../../src/modules/auth/utils/hasAnyRole.ts";

test("allows access when at least one user role is permitted", () => {
  assert.equal(hasAnyRole(["STUDENT", "TEACHER"], ["ADMIN", "TEACHER"]), true);
});

test("denies access when none of the user roles is permitted", () => {
  assert.equal(hasAnyRole(["STUDENT"], ["ADMIN", "TEACHER"]), false);
});

test("denies access when the user has no roles", () => {
  assert.equal(hasAnyRole([], ["ADMIN"]), false);
});

test("denies access when no roles are allowed", () => {
  assert.equal(hasAnyRole(["ADMIN"], []), false);
});

test("supports an exact role match", () => {
  assert.equal(hasAnyRole(["ADMIN"], ["ADMIN"]), true);
});
