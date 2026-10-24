import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createLocalDatabase } from "../src/server/local";
import { createApplication } from "../src/server/app";
import { transact } from "../src/server/database";
import { mapLegacy, type LegacySnapshot } from "./legacy-mapping";
const snapshot = JSON.parse(
  await readFile(".local/migration/airtable-snapshot.json", "utf8"),
) as LegacySnapshot;
const path = ".local/rehearsal-" + Date.now();
let db = await createLocalDatabase(path);
const { app } = await createApplication({ db, mode: "local" });
const setup = await app.request("http://localhost/api/auth/setup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Migration verification",
    email: "migration@example.invalid",
    password: crypto.randomUUID() + crypto.randomUUID(),
  }),
});
assert.equal(setup.status, 200, "Isolated owner setup must succeed.");
let added = 0;
for (let attempt = 0; attempt < 2; attempt++)
  await transact(db, (state) => {
    const mapped = mapLegacy(snapshot, state.projects[0], state.members);
    const ids = new Set(state.records.map((r) => r.id));
    const next = mapped.records.filter((r) => !ids.has(r.id));
    if (attempt === 1)
      assert.equal(next.length, 0, "Repeat import must not duplicate records.");
    state.records.push(...next);
    added += next.length;
    const existing = new Set(state.activities.map((a) => a.id));
    state.activities.push(
      ...mapped.activities.filter((a) => !existing.has(a.id)),
    );
  });
await db.close?.();
db = await createLocalDatabase(path);
try {
  const persisted = await db.snapshot(),
    contacts = persisted.records.filter(
      (r) => r.kind === "contact" && r.data.legacySource === "airtable",
    );
  assert.equal(contacts.length, snapshot.tables.Leads.length);
  for (const original of snapshot.tables.Leads) {
    const row = contacts.find((r) => r.data.legacyId === original.id);
    assert(row);
    assert.deepEqual(
      row.data.legacyRaw,
      original.fields,
      "Every original field must survive the Postgres restart.",
    );
  }
  const drafts = persisted.records.filter((r) => r.kind === "draft");
  assert(
    drafts.every(
      (r) =>
        r.status === "Needs review" && !r.data.approvedHash && !r.data.sentAt,
    ),
  );
  for (const experimental of [
    "mrsumitreview",
    "mommylilworld",
    "fs_praveen_mekala",
    "captain_amaira",
    "geekyranjitofficial",
  ])
    assert.equal(
      contacts.find((r) => r.data.handle === experimental)?.data.segment,
      "brand_deal",
    );
  console.log(
    JSON.stringify(
      {
        ok: true,
        isolatedDatabase: path,
        contactsVerified: contacts.length,
        sourceOperations: snapshot.tables["CRM Operations"].length,
        recordsImported: added,
        draftsUnapproved: drafts.length,
        repeatedImportAdded: 0,
        persistenceRestartVerified: true,
        allOriginalLeadFieldsVerified: true,
        sourceAirtableWrites: 0,
        cutover: false,
      },
      null,
      2,
    ),
  );
} finally {
  await db.close?.();
}
