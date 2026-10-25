import type {
  Fields,
  MutationResult,
  Session,
  WorkspaceData,
} from "../shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { verificationRedirectUrl } from "../shared/auth-redirect";
let supabase: SupabaseClient | undefined;
let authSetup: Promise<void> | undefined;
export async function configureAuth(session: Session) {
  if (!session.supabaseUrl || !session.supabaseAnonKey || supabase) return;
  const url = session.supabaseUrl,
    publicKey = session.supabaseAnonKey;
  if (authSetup) return authSetup;
  authSetup = (async () => {
    const { createClient } = await import("@supabase/supabase-js");
    supabase = createClient(url, publicKey);
  })();
  try {
    await authSetup;
  } finally {
    authSetup = undefined;
  }
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
    options: {
      data: { name },
      emailRedirectTo: verificationRedirectUrl(location.href),
    },
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
    signal: options?.signal ?? AbortSignal.timeout(30000),
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new RequestError(
      response.status,
      body.error || `Request failed (${response.status}). Please try again.`,
    );
  return body as T;
}
export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const pendingSessions = new Map<string, Promise<Session>>();
export function getSession(
  options: { includeWorkspace?: boolean; projectId?: string } = {},
) {
  const params = new URLSearchParams();
  if (options.includeWorkspace) params.set("includeWorkspace", "1");
  if (options.projectId) params.set("projectId", options.projectId);
  const path = "/api/session" + (params.size ? "?" + params : "");
  const pending = pendingSessions.get(path);
  if (pending) return pending;
  const result = (async () => {
    const initial = await request<Session>(path);
    await configureAuth(initial);
    // A signed-out visitor needs no second database/Auth round trip.
    const token =
      supabase && !initial.authenticated
        ? (await supabase.auth.getSession()).data.session?.access_token
        : undefined;
    return token ? request<Session>(path) : initial;
  })();
  pendingSessions.set(path, result);
  void result
    .finally(() => {
      if (pendingSessions.get(path) === result) pendingSessions.delete(path);
    })
    .catch(() => {});
  return result;
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
