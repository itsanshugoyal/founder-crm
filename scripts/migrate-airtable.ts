import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  mapLegacy,
  legacyCounts,
  type AirtableRecord,
  type LegacySnapshot,
} from "./legacy-mapping";
import {
  transact,
  SupabaseDatabase,
  type Database,
} from "../src/server/database";
import { createLocalDatabase } from "../src/server/local";
const args = process.argv.slice(2),
  option = (name: string) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
const sourceEnv = option("--source-env") ?? "C:/code/DealDock/.env.local";
function loadEnv(text: string) {
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]])
      process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
}
async function snapshot() {
  loadEnv(await readFile(sourceEnv, "utf8"));
  const pat = process.env.AIRTABLE_PAT,
    base = process.env.AIRTABLE_BASE_ID;
  if (!pat || !base)
    throw new Error("Airtable credentials are not configured.");
  const tables: Record<string, AirtableRecord[]> = {},
    missingTables: string[] = [];
  for (const table of ["Leads", "CRM Operations", "Calls", "Daily Counters"]) {
    tables[table] = [];
    let offset: string | undefined;
    do {
      const url = new URL(
        `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}`,
      );
      url.searchParams.set("pageSize", "100");
      if (offset) url.searchParams.set("offset", offset);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${pat}` },
        signal: AbortSignal.timeout(30000),
      });
      if (response.status === 404) {
        if (table === "Leads")
          throw new Error("Airtable Leads table could not be read.");
        missingTables.push(table);
        break;
      }
      if (!response.ok)
        throw new Error(
          `Airtable export failed for ${table} (HTTP ${response.status}).`,
        );
      const body = (await response.json()) as {
        records: AirtableRecord[];
        offset?: string;
      };
      tables[table].push(...body.records);
      offset = body.offset;
    } while (offset);
  }
  const data: LegacySnapshot = {
    exportedAt: new Date().toISOString(),
    tables,
    missingTables,
    counts: legacyCounts(tables),
  };
  const path = resolve(
    option("--output") ?? ".local/migration/airtable-snapshot.json",
  );
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), { mode: 0o600 });
  console.log(
    JSON.stringify({
      mode: "read-only Airtable export",
      privateSnapshot: path,
      counts: data.counts,
      missingTables,
    }),
  );
  return data;
}
async function main() {
  const data =
    args.includes("--snapshot") || !option("--snapshot-file")
      ? await snapshot()
      : (JSON.parse(
          await readFile(resolve(option("--snapshot-file")!), "utf8"),
        ) as LegacySnapshot);
  if (!args.includes("--apply-local") && !args.includes("--apply-production"))
    return;
  let db: Database;
  if (args.includes("--apply-production")) {
    try {
      loadEnv(await readFile(".env.local", "utf8"));
    } catch {}
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw new Error(
        "Production Postgres configuration is missing. Airtable was not changed.",
      );
    db = new SupabaseDatabase(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  } else db = await createLocalDatabase(option("--database") ?? ".local/db");
  try {
    let report: unknown;
    await transact(db, (state) => {
      const project = state.projects.find(
        (p) =>
          p.id === option("--project") ||
          (!option("--project") && p.name === "DealDock"),
      );
      if (
        !project ||
        !state.members.some(
          (m) => m.role === "owner" && m.projectIds.includes(project.id),
        )
      )
        throw new Error(
          "Set up the owner and destination project before importing.",
        );
      const mapped = mapLegacy(data, project, state.members);
      const existing = state.records.filter(
        (r) => r.projectId === project.id && r.data.legacySource === "airtable",
      );
      const existingIds = new Set(existing.map((r) => r.id));
      const conflicts = mapped.records.filter(
        (r) =>
          existingIds.has(r.id) &&
          existing.find((e) => e.id === r.id)?.data.legacyRaw &&
          JSON.stringify(
            existing.find((e) => e.id === r.id)?.data.legacyRaw,
          ) !== JSON.stringify(r.data.legacyRaw),
      );
      if (conflicts.length)
        throw new Error(
          `${conflicts.length} imported records differ. Reconcile changes before re-importing.`,
        );
      const added = mapped.records.filter((r) => !existingIds.has(r.id));
      state.records.push(...added);
      const activityIds = new Set(state.activities.map((a) => a.id));
      state.activities.push(
        ...mapped.activities.filter((a) => !activityIds.has(a.id)),
      );
      const importedContacts = state.records.filter(
        (r) =>
          r.projectId === project.id &&
          r.kind === "contact" &&
          r.data.legacySource === "airtable",
      );
      if (importedContacts.length !== mapped.counts.leads)
        throw new Error(
          "Contact count reconciliation failed. Transaction cancelled.",
        );
      report = {
        imported: added.length,
        alreadyPresent: mapped.records.length - added.length,
        contactsVerified: importedContacts.length,
        sourceCounts: mapped.counts,
        warnings: mapped.warnings,
        cutover: false,
        sourceOfTruth: "Airtable unchanged; this is a verified import only.",
      };
    });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await db.close?.();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Migration failed. No source records were changed.",
  );
  process.exitCode = 1;
});
