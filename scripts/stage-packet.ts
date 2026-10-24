import { loadCredentials } from "./mcp-launch.mjs";
import { draftingPacket } from "../src/shared/automation";
const credentials = await loadCredentials();
const result = await fetch(
  credentials.CRM_API_URL +
    "/api/workspace?projectId=" +
    encodeURIComponent(credentials.CRM_PROJECT_ID),
  {
    headers: { Authorization: "Bearer " + credentials.CRM_MCP_TOKEN },
    signal: AbortSignal.timeout(30000),
    redirect: "error",
  },
);
if (!result.ok)
  throw new Error("CRM read failed; do not run the drafting stage.");
const workspace = await result.json();
console.log(
  JSON.stringify(
    draftingPacket(workspace.records, credentials.CRM_PROJECT_ID),
    null,
    2,
  ),
);
