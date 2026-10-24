/** Keep hosting/session cookies and host identity headers out of the provider request. */
export async function proxyEdge(
  request: Request,
  edgeUrl: string,
  fetcher: typeof fetch = fetch,
) {
  const base = new URL(edgeUrl);
  if (
    base.protocol !== "https:" ||
    !base.hostname.endsWith(".supabase.co") ||
    base.pathname !== "/functions/v1/founder-crm" ||
    base.search ||
    base.hash
  )
    return Response.json(
      { error: "Backend connection is not configured correctly." },
      { status: 503 },
    );
  const source = new URL(request.url),
    target = new URL(base);
  target.pathname += source.pathname;
  target.search = source.search;
  const headers = new Headers();
  for (const name of [
    "Authorization",
    "Content-Type",
    "Accept",
    "X-CSRF-Token",
    "Origin",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const forwarded = new Request(
    target,
    new Request(request, {
      headers,
      redirect: "manual",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(25000)]),
    }),
  );
  try {
    const upstream = await fetcher(forwarded);
    // Consume the native fetch stream before the serverless invocation finishes.
    // Its transport encoding/length and provider cookies do not describe this response.
    const body = await upstream.arrayBuffer();
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const name of [
      "Content-Type",
      "Content-Disposition",
      "Referrer-Policy",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Retry-After",
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(
      [204, 205, 304].includes(upstream.status) || request.method === "HEAD"
        ? null
        : new Uint8Array(body),
      { status: upstream.status, headers: responseHeaders },
    );
  } catch {
    return Response.json(
      { error: "The CRM backend is temporarily unavailable." },
      { status: 503 },
    );
  }
}
