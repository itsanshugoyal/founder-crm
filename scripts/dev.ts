import { serve } from "@hono/node-server";
import { createApplication, type Environment } from "../src/server/app";
import { createLocalDatabase } from "../src/server/local";
const production =
  process.argv.includes("--production") ||
  process.env.NODE_ENV === "production";
const env = process.env as Environment;
// Vite proxies browser requests from :3460 to the local API on :3461.
// Keep the browser origin explicit so a production APP_ORIGIN inherited by
// the shell cannot make local CSRF/origin validation reject sign-in.
if (!production) env.APP_ORIGIN = "http://127.0.0.1:3460";
const db = production
  ? undefined
  : await createLocalDatabase(process.env.CRM_DATA_PATH ?? ".local/db");
const { app } = await createApplication({
  db,
  env,
  mode: production ? "production" : "local",
});
const port = Number(process.env.PORT ?? 3461);
serve({ fetch: app.fetch, port, hostname: "127.0.0.1" });
console.log(
  `Founder CRM API ready at http://127.0.0.1:${port} (${production ? "production" : "private local"} mode).`,
);
if (!production) {
  const { spawn } = await import("node:child_process");
  const vite = spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
    { stdio: "inherit", windowsHide: true },
  );
  process.on("SIGINT", () => {
    vite.kill();
    process.exit(0);
  });
}
