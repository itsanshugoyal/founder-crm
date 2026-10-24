import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { root } from "./mcp-launch.mjs";
import { resolve } from "node:path";

const client = new Client({ name: "founder-crm-live-check", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve(root, "scripts/mcp-launch.mjs")],
  stderr: "pipe",
});
function data(result) {
  if (result.isError)
    throw new Error(
      "CRM operation rejected. Check account scope and token validity privately.",
    );
  return JSON.parse(result.content.find((item) => item.type === "text").text);
}
try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  if (tools.some((tool) => /send|approve|invite|payment/.test(tool.name)))
    throw new Error("Unexpected consequential tool; stop.");
  let workspace = data(
    await client.callTool({ name: "records_list", arguments: {} }),
  );
  const project = workspace.projects?.[0];
  if (!project || workspace.projects.length !== 1)
    throw new Error("Unexpected project scope.");
  let receiptId;
  if (process.argv.includes("--record-receipt")) {
    const runKey = `mcp-connection-check:${project.id}`;
    const existing = workspace.records.find(
      (record) => record.data?.runKey === runKey,
    );
    if (!existing) {
      data(
        await client.callTool({
          name: "evidence_create",
          arguments: {
            title: "Codex connection verified",
            status: "Verified",
            data: {
              runKey,
              checkedAt: new Date().toISOString(),
              body: "Real production MCP read/write/readback verification. Project scoped; no send, approval, invitation or payment tools exposed. No outreach sent. This is a connection check, not a completed daily lead-processing run.",
            },
          },
        }),
      );
    }
    workspace = data(
      await client.callTool({ name: "records_list", arguments: {} }),
    );
    receiptId = workspace.records.find(
      (record) => record.data?.runKey === runKey,
    )?.id;
    if (!receiptId)
      throw new Error(
        "Receipt readback failed; do not retry a mutation blindly.",
      );
  }
  console.log(
    JSON.stringify({
      ok: true,
      scope: project.id,
      tools: tools.map((tool) => tool.name),
      recordCount: workspace.records.length,
      receiptId,
    }),
  );
} catch {
  console.error(
    "CRM MCP verification failed. No credentials were printed. Check the private credential file, network, expiry and configured project.",
  );
  process.exitCode = 1;
} finally {
  await client.close();
}
