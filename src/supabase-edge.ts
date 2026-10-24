import { createApplication, type Environment } from "./server/app";
import { crmEdgePath } from "./edge-path";

declare const Deno: {
  env: { toObject(): Record<string, string> };
  serve(handler: (request: Request) => Promise<Response>): void;
};

function namedKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const keys = JSON.parse(raw);
    return typeof keys.default === "string" ? keys.default : undefined;
  } catch {
    return undefined;
  }
}
const runtime = Deno.env.toObject();
const env: Environment = {
  ...runtime,
  SUPABASE_ANON_KEY:
    namedKey(runtime.SUPABASE_PUBLISHABLE_KEYS) ?? runtime.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY:
    namedKey(runtime.SUPABASE_SECRET_KEYS) ?? runtime.SUPABASE_SERVICE_ROLE_KEY,
  APP_ORIGIN: runtime.APP_ORIGIN,
};
const { app } = await createApplication({ env, mode: "production" });
Deno.serve(async (request) => {
  const url = new URL(request.url);
  url.pathname = crmEdgePath(url.pathname);
  return app.fetch(new Request(url, request));
});
