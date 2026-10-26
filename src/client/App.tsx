import { Dialog } from "@base-ui/react/dialog";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  lazy,
  Suspense,
  type ReactNode,
  type FormEvent,
} from "react";

import { HouseIcon as House } from "@phosphor-icons/react/dist/csr/House";
import { UsersIcon as Users } from "@phosphor-icons/react/dist/csr/Users";
import { KanbanIcon as Kanban } from "@phosphor-icons/react/dist/csr/Kanban";
import { TrayIcon as Tray } from "@phosphor-icons/react/dist/csr/Tray";
import { CheckSquareIcon as CheckSquare } from "@phosphor-icons/react/dist/csr/CheckSquare";
import { ChartBarIcon as ChartBar } from "@phosphor-icons/react/dist/csr/ChartBar";
import { WalletIcon as Wallet } from "@phosphor-icons/react/dist/csr/Wallet";
import { BookOpenIcon as BookOpen } from "@phosphor-icons/react/dist/csr/BookOpen";
import { LightningIcon as Lightning } from "@phosphor-icons/react/dist/csr/Lightning";
import { GearSixIcon as GearSix } from "@phosphor-icons/react/dist/csr/GearSix";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { MagnifyingGlassIcon as MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { CaretDownIcon as CaretDown } from "@phosphor-icons/react/dist/csr/CaretDown";
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { SignOutIcon as SignOut } from "@phosphor-icons/react/dist/csr/SignOut";
import { XIcon as X } from "@phosphor-icons/react/dist/csr/X";
import { BuildingsIcon as Buildings } from "@phosphor-icons/react/dist/csr/Buildings";
import { ListIcon as List } from "@phosphor-icons/react/dist/csr/List";
import { ArrowClockwiseIcon as ArrowClockwise } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { CheckCircleIcon as CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { WarningCircleIcon as WarningCircle } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { CommandIcon as Command } from "@phosphor-icons/react/dist/csr/Command";

import type {
  CrmRecord,
  Fields,
  MutationResult,
  RecordKind,
  Session,
  InvitationInfo,
  WorkspaceData,
} from "../shared/types";

import {
  getSession,
  getWorkspace,
  mutate,
  request,
  productionLogin,
  productionLogout,
  productionSignUp,
  productionIdentity,
  productionResendVerification,
  isPasswordRecoveryRedirect,
  productionRequestPasswordReset,
  productionUpdatePassword,
  joinProductionInvitation,
  RequestError,
} from "./api";

import { active, initials, modules } from "./models";
import { verificationCallbackError } from "../shared/auth-redirect";
import { authGuidance } from "../shared/auth-guidance";

// Capture safe guidance before the Auth client consumes and clears callback fragments.
const initialVerificationError = verificationCallbackError(location.hash);
const initialPasswordRecovery = isPasswordRecoveryRedirect();

import { Button, Modal, Confirm, ErrorBox, RecordForm, cn } from "./ui";
import { ViewBoundary } from "./ViewBoundary";

const TodayView = lazy(() =>
  import("./views").then((m) => ({ default: m.TodayView })),
);
const PeopleView = lazy(() =>
  import("./views").then((m) => ({ default: m.PeopleView })),
);
const PipelineView = lazy(() =>
  import("./views").then((m) => ({ default: m.PipelineView })),
);
const InboxView = lazy(() =>
  import("./views").then((m) => ({ default: m.InboxView })),
);
const ReportsView = lazy(() =>
  import("./views").then((m) => ({ default: m.ReportsView })),
);
const SettingsView = lazy(() =>
  import("./views").then((m) => ({ default: m.SettingsView })),
);
const KnowledgeView = lazy(() =>
  import("./views").then((m) => ({ default: m.KnowledgeView })),
);
const AutomationView = lazy(() =>
  import("./views").then((m) => ({ default: m.AutomationView })),
);
const MoneyView = lazy(() =>
  import("./views").then((m) => ({ default: m.MoneyView })),
);
const WorkView = lazy(() =>
  import("./views").then((m) => ({ default: m.WorkView })),
);
const RecordDetail = lazy(() =>
  import("./views").then((m) => ({ default: m.RecordDetail })),
);

export type Page =
  | "today"
  | "people"
  | "pipeline"
  | "inbox"
  | "work"
  | "reports"
  | "money"
  | "knowledge"
  | "automation"
  | "settings";

type CRMContext = {
  workspace: WorkspaceData;
  projectId: string;
  setPage: (page: Page) => void;
  openCreate: (kind: RecordKind, contactId?: string) => void;
  openRecord: (r: CrmRecord) => void;
  editRecord: (r: CrmRecord) => void;
  act: (
    action: string,
    payload: Fields,
    record?: CrmRecord,
  ) => Promise<MutationResult>;
  refresh: () => Promise<void>;
  toast: (s: string) => void;
  csrf: string;
};

const Context = createContext<CRMContext | null>(null);

export function useCRM() {
  const value = useContext(Context);
  if (!value) throw Error("CRM is unavailable");
  return value;
}

const navigation = [
  { page: "today", label: "Today", icon: House },
  { page: "people", label: "People", icon: Users },
  { page: "pipeline", label: "Pipeline", icon: Kanban },
  { page: "inbox", label: "Inbox", icon: Tray },
  { page: "work", label: "Work", icon: CheckSquare },
  { page: "reports", label: "Reports", icon: ChartBar },
  { page: "money", label: "Money", icon: Wallet },
  { page: "knowledge", label: "Knowledge", icon: BookOpen },
  { page: "automation", label: "Automation", icon: Lightning },
  { page: "settings", label: "Settings", icon: GearSix },
] as const;

function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg width="31" height="31" viewBox="0 0 31 31" fill="none">
          <path d="M3 2H28V29H3V2Z" fill="currentColor" />
          <path
            d="M9 8H23V12H13V16H20V20H13V26H9V8Z"
            fill="var(--brand-glyph, #202522)"
          />
          <path d="M23 22H27V26H23V22Z" fill="var(--accent)" />
        </svg>
      </span>
      <span className="brand-wordmark">
        Founder<span className="brand-product">CRM</span>
      </span>
    </span>
  );
}

function Loading({ onRetry }: { onRetry?: () => void }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 7000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      className="loading-shell"
      aria-label="Loading workspace"
      aria-busy="true"
    >
      <div className="skeleton skeleton-sidebar" />
      <div className="skeleton-page">
        <div role="status" className="load-message">
          <Brand />
          <p>
            {slow
              ? "The workspace is taking longer to respond."
              : "Opening your private workspace…"}
          </p>
          {slow && (
            <p>
              Your connection or the hosted service may be slow. Your data has
              not changed.
            </p>
          )}
          {slow && onRetry && (
            <Button onClick={onRetry}>Try loading again</Button>
          )}
        </div>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-subtitle" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton skeleton-row" />
        ))}
      </div>
    </div>
  );
}

function Auth({
  session,
  onReady,
}: {
  session: Session;
  onReady: () => Promise<void>;
}) {
  const invite = new URLSearchParams(location.search).get("invite");
  const [isSetup] = useState(
    Boolean(session.setupRequired && session.readiness.mode === "local"),
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialVerificationError);
  const [inviteCreate, setInviteCreate] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<InvitationInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(Boolean(invite));
  const [inviteLookupError, setInviteLookupError] = useState("");
  const [signedInIdentity, setSignedInIdentity] =
    useState<Awaited<ReturnType<typeof productionIdentity>>>(null);
  const [ownerCreate, setOwnerCreate] = useState(false);
  const [verification, setVerification] = useState("");
  const canCreateOwner = Boolean(
    (session as Session & { canCreateOwner?: boolean }).canCreateOwner &&
    session.readiness.mode === "production" &&
    !invite,
  );
  const creatingPassword =
    isSetup ||
    ownerCreate ||
    (invite && (session.readiness.mode === "local" || inviteCreate));
  const blocked =
    session.setupRequired && session.readiness.mode === "production";
  const acceptWithSession = Boolean(
    signedInIdentity?.verified &&
    signedInIdentity.email.toLowerCase() === inviteInfo?.email.toLowerCase(),
  );
  const wrongAccount = Boolean(
    signedInIdentity &&
    signedInIdentity.email.toLowerCase() !== inviteInfo?.email.toLowerCase(),
  );

  useEffect(() => {
    if (!invite) return;
    let cancelled = false;
    void (async () => {
      try {
        const [info, identity] = await Promise.all([
          request<InvitationInfo>("/api/auth/invitation", {
            method: "POST",
            body: JSON.stringify({ token: invite }),
          }),
          session.readiness.mode === "production"
            ? productionIdentity()
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setInviteInfo(info);
        setName(info.name);
        setEmail(info.email);
        setSignedInIdentity(identity);
        if (identity?.verified) setInviteCreate(false);
      } catch (failure) {
        if (!cancelled) setInviteLookupError(authGuidance(failure, true));
      } finally {
        if (!cancelled) setInviteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invite, session.readiness.mode]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (invite) {
        if (!inviteInfo || inviteLookupError)
          throw Error("Open a valid invitation link before continuing.");
        if (session.readiness.mode === "production") {
          const result = await joinProductionInvitation({
            token: invite,
            email,
            name,
            password,
            createAccount: inviteCreate,
          });
          if (result === "verification_required") {
            setVerification(
              "Account registration submitted. Open the confirmation email, then return to this invitation link to accept access. If you registered before, choose Sign in to accept and use your existing password.",
            );
            setPassword("");
            setInviteCreate(false);
            return;
          }
        } else
          await request("/api/auth/accept-invite", {
            method: "POST",
            body: JSON.stringify({ token: invite, name, password }),
          });
        history.replaceState(null, "", location.pathname);
      } else if (session.readiness.mode === "production") {
        if (ownerCreate && canCreateOwner) {
          const ready = await productionSignUp(email, password, name);
          if (!ready) {
            setVerification(
              "Check your email to verify your owner account, then return here and sign in with the same email address.",
            );
            setOwnerCreate(false);
            setPassword("");
            return;
          }
        } else await productionLogin(email, password);
      } else
        await request(`/api/auth/${isSetup ? "setup" : "login"}`, {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
      await onReady();
    } catch (e) {
      setError(authGuidance(e, Boolean(invite)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <header className="auth-brand">
        <Brand />
        <div className="auth-intro">
          <span className="eyebrow">PROJECT OPERATIONS</span>
          <h1>
            Manage the business,
            <br />
            project by project.
          </h1>
          <p>
            One workspace for relationships, conversations, delivery, and
            financial records.
          </p>
          <ol className="auth-index">
            <li>
              <span>01</span>People & pipeline
            </li>
            <li>
              <span>02</span>Conversations & work
            </li>
            <li>
              <span>03</span>Money & project knowledge
            </li>
          </ol>
        </div>
      </header>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">SECURE ACCESS</span>
          <h2>
            {blocked
              ? "Connect your workspace"
              : invite
                ? acceptWithSession
                  ? "Accept your invitation"
                  : inviteCreate
                    ? "Create your account"
                    : "Sign in to accept"
                : ownerCreate
                  ? "Create your owner account"
                  : isSetup
                    ? "Set up your local workspace"
                    : "Sign in to Founder CRM"}
          </h2>
          <p>
            {blocked
              ? "The production database and authentication need to be connected before you can sign in."
              : invite
                ? acceptWithSession
                  ? "Your verified account is ready to join this project."
                  : inviteCreate
                    ? "New here? Create your own login to join this project."
                    : "Use your existing account password to accept this invitation."
                : ownerCreate
                  ? "Use the email address authorized to own this workspace. Verify it before signing in."
                  : isSetup
                    ? "Create the first owner account. Project data is stored on this computer."
                    : "Access the projects and records assigned to your account."}
          </p>
          {invite && (
            <div className="form-note" role="status">
              {inviteLoading
                ? "Checking your invitation…"
                : inviteInfo
                  ? `Invitation for ${inviteInfo.name} · ${inviteInfo.role === "owner" ? "Owner" : inviteInfo.role} · ${inviteInfo.projects.join(", ")}. First create your login, verify your email, then accept this invitation. The invitation does not create a password.`
                  : "Invitation could not be checked."}
            </div>
          )}
          {blocked ? (
            <>
              <div className="setup-list">
                {session.readiness.pending.map((item) => (
                  <div key={item}>
                    <WarningCircle size={20} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="form-note">
                The application is installed. An administrator can connect the
                required environment settings and redeploy to enable access.
              </p>
              <Button onClick={() => location.reload()}>
                <ArrowClockwise size={17} />
                Check connection again
              </Button>
            </>
          ) : (
            <form onSubmit={submit}>
              <ErrorBox error={error} />
              <ErrorBox error={inviteLookupError} />
              {wrongAccount && (
                <div className="inline-notice" role="alert">
                  A different account is signed in. Sign out here before
                  accepting this invitation.
                </div>
              )}
              {acceptWithSession && (
                <div className="inline-notice" role="status">
                  Your email is verified. Accept the invitation below to join
                  this project.
                </div>
              )}
              {signedInIdentity && invite && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await productionLogout();
                      setSignedInIdentity(null);
                      setPassword("");
                      setError("");
                    } catch (failure) {
                      setError(authGuidance(failure, true));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Use a different account
                </Button>
              )}
              {verification && (
                <div className="inline-notice" role="status">
                  <CheckCircle size={18} />
                  {verification}
                </div>
              )}
              {invite &&
                session.readiness.mode === "production" &&
                !acceptWithSession && (
                  <div className="segmented invite-auth-choice">
                    <button
                      type="button"
                      className={inviteCreate ? "selected" : ""}
                      aria-pressed={inviteCreate}
                      onClick={() => {
                        setInviteCreate(true);
                        setError("");
                        setPassword("");
                      }}
                    >
                      Create an account
                    </button>
                    <button
                      type="button"
                      className={!inviteCreate ? "selected" : ""}
                      aria-pressed={!inviteCreate}
                      onClick={() => {
                        setInviteCreate(false);
                        setError("");
                        setPassword("");
                      }}
                    >
                      Sign in to accept
                    </button>
                  </div>
                )}
              {canCreateOwner && (
                <div className="segmented invite-auth-choice">
                  <button
                    type="button"
                    className={!ownerCreate ? "selected" : ""}
                    aria-pressed={!ownerCreate}
                    onClick={() => setOwnerCreate(false)}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    className={ownerCreate ? "selected" : ""}
                    aria-pressed={ownerCreate}
                    onClick={() => setOwnerCreate(true)}
                  >
                    Create owner account
                  </button>
                </div>
              )}
              {(isSetup ||
                (invite && inviteCreate && !acceptWithSession) ||
                ownerCreate) && (
                <div className="field">
                  <label htmlFor="auth-name">Your name</label>
                  <input
                    id="auth-name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              {(!invite || session.readiness.mode === "production") && (
                <div className="field">
                  <label htmlFor="auth-email">Email address</label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    readOnly={Boolean(inviteInfo)}
                    spellCheck={false}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}
              {!acceptWithSession && (
                <div className="field">
                  <label htmlFor="auth-password">Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={
                      creatingPassword ? "new-password" : "current-password"
                    }
                    minLength={creatingPassword ? 14 : undefined}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {creatingPassword && (
                    <small>
                      Use at least 14 characters. A memorable passphrase works
                      well.
                    </small>
                  )}
                </div>
              )}
              <Button
                tone="primary"
                disabled={
                  busy ||
                  inviteLoading ||
                  Boolean(inviteLookupError) ||
                  wrongAccount
                }
                className="auth-submit"
              >
                {busy
                  ? "Opening your workspace…"
                  : invite
                    ? inviteCreate && !acceptWithSession
                      ? "Create account & verify email"
                      : "Accept invitation"
                    : ownerCreate
                      ? "Create owner account"
                      : isSetup
                        ? "Create workspace"
                        : "Sign in"}
                <ArrowRight size={18} />
              </Button>
              {!invite &&
                !ownerCreate &&
                !isSetup &&
                session.readiness.mode === "production" && (
                  <button
                    type="button"
                    className="auth-recovery-link"
                    disabled={busy || !email.trim()}
                    onClick={async () => {
                      setBusy(true);
                      setError("");
                      try {
                        await productionRequestPasswordReset(email);
                        setVerification(
                          "If this email has a Founder CRM account, a password reset link has been requested. Check the inbox and spam folder.",
                        );
                      } catch (failure) {
                        setError(authGuidance(failure, false));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Forgot your password?
                  </button>
                )}
              {invite &&
                inviteInfo &&
                session.readiness.mode === "production" &&
                !acceptWithSession && (
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError("");
                      try {
                        await productionResendVerification(email);
                        setVerification(
                          "If this account needs verification, a confirmation email has been requested. Check your inbox and spam folder, then return to this invitation link.",
                        );
                      } catch (failure) {
                        setError(authGuidance(failure, true));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Resend confirmation email
                  </Button>
                )}
            </form>
          )}
          <div className="auth-trust">
            <CheckCircle size={16} />{" "}
            {session.readiness.mode === "local"
              ? "Local workspace · Saved on this computer"
              : "Protected workspace · Individual accounts"}
          </div>
        </div>
      </section>
    </main>
  );
}

function PasswordRecovery({ onReady }: { onReady: () => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 14)
      return setError("Use at least 14 characters for your new password.");
    if (password !== confirm)
      return setError("The two passwords do not match.");
    setBusy(true);
    try {
      await productionUpdatePassword(password);
      history.replaceState(null, "", location.pathname + location.search);
      await onReady();
    } catch (failure) {
      setError(
        `${authGuidance(failure, false)} Request another reset link if this one has expired.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <header className="auth-brand">
        <Brand />
        <div className="auth-intro">
          <span className="eyebrow">SECURE ACCESS</span>
          <h1>Choose a new password.</h1>
          <p>
            This link only opens a password reset. It does not change project
            access.
          </p>
        </div>
      </header>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <span className="eyebrow">PASSWORD RESET</span>
          <h2>Set a new password</h2>
          <p>Use a memorable passphrase of at least 14 characters.</p>
          <ErrorBox error={error} />
          <div className="field">
            <label htmlFor="recovery-password">New password</label>
            <input
              id="recovery-password"
              autoFocus
              type="password"
              autoComplete="new-password"
              minLength={14}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="recovery-confirm">Confirm new password</label>
            <input
              id="recovery-confirm"
              type="password"
              autoComplete="new-password"
              minLength={14}
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
          <Button tone="primary" className="auth-submit" disabled={busy}>
            {busy ? "Saving your password…" : "Save new password"}
            <ArrowRight size={18} />
          </Button>
        </form>
      </section>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [recoveryPending, setRecoveryPending] = useState(
    initialPasswordRecovery,
  );
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [projectId, setProjectId] = useState(
    () => localStorage.getItem("founder-project") || "",
  );
  const [page, setPageState] = useState<Page>(() => {
    const requested = new URLSearchParams(location.search).get("view");
    return navigation.some((item) => item.page === requested)
      ? (requested as Page)
      : "today";
  });
  const projectRef = useRef(projectId);
  const loadSequence = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createKind, setCreateKind] = useState<RecordKind | null>(null);
  const [editing, setEditing] = useState<CrmRecord | null>(null);
  const [selected, setSelected] = useState<CrmRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [newProject, setNewProject] = useState(false);
  const [initialContact, setInitialContact] = useState("");
  const [formDirty, setFormDirty] = useState(false);
  const [discard, setDiscard] = useState(false);

  const toast = useCallback((message: string) => {
    setNotice(message);
  }, []);

  useEffect(() => {
    if (!formDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [formDirty]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const load = useCallback(async (selectedProject = projectRef.current) => {
    const sequence = ++loadSequence.current;
    try {
      setError("");
      let s: Session;
      try {
        s = await getSession({
          includeWorkspace: true,
          projectId: selectedProject || undefined,
        });
      } catch (e) {
        if (
          !(e instanceof RequestError) ||
          e.status !== 403 ||
          !selectedProject
        )
          throw e;
        s = await getSession({ includeWorkspace: true });
      }
      if (sequence !== loadSequence.current) return;
      setSession(s);
      if (s.authenticated) {
        const w =
          s.workspace ?? (await getWorkspace(selectedProject || undefined));
        if (sequence !== loadSequence.current) return;
        setWorkspace(w);
        // The actor's selected membership, not a stale local hint, determines the active project.
        const id =
          w.selectedProjectId ||
          (w.projects.some((p) => p.id === selectedProject)
            ? selectedProject
            : w.projects[0]?.id) ||
          "";
        projectRef.current = id;
        setProjectId(id);
        localStorage.setItem("founder-project", id);
      } else setWorkspace(null);
    } catch (e) {
      if (sequence === loadSequence.current)
        setError(
          (e as Error).name === "TimeoutError"
            ? "The workspace took too long to respond. Check your connection and try again."
            : (e as Error).message,
        );
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    const selectedProject = projectRef.current;
    const w = await getWorkspace(selectedProject || undefined);
    if (selectedProject !== projectRef.current) return;
    setWorkspace(w);
    setSelected((current) =>
      current ? w.records.find((r) => r.id === current.id) || null : null,
    );
  }

  async function act(action: string, payload: Fields, record?: CrmRecord) {
    const result = await mutate(
      session?.csrfToken || "",
      projectId,
      action,
      payload,
      record?.id,
      record?.version,
    );
    if (action === "list_mcp_tokens") return result;
    await refresh();
    toast(result.message || "Saved to your workspace");
    return result;
  }

  function setPage(next: Page) {
    setPageState(next);
    const url = new URL(location.href);
    url.searchParams.set("view", next);
    history.pushState(null, "", url.pathname + url.search);
    window.scrollTo({ top: 0 });
    setMobile(false);
    setSearchOpen(false);
  }

  function pageHref(next: Page) {
    const url = new URL(location.href);
    url.searchParams.set("view", next);
    return url.pathname + url.search;
  }

  function changeProject(id: string) {
    if (id === projectRef.current) return;
    projectRef.current = id;
    setProjectId(id);
    localStorage.setItem("founder-project", id);
    setSelected(null);
    setMobile(false);
    setWorkspace(null);
    setLoading(true);
    void load(id);
  }

  useEffect(() => {
    const back = () => {
      const requested = new URLSearchParams(location.search).get("view");
      setPageState(
        navigation.some((item) => item.page === requested)
          ? (requested as Page)
          : "today",
      );
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  if (loading) return <Loading onRetry={() => void load()} />;

  if (!session)
    return (
      <div className="fatal">
        <Brand />
        <h1>We couldn’t open your workspace</h1>
        <ErrorBox error={error} />
        <Button
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          Try again
        </Button>
      </div>
    );

  if (recoveryPending || isPasswordRecoveryRedirect())
    return (
      <PasswordRecovery
        onReady={async () => {
          setRecoveryPending(false);
          await load();
        }}
      />
    );

  if (!session.authenticated) return <Auth session={session} onReady={load} />;

  if (!workspace)
    return (
      <div className="fatal">
        <Brand />
        <ErrorBox error={error || "Workspace data is unavailable."} />
        <Button onClick={() => void load()}>Try again</Button>
      </div>
    );

  const records = workspace.records.filter(active);
  const project = workspace.projects.find((p) => p.id === projectId);
  const unread = records.filter(
    (r) =>
      r.kind === "conversation" &&
      r.status.toLowerCase().replaceAll("_", " ") === "needs action",
  ).length;
  const tasks = records.filter(
    (r) =>
      r.kind === "task" &&
      !["done", "archived"].includes(r.status.toLowerCase()),
  ).length;

  const context: CRMContext = {
    workspace,
    projectId,
    setPage,
    openCreate: (kind, id) => {
      setInitialContact(id || "");
      setFormDirty(false);
      setCreateKind(kind);
    },
    openRecord: setSelected,
    editRecord: (record) => {
      setFormDirty(false);
      setEditing(record);
    },
    act,
    refresh,
    toast,
    csrf: session.csrfToken || "",
  };

  const titles: Record<Page, string> = {
    today: "Today",
    people: "People",
    pipeline: "Pipeline",
    inbox: "Inbox",
    work: "Work",
    reports: "Reports",
    money: "Money",
    knowledge: "Knowledge",
    automation: "Automation",
    settings: "Settings",
  };

  const sidebarContent = (surface: string) => (
    <>
      <a
        className="brand-link"
        href={pageHref("today")}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          setPage("today");
        }}
      >
        <Brand />
      </a>
      <div className="project-picker">
        <span className="project-symbol">
          {initials(project?.name || "Workspace")}
        </span>
        <div>
          <label htmlFor={`project-switcher-${surface}`}>PROJECT</label>
          <select
            id={`project-switcher-${surface}`}
            value={projectId}
            onChange={(e) => changeProject(e.target.value)}
          >
            {workspace.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="icon-btn project-new"
          aria-label="Create project"
          onClick={() => {
            setMobile(false);
            setNewProject(true);
          }}
        >
          <Plus size={15} />
        </button>
      </div>
      <button
        className="sidebar-search"
        onClick={() => {
          setMobile(false);
          setSearchOpen(true);
        }}
      >
        <MagnifyingGlass size={17} />
        <span>Search records</span>
        <kbd>Ctrl K</kbd>
      </button>
      <nav aria-label="Main navigation">
        {navigation.slice(0, 5).map((item, i) => (
          <div key={item.page}>
            {i === 0 && <div className="nav-label">Workspace</div>}

            <a
              href={pageHref(item.page)}
              aria-current={page === item.page ? "page" : undefined}
              className={cn("nav-item", page === item.page && "nav-active")}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                setPage(item.page);
              }}
            >
              <item.icon
                size={19}
                weight={page === item.page ? "fill" : "regular"}
              />
              <span>{item.label}</span>
              {item.page === "inbox" && unread > 0 && (
                <span className="nav-count">{unread}</span>
              )}
              {item.page === "work" && tasks > 0 && (
                <span className="nav-count">{tasks}</span>
              )}
            </a>
          </div>
        ))}
        <details
          className="nav-group"
          key={`${surface}-${navigation.slice(5).some((item) => item.page === page)}`}
          open={
            navigation.slice(5).some((item) => item.page === page) || undefined
          }
        >
          <summary className="nav-group-toggle">
            Operations <CaretDown size={14} aria-hidden="true" />
          </summary>
          <div className="nav-group-links">
            {navigation.slice(5).map((item) => (
              <a
                key={item.page}
                href={pageHref(item.page)}
                aria-current={page === item.page ? "page" : undefined}
                className={cn("nav-item", page === item.page && "nav-active")}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  setPage(item.page);
                }}
              >
                <item.icon
                  size={19}
                  weight={page === item.page ? "fill" : "regular"}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </details>
      </nav>
      <div className="sidebar-bottom">
        <div className="profile">
          <div className="avatar avatar-dark">
            {initials(workspace.actor.name)}
          </div>
          <div>
            <strong>{workspace.actor.name}</strong>
            <span>{workspace.actor.role}</span>
          </div>
          <button
            className="icon-btn"
            aria-label="Sign out"
            onClick={async () => {
              try {
                await productionLogout();
                await request("/api/auth/logout", {
                  method: "POST",
                  headers: { "X-CSRF-Token": session.csrfToken || "" },
                });
                setSession(await getSession());
                setWorkspace(null);
              } catch (e) {
                toast((e as Error).message);
              }
            }}
          >
            <SignOut size={18} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <Context.Provider value={context}>
      <div className="app-shell">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <aside className="sidebar desktop-sidebar">
          {sidebarContent("desktop")}
        </aside>
        <Dialog.Root open={mobile} onOpenChange={setMobile}>
          <Dialog.Portal>
            <Dialog.Backdrop className="mobile-backdrop" />
            <Dialog.Popup className="sidebar mobile-sidebar">
              <Dialog.Title className="sr-only">
                Project navigation
              </Dialog.Title>
              <Dialog.Close
                className="icon-btn mobile-nav-close"
                aria-label="Close navigation"
              >
                <X size={19} />
              </Dialog.Close>
              {sidebarContent("mobile")}
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-btn mobile-menu"
                onClick={() => setMobile(true)}
                aria-label="Open navigation"
              >
                <List size={22} />
              </button>
              <span>{project?.name || "Workspace"}</span>
              <span className="slash">/</span>
              <strong>{titles[page]}</strong>
            </div>
            <button
              className="topbar-search"
              aria-label="Search this project"
              onClick={() => setSearchOpen(true)}
            >
              <MagnifyingGlass size={16} />
              <span>Search this project</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div className="topbar-right">
              <span className="workspace-private">
                <span className="small-dot" />
                {workspace.readiness.mode === "local"
                  ? "Local workspace"
                  : "Private workspace"}
              </span>
              <Button
                tone="quiet"
                onClick={() => void refresh().catch((e) => toast(e.message))}
                aria-label="Refresh workspace"
              >
                <ArrowClockwise size={17} />
              </Button>
              <div className="avatar">{initials(workspace.actor.name)}</div>
            </div>
          </header>
          <main id="main" className="main-content" key={projectId}>
            <ErrorBox error={error} />
            <ViewBoundary key={page}>
              <Suspense
                fallback={
                  <p role="status" className="view-footnote">
                    Opening this view…
                  </p>
                }
              >
                {page === "today" ? (
                  <TodayView />
                ) : page === "people" ? (
                  <PeopleView />
                ) : page === "pipeline" ? (
                  <PipelineView />
                ) : page === "inbox" ? (
                  <InboxView />
                ) : page === "work" ? (
                  <WorkView />
                ) : page === "reports" ? (
                  <ReportsView />
                ) : page === "money" ? (
                  <MoneyView />
                ) : page === "knowledge" ? (
                  <KnowledgeView />
                ) : page === "automation" ? (
                  <AutomationView />
                ) : (
                  <SettingsView key={projectId} />
                )}
              </Suspense>
            </ViewBoundary>
          </main>
        </div>
      </div>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle size={19} />
          {notice}
          <button
            className="icon-btn"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <Modal
        open={Boolean(createKind || editing)}
        onClose={() => {
          if (formDirty) setDiscard(true);
          else {
            setCreateKind(null);
            setEditing(null);
          }
        }}
        title={
          editing
            ? `Edit ${modules[editing.kind].singular}`
            : `New ${modules[createKind || "contact"].singular}`
        }
        description={`Project: ${project?.name || "Workspace"}. Changes are saved after you submit this form.`}
        wide
      >
        {(createKind || editing) && (
          <RecordForm
            key={editing?.id || createKind}
            kind={editing?.kind || createKind!}
            record={editing || undefined}
            members={workspace.members.filter(
              (m) =>
                m.projectIds.includes(projectId) ||
                ["owner", "admin"].includes(m.role),
            )}
            contacts={records.filter((r) => r.kind === "contact")}
            integrations={workspace.integrations}
            initialContactId={initialContact}
            onDirty={() => setFormDirty(true)}
            onSave={async (payload) => {
              await act(
                editing ? "update_record" : "create_record",
                payload,
                editing || undefined,
              );
            }}
            onClose={() => {
              setFormDirty(false);
              setInitialContact("");
              setCreateKind(null);
              setEditing(null);
            }}
          />
        )}
      </Modal>
      <Confirm
        open={discard}
        onClose={() => setDiscard(false)}
        title="Discard unsaved changes?"
        description="Your changes have not been saved. Confirm to close this form and discard them."
        onConfirm={() => {
          setDiscard(false);
          setFormDirty(false);
          setCreateKind(null);
          setEditing(null);
        }}
      />
      {selected && (
        <ViewBoundary key={selected.id} onClose={() => setSelected(null)}>
          <Suspense
            fallback={
              <p role="status" className="toast">
                Opening record…
              </p>
            }
          >
            <RecordDetail record={selected} onClose={() => setSelected(null)} />
          </Suspense>
        </ViewBoundary>
      )}
      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Search your workspace"
        description="Search contacts, opportunities, conversations, and work in the selected project."
      >
        <div className="modal-body">
          <div className="search-input large-search">
            <MagnifyingGlass size={20} />
            <input
              autoFocus
              aria-label="Search all records"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, or detail…"
            />
          </div>
          <div className="search-results">
            {search.trim() ? (
              records
                .filter((r) =>
                  `${r.title} ${JSON.stringify(r.data)}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .slice(0, 30)
                .map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelected(r);
                      setSearchOpen(false);
                    }}
                  >
                    <span className="record-kind">
                      {modules[r.kind].singular}
                    </span>
                    <strong>{r.title}</strong>
                    <ArrowRight size={17} />
                  </button>
                ))
            ) : (
              <p className="muted">
                Search only includes this project’s records.
              </p>
            )}
          </div>
        </div>
      </Modal>
      <Modal
        open={newProject}
        onClose={() => setNewProject(false)}
        title="Create project"
        description="Create a separate space for records, team access, and operating instructions."
      >
        <ProjectForm
          onClose={() => setNewProject(false)}
          onSave={async (payload) => {
            const result = await act("create_project", payload);
            if (result.project) changeProject(result.project.id);
            setNewProject(false);
          }}
        />
      </Modal>
    </Context.Provider>
  );
}

function ProjectForm({
  onSave,
  onClose,
}: {
  onSave: (p: Fields) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave({ name, description });
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="modal-body">
        <ErrorBox error={error} />
        <div className="field">
          <label htmlFor="project-name">Project name</label>
          <input
            id="project-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="project-description">Project description</label>
          <textarea
            id="project-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <div className="form-footer">
        <Button type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button tone="primary" disabled={busy}>
          {busy ? "Creating…" : "Create project"}
          <ArrowRight size={16} />
        </Button>
      </div>
    </form>
  );
}
