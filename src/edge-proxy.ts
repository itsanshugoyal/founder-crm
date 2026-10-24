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
    new Request(request, { headers, redirect: "manual" }),
  );
  try {
    return await fetcher(forwarded);
  } catch {
    return Response.json(
      { error: "The CRM backend is temporarily unavailable." },
      { status: 503 },
    );
  }
}
