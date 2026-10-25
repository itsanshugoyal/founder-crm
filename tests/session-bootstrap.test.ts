import test from "node:test";
import assert from "node:assert/strict";
import { createApplication } from "../src/server/app";
import { createLocalDatabase } from "../src/server/local";
import { getSession } from "../src/client/api";

test("combined bootstrap reads one snapshot and keeps anonymous/private and project boundaries", async () => {
  const db = await createLocalDatabase(":memory:");
  let reads = 0;
  const { app } = await createApplication({
    db: {
      snapshot: async () => {
        reads++;
        return db.snapshot();
      },
      commit: (version, state) => db.commit(version, state),
    },
    mode: "local",
  });
  try {
    const setup = await app.request("http://localhost/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bootstrap owner",
        email: "bootstrap@example.test",
        password: crypto.randomUUID() + crypto.randomUUID(),
      }),
    });
    assert.equal(setup.status, 200);
    const cookie = setup.headers.get("set-cookie")!.split(";")[0];
    reads = 0;
    const anonymous = await (
      await app.request("http://localhost/api/session?includeWorkspace=1")
    ).json();
    assert.equal(reads, 1);
    assert.equal(anonymous.authenticated, false);
    assert.equal(anonymous.workspace, undefined);
    reads = 0;
    const boot = await (
      await app.request("http://localhost/api/session?includeWorkspace=1", {
        headers: { Cookie: cookie },
      })
    ).json();
    assert.equal(reads, 1);
    assert.equal(boot.authenticated, true);
    assert(boot.workspace.selectedProjectId);
    assert.equal(boot.workspace.private, undefined);
    assert(!JSON.stringify(boot).includes('"credentials"'));
    const workspace = await (
      await app.request("http://localhost/api/workspace", {
        headers: { Cookie: cookie },
      })
    ).json();
    assert.deepEqual(boot.workspace, workspace);
    assert.equal(
      (
        await app.request(
          "http://localhost/api/session?includeWorkspace=1&projectId=foreign-project",
          { headers: { Cookie: cookie } },
        )
      ).status,
      403,
    );
  } finally {
    await db.close?.();
  }
});

test("client bootstrap coalesces duplicate loading requests and does not repeat a signed-out session", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  globalThis.fetch = async (input, options) => {
    calls++;
    assert(String(input).includes("includeWorkspace=1"));
    assert(options?.signal);
    await gate;
    return Response.json({
      authenticated: false,
      canCreateOwner: false,
      readiness: {
        database: true,
        auth: true,
        composio: false,
        mode: "local",
        sourceOfTruth: "Postgres",
        pending: [],
      },
    });
  };
  try {
    const a = getSession({ includeWorkspace: true }),
      b = getSession({ includeWorkspace: true });
    assert.equal(a, b);
    release();
    assert.equal((await a).authenticated, false);
    await b;
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});
