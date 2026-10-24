import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapLegacy,
  legacyId,
  type LegacySnapshot,
} from "../scripts/legacy-mapping";
import type { Member, Project } from "../src/shared/types";
const project: Project = {
  id: "project",
  name: "DealDock",
  slug: "dealdock",
  description: "",
  settings: {},
  createdAt: "2026-10-24T00:00:00Z",
};
const member: Member = {
  id: "anshu",
  name: "Anshu",
  role: "owner",
  projectIds: ["project"],
};
test("legacy import preserves raw fields, experiment exclusion, unknown evidence and unapproved drafts", () => {
  const source = {
    id: "rec1",
    fields: {
      ig_handle: "mrsumitreview",
      qualification_status: "pending",
      score: 7,
      ig_dm_draft: "Legacy text",
      notes:
        'Original notes\n\n--- DealDock CRM metadata ---\n{"owner":"Anshu","segment":"brand_deal","approvedDraft":"Legacy text"}',
    },
  };
  const snapshot: LegacySnapshot = {
    exportedAt: "2026-10-24T00:00:00Z",
    tables: { Leads: [source] },
    missingTables: [],
    counts: {},
  };
  const result = mapLegacy(snapshot, project, [member]);
  assert.equal(result.records.length, 2);
  const contact = result.records[0],
    draft = result.records[1];
  assert.deepEqual(contact.data.legacyRaw, source.fields);
  assert.equal(contact.data.segment, "brand_deal");
  assert.equal(contact.data.followers, null);
  assert.equal(contact.data.notes, "Original notes");
  assert.equal(contact.ownerId, "anshu");
  assert.equal(draft.status, "Needs review");
  assert.equal(draft.data.approvedHash, undefined);
  assert.equal(draft.contactId, contact.id);
  assert.equal(result.counts.pending, 1);
  assert.equal(
    mapLegacy(snapshot, project, [member]).records[0].id,
    contact.id,
  );
});
test("malformed metadata is preserved rather than guessed", () => {
  const source = {
    id: "rec2",
    fields: {
      ig_handle: "fixture",
      notes: "Text\n\n--- DealDock CRM metadata ---\nnot-json",
    },
  };
  const result = mapLegacy(
    {
      exportedAt: "2026-10-24T00:00:00Z",
      tables: { Leads: [source] },
      missingTables: [],
      counts: {},
    },
    project,
    [],
  );
  assert.equal(result.warnings.length, 1);
  assert.equal(result.records[0].data.notes, source.fields.notes);
  assert.equal(result.records[0].ownerId, null);
  assert.equal(result.records[0].data.evidenceUrl, "");
  assert.notEqual(legacyId("a"), legacyId("b"));
});
