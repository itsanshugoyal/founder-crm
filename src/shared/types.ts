export const KINDS = [
  "contact",
  "company",
  "opportunity",
  "task",
  "campaign",
  "content",
  "meeting",
  "onboarding",
  "invoice",
  "expense",
  "payment",
  "knowledge",
  "automation",
  "draft",
  "conversation",
  "message",
  "promise",
  "experiment",
  "proposal",
] as const;
export type RecordKind = (typeof KINDS)[number];
export type Json =
  null | boolean | number | string | Json[] | { [key: string]: Json };
export type Fields = { [key: string]: Json };
export interface CrmRecord {
  id: string;
  projectId: string;
  kind: RecordKind;
  title: string;
  status: string;
  ownerId: string | null;
  contactId: string | null;
  dueAt: string | null;
  data: Fields;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  settings: Fields;
  createdAt: string;
  version?: number;
}
export interface Member {
  id: string;
  name: string;
  email?: string;
  role: "owner" | "admin" | "member" | "viewer";
  projectIds: string[];
}
export interface Activity {
  id: string;
  projectId: string;
  recordId: string | null;
  actor: string;
  action: string;
  at: string;
  detail: string;
}
export interface Integration {
  id: string;
  provider: string;
  label: string;
  status: "connected" | "not_connected" | "restricted" | "error";
  capabilities: string[];
  reason?: string;
  accountId?: string;
  projectId?: string;
  setupRequired?: boolean;
  mode?: "native" | "codex";
  lastVerifiedAt?: string;
}
export interface Readiness {
  database: boolean;
  auth: boolean;
  composio: boolean;
  mode: "local" | "production";
  sourceOfTruth: string;
  pending: string[];
}
export interface Session {
  /** Optional authenticated bootstrap. Never populated for anonymous requests. */
  workspace?: WorkspaceData;
  authenticated: boolean;
  canCreateOwner: boolean;
  actor?: Member;
  csrfToken?: string;
  readiness: Readiness;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  setupRequired?: boolean;
}
export interface WorkspaceData {
  selectedProjectId?: string;
  projects: Project[];
  members: Member[];
  records: CrmRecord[];
  activities: Activity[];
  integrations: Integration[];
  readiness: Readiness;
  actor: Member;
  revision?: string;
}
export interface Mutation {
  action: string;
  projectId: string;
  recordId?: string;
  version?: number;
  requestId: string;
  payload: Fields;
}
export interface MutationResult {
  record?: CrmRecord;
  project?: Project;
  message?: string;
  receiptId?: string;
  token?: string;
  url?: string;
  duplicate?: boolean;
  [key: string]: unknown;
}
export const OPPORTUNITY_STAGES = [
  "Conversation",
  "Call booked",
  "Discovery done",
  "Proposal",
  "Pilot active",
  "Paying",
  "Lost",
];
export const OWNERS = ["Anshu", "Nahush", "Both", "Unassigned"];
export const EXPERIMENT_HANDLES = [
  "mrsumitreview",
  "mommylilworld",
  "fs_praveen_mekala",
  "captain_amaira",
  "geekyranjitofficial",
];
