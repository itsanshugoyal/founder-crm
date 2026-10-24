import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("credential launcher rejects foreign destinations and missing project scopes", async () => {
  // Import the JavaScript launcher without starting its stdio process.
  const { loadCredentials } = await import("../scripts/mcp-launch.mjs");
  const directory = await mkdtemp(join(tmpdir(), "crm-mcp-config-"));
  const credentials = join(directory, ".local/credentials");
  await mkdir(credentials, { recursive: true });
  const token =
    crypto.randomUUID().replaceAll("-", "") +
    crypto.randomUUID().replaceAll("-", "");
  await writeFile(join(credentials, "crm-token.txt"), token);
  const config: { apiUrl: string; projectId: string } = {
    apiUrl: "https://example.invalid",
    projectId: crypto.randomUUID(),
  };
  const save = () =>
    writeFile(join(credentials, "crm-config.json"), JSON.stringify(config));
  try {
    await save();
    await assert.rejects(loadCredentials(directory), /only be sent/);
    config.apiUrl = "https://founder-crm-rouge.vercel.app";
    config.projectId = "";
    await save();
    await assert.rejects(loadCredentials(directory), /project scope/);
    config.projectId = crypto.randomUUID();
    await save();
    assert.equal(
      (await loadCredentials(directory)).CRM_PROJECT_ID,
      config.projectId,
    );
    await writeFile(join(credentials, "crm-token.txt"), "invalid");
    await assert.rejects(loadCredentials(directory), /valid CRM token/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
