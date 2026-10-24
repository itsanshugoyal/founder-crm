import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUtmUrl, PLAYBOOKS } from "../src/shared/playbooks";
test("campaign links preserve existing query values and encode attribution without unsafe schemes", () => {
  const u = new URL(
    buildUtmUrl(
      "https://example.invalid/apply?ref=founder",
      "pilot cohort",
      "instagram",
      "organic social",
    ),
  );
  assert.equal(u.searchParams.get("ref"), "founder");
  assert.equal(u.searchParams.get("utm_campaign"), "pilot cohort");
  assert.equal(u.searchParams.get("utm_medium"), "organic social");
  assert.throws(() => buildUtmUrl("javascript:alert(1)", "a", "b", "c"));
  assert.throws(() => buildUtmUrl("https://example.invalid", "", "b", "c"));
});
test("operating playbooks contain concrete steps and no automatic-send authorization", () => {
  assert.equal(PLAYBOOKS.length, 6);
  assert(PLAYBOOKS.every((p) => p.steps.length >= 5 && p.description && p.id));
  assert.equal(new Set(PLAYBOOKS.map((p) => p.id)).size, PLAYBOOKS.length);
});
