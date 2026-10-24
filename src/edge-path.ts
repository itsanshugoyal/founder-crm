/** Supabase ingress removes /functions/v1 in some runtimes, retaining the function name. */
export function crmEdgePath(path: string) {
  return path.replace(/^\/(?:functions\/v1\/)?founder-crm(?=\/|$)/, "") || "/";
}
