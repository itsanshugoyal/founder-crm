import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type {
  Fields,
  Member,
  Mutation,
  Readiness,
  Session,
} from "../shared/types.js";
import {
  normalizeState,
  SupabaseDatabase,
  transact,
  type Database,
  type State,
} from "./database.js";
import {
  applyMutation,
  audit,
  requireProject,
  requireRecord,
  seedProject,
  type ActorContext,
} from "./operations.js";
import {
  assert,
  cleanString,
  constantEqual,
  digest,
  emailAddress,
  HttpError,
  passwordHash,
  randomToken,
  sign,
} from "./security.js";
import { Providers } from "./providers.js";

export interface Environment {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  BOOTSTRAP_OWNER_EMAIL?: string;
  APP_ORIGIN?: string;
  COMPOSIO_API_KEY?: string;
  COMPOSIO_GMAIL_AUTH_CONFIG_ID?: string;
  COMPOSIO_GMAIL_TOOL_VERSION?: string;
  COMPOSIO_GOOGLECALENDAR_AUTH_CONFIG_ID?: string;
  COMPOSIO_GOOGLECALENDAR_TOOL_VERSION?: string;
  COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID?: string;
  COMPOSIO_INSTAGRAM_TOOL_VERSION?: string;
  NODE_ENV?: string;
}
export interface AppOptions {
  db?: Database;
  env?: Environment;
  mode?: "local" | "production";
  fetcher?: typeof fetch;
}
type Variables = { actor: ActorContext; state: State; csrf: string };
const cookieName = "founder_crm_session";
export async function createApplication(options: AppOptions = {}) {
  const env = { ...(options.env ?? {}) };
  const mode = options.mode ?? "production";
  let db = options.db;
  let supabase: SupabaseDatabase | undefined;
  if (!db && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = new SupabaseDatabase(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );
    db = supabase;
  }
  if (db instanceof SupabaseDatabase) supabase = db;
  if (mode === "production" && db && !env.APP_ORIGIN) {
    const configuredOrigin = (await db.snapshot()).private.appOrigin;
    if (configuredOrigin) {
      const origin = new URL(configuredOrigin);
      assert(
        origin.protocol === "https:" &&
          origin.pathname === "/" &&
          !origin.search &&
          !origin.hash &&
          !origin.username &&
          !origin.password,
        "Configure an exact HTTPS application origin.",
      );
      env.APP_ORIGIN = origin.origin;
    }
  }
  const readiness: Readiness = {
    database: !!db,
    auth: mode === "local" ? !!db : !!supabase && !!env.SUPABASE_ANON_KEY,
    composio:
      !!env.COMPOSIO_API_KEY &&
      [
        [env.COMPOSIO_GMAIL_AUTH_CONFIG_ID, env.COMPOSIO_GMAIL_TOOL_VERSION],
        [
          env.COMPOSIO_GOOGLECALENDAR_AUTH_CONFIG_ID,
          env.COMPOSIO_GOOGLECALENDAR_TOOL_VERSION,
        ],
        [
          env.COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID,
          env.COMPOSIO_INSTAGRAM_TOOL_VERSION,
        ],
      ].some(([auth, version]) => !!auth && !!version),
    mode,
    sourceOfTruth:
      "Postgres CRM; original Airtable is preserved until verified cutover.",
    pending: [],
  };
  if (!db)
    readiness.pending.push(
      "Configure Supabase, apply the database migration, and configure an individual owner account.",
    );
  if (mode === "production" && !readiness.auth)
    readiness.pending.push(
      "Configure Supabase URL, public anon key, service-role key and verified owner email.",
    );
  readiness.pending.push(
    "External accounts require verified OAuth authorization. Every provider write requires individual human confirmation.",
  );
  const app = new Hono<{ Variables: Variables }>();
  app.use("*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "no-referrer");
    c.header("X-Frame-Options", "DENY");
    if (
      c.req.path.startsWith("/api/") &&
      Number(c.req.header("content-length") ?? 0) > 200000
    )
      return c.json({ error: "Request is too large." }, 413);
    await next();
  });
  app.onError((error, c) => {
    if (error instanceof HttpError)
      return c.json({ error: error.message }, error.status as 400);
    console.error(
      "CRM request failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return c.json(
      {
        error:
          "The request could not be completed. Check database setup or refresh and try again.",
      },
      500,
    );
  });
  function database() {
    assert(db, "Database setup is required.", 503);
    return db;
  }
  function bootstrapOwner(state: State) {
    const value =
      env.BOOTSTRAP_OWNER_EMAIL ?? state.private.bootstrapOwnerEmail;
    return typeof value === "string" ? value.trim().toLowerCase() : undefined;
  }
  const providers = db ? new Providers(db, env, options.fetcher) : undefined;
  function checkOrigin(c: Context) {
    const origin = c.req.header("origin");
    assert(
      !origin || origin === (env.APP_ORIGIN ?? new URL(c.req.url).origin),
      "Cross-origin requests are not allowed.",
      403,
    );
    assert(
      c.req.header("content-type")?.includes("application/json"),
      "Content-Type application/json is required.",
      415,
    );
  }
  async function body(c: Context) {
    checkOrigin(c);
    const text = await c.req.text();
    assert(text.length <= 200000, "Request is too large.", 413);
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new HttpError(400, "Invalid JSON.");
    }
  }
  async function authenticate(
    c: Context,
  ): Promise<{ actor: ActorContext; state: State; csrf: string } | null> {
    if (!db) return null;
    const state = await db.snapshot();
    const bearer = c.req.header("authorization")?.replace(/^Bearer /i, "");
    if (bearer) {
      const token = state.private.tokens[await digest(bearer)];
      if (token && (token.expires === null || token.expires > Date.now())) {
        const member = state.members.find((m) => m.id === token.memberId);
        if (member)
          return {
            actor: { member, machine: true, projectId: token.projectId },
            state,
            csrf: "",
          };
      }
      if (supabase) {
        const { data, error } = await supabase.client.auth.getUser(bearer);
        if (!error && data.user?.email_confirmed_at) {
          let member = state.members.find(
            (m) =>
              m.id === data.user.id ||
              m.email === data.user.email?.toLowerCase(),
          );
          if (
            !member &&
            state.members.length === 0 &&
            bootstrapOwner(state) &&
            data.user.email?.toLowerCase() === bootstrapOwner(state)
          ) {
            const user = data.user;
            member = await transact(db, (state) => {
              assert(
                state.members.length === 0,
                "An owner already exists.",
                409,
              );
              assert(
                bootstrapOwner(state) &&
                  user.email?.toLowerCase() === bootstrapOwner(state),
                "This verified identity is not permitted to create the owner.",
                403,
              );
              const member: Member = {
                id: user.id,
                name: String(
                  user.user_metadata?.name ??
                    user.email?.split("@")[0] ??
                    "Owner",
                ),
                email: user.email?.toLowerCase(),
                role: "owner",
                projectIds: [],
              };
              state.members.push(member);
              if (state.projects.length) {
                member.projectIds = state.projects.map((project) => project.id);
              } else {
                member.projectIds.push(seedProject(state, member.id).id);
              }
              return member;
            });
            return {
              actor: { member, machine: false },
              state: await db.snapshot(),
              csrf: "",
            };
          }
          if (member) {
            if (
              Object.values(state.private.invites).some(
                (invite) => invite.memberId === member!.id,
              )
            )
              return null;
            return { actor: { member, machine: false }, state, csrf: "" };
          }
        }
      }
      return null;
    }
    if (mode !== "local") return null;
    const signed = getCookie(c, cookieName);
    if (!signed || !state.private.secret) return null;
    const [token, signature] = signed.split(".");
    if (
      !token ||
      !signature ||
      !constantEqual(await sign(token, state.private.secret), signature)
    )
      return null;
    const session = state.private.sessions[await digest(token)];
    if (!session || session.expires <= Date.now()) return null;
    const member = state.members.find((m) => m.id === session.memberId);
    return member
      ? { actor: { member, machine: false }, state, csrf: session.csrf }
      : null;
  }
  async function sessionCookie(c: Context, memberId: string) {
    const token = randomToken(),
      csrf = randomToken();
    await transact(database(), async (state) => {
      state.private.secret ||= randomToken();
      for (const [key, value] of Object.entries(state.private.sessions))
        if (value.expires <= Date.now()) delete state.private.sessions[key];
      state.private.sessions[await digest(token)] = {
        memberId,
        csrf,
        expires: Date.now() + 12 * 3600000,
      };
    });
    const state = await database().snapshot();
    setCookie(
      c,
      cookieName,
      token + "." + (await sign(token, state.private.secret)),
      {
        httpOnly: true,
        secure: new URL(c.req.url).protocol === "https:",
        sameSite: "Strict",
        path: "/",
        maxAge: 43200,
      },
    );
    return csrf;
  }
  app.get("/api/health", (c) =>
    c.json({
      database: readiness.database,
      auth: readiness.auth,
      configured: readiness.database && readiness.auth,
    }),
  );
  app.get("/api/session", async (c) => {
    const auth = await authenticate(c);
    const state = auth?.state ?? (db ? await db.snapshot() : undefined);
    let setupRequired = !readiness.database || !readiness.auth;
    if (db && mode === "local") setupRequired = state?.members.length === 0;
    const session: Session = {
      authenticated: !!auth,
      canCreateOwner:
        mode === "production" &&
        readiness.database &&
        readiness.auth &&
        !!state &&
        state.members.length === 0 &&
        !!bootstrapOwner(state),
      actor: auth?.actor.member,
      csrfToken: auth?.csrf,
      readiness,
      setupRequired,
    };
    if (mode === "production" && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
      session.supabaseUrl = env.SUPABASE_URL;
      session.supabaseAnonKey = env.SUPABASE_ANON_KEY;
    }
    return c.json(session);
  });
  app.post("/api/auth/setup", async (c) => {
    assert(mode === "local", "Use Supabase Auth for production sign-in.", 403);
    const data = await body(c);
    const name = cleanString(data.name, "Name", 100),
      email = emailAddress(data.email),
      password = cleanString(data.password, "Password", 1000);
    assert(password.length >= 14, "Use a password of at least 14 characters.");
    const credential = await passwordHash(password);
    const member = await transact(database(), (state) => {
      assert(
        state.members.length === 0,
        "This workspace already has an owner. Sign in instead.",
        409,
      );
      const member: Member = {
        id: crypto.randomUUID(),
        name,
        email,
        role: "owner",
        projectIds: [],
      };
      state.members.push(member);
      const project = seedProject(state, member.id);
      member.projectIds.push(project.id);
      state.private.credentials[member.id] = credential;
      audit(
        state,
        { member, machine: false },
        project.id,
        null,
        "setup",
        "Created individual owner",
      );
      return member;
    });
    const csrfToken = await sessionCookie(c, member.id);
    return c.json({ authenticated: true, actor: member, csrfToken, readiness });
  });
  const attempts = new Map<string, { count: number; reset: number }>();
  app.post("/api/auth/login", async (c) => {
    assert(mode === "local", "Use Supabase Auth for production sign-in.", 403);
    const data = await body(c),
      email = emailAddress(data.email),
      password = cleanString(data.password, "Password", 1000);
    const key = email;
    const previous = attempts.get(key);
    assert(
      !previous || previous.reset < Date.now() || previous.count < 10,
      "Too many sign-in attempts. Try again in 15 minutes.",
      429,
    );
    const attempt =
      previous && previous.reset > Date.now()
        ? previous
        : { count: 0, reset: Date.now() + 900000 };
    attempt.count++;
    attempts.set(key, attempt);
    const state = await database().snapshot();
    const member = state.members.find((m) => m.email === email);
    const credential = member
      ? state.private.credentials[member.id]
      : undefined;
    const candidate = await passwordHash(
      password,
      credential?.salt ?? "missing-user-fixed-timing-salt",
    );
    assert(
      member && credential && constantEqual(candidate.hash, credential.hash),
      "Email or password is incorrect.",
      401,
    );
    attempts.delete(key);
    const csrfToken = await sessionCookie(c, member.id);
    return c.json({ authenticated: true, actor: member, csrfToken, readiness });
  });
  app.post("/api/auth/logout", async (c) => {
    checkOrigin(c);
    const auth = await authenticate(c);
    if (auth && mode === "local") {
      assert(
        c.req.header("x-csrf-token") === auth.csrf,
        "CSRF validation failed.",
        403,
      );
      const signed = getCookie(c, cookieName);
      if (signed)
        await transact(database(), async (state) => {
          delete state.private.sessions[await digest(signed.split(".")[0])];
        });
    }
    deleteCookie(c, cookieName, { path: "/" });
    return c.json({ message: "Signed out." });
  });
  app.post("/api/auth/accept-invite", async (c) => {
    const data = await body(c),
      token = cleanString(data.token, "Invite token", 200);
    if (mode === "production") {
      assert(supabase, "Production authentication setup is required.", 503);
      assert(
        data.password === undefined,
        "Set your password privately through Supabase Auth, then sign in to accept this invite.",
      );
      const bearer = c.req
        .header("authorization")
        ?.match(/^Bearer (.+)$/i)?.[1];
      assert(bearer, "Sign in with your invited Supabase account first.", 401);
      const { data: identity, error } =
        await supabase.client.auth.getUser(bearer);
      assert(
        !error && identity.user?.email_confirmed_at && identity.user.email,
        "Verify your email and sign in before accepting this invite.",
        401,
      );
      const user = identity.user;
      const member = await transact(database(), async (state) => {
        const key = await digest(token),
          invite = state.private.invites[key];
        assert(
          invite && invite.expires > Date.now(),
          "Invite is invalid or expired.",
          403,
        );
        const member = state.members.find((m) => m.id === invite.memberId);
        assert(member, "Invite member no longer exists.", 404);
        assert(
          member.email?.toLowerCase() === user.email!.toLowerCase(),
          "This invitation belongs to a different verified email address.",
          403,
        );
        assert(
          !state.members.some((m) => m.id === user.id && m.id !== member.id),
          "This account already has a different membership. Ask an owner to review access.",
          409,
        );
        const previousId = member.id;
        member.id = user.id;
        if (data.name) member.name = cleanString(data.name, "Name", 100);
        for (const record of state.records) {
          if (record.ownerId === previousId) record.ownerId = user.id;
          for (const field of ["ownerIds", "collaboratorIds"])
            if (Array.isArray(record.data[field]))
              record.data[field] = (record.data[field] as string[]).map((id) =>
                id === previousId ? user.id : id,
              );
          if (record.data.approvedBy === previousId)
            record.data.approvedBy = user.id;
        }
        for (const existing of Object.values(state.private.tokens))
          if (existing.memberId === previousId) existing.memberId = user.id;
        for (const existing of Object.values(state.private.connections ?? {}))
          if (existing.memberId === previousId) existing.memberId = user.id;
        for (const [inviteKey, existing] of Object.entries(
          state.private.invites,
        ))
          if (existing.memberId === previousId)
            delete state.private.invites[inviteKey];
        delete state.private.credentials[previousId];
        for (const [sessionKey, session] of Object.entries(
          state.private.sessions,
        ))
          if (session.memberId === previousId)
            delete state.private.sessions[sessionKey];
        for (const projectId of member.projectIds)
          audit(
            state,
            { member, machine: false },
            projectId,
            null,
            "accept_invite",
            "Verified invited email and bound individual Supabase identity",
          );
        return member;
      });
      return c.json({
        authenticated: true,
        actor: member,
        csrfToken: "",
        readiness,
      });
    }
    const password = cleanString(data.password, "Password", 1000);
    assert(password.length >= 14, "Use a password of at least 14 characters.");
    const credential = await passwordHash(password);
    const member = await transact(database(), async (state) => {
      const key = await digest(token),
        invite = state.private.invites[key];
      assert(
        invite && invite.expires > Date.now(),
        "Invite is invalid or expired.",
        403,
      );
      const member = state.members.find((m) => m.id === invite.memberId);
      assert(member, "Invite member no longer exists.", 404);
      assert(
        !state.private.credentials[member.id],
        "Invite has already been accepted.",
        409,
      );
      if (data.name) member.name = cleanString(data.name, "Name", 100);
      state.private.credentials[member.id] = credential;
      delete state.private.invites[key];
      return member;
    });
    const csrfToken = await sessionCookie(c, member.id);
    return c.json({ authenticated: true, actor: member, csrfToken, readiness });
  });
  app.use("/api/*", async (c, next) => {
    if (
      [
        "/api/session",
        "/api/auth/setup",
        "/api/auth/login",
        "/api/auth/logout",
        "/api/auth/accept-invite",
      ].includes(c.req.path)
    )
      return next();
    if (c.req.path.startsWith("/api/share/")) return next();
    const auth = await authenticate(c);
    assert(auth, "Sign in with your individual account.", 401);
    c.set("actor", auth.actor);
    c.set("state", auth.state);
    c.set("csrf", auth.csrf);
    if (c.req.method !== "GET") {
      checkOrigin(c);
      if (!auth.actor.machine && mode === "local")
        assert(
          c.req.header("x-csrf-token") === auth.csrf,
          "CSRF validation failed.",
          403,
        );
    }
    await next();
  });
  app.get("/api/workspace", async (c) => {
    const { member } = c.get("actor"),
      state = c.get("state");
    const projects = state.projects.filter(
      (p) =>
        member.projectIds.includes(p.id) &&
        (!c.get("actor").machine || c.get("actor").projectId === p.id),
    );
    const projectId = c.req.query("projectId") ?? projects[0]?.id;
    assert(projectId, "No project membership is available.", 403);
    requireProject(state, c.get("actor"), projectId);
    return c.json({
      projects,
      members: state.members
        .filter((m) => m.projectIds.includes(projectId))
        .map((m) => ({
          ...m,
          projectIds: m.projectIds.filter((p) => member.projectIds.includes(p)),
        })),
      records: state.records.filter((r) => r.projectId === projectId),
      activities: state.activities
        .filter((a) => a.projectId === projectId)
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 500),
      integrations: [
        ...(providers?.integrations(state, c.get("actor"), projectId) ?? []),
        ...["gmail", "googlecalendar", "instagram"]
          .filter(
            (provider) =>
              !Object.values(state.private.connections ?? {}).some(
                (connection) =>
                  connection.projectId === projectId &&
                  connection.memberId === member.id &&
                  connection.provider === provider,
              ),
          )
          .map((provider) => ({
            id: "setup-" + provider,
            provider,
            label:
              provider === "gmail"
                ? "Gmail · CRM inbox"
                : provider === "googlecalendar"
                  ? "Google Calendar · CRM"
                  : "Instagram · CRM",
            status: "not_connected" as const,
            capabilities: [],
            mode: "native" as const,
            setupRequired: !providers?.configured(state, projectId, provider),
            reason: providers?.configured(state, projectId, provider)
              ? "Ready to authorize your account."
              : "Add this project's Composio connection settings, then authorize your account. Connecting an app in Codex does not link it to this CRM.",
          })),
        ...state.records
          .filter(
            (record) =>
              record.projectId === projectId &&
              record.kind === "knowledge" &&
              record.data.integrationVerification === true &&
              record.data.mode === "codex" &&
              ["gmail", "googlecalendar", "composio"].includes(
                String(record.data.provider),
              ) &&
              !state.records.some(
                (other) =>
                  other.projectId === projectId &&
                  other.kind === "knowledge" &&
                  other.data.mode === "codex" &&
                  other.data.integrationVerification === true &&
                  other.data.provider === record.data.provider &&
                  String(other.data.checkedAt) > String(record.data.checkedAt),
              ),
          )
          .map((record) => ({
            id: "codex-" + String(record.data.provider),
            provider: String(record.data.provider),
            label: String(record.data.label ?? record.title) + " · Codex",
            status: (Date.now() - Date.parse(String(record.data.checkedAt)) >=
              0 &&
            Date.now() - Date.parse(String(record.data.checkedAt)) <
              7 * 86400000
              ? "connected"
              : "not_connected") as "connected" | "not_connected",
            mode: "codex" as const,
            capabilities:
              record.data.provider === "composio"
                ? ["oauth_authenticated"]
                : ["read_via_codex", "draft_in_crm"],
            lastVerifiedAt: String(record.data.checkedAt),
            reason:
              record.data.provider === "composio"
                ? "Codex MCP sign-in verified. Provider account authorization and CRM project-key setup are separate; this does not grant the CRM inbox access."
                : "Available to Codex workflows. CRM-native inbox/calendar authorization is separate. Sending always requires your individual action.",
          })),
        {
          id: "mcp",
          provider: "mcp",
          label: "Project-scoped MCP",
          status:
            Object.values(state.private.tokens).some(
              (token) =>
                token.projectId === projectId &&
                (token.expires === null || token.expires > Date.now()),
            ) &&
            state.activities.some(
              (activity) =>
                activity.projectId === projectId &&
                activity.actor.endsWith(" (MCP)"),
            )
              ? "connected"
              : "not_connected",
          capabilities: ["read", "records", "drafts", "tasks", "evidence"],
          reason:
            "Project-scoped read and preparation access. Cannot approve, send, invite, issue invoices, or spend.",
        },
      ],
      actor: member,
      readiness: {
        ...readiness,
        sourceOfTruth:
          state.private.cutover?.sourceOfTruth === "supabase"
            ? "Supabase · live CRM. Airtable is an archived snapshot."
            : readiness.sourceOfTruth,
        composio: ["gmail", "googlecalendar", "instagram"].some((provider) =>
          providers?.configured(state, projectId, provider),
        ),
      },
      revision: String(state.revision),
    });
  });
  app.post("/api/mutate", async (c) => {
    const input = (await body(c)) as unknown as Mutation;
    assert(
      typeof input.action === "string" && typeof input.projectId === "string",
      "Action and projectId are required.",
    );
    assert(
      typeof input.requestId === "string" &&
        input.requestId.length >= 8 &&
        input.requestId.length <= 200,
      "A stable requestId of 8–200 characters is required.",
    );
    const auth = c.get("actor");
    const scope = auth.machine
      ? "mcp:" +
        auth.projectId +
        ":" +
        (await digest(c.req.header("authorization") ?? ""))
      : "human";
    const requestKey = auth.member.id + ":" + scope + ":" + input.requestId;
    const fingerprint = await digest(JSON.stringify(input));
    if (
      [
        "connect_provider",
        "configure_provider",
        "provider_connection_status",
        "fetch_inbox",
        "provider_send",
        "sync_calendar",
        "sync_instagram",
        "fetch_instagram_inbox",
        "calendar_create_event",
      ].includes(input.action)
    ) {
      assert(providers, "Database setup is required.", 503);
      assert(
        input.payload &&
          typeof input.payload === "object" &&
          !Array.isArray(input.payload),
        "Provider payload must be an object.",
      );
      return c.json(
        await providers.action(
          auth,
          input,
          env.APP_ORIGIN ?? new URL(c.req.url).origin,
        ),
      );
    }
    const result = await transact(database(), async (state) => {
      const member = state.members.find((m) => m.id === auth.member.id);
      assert(member, "Membership no longer exists.", 403);
      const currentActor = { ...auth, member };
      if (input.action !== "create_project")
        requireProject(state, currentActor, input.projectId);
      if (auth.machine)
        assert(
          [
            "create_record",
            "update_record",
            "archive_record",
            "apply_changeset",
          ].includes(input.action),
          "MCP cannot perform this action.",
          403,
        );
      const prior = state.private.requests[requestKey];
      if (prior) {
        assert(
          prior.fingerprint === fingerprint,
          "A request ID cannot be reused for a different operation.",
          409,
        );
        return { ...(prior.result as object), duplicate: true };
      }
      const result = await applyMutation(
        state,
        currentActor,
        input,
        env.APP_ORIGIN ?? new URL(c.req.url).origin,
      );
      state.private.requests[requestKey] = {
        result:
          result.token || result.url
            ? {
                message:
                  "This one-time result was already created. Create a new request if you need another link or token.",
              }
            : result,
        at: Date.now(),
        fingerprint,
      };
      return result;
    });
    return c.json(result);
  });
  app.get("/api/invoices/:id/pdf", async (c) => {
    const state = c.get("state"),
      record = state.records.find((r) => r.id === c.req.param("id"));
    assert(record && record.kind === "invoice", "Invoice not found.", 404);
    requireProject(state, c.get("actor"), record.projectId);
    const bytes = await invoicePdf(record);
    return new Response(bytes.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="invoice.pdf"',
        "Cache-Control": "no-store",
      },
    });
  });
  app.get("/api/share/:token", async (c) =>
    c.json(await getShare(database(), c.req.param("token"))),
  );
  app.get("/share/:token", async (c) => {
    const record = await getShare(database(), c.req.param("token"));
    const escape = (x: unknown) =>
      String(x ?? "").replace(
        /[&<>"']/g,
        (ch) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[ch]!,
      );
    return c.html(
      `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(record.title)}</title><style>body{font:18px system-ui;max-width:760px;margin:80px auto;padding:24px;background:#f7f6f2;color:#171b21}article{background:white;padding:36px;border:1px solid #ddd;border-radius:20px}pre{white-space:pre-wrap;font:inherit}</style><article><p>Shared ${escape(record.kind)} · Read only</p><h1>${escape(record.title)}</h1><p>${escape(record.status)}</p><pre>${escape(JSON.stringify(record.data, null, 2))}</pre></article></html>`,
    );
  });
  return { app, db, readiness };
}
async function getShare(db: Database, token: string) {
  const state = await db.snapshot(),
    share = state.private.shares[await digest(token)];
  assert(
    share && share.expires > Date.now() && share.snapshot,
    "This share link is invalid or expired.",
    404,
  );
  return share.snapshot;
}
async function invoicePdf(record: {
  title: string;
  status: string;
  data: Fields;
}) {
  const doc = await PDFDocument.create(),
    font = await doc.embedFont(StandardFonts.Helvetica);
  let page = doc.addPage([595, 842]),
    y = 785;
  let contentLength = 0;
  const line = (value: string, size = 12) => {
    contentLength += value.length;
    assert(
      contentLength <= 20000,
      "Invoice PDF text is too long. Shorten descriptions or public notes before exporting.",
    );
    for (const paragraph of value.split(/\r?\n/)) {
      let remaining = paragraph.replace(/[^\x20-\x7E]/g, "?");
      do {
        let low = 1,
          high = Math.min(remaining.length, 250);
        while (low < high) {
          const mid = Math.ceil((low + high) / 2);
          if (font.widthOfTextAtSize(remaining.slice(0, mid), size) <= 499)
            low = mid;
          else high = mid - 1;
        }
        let length = low;
        if (length < remaining.length) {
          const space = remaining.lastIndexOf(" ", length);
          if (space > length / 2) length = space;
        }
        if (y < 60) {
          page = doc.addPage([595, 842]);
          y = 785;
        }
        page.drawText(remaining.slice(0, length), {
          x: 48,
          y,
          size,
          font,
          color: rgb(0.08, 0.1, 0.14),
        });
        y -= size + 12;
        remaining = remaining.slice(length).trimStart();
      } while (remaining.length);
    }
  };
  line(record.title, 24);
  line(`Status: ${record.status}`);
  line(`Invoice: ${String(record.data.invoiceNumber ?? "Draft")}`);
  for (const [key, label] of [
    ["customerName", "Bill to"],
    ["customerEmail", "Email"],
    ["billingAddress", "Address"],
    ["issuedAt", "Issued"],
    ["dueDate", "Due"],
  ]) {
    if (record.data[key]) line(`${label}: ${String(record.data[key])}`);
  }
  const items = record.data.items;
  if (Array.isArray(items))
    for (const item of items) {
      if (item && typeof item === "object" && !Array.isArray(item))
        line(
          `${String(item.description ?? "Item")}  ${String(item.quantity)} x ${(Number(item.unitCents) / 100).toFixed(2)}`,
        );
    }
  line(
    `Total: ${String(record.data.currency ?? "")} ${(Number(record.data.totalCents ?? record.data.amountCents ?? 0) / 100).toFixed(2)}`,
    18,
  );
  if (record.data.publicNotes) line(String(record.data.publicNotes));
  if (record.data.paymentInstructions)
    line(`Payment instructions: ${String(record.data.paymentInstructions)}`);
  return doc.save();
}
