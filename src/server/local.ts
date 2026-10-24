import { PGlite } from "@electric-sql/pglite";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { normalizeState, type Database, type State } from "./database.js";
export async function createLocalDatabase(
  path = ".local/db",
): Promise<Database> {
  if (path !== ":memory:") await mkdir(resolve(path), { recursive: true });
  const pg = new PGlite(path === ":memory:" ? undefined : resolve(path));
  await pg.waitReady;
  const sql = await readFile(
    new URL("../../supabase/migrations/202610240001_crm.sql", import.meta.url),
    "utf8",
  );
  await pg.exec(sql);
  return {
    async snapshot() {
      const r = await pg.query<{ state: State }>(
        "select crm_snapshot() as state",
      );
      return normalizeState(r.rows[0].state);
    },
    async commit(expected, state) {
      const r = await pg.query<{ ok: boolean }>(
        "select crm_commit($1,$2::jsonb) as ok",
        [expected, JSON.stringify(state)],
      );
      return r.rows[0].ok;
    },
    async close() {
      await pg.close();
    },
  };
}
