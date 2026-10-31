import test from "node:test";
import assert from "node:assert/strict";
import type { CrmRecord } from "../src/shared/types";
import { indexSearchRecords, searchRecords } from "../src/client/record-search";

const record = (id: string, title: string, overrides: Partial<CrmRecord> = {}): CrmRecord => ({
  id, title, projectId: "project", kind: "task", status: "to_do", ownerId: "owner", contactId: null, dueAt: null,
  data: {}, version: 1, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", ...overrides,
});
const records = [
  record("exact", "Acme"),
  record("detail", "Write launch email", { kind: "draft", contactId: "contact", data: { company: "Acme", email: "team@acme.test" } }),
  record("contact", "José Rivera", { kind: "contact", updatedAt: "2026-10-27T00:00:00Z" }),
  record("foreign", "Acme secret", { projectId: "other" }),
  record("archived", "Acme old", { status: "archived" }),
];
const index = indexSearchRecords(records, "project", [{ id: "owner", name: "Nahush Patel" }]);

test("search isolates the selected project and excludes archived records", () => {
  assert.deepEqual(searchRecords(index, "Acme").map((item) => item.id), ["exact", "detail"]);
});
test("search matches related contact, owner, status, and multiple words", () => {
  assert.equal(searchRecords(index, "Jose launch")[0]?.id, "detail");
  assert.equal(searchRecords(index, "Nahush draft acme")[0]?.id, "detail");
  assert.equal(searchRecords(index, "team@acme.test")[0]?.id, "detail");
});
test("search tolerates a single typo and rejects unrelated terms", () => {
  assert.equal(searchRecords(index, "launh")[0]?.id, "detail");
  assert.deepEqual(searchRecords(index, "unrelated xyz"), []);
});
test("empty search suggests recent records and honours the result limit", () => {
  assert.equal(searchRecords(index, "", 1)[0]?.id, "contact");
  assert.equal(searchRecords(index, "", 1).length, 1);
});
