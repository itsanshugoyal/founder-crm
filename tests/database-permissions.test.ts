import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
test("Supabase default grants cannot expose state or mutation RPCs to browser roles", async () => {
  const pg = new PGlite();
  try {
    await pg.waitReady;
    await pg.exec(
      "create role anon; create role authenticated; create role service_role bypassrls; alter default privileges in schema public grant execute on functions to anon, authenticated; alter default privileges in schema public grant all on tables to anon, authenticated;",
    );
    await pg.exec(
      await readFile(
        new URL("../supabase/migrations/202610240001_crm.sql", import.meta.url),
        "utf8",
      ),
    );
    for (const role of ["anon", "authenticated"]) {
      await pg.exec(`set role ${role}`);
      await assert.rejects(
        () => pg.query("select crm_snapshot()"),
        /permission denied/,
      );
      await assert.rejects(
        () => pg.query("select * from crm_revision"),
        /permission denied/,
      );
      await assert.rejects(
        () => pg.query("select crm_commit(0,'{}'::jsonb)"),
        /permission denied/,
      );
      await pg.exec("reset role");
    }
    await pg.exec("set role service_role");
    const rows = await pg.query<{ state: unknown }>(
      "select crm_snapshot() as state",
    );
    assert(rows.rows[0].state);
    await pg.exec("reset role");
  } finally {
    await pg.close();
  }
});
