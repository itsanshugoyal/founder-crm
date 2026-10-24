import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { serve } from "@hono/node-server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createApplication } from "../src/server/app";
import { createLocalDatabase } from "../src/server/local";

test("real stdio MCP negotiates, creates a scoped task, and exposes no send tools", async () => {
  const db = await createLocalDatabase(":memory:");
  const { app } = await createApplication({ db, mode: "local" });
  const setup = await app.request("http://localhost/api/auth/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test owner",
      email: "mcp@example.invalid",
      password: crypto.randomUUID() + crypto.randomUUID(),
    }),
  });
  assert.equal(setup.status, 200);
  const cookie = setup.headers.get("set-cookie")!.split(";")[0];
  const { csrfToken } = await setup.json();
  const { projects } = await (
    await app.request("http://localhost/api/workspace", {
      headers: { Cookie: cookie },
    })
  ).json();
  const projectId = projects[0].id;
  const response = await app.request("http://localhost/api/mutate", {
    method: "POST",
    headers: {
      Cookie: cookie,
      "X-CSRF-Token": csrfToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "create_mcp_token",
      projectId,
      requestId: crypto.randomUUID(),
      payload: { label: "Ephemeral protocol test", expiresInDays: 1 },
    }),
  });
  assert.equal(response.status, 200);
  const { token } = await response.json();
  const server = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 0 });
  if (!server.listening) await once(server, "listening");
  const address = server.address();
  assert(address && typeof address !== "string");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", "scripts/mcp.ts"],
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          (entry): entry is [string, string] => entry[1] !== undefined,
        ),
      ),
      CRM_API_URL: `http://127.0.0.1:${address.port}`,
      CRM_PROJECT_ID: projectId,
      CRM_MCP_TOKEN: token,
    },
    stderr: "pipe",
  });
  const client = new Client({ name: "crm-protocol-test", version: "1.0.0" });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert(tools.some((tool) => tool.name === "task_create"));
    assert(
      !tools.some((tool) => /send|approve|invite|payment/.test(tool.name)),
    );
    const result = await client.callTool({
      name: "task_create",
      arguments: { title: "Protocol fixture" },
    });
    assert.notEqual(result.isError, true);
    const state = await db.snapshot();
    assert(
      state.records.some(
        (record) =>
          record.projectId === projectId &&
          record.kind === "task" &&
          record.title === "Protocol fixture",
      ),
    );
    const denied = await client.callTool({
      name: "provider_send",
      arguments: {},
    });
    assert.equal(denied.isError, true);
  } finally {
    await client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await db.close?.();
  }
});
