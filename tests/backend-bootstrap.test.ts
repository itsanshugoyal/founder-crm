import test from "node:test";
import assert from "node:assert/strict";
import { createApplication, type Environment } from "../src/server/app";
import { SupabaseDatabase, transact, type State } from "../src/server/database";
import { createLocalDatabase } from "../src/server/local";

type Identity = {
  id: string;
  email: string;
  email_confirmed_at?: string;
  user_metadata: Record<string, string>;
};
async function fixture(
  configure?: (state: State) => void,
  extraEnv: Environment = {},
) {
  const local = await createLocalDatabase(":memory:");
  if (configure) await transact(local, configure);
  const remote = new SupabaseDatabase(
    "https://fixture.supabase.co",
    "fixture-only-not-a-real-service-key",
  );
  remote.snapshot = () => local.snapshot();
  remote.commit = (revision, state) => local.commit(revision, state);
  const ownerId = crypto.randomUUID();
  const identities: Record<string, Identity> = {
    owner: {
      id: ownerId,
      email: "owner@example.test",
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { name: "Verified owner" },
    },
    unverified: { id: ownerId, email: "owner@example.test", user_metadata: {} },
    wrong: {
      id: crypto.randomUUID(),
      email: "wrong@example.test",
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {},
    },
    override: {
      id: crypto.randomUUID(),
      email: "override@example.test",
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {},
    },
  };
  Object.defineProperty(remote.client.auth, "getUser", {
    value: async (token: string) => ({
      data: { user: identities[token] ?? null },
      error: identities[token] ? null : new Error("Invalid fixture token"),
    }),
  });
  const { app } = await createApplication({
    db: remote,
    mode: "production",
    env: {
      SUPABASE_URL: "https://fixture.supabase.co",
      SUPABASE_ANON_KEY: "fixture-public-key",
      ...extraEnv,
    },
  });
  const session = async (token?: string) => {
    const response = await app.request("https://crm.example.test/api/session", {
      headers: token ? { Authorization: "Bearer " + token } : {},
    });
    assert.equal(response.status, 200, await response.clone().text());
    return response.json();
  };
  return { local, app, session, ownerId };
}

test("first production owner creation remains server-allowlisted and single-use (mock Supabase Auth)", async (t) => {
  await t.test(
    "no configured bootstrap identity means no creation option or automatic owner",
    async () => {
      const f = await fixture();
      try {
        assert.equal((await f.session()).canCreateOwner, false);
        assert.equal((await f.session("owner")).authenticated, false);
        assert.equal((await f.local.snapshot()).members.length, 0);
      } finally {
        await f.local.close?.();
      }
    },
  );
  await t.test(
    "private SQL configuration allows only the matching verified identity and is not disclosed",
    async () => {
      const f = await fixture((state) => {
        state.private.bootstrapOwnerEmail = "Owner@Example.Test";
      });
      try {
        const publicSession = await f.session();
        assert.equal(publicSession.canCreateOwner, true);
        assert.equal(
          JSON.stringify(publicSession)
            .toLowerCase()
            .includes("owner@example.test"),
          false,
        );
        assert.equal("bootstrapOwnerEmail" in publicSession, false);
        assert.equal((await f.session("unverified")).authenticated, false);
        assert.equal((await f.session("wrong")).authenticated, false);
        assert.equal((await f.session("invalid")).authenticated, false);
        assert.equal((await f.local.snapshot()).members.length, 0);
        const created = await f.session("owner");
        assert.equal(created.authenticated, true);
        assert.equal(created.actor.id, f.ownerId);
        assert.equal(created.actor.role, "owner");
        assert.equal(created.canCreateOwner, false);
        const first = await f.local.snapshot();
        assert.equal(first.members.length, 1);
        assert.equal(first.projects.length, 1);
        assert.equal((await f.session("owner")).actor.id, f.ownerId);
        assert.equal((await f.session()).canCreateOwner, false);
        const repeated = await f.local.snapshot();
        assert.equal(repeated.members.length, 1);
        assert.deepEqual(
          repeated.projects.map((p) => p.id),
          first.projects.map((p) => p.id),
        );
        assert.equal((await f.session("wrong")).authenticated, false);
      } finally {
        await f.local.close?.();
      }
    },
  );
  await t.test(
    "explicit environment configuration takes precedence over SQL fallback",
    async () => {
      const f = await fixture(
        (state) => {
          state.private.bootstrapOwnerEmail = "owner@example.test";
        },
        { BOOTSTRAP_OWNER_EMAIL: " OVERRIDE@example.test " },
      );
      try {
        assert.equal((await f.session("owner")).authenticated, false);
        const accepted = await f.session("override");
        assert.equal(accepted.authenticated, true);
        assert.equal(accepted.actor.email, "override@example.test");
        assert.equal((await f.local.snapshot()).members.length, 1);
      } finally {
        await f.local.close?.();
      }
    },
  );
  await t.test(
    "pre-imported projects are assigned to the first owner without duplicate project or record seeding",
    async () => {
      const importedProject = crypto.randomUUID(),
        otherProject = crypto.randomUUID(),
        recordId = crypto.randomUUID(),
        at = new Date().toISOString();
      const f = await fixture((state) => {
        state.private.bootstrapOwnerEmail = "owner@example.test";
        state.projects.push(
          {
            id: importedProject,
            name: "Imported DealDock",
            slug: "imported-dealdock",
            description: "Preserved source",
            settings: {},
            version: 1,
            createdAt: at,
          },
          {
            id: otherProject,
            name: "Second imported project",
            slug: "second-import",
            description: "",
            settings: {},
            version: 1,
            createdAt: at,
          },
        );
        state.records.push({
          id: recordId,
          projectId: importedProject,
          kind: "contact",
          title: "Preserved imported record",
          status: "new",
          ownerId: null,
          contactId: null,
          dueAt: null,
          data: {
            legacyId: "original-source-id",
            legacyOwner: "Unmapped source owner",
          },
          version: 1,
          createdAt: at,
          updatedAt: at,
        });
      });
      try {
        const before = await f.local.snapshot(),
          session = await f.session("owner"),
          after = await f.local.snapshot();
        assert.deepEqual(
          session.actor.projectIds.slice().sort(),
          [importedProject, otherProject].sort(),
        );
        assert.equal(after.members.length, 1);
        assert.equal(after.projects.length, 2);
        assert.deepEqual(after.records, before.records);
        assert.equal(after.records[0].ownerId, null);
        assert.equal(
          after.records[0].data.legacyOwner,
          "Unmapped source owner",
        );
        await f.session("owner");
        assert.equal((await f.local.snapshot()).projects.length, 2);
      } finally {
        await f.local.close?.();
      }
    },
  );
});
