import { getRequestListener } from "@hono/node-server";
import { proxyEdge } from "../src/edge-proxy.js";
// The official Supabase integration supplies the modern key names.
const env = {
  ...process.env,
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
};
const application = process.env.CRM_EDGE_URL
  ? undefined
  : import("../src/server/app.js").then(({ createApplication }) =>
      createApplication({ env, mode: "production" }),
    );
export default getRequestListener(async (request) =>
  process.env.CRM_EDGE_URL
    ? proxyEdge(request, process.env.CRM_EDGE_URL)
    : (await application!).app.fetch(request),
);
