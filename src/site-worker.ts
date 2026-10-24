import backend from "./worker";
import assets from "./generated/assets";
import type { Environment } from "./server/app";
import { proxyEdge } from "./edge-proxy";
const mime: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  svg: "image/svg+xml",
  woff2: "font/woff2",
  woff: "font/woff",
  png: "image/png",
  ico: "image/x-icon",
  json: "application/json",
};
export default {
  async fetch(request: Request, env: Environment & { CRM_EDGE_URL?: string }) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/") || path.startsWith("/share/"))
      return env.CRM_EDGE_URL
        ? proxyEdge(request, env.CRM_EDGE_URL)
        : backend.fetch(request, env);
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Method not allowed", { status: 405 });
    const key = Object.hasOwn(assets, path) ? path : "/index.html";
    if (!Object.hasOwn(assets, key))
      return new Response("Build output unavailable", { status: 503 });
    const encoded = assets[key as keyof typeof assets];
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const headers = {
      "Content-Type":
        mime[key.split(".").pop() ?? ""] ?? "application/octet-stream",
      "Cache-Control":
        key === "/index.html"
          ? "no-store"
          : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'",
    };
    return new Response(request.method === "HEAD" ? null : bytes, { headers });
  },
};
