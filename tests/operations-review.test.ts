import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeState } from "../src/server/database";
import {
  applyMutation,
  draftHash,
  type ActorContext,
} from "../src/server/operations";
import type { CrmRecord, Fields, Project } from "../src/shared/types";
const at = new Date().toISOString();
test("status-only opt-outs stay suppressed after edit, archive and merge", async () => {
  for (const action of ["update_record", "archive_record", "merge_contacts"]) {
    const { state, actor } = fixture();
    const source = (
      await applyMutation(
        state,
        actor,
        mutation("create_record", {
          kind: "contact",
          title: "Status-only opt-out",
          data: { email: "stop@example.invalid" },
        }),
        "http://localhost",
      )
    ).record!;
    source.status = "do_not_contact";
    const target = (
      await applyMutation(
        state,
        actor,
        mutation("create_record", {
          kind: "contact",
          title: "Merge destination",
          data: { email: "other@example.invalid" },
        }),
        "http://localhost",
      )
    ).record!;
    await applyMutation(
      state,
      actor,
      mutation(
        action,
        action === "merge_contacts"
          ? { targetId: target.id, targetVersion: target.version }
          : { status: "active" },
        source,
      ),
      "http://localhost",
    );
    const relationship = (
      await applyMutation(
        state,
        actor,
        mutation(
          "create_record",
          {
            kind: "contact",
            title: "Other project",
            data: { email: "stop@example.invalid" },
          },
          undefined,
          "q",
        ),
        "http://localhost",
      )
    ).record!;
    const draft = (
      await applyMutation(
        state,
        actor,
        mutation(
          "create_record",
          {
            kind: "draft",
            title: "Should remain blocked",
            contactId: relationship.id,
            data: { channel: "email", body: "Test" },
          },
          undefined,
          "q",
        ),
        "http://localhost",
      )
    ).record!;
    await assert.rejects(
      () =>
        applyMutation(
          state,
          actor,
          mutation("approve_draft", {}, draft, "q"),
          "http://localhost",
        ),
      /suppressed/,
      action,
    );
  }
});
test("identity changes retain duplicate and opt-out protection for earlier addresses", async () => {
  const { state, actor } = fixture();
  let original = (
    await applyMutation(
      state,
      actor,
      mutation("create_record", {
        kind: "contact",
        title: "Suppressed original",
        data: { email: "old@example.invalid", optOut: true },
      }),
      "http://localhost",
    )
  ).record!;
  original = (
    await applyMutation(
      state,
      actor,
      mutation(
        "update_record",
        { data: { email: "new@example.invalid" } },
        original,
      ),
      "http://localhost",
    )
  ).record!;
  await assert.rejects(
    () =>
      applyMutation(
        state,
        actor,
        mutation("create_record", {
          kind: "contact",
          title: "Duplicate old address",
          data: { email: "old@example.invalid" },
        }),
        "http://localhost",
      ),
    /already exists/,
  );
  const other = (
    await applyMutation(
      state,
      actor,
      mutation(
        "create_record",
        {
          kind: "contact",
          title: "Other project",
          data: { email: "old@example.invalid" },
        },
        undefined,
        "q",
      ),
      "http://localhost",
    )
  ).record!;
  const draft = (
    await applyMutation(
      state,
      actor,
      mutation(
        "create_record",
        {
          kind: "draft",
          title: "Blocked",
          contactId: other.id,
          data: { channel: "email", body: "Fixture" },
        },
        undefined,
        "q",
      ),
      "http://localhost",
    )
  ).record!;
  await assert.rejects(
    () =>
      applyMutation(
        state,
        actor,
        mutation("approve_draft", {}, draft, "q"),
        "http://localhost",
      ),
    /suppressed/,
  );
});
function fixture() {
  const state = normalizeState({});
  state.projects = [
    {
      id: "p",
      name: "DealDock",
      slug: "dealdock",
      description: "",
      settings: { dailySendLimit: 25, hourlySendLimit: 5 },
      createdAt: at,
      version: 1,
    },
    {
      id: "q",
      name: "Other",
      slug: "other",
      description: "",
      settings: {},
      createdAt: at,
      version: 1,
    },
  ];
  state.members = [
    { id: "a", name: "Anshu", role: "owner", projectIds: ["p", "q"] },
    { id: "n", name: "Nahush", role: "owner", projectIds: ["p", "q"] },
  ];
  const actor: ActorContext = { member: state.members[0], machine: false };
  return { state, actor };
}
const mutation = (
  action: string,
  payload: Fields,
  record?: CrmRecord,
  projectId = "p",
) => ({
  action,
  payload,
  projectId,
  recordId: record?.id,
  version: record?.version,
  requestId: crypto.randomUUID(),
});
test("contacts preserve unknown scores, normalize segment and reject duplicate identities", async () => {
  const { state, actor } = fixture();
  const a = (
    await applyMutation(
      state,
      actor,
      mutation("create_record", {
        kind: "contact",
        title: "QA contact",
        data: {
          email: "QA@EXAMPLE.INVALID",
          qualificationScore: null,
          segment: "Owned Offer",
        },
      }),
      "http://localhost",
    )
  ).record!;
  assert.equal(a.data.qualificationScore, null);
  assert.equal(a.data.segment, "owned_offer");
  await assert.rejects(
    () =>
      applyMutation(
        state,
        actor,
        mutation("create_record", {
          kind: "contact",
          title: "Duplicate",
          data: { email: "qa@example.invalid" },
        }),
        "http://localhost",
      ),
    /already exists/,
  );
  const b = await applyMutation(
    state,
    actor,
    mutation(
      "create_record",
      {
        kind: "contact",
        title: "Other project relationship",
        data: { email: "qa@example.invalid" },
      },
      undefined,
      "q",
    ),
    "http://localhost",
  );
  assert.equal(b.record?.projectId, "q");
});
test("merging preserves originals and moves unsent work while revoking approval", async () => {
  const { state, actor } = fixture();
  const make = async (title: string, data: Fields = {}) =>
    (
      await applyMutation(
        state,
        actor,
        mutation("create_record", { kind: "contact", title, data }),
        "http://localhost",
      )
    ).record!;
  const source = await make("Source", {
      email: "source@example.invalid",
      notes: "Source notes",
    }),
    target = await make("Destination", {
      email: "destination@example.invalid",
    });
  const task = (
    await applyMutation(
      state,
      actor,
      mutation("create_record", {
        kind: "task",
        title: "Follow up",
        contactId: source.id,
        data: {},
      }),
      "http://localhost",
    )
  ).record!;
  await applyMutation(
    state,
    actor,
    mutation(
      "merge_contacts",
      { targetId: target.id, targetVersion: target.version },
      source,
    ),
    "http://localhost",
  );
  assert.equal(source.status, "archived");
  assert.equal(source.data.notes, "Source notes");
  assert.equal(source.data.mergedIntoId, target.id);
  assert.equal(task.contactId, target.id);
  assert((target.data.mergedFromIds as string[]).includes(source.id));
});
test("an archived opt-out also suppresses another project relationship with the same identity", async () => {
  const { state, actor } = fixture();
  const one = (
    await applyMutation(
      state,
      actor,
      mutation("create_record", {
        kind: "contact",
        title: "One",
        data: { email: "same@example.invalid", optOut: true },
      }),
      "http://localhost",
    )
  ).record!;
  one.status = "archived";
  const two = (
    await applyMutation(
      state,
      actor,
      mutation(
        "create_record",
        {
          kind: "contact",
          title: "Two",
          data: { email: "same@example.invalid" },
        },
        undefined,
        "q",
      ),
      "http://localhost",
    )
  ).record!;
  const draft = (
    await applyMutation(
      state,
      actor,
      mutation(
        "create_record",
        {
          kind: "draft",
          title: "Review",
          contactId: two.id,
          data: { channel: "email", body: "QA message" },
        },
        undefined,
        "q",
      ),
      "http://localhost",
    )
  ).record!;
  await assert.rejects(
    () =>
      applyMutation(
        state,
        actor,
        mutation("approve_draft", {}, draft, "q"),
        "http://localhost",
      ),
    /suppressed/,
  );
});
test("manual Instagram cold outreach is approvable but shares the 15-touch ceiling across cofounders/projects", async () => {
  const { state, actor } = fixture();
  const contact = (
    await applyMutation(
      state,
      actor,
      mutation("create_record", {
        kind: "contact",
        title: "QA person",
        data: { handle: "qa_fixture" },
      }),
      "http://localhost",
    )
  ).record!;
  const draft = (
    await applyMutation(
      state,
      actor,
      mutation("create_record", {
        kind: "draft",
        title: "Manual introduction",
        contactId: contact.id,
        data: { channel: "instagram", body: "QA only", deliveryMode: "manual" },
      }),
      "http://localhost",
    )
  ).record!;
  await applyMutation(
    state,
    actor,
    mutation("approve_draft", {}, draft),
    "http://localhost",
  );
  assert.equal(draft.status, "approved");
  for (let i = 0; i < 15; i++)
    state.records.push({
      ...draft,
      id: "sent" + i,
      projectId: i % 2 ? "p" : "q",
      ownerId: i % 2 ? "a" : "n",
      data: {
        channel: "instagram",
        body: "Earlier QA fixture",
        sendState: "manually_confirmed",
        sentAt: at,
      },
    });
  await assert.rejects(
    () =>
      applyMutation(
        state,
        actor,
        mutation("confirm_send", { attestation: true }, draft),
        "http://localhost",
      ),
    /daily send ceiling/,
  );
  assert.equal(draft.data.sentAt, undefined);
});
test("legacy draft approval requires a fresh actual observation", async () => {
  const { state, actor } = fixture();
  const contact = (
    await applyMutation(
      state,
      actor,
      mutation("create_record", {
        kind: "contact",
        title: "Legacy",
        data: { email: "legacy@example.invalid" },
      }),
      "http://localhost",
    )
  ).record!;
  const draft = (
    await applyMutation(
      state,
      actor,
      mutation("create_record", {
        kind: "draft",
        title: "Legacy review",
        contactId: contact.id,
        data: { channel: "email", body: "Legacy text", legacyDraft: true },
      }),
      "http://localhost",
    )
  ).record!;
  await assert.rejects(
    () =>
      applyMutation(
        state,
        actor,
        mutation("approve_draft", {}, draft),
        "http://localhost",
      ),
    /Reverify/,
  );
  contact.data.evidenceUrl = "https://example.invalid/observed";
  contact.data.observation = "QA observation supplied explicitly";
  contact.data.checkedAt = at;
  await applyMutation(
    state,
    actor,
    mutation("approve_draft", {}, draft),
    "http://localhost",
  );
  assert.equal(draft.status, "approved");
});
