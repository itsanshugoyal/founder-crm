import type {
  Fields,
  MutationResult,
  Session,
  WorkspaceData,
} from "../shared/types";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let supabase: SupabaseClient | undefined;
export function configureAuth(session: Session) {
  if (session.supabaseUrl && session.supabaseAnonKey && !supabase)
    supabase = createClient(session.supabaseUrl, session.supabaseAnonKey);
}
export async function productionLogin(email: string, password: string) {
  if (!supabase) throw Error("Production authentication is not configured.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export async function productionSignUp(
  email: string,
  password: string,
  name: string,
) {
  if (!supabase) throw Error("Production authentication is not configured.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: location.href },
  });
  if (error) throw error;
  return Boolean(data.session);
}
export async function productionLogout() {
  if (supabase) await supabase.auth.signOut();
}
export async function downloadInvoice(id: string) {
  const token = supabase
    ? (await supabase.auth.getSession()).data.session?.access_token
    : undefined;
  const response = await fetch(`/api/invoices/${encodeURIComponent(id)}/pdf`, {
    credentials: "same-origin",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Error(body.error || "Could not download this invoice.");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "invoice.pdf";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = supabase
    ? (await supabase.auth.getSession()).data.session?.access_token
    : undefined;
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.error || `Request failed (${response.status}). Please try again.`,
    );
  return body as T;
}
export async function getSession() {
  const initial = await request<Session>("/api/session");
  configureAuth(initial);
  return supabase && !initial.authenticated
    ? request<Session>("/api/session")
    : initial;
}
export const getWorkspace = (projectId?: string) =>
  request<WorkspaceData>(
    `/api/workspace${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`,
  );
export const mutate = (
  csrfToken: string,
  projectId: string,
  action: string,
  payload: Fields,
  recordId?: string,
  version?: number,
) =>
  request<MutationResult>("/api/mutate", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
    body: JSON.stringify({
      action,
      projectId,
      payload,
      recordId,
      version,
      requestId: crypto.randomUUID(),
    }),
  });
export function csvExport(filename: string, rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = String(value);
    return `"${(/^\s*[=+\-@]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
  };
  const blob = new Blob(
    ["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
