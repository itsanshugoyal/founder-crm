import test from "node:test";
import assert from "node:assert/strict";
import { createApplication } from "../src/server/app";
import { createLocalDatabase } from "../src/server/local";
import { transact } from "../src/server/database";
import { Providers } from "../src/server/providers";

test("admin invitations, never-expiring scoped tokens, revocation and truthful integration status", async () => {
  const db = await createLocalDatabase(":memory:");
  const { app } = await createApplication({ db, mode: "local" });
  try {
    const setup = await app.request("http://localhost/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Owner",
        email: "owner@example.test",
        password: crypto.randomUUID() + crypto.randomUUID(),
      }),
    });
    const cookie = setup.headers.get("set-cookie")!.split(";")[0],
      { csrfToken } = await setup.json();
    const headers = {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    };
    let workspace = await (
      await app.request("http://localhost/api/workspace", { headers })
    ).json();
    const projectId = workspace.projects[0].id;
    const mutate = async (action: string, payload: unknown, bearer?: string) =>
      app.request("http://localhost/api/mutate", {
        method: "POST",
        headers: bearer
          ? {
              "Content-Type": "application/json",
              Authorization: "Bearer " + bearer,
            }
          : headers,
        body: JSON.stringify({
          action,
          projectId,
          requestId: crypto.randomUUID(),
          payload,
        }),
      });
    assert.equal(
      workspace.integrations.find((i: any) => i.provider === "mcp").status,
      "not_connected",
    );
    const invitation = await mutate("invite_member", {
      name: "Cofounder",
      email: "cofounder@example.test",
      role: "admin",
    });
    assert.equal(invitation.status, 200);
    const invited = (await db.snapshot()).members.find(
      (m) => m.email === "cofounder@example.test",
    )!;
    assert.equal(invited.role, "admin");
    const created = await mutate("create_mcp_token", {
      label: "Long-running local Codex",
      neverExpires: true,
    });
    const { token } = await created.json();
    assert.equal(created.status, 200);
    assert.equal(
      Object.values((await db.snapshot()).private.tokens)[0].expires,
      null,
    );
    assert.equal(
      (
        await mutate(
          "create_record",
          { kind: "task", title: "Scoped proof" },
          token,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await mutate(
          "invite_member",
          { name: "Forbidden", email: "forbidden@example.test", role: "admin" },
          token,
        )
      ).status,
      403,
    );
    workspace = await (
      await app.request("http://localhost/api/workspace", { headers })
    ).json();
    assert.equal(
      workspace.integrations.find((i: any) => i.provider === "mcp").status,
      "connected",
    );
    const listed = await (await mutate("list_mcp_tokens", {})).json();
    assert.equal(listed.tokens[0].expires, null);
    assert.equal(
      (await mutate("revoke_mcp_token", { tokenId: listed.tokens[0].id }))
        .status,
      200,
    );
    assert.equal(
      (
        await app.request("http://localhost/api/workspace", {
          headers: { Authorization: "Bearer " + token },
        })
      ).status,
      401,
    );
    await transact(db, (s) => {
      s.members[0].role = "admin";
    });
    assert.equal(
      (
        await mutate("invite_member", {
          name: "Admin invited",
          email: "second@example.test",
          role: "member",
        })
      ).status,
      200,
    );
  } finally {
    await db.close?.();
  }
});

test("private provider setup pins schemas without executing tools and never exposes the key", async () => {
  const db = await createLocalDatabase(":memory:");
  const { app } = await createApplication({ db, mode: "local" });
  try {
    await app.request("http://localhost/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Owner",
        email: "setup@example.test",
        password: crypto.randomUUID() + crypto.randomUUID(),
      }),
    });
    const state = await db.snapshot(),
      member = state.members[0],
      projectId = state.projects[0].id;
    const calls: string[] = [];
    const providers = new Providers(db, {}, async (input, options) => {
      const url = String(input);
      calls.push(url);
      assert(!url.includes("/execute/"));
      if (url.includes("/tools/"))
        return Response.json({ version: "20261025_00" });
      if (url.includes("auth_configs?")) return Response.json({ items: [] });
      if (url.endsWith("auth_configs")) {
        assert.equal(options?.method, "POST");
        return Response.json({ auth_config: { id: "ac_verified_fixture" } });
      }
      throw Error("Unexpected provider setup request");
    });
    const input = {
      action: "configure_provider",
      projectId,
      requestId: crypto.randomUUID(),
      payload: { provider: "gmail", apiKey: "fixture-project-key-not-live" },
    };
    const result = await providers.action(
      { member, machine: false },
      input,
      "http://localhost",
    );
    assert(!JSON.stringify(result).includes("fixture-project-key"));
    assert(providers.configured(await db.snapshot(), projectId, "gmail"));
    assert(
      !providers.configured(await db.snapshot(), "another-project", "gmail"),
    );
    await assert.rejects(
      providers.action({ member, machine: true }, input, "http://localhost"),
      /individual project member/,
    );
    assert.equal(calls.filter((url) => url.includes("/execute/")).length, 0);
    const publicState = await (
      await app.request("http://localhost/api/session")
    ).json();
    assert(!JSON.stringify(publicState).includes("fixture-project-key"));
  } finally {
    await db.close?.();
  }
});
