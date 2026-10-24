import { build } from "esbuild";
import { mkdir, stat } from "node:fs/promises";
await mkdir(".local/deploy", { recursive: true });
await build({
  entryPoints: ["src/supabase-edge.ts"],
  outfile: ".local/deploy/supabase-edge.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  conditions: ["workerd", "worker", "browser"],
  external: ["node:*"],
  logLevel: "warning",
});
console.log(
  JSON.stringify({
    edgeBundle: ".local/deploy/supabase-edge.js",
    bytes: (await stat(".local/deploy/supabase-edge.js")).size,
  }),
);
