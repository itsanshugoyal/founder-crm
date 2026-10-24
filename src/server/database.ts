import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Activity, CrmRecord, Member, Project } from "../shared/types";

export interface PrivateState {
  /** Server-managed allowlist for the first verified production owner only. */
  bootstrapOwnerEmail?: string;
  credentials: Record<string, { salt: string; hash: string }>;
  sessions: Record<string, { memberId: string; csrf: string; expires: number }>;
  invites: Record<string, { memberId: string; expires: number }>;
  tokens: Record<
    string,
    { memberId: string; projectId: string; expires: number; label: string }
  >;
  shares: Record<
    string,
    {
      recordId: string;
      expires: number;
      snapshot?: {
        title: string;
        kind: string;
        status: string;
        data: Record<string, unknown>;
      };
    }
  >;
  requests: Record<
    string,
    { result: unknown; at: number; fingerprint?: string }
  >;
  connections?: Record<
    string,
    {
      memberId: string;
      projectId: string;
      provider: string;
      accountId: string;
      userId: string;
      status: string;
    }
  >;
  secret: string;
}
export interface State {
  revision: number;
  projects: Project[];
  members: Member[];
  records: CrmRecord[];
  activities: Activity[];
  private: PrivateState;
}
export interface Database {
  snapshot(): Promise<State>;
  commit(expected: number, state: State): Promise<boolean>;
  close?(): Promise<void>;
}
export function normalizeState(raw: Partial<State>): State {
  return {
    revision: Number(raw.revision ?? 0),
    projects: raw.projects ?? [],
    members: raw.members ?? [],
    records: raw.records ?? [],
    activities: raw.activities ?? [],
    private: {
      credentials: {},
      sessions: {},
      invites: {},
      tokens: {},
      shares: {},
      requests: {},
      secret: "",
      ...raw.private,
    },
  };
}
export class SupabaseDatabase implements Database {
  readonly client: SupabaseClient;
  constructor(url: string, serviceKey: string) {
    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  async snapshot(): Promise<State> {
    const { data, error } = await this.client.rpc("crm_snapshot");
    if (error)
      throw new Error("Database is unavailable or migration is missing.");
    return normalizeState(data);
  }
  async commit(expected: number, state: State): Promise<boolean> {
    const { data, error } = await this.client.rpc("crm_commit", {
      expected_revision: expected,
      next_state: state,
    });
    if (error) throw new Error("Database transaction failed.");
    return data === true;
  }
}
export async function transact<T>(
  db: Database,
  fn: (state: State) => Promise<T> | T,
): Promise<T> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const state = await db.snapshot();
    const result = await fn(state);
    if (await db.commit(state.revision, state)) return result;
  }
  throw new Error(
    "Concurrent changes prevented this operation. Please refresh and try again.",
  );
}
