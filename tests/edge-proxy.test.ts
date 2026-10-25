import test from "node:test";
import assert from "node:assert/strict";
import { proxyEdge } from "../src/edge-proxy";
import { crmEdgePath } from "../src/edge-path";
test("function routing accepts Supabase ingress paths and preserves record boundaries", () => {
  for (const prefix of ["/founder-crm", "/functions/v1/founder-crm"]) {
    assert.equal(crmEdgePath(prefix + "/api/session"), "/api/session");
    assert.equal(
      crmEdgePath(prefix + "/api/invoices/id/pdf"),
      "/api/invoices/id/pdf",
    );
    assert.equal(crmEdgePath(prefix), "/");
  }
  assert.equal(
    crmEdgePath("/founder-crm-other/api/session"),
    "/founder-crm-other/api/session",
  );
});
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
        "x-region": "us-east-1",
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
      assert.equal(forwarded.headers.get("x-region"), "ap-northeast-2");
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

test("proxy consumes streamed payloads and strips upstream transport headers and cookies", async () => {
  const response = await proxyEdge(
    new Request("https://crm.example.invalid/api/session"),
    "https://fixture.supabase.co/functions/v1/founder-crm",
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"configured":'));
            controller.enqueue(new TextEncoder().encode("true}"));
            controller.close();
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Encoding": "gzip",
            "Content-Length": "999",
            "Transfer-Encoding": "chunked",
            "Set-Cookie": "provider_session=synthetic",
          },
        },
      ),
  );
  assert.deepEqual(await response.json(), { configured: true });
  for (const header of [
    "Content-Encoding",
    "Content-Length",
    "Transfer-Encoding",
    "Set-Cookie",
  ]) {
    assert.equal(response.headers.get(header), null);
  }
  assert.equal(response.headers.get("Cache-Control"), "no-store");
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
