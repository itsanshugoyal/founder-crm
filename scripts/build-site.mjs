import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import { build } from "esbuild";
const root = resolve("dist"),
  assets = {};
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, e.name);
    if (e.isDirectory()) await walk(path);
    else if (!path.includes(".openai") && !path.includes("server"))
      assets["/" + relative(root, path).replaceAll("\\", "/")] = (
        await readFile(path)
      ).toString("base64");
  }
}
await walk(root);
await mkdir("src/generated", { recursive: true });
await writeFile(
  "src/generated/assets.ts",
  "export default " + JSON.stringify(assets) + " as Record<string,string>;\n",
);
await mkdir("dist/server", { recursive: true });
await build({
  entryPoints: ["src/site-worker.ts"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  conditions: ["workerd", "worker", "browser"],
  external: ["node:*"],
  logLevel: "warning",
});
await mkdir("dist/.openai", { recursive: true });
await writeFile(
  "dist/.openai/hosting.json",
  await readFile(".openai/hosting.json"),
);
console.log(
  JSON.stringify({
    worker: "dist/server/index.js",
    assets: Object.keys(assets).length,
    workerBytes: (await readFile("dist/server/index.js")).length,
  }),
);
