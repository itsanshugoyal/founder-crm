import test from "node:test";
import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
test("Vercel Node adapter preserves POST bodies, paths and individual bearer authentication", async () => {
  const previous = process.env.CRM_EDGE_URL,
    originalFetch = globalThis.fetch;
  process.env.CRM_EDGE_URL =
    "https://fixture.supabase.co/functions/v1/founder-crm";
  let calls = 0;
  globalThis.fetch = async (input) => {
    const req = input as Request;
    calls++;
    assert.equal(
      req.url,
      "https://fixture.supabase.co/functions/v1/founder-crm/api/mutate?projectId=p",
    );
    assert.equal(
      req.headers.get("authorization"),
      "Bearer synthetic-review-session",
    );
    assert.equal(req.headers.get("cookie"), null);
    assert.deepEqual(await req.json(), { action: "fixture" });
    return Response.json({ verified: true });
  };
  const { default: handler } = await import("../api/index.js");
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  try {
    const result = await new Promise<{ status: number; body: string }>(
      (resolve, reject) => {
        const req = httpRequest(
          {
            host: "127.0.0.1",
            port: address.port,
            path: "/api/mutate?projectId=p",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer synthetic-review-session",
              Cookie: "hosting_session=synthetic",
            },
          },
          (res) => {
            let body = "";
            res.setEncoding("utf8");
            res.on("data", (part) => (body += part));
            res.on("end", () => resolve({ status: res.statusCode!, body }));
          },
        );
        req.on("error", reject);
        req.end(JSON.stringify({ action: "fixture" }));
      },
    );
    assert.equal(result.status, 200);
    assert.deepEqual(JSON.parse(result.body), { verified: true });
    assert.equal(calls, 1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.CRM_EDGE_URL;
    else process.env.CRM_EDGE_URL = previous;
  }
});
