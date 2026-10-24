import test from "node:test";
import assert from "node:assert/strict";
import { proxyEdge } from "../src/edge-proxy";
test("hosting proxy preserves scoped API requests while stripping hosting credentials", async () => {
  let calls = 0;
  const response = await proxyEdge(
    new Request("https://crm.example.invalid/api/mutate?projectId=p", {
      method: "POST",
      headers: {
        Authorization: "Bearer synthetic-session",
        "Content-Type": "application/json",
        Origin: "https://crm.example.invalid",
        Cookie: "hosting_private=synthetic",
        "x-site-owner": "private-host-identity",
      },
      body: '{"fixture":true}',
    }),
    "https://fixture.supabase.co/functions/v1/founder-crm",
    async (input) => {
      calls++;
      const forwarded = input as Request;
      assert.equal(
        forwarded.url,
        "https://fixture.supabase.co/functions/v1/founder-crm/api/mutate?projectId=p",
      );
      assert.equal(forwarded.headers.get("Cookie"), null);
      assert.equal(forwarded.headers.get("x-site-owner"), null);
      assert.equal(
        forwarded.headers.get("Authorization"),
        "Bearer synthetic-session",
      );
      assert.equal(await forwarded.text(), '{"fixture":true}');
      return Response.json({ ok: true });
    },
  );
  assert.equal(response.status, 200);
  assert.equal(calls, 1);
});
test("proxy configuration failures and transport failures stay closed with no retry", async () => {
  let calls = 0;
  const fail: typeof fetch = async () => {
    calls++;
    throw Error("Private upstream details");
  };
  assert.equal(
    (
      await proxyEdge(
        new Request("https://crm.example.invalid/api/session"),
        "https://attacker.invalid/functions/v1/founder-crm",
        fail,
      )
    ).status,
    503,
  );
  assert.equal(calls, 0);
  const response = await proxyEdge(
    new Request("https://crm.example.invalid/api/session"),
    "https://fixture.supabase.co/functions/v1/founder-crm",
    fail,
  );
  assert.equal(response.status, 503);
  assert.equal(calls, 1);
  assert(!(await response.text()).includes("Private upstream"));
});
