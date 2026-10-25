/** Isolated loopback QA only. Never used by production/server adapters. */
import { serve } from "@hono/node-server";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { createApplication } from "../src/server/app";
import { createLocalDatabase } from "../src/server/local";
import { transact } from "../src/server/database";
import { mapLegacy, type LegacySnapshot } from "./legacy-mapping";
import type { WorkspaceData } from "../src/shared/types";
if (process.env.NODE_ENV === "production" || process.env.VERCEL)
  throw new Error("QA server is forbidden in production.");
const origin = "http://127.0.0.1:3462",
  db = await createLocalDatabase(":memory:");
const { app } = await createApplication({
  db,
  mode: "local",
  env: { APP_ORIGIN: origin },
});
const setup = await app.request(origin + "/api/auth/setup", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: origin },
  body: JSON.stringify({
    name: "Anshu · QA sandbox",
    email: "qa-owner@example.invalid",
    password: crypto.randomUUID() + crypto.randomUUID(),
  }),
});
if (!setup.ok) throw new Error("Isolated QA setup failed.");
const cookie = (setup.headers.get("set-cookie") ?? "").split(";")[0];
let imported = 0;
try {
  const workspaceFile = process.argv.includes("--workspace-copy")
    ? ".local/verification/qa-workspace.json"
    : undefined;
  if (workspaceFile) {
    // Only the public workspace response is copied; no session, keys or private server state.
    const workspace = JSON.parse(
      await readFile(workspaceFile, "utf8"),
    ) as WorkspaceData;
    const sourceProject =
      workspace.projects.find((p) => p.id === workspace.selectedProjectId) ??
      workspace.projects[0];
    if (!sourceProject) throw new Error("QA source project is missing.");
    await transact(db, (state) => {
      const project = state.projects[0],
        member = state.members[0];
      project.name = sourceProject.name;
      project.description =
        "QA snapshot: in-memory changes only. No production writes or outbound providers.";
      state.records = workspace.records
        .filter((r) => r.projectId === sourceProject.id)
        .map((r) => ({
          ...r,
          projectId: project.id,
          ownerId: r.ownerId ? member.id : null,
        }));
      state.activities = [];
      imported = state.records.filter((r) => r.kind === "contact").length;
    });
  } else {
    const snapshot = JSON.parse(
      await readFile(".local/migration/airtable-snapshot.json", "utf8"),
    ) as LegacySnapshot;
    await transact(db, (state) => {
      const project = state.projects[0];
      const mapped = mapLegacy(snapshot, project, state.members);
      state.records.push(...mapped.records);
      state.activities.push(...mapped.activities);
      project.description =
        "QA sandbox: changes are in memory only. Airtable is unchanged.";
      imported = mapped.counts.leads;
    });
  }
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
const root = resolve("dist");
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
serve({
  hostname: "127.0.0.1",
  port: 3462,
  fetch: async (request) => {
    const url = new URL(request.url);
    if (
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/share/")
    ) {
      const headers = new Headers(request.headers);
      headers.set("Cookie", cookie);
      return app.fetch(new Request(request, { headers }));
    }
    let path = resolve(root, "." + decodeURIComponent(url.pathname));
    if (!path.startsWith(root))
      return new Response("Not found", { status: 404 });
    let content: Uint8Array;
    try {
      content = await readFile(path);
    } catch {
      path = resolve(root, "index.html");
      content = await readFile(path);
    }
    return new Response(Uint8Array.from(content).buffer, {
      headers: {
        "Content-Type": mime[extname(path)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  },
});
console.log(
  `Isolated QA sandbox at ${origin}; ${imported} imported contacts; changes are in memory only. No production credentials or outbound integrations are used.`,
);
