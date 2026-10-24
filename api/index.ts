import { getRequestListener } from "@hono/node-server";
import { createApplication } from "../src/server/app";
const application = createApplication({ env: process.env, mode: "production" });
export default getRequestListener(async (request) =>
  (await application).app.fetch(request),
);
