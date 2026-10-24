import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

export const root = fileURLToPath(new URL("../", import.meta.url));
export async function loadCredentials(directory = root) {
  const config = JSON.parse(
    await readFile(
      resolve(directory, ".local/credentials/crm-config.json"),
      "utf8",
    ),
  );
  const token = (
    await readFile(
      resolve(directory, ".local/credentials/crm-token.txt"),
      "utf8",
    )
  ).trim();
  if (!/^[a-f0-9]{64}$/i.test(token))
    throw new Error("Save a valid CRM token in the private credential file.");
  if (config.apiUrl !== "https://founder-crm-rouge.vercel.app")
    throw new Error(
      "CRM credentials may only be sent to the configured production CRM.",
    );
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      config.projectId,
    )
  )
    throw new Error("A project scope is required.");
  return {
    CRM_API_URL: config.apiUrl,
    CRM_PROJECT_ID: config.projectId,
    CRM_MCP_TOKEN: token,
  };
}

async function main() {
  const credentials = await loadCredentials();
  const child = spawn(process.execPath, ["--import", "tsx", "scripts/mcp.ts"], {
    cwd: root,
    env: { ...process.env, ...credentials },
    stdio: "inherit",
    windowsHide: true,
  });
  child.on("error", () => {
    console.error("CRM MCP could not start.");
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => child.kill(signal));
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch(() => {
    console.error(
      "CRM MCP is not configured. Check the private credential files; no credentials were printed.",
    );
    process.exitCode = 1;
  });
}
