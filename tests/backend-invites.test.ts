import test from "node:test";
import assert from "node:assert/strict";
import { createLocalDatabase } from "../src/server/local";
import { SupabaseDatabase, transact } from "../src/server/database";
import { createApplication } from "../src/server/app";
import { digest } from "../src/server/security";
import { seedProject } from "../src/server/operations";

test("production invite requires verified matching Supabase identity, consumes its token once, and binds the member UUID (mock Auth)", async () => {
  const local = await createLocalDatabase(":memory:");
  const remote = new SupabaseDatabase(
    "https://fixture.supabase.co",
    "fixture-only-not-a-real-service-key",
  );
  remote.snapshot = () => local.snapshot();
  remote.commit = (revision, state) => local.commit(revision, state);
  const confirmedId = crypto.randomUUID(),
    stubId = crypto.randomUUID(),
    ownerId = crypto.randomUUID(),
    token = "fixture-private-invitation";
  let projectId = "";
  Object.defineProperty(remote.client.auth, "getUser", {
    value: async (jwt: string) => ({
      data: {
        user:
          jwt === "verified-invitee"
            ? {
                id: confirmedId,
                email: "invitee@example.test",
                email_confirmed_at: new Date().toISOString(),
                user_metadata: {},
              }
            : jwt === "wrong-email"
              ? {
                  id: crypto.randomUUID(),
                  email: "other@example.test",
                  email_confirmed_at: new Date().toISOString(),
                  user_metadata: {},
                }
              : jwt === "unverified"
                ? {
                    id: confirmedId,
                    email: "invitee@example.test",
                    user_metadata: {},
                  }
                : null,
      },
      error: jwt === "invalid" ? new Error("fixture invalid token") : null,
    }),
  });
  await transact(local, async (state) => {
    state.members.push({
      id: ownerId,
      name: "Existing owner",
      email: "owner@example.test",
      role: "owner",
      projectIds: [],
    });
    const project = seedProject(state, ownerId);
    projectId = project.id;
    state.members[0].projectIds.push(projectId);
    state.members.push({
      id: stubId,
      name: "Invited teammate",
      email: "invitee@example.test",
      role: "member",
      projectIds: [projectId],
    });
    state.private.invites[await digest(token)] = {
      memberId: stubId,
      expires: Date.now() + 86400000,
    };
    state.records.push({
      id: crypto.randomUUID(),
      projectId,
      kind: "task",
      title: "Assigned before acceptance",
      status: "pending",
      ownerId: stubId,
      contactId: null,
      dueAt: null,
      data: { ownerIds: [ownerId, stubId] },
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
  const { app } = await createApplication({
    db: remote,
    mode: "production",
    env: {
      SUPABASE_URL: "https://fixture.supabase.co",
      SUPABASE_ANON_KEY: "fixture-public-key",
    },
  });
  const post = (jwt?: string, extra: Record<string, unknown> = {}) =>
    app.request("https://crm.example.test/api/auth/accept-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwt ? { Authorization: "Bearer " + jwt } : {}),
      },
      body: JSON.stringify({ token, ...extra }),
    });
  try {
    assert.equal((await post()).status, 401);
    assert.equal((await post("invalid")).status, 401);
    assert.equal((await post("unverified")).status, 401);
    assert.equal((await post("wrong-email")).status, 403);
    assert.equal(
      (
        await post("verified-invitee", {
          password: "must-not-be-stored-in-crm",
        })
      ).status,
      400,
    );
    const pending = await (
      await app.request("https://crm.example.test/api/session", {
        headers: { Authorization: "Bearer verified-invitee" },
      })
    ).json();
    assert.equal(pending.authenticated, false);
    const accepted = await post("verified-invitee", {
      name: "Verified teammate",
    });
    assert.equal(accepted.status, 200, await accepted.clone().text());
    const session = await accepted.json();
    assert.equal(session.actor.id, confirmedId);
    assert.equal(session.actor.name, "Verified teammate");
    assert.equal(accepted.headers.get("set-cookie"), null);
    assert.equal((await post("verified-invitee")).status, 403);
    const state = await local.snapshot();
    assert.equal(
      state.members.some((m) => m.id === stubId),
      false,
    );
    assert.equal(
      state.records.find((r) => r.kind === "task")?.ownerId,
      confirmedId,
    );
    assert.deepEqual(
      state.records.find((r) => r.kind === "task")?.data.ownerIds,
      [ownerId, confirmedId],
    );
    assert.equal(Object.keys(state.private.credentials).length, 0);
    assert.equal(Object.keys(state.private.invites).length, 0);
    const active = await (
      await app.request("https://crm.example.test/api/session", {
        headers: { Authorization: "Bearer verified-invitee" },
      })
    ).json();
    assert.equal(active.authenticated, true);
    assert.equal(active.actor.id, confirmedId);
  } finally {
    await local.close?.();
  }
});
