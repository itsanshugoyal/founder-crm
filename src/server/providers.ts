import type {
  CrmRecord,
  Fields,
  Integration,
  Mutation,
  MutationResult,
} from "../shared/types.js";
import { transact, type Database, type State } from "./database.js";
import {
  applyMutation,
  audit,
  istDay,
  requireProject,
  requireRecord,
  type ActorContext,
} from "./operations.js";
import { assert, cleanString, digest, emailAddress } from "./security.js";

export interface ProviderEnvironment {
  COMPOSIO_API_KEY?: string;
  COMPOSIO_GMAIL_AUTH_CONFIG_ID?: string;
  COMPOSIO_GMAIL_TOOL_VERSION?: string;
  COMPOSIO_GOOGLECALENDAR_AUTH_CONFIG_ID?: string;
  COMPOSIO_GOOGLECALENDAR_TOOL_VERSION?: string;
  COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID?: string;
  COMPOSIO_INSTAGRAM_TOOL_VERSION?: string;
}
type Provider = "gmail" | "googlecalendar" | "instagram";
type Connection = NonNullable<State["private"]["connections"]>[string] & {
  fingerprint?: string;
  providerUserId?: string;
};
type Data = Record<string, unknown>;
const object = (v: unknown): Data =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Data) : {};
const unwrap = (v: unknown): Data => {
  const d = object(v);
  return Object.keys(object(d.response_data)).length
    ? object(d.response_data)
    : Object.keys(object(d.data)).length
      ? object(d.data)
      : d;
};
const list = (v: unknown): Data[] => (Array.isArray(v) ? v.map(object) : []);
const now = () => new Date().toISOString();
const labels: Record<Provider, string> = {
  gmail: "Gmail",
  googlecalendar: "Google Calendar",
  instagram: "Instagram Business / Creator",
};
const tools = {
  gmail: ["GMAIL_GET_PROFILE", "GMAIL_FETCH_EMAILS", "GMAIL_SEND_EMAIL"],
  googlecalendar: [
    "GOOGLECALENDAR_GET_CURRENT_USER",
    "GOOGLECALENDAR_EVENTS_LIST",
    "GOOGLECALENDAR_CREATE_EVENT",
  ],
  instagram: [
    "INSTAGRAM_GET_USER_INFO",
    "INSTAGRAM_LIST_ALL_CONVERSATIONS",
    "INSTAGRAM_LIST_ALL_MESSAGES",
    "INSTAGRAM_SEND_TEXT_MESSAGE",
  ],
} as const;

/** Fixed adapter operations only. Clients never choose a tool slug, URL, HTTP method, or raw arguments. */
export class Providers {
  constructor(
    private db: Database,
    private env: ProviderEnvironment,
    private fetcher: typeof fetch = fetch,
  ) {}
  private config(provider: Provider) {
    const prefix =
      provider === "gmail"
        ? "GMAIL"
        : provider === "googlecalendar"
          ? "GOOGLECALENDAR"
          : "INSTAGRAM";
    return {
      authConfig: this.env[`COMPOSIO_${prefix}_AUTH_CONFIG_ID`],
      version: this.env[`COMPOSIO_${prefix}_TOOL_VERSION`],
    };
  }
  private async call(path: string, body?: unknown) {
    assert(
      this.env.COMPOSIO_API_KEY,
      "Configure the server Composio API key and provider auth config first.",
      409,
    );
    const response = await this.fetcher(
      "https://backend.composio.dev/api/v3.1/" + path,
      {
        method: body ? "POST" : "GET",
        headers: {
          "x-api-key": this.env.COMPOSIO_API_KEY,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20000),
        redirect: "error",
      },
    );
    assert(
      response.ok,
      "Provider request failed. Check the account; never retry an uncertain external write.",
      502,
    );
    return object(await response.json());
  }
  private async execute(c: Connection, slug: string, args: Data) {
    assert(
      (tools[c.provider as Provider] as readonly string[]).includes(slug),
      "Provider action is not allowlisted.",
      403,
    );
    const { version } = this.config(c.provider as Provider);
    assert(
      version && /^\d{8}_\d{2}$/.test(version),
      "Configure a verified pinned provider tool version first.",
      409,
    );
    return this.call("tools/execute/" + slug, {
      connected_account_id: c.accountId,
      user_id: c.userId,
      version,
      arguments: args,
    });
  }
  private success(response: Data) {
    assert(
      response.successful === true && !response.error,
      "Provider did not report success.",
      502,
    );
    return unwrap(response.data);
  }
  private actor(state: State, actor: ActorContext, projectId: string) {
    const member = state.members.find((m) => m.id === actor.member.id);
    assert(member, "Membership no longer exists.", 403);
    assert(
      member.role !== "viewer",
      "Viewers cannot perform provider actions.",
      403,
    );
    const current = { ...actor, member };
    requireProject(state, current, projectId);
    return current;
  }
  private connection(
    state: State,
    actor: ActorContext,
    projectId: string,
    connectionId: string,
  ) {
    this.actor(state, actor, projectId);
    const c = state.private.connections?.[connectionId] as
      Connection | undefined;
    assert(
      c && c.projectId === projectId && c.memberId === actor.member.id,
      "Connection is not bound to your individual account in this project.",
      403,
    );
    return c;
  }
  integrations(
    state: State,
    actor: ActorContext,
    projectId: string,
  ): Integration[] {
    return Object.entries(state.private.connections ?? {})
      .filter(
        ([, c]) => c.projectId === projectId && c.memberId === actor.member.id,
      )
      .map(([id, c]) => ({
        id,
        provider: c.provider,
        label: `${labels[c.provider as Provider] ?? "Provider"} · individual account`,
        status: c.status === "ACTIVE" ? "connected" : "not_connected",
        accountId: c.accountId,
        projectId,
        capabilities:
          c.status === "ACTIVE"
            ? c.provider === "googlecalendar"
              ? ["calendar_read", "human_event_create"]
              : c.provider === "instagram"
                ? ["inbox_read", "human_in_window_reply"]
                : ["inbox_read", "human_send"]
            : [],
        reason:
          c.status === "ACTIVE"
            ? "Individual human confirmation required. Acceptance is not delivery."
            : "Complete authorization and verify account identity.",
      }));
  }
  private async identity(c: Connection) {
    const provider = c.provider as Provider,
      slug =
        provider === "gmail"
          ? "GMAIL_GET_PROFILE"
          : provider === "googlecalendar"
            ? "GOOGLECALENDAR_GET_CURRENT_USER"
            : "INSTAGRAM_GET_USER_INFO";
    const args: Data =
      provider === "gmail"
        ? { user_id: "me" }
        : provider === "instagram"
          ? { ig_user_id: "me", fields: "id,user_id,username,account_type" }
          : {};
    const p = this.success(await this.execute(c, slug, args));
    const raw =
      provider === "gmail"
        ? emailAddress(p.emailAddress ?? p.email)
        : provider === "instagram"
          ? cleanString(p.id ?? p.user_id, "Verified Instagram identity", 200)
          : cleanString(
              p.email ??
                p.emailAddress ??
                p.primary_calendar_id ??
                p.primaryCalendarId ??
                p.id,
              "Verified Calendar identity",
              300,
            );
    if (provider === "instagram")
      assert(
        ["BUSINESS", "CREATOR", "MEDIA_CREATOR"].includes(
          String(p.account_type ?? "").toUpperCase(),
        ),
        "Instagram requires a verified Business or Creator account.",
        403,
      );
    const fingerprint = await digest(provider + ":" + raw.toLowerCase());
    assert(
      !c.fingerprint || c.fingerprint === fingerprint,
      "Connected account identity changed. Reconnect and review affected drafts.",
      403,
    );
    return {
      fingerprint,
      providerUserId: provider === "instagram" ? raw : undefined,
    };
  }
  private async verify(
    actor: ActorContext,
    input: Mutation,
    connectionId: string,
  ) {
    const c = this.connection(
        await this.db.snapshot(),
        actor,
        input.projectId,
        connectionId,
      ),
      kind = c.provider as Provider;
    assert(Object.hasOwn(tools, kind), "Unsupported provider.", 403);
    const details = await this.call(
      "connected_accounts/" + encodeURIComponent(c.accountId),
    );
    assert(
      details.user_id === c.userId &&
        details.id === c.accountId &&
        object(details.toolkit).slug === kind,
      "Provider account binding verification failed.",
      403,
    );
    assert(
      object(details.auth_config).id === this.config(kind).authConfig,
      "Provider auth configuration does not match.",
      403,
    );
    if (details.status !== "ACTIVE") {
      await transact(this.db, (state) => {
        this.connection(state, actor, input.projectId, connectionId).status =
          String(details.status);
      });
      assert(
        input.action === "provider_connection_status",
        "Complete provider authorization first.",
        409,
      );
      return { ...c, status: String(details.status) };
    }
    const identity = await this.identity(c);
    await transact(this.db, (state) => {
      const live = this.connection(state, actor, input.projectId, connectionId);
      assert(
        !live.fingerprint || live.fingerprint === identity.fingerprint,
        "Provider identity changed.",
        403,
      );
      Object.assign(live, identity, { status: "ACTIVE" });
    });
    return { ...c, ...identity, status: "ACTIVE" };
  }
  async action(
    actor: ActorContext,
    input: Mutation,
    origin: string,
  ): Promise<MutationResult> {
    assert(
      !actor.machine && actor.member.role !== "viewer",
      "An individual project member must perform provider actions.",
      403,
    );
    this.actor(await this.db.snapshot(), actor, input.projectId);
    if (input.action === "connect_provider")
      return this.connect(actor, input, origin);
    const connectionId = cleanString(
        input.payload.connectionId,
        "Connection identifier",
        200,
      ),
      c = await this.verify(actor, input, connectionId);
    if (input.action === "provider_connection_status")
      return {
        message:
          c.status === "ACTIVE"
            ? `${labels[c.provider as Provider]} account identity verified.`
            : "Authorization is not active yet.",
        status: c.status,
      };
    assert(
      c.status === "ACTIVE",
      "Complete provider authorization first.",
      409,
    );
    if (input.action === "fetch_inbox") {
      assert(c.provider === "gmail", "Choose a Gmail connection.");
      return this.syncGmail(actor, input, c);
    }
    if (input.action === "sync_calendar") {
      assert(c.provider === "googlecalendar", "Choose a Calendar connection.");
      return this.syncCalendar(actor, input, c);
    }
    if (
      input.action === "sync_instagram" ||
      input.action === "fetch_instagram_inbox"
    ) {
      assert(c.provider === "instagram", "Choose an Instagram connection.");
      return this.syncInstagram(actor, input, c);
    }
    if (input.action === "calendar_create_event") {
      assert(c.provider === "googlecalendar", "Choose a Calendar connection.");
      return this.createEvent(actor, input, c);
    }
    assert(
      input.action === "provider_send" &&
        (c.provider === "gmail" || c.provider === "instagram"),
      "Unsupported provider action.",
    );
    return this.send(actor, input, c, origin);
  }
  private async connect(actor: ActorContext, input: Mutation, origin: string) {
    assert(
      actor.member.role === "owner",
      "An owner must connect external accounts.",
      403,
    );
    const provider = String(input.payload.provider) as Provider;
    assert(
      Object.hasOwn(tools, provider),
      "Only Gmail, Calendar, and Instagram Business/Creator adapters are enabled.",
      409,
    );
    const { authConfig, version } = this.config(provider);
    assert(
      authConfig && version && /^\d{8}_\d{2}$/.test(version),
      "Configure the provider auth config and verified pinned version first.",
      409,
    );
    if (input.payload.existingConnectionId) {
      const existingId = cleanString(
          input.payload.existingConnectionId,
          "Existing connection",
          200,
        ),
        state = await this.db.snapshot(),
        existing = state.private.connections?.[existingId] as
          Connection | undefined;
      assert(
        existing &&
          existing.memberId === actor.member.id &&
          existing.provider === provider,
        "Only your own matching connection may be explicitly bound to another project.",
        403,
      );
      this.actor(state, actor, existing.projectId);
      const verified = await this.verify(
        actor,
        { ...input, projectId: existing.projectId },
        existingId,
      );
      assert(
        verified.status === "ACTIVE",
        "Verify the original connection first.",
      );
      const connectionId = crypto.randomUUID();
      await transact(this.db, (state) => {
        this.actor(state, actor, input.projectId);
        state.private.connections ??= {};
        state.private.connections[connectionId] = {
          ...verified,
          projectId: input.projectId,
        };
        audit(
          state,
          actor,
          input.projectId,
          null,
          "connect_provider",
          "Explicitly bound a verified owned account to this project",
        );
      });
      return {
        connectionId,
        message: "Existing account explicitly bound to this project.",
      };
    }
    const userId = `founder-crm:${actor.member.id}`,
      response = await this.call("connected_accounts/link", {
        auth_config_id: authConfig,
        user_id: userId,
        callback_url: origin + "/?connection=complete",
      }),
      accountId = cleanString(
        response.connected_account_id,
        "Provider account",
        200,
      ),
      url = new URL(
        cleanString(response.redirect_url, "Authorization URL", 4000),
      );
    assert(
      url.protocol === "https:" &&
        (url.hostname === "composio.dev" ||
          url.hostname.endsWith(".composio.dev")),
      "Unexpected provider authorization destination.",
      502,
    );
    const connectionId = crypto.randomUUID();
    await transact(this.db, (state) => {
      this.actor(state, actor, input.projectId);
      state.private.connections ??= {};
      state.private.connections[connectionId] = {
        memberId: actor.member.id,
        projectId: input.projectId,
        provider,
        accountId,
        userId,
        status: "INITIALIZING",
      };
      audit(
        state,
        actor,
        input.projectId,
        null,
        "connect_provider",
        "Created individual project-bound OAuth session",
      );
    });
    return {
      url: url.toString(),
      connectionId,
      message: "Complete authorization, then verify the account identity.",
    };
  }
  private contact(state: State, projectId: string, email: string) {
    return state.records.find(
      (r) =>
        r.projectId === projectId &&
        r.kind === "contact" &&
        r.status !== "archived" &&
        String(r.data.email ?? "").toLowerCase() === email.toLowerCase(),
    );
  }
  private inbound(
    state: State,
    contact: CrmRecord,
    channel: string,
    body: string,
    at: string,
  ) {
    if (
      Number.isFinite(Date.parse(at)) &&
      Date.parse(at) <= Date.now() &&
      (!contact.data.lastInboundAt ||
        Date.parse(at) > Date.parse(String(contact.data.lastInboundAt)))
    ) {
      contact.data.lastInboundAt = at;
      contact.data.lastInboundChannel = channel;
      contact.updatedAt = now();
      contact.version++;
    }
    if (
      /^(stop|unsubscribe|do not contact( me)?|remove me)[.!\s]*$/i.test(
        body.trim(),
      )
    ) {
      contact.data.optOut = true;
      contact.status = "opted_out";
      contact.version++;
      contact.updatedAt = now();
    }
    for (const followup of state.records.filter(
      (r) =>
        r.projectId === contact.projectId &&
        r.contactId === contact.id &&
        ["task", "draft", "automation"].includes(r.kind) &&
        ["queued", "scheduled", "pending"].includes(r.status),
    )) {
      followup.status = "cancelled";
      followup.data.cancellationReason = "Contact replied; follow-up stopped";
      followup.version++;
      followup.updatedAt = now();
    }
  }
  private async syncGmail(actor: ActorContext, input: Mutation, c: Connection) {
    const data = this.success(
        await this.execute(c, "GMAIL_FETCH_EMAILS", {
          user_id: "me",
          max_results: 25,
          query: "in:inbox newer_than:30d",
          include_payload: true,
        }),
      ),
      messages = list(data.messages ?? data.emails);
    let skipped = 0;
    const imported = await transact(this.db, (state) => {
      this.actor(state, actor, input.projectId);
      let count = 0;
      skipped = 0;
      for (const item of messages) {
        const messageId = String(
          item.id ?? item.messageId ?? item.message_id ?? "",
        );
        if (
          !messageId ||
          state.records.some(
            (r) =>
              r.projectId === input.projectId &&
              r.data.providerMessageId === messageId &&
              r.data.connectedAccountId === c.accountId,
          )
        )
          continue;
        const from = String(item.from ?? item.sender ?? "").slice(0, 500),
          match = from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i),
          contact = match
            ? this.contact(state, input.projectId, match[0])
            : undefined;
        if (!contact) {
          skipped++;
          continue;
        }
        const body = String(
            item.body ?? item.messageText ?? item.snippet ?? "",
          ).slice(0, 30000),
          at = now();
        state.records.push({
          id: crypto.randomUUID(),
          projectId: input.projectId,
          kind: "message",
          title: String(item.subject ?? "Gmail inbound message").slice(0, 500),
          status: "received",
          ownerId: actor.member.id,
          contactId: contact.id,
          dueAt: null,
          data: {
            direction: "inbound",
            channel: "email",
            from,
            body,
            providerMessageId: messageId,
            connectedAccountId: c.accountId,
            fetchedAt: at,
          },
          version: 1,
          createdAt: at,
          updatedAt: at,
        });
        this.inbound(
          state,
          contact,
          "email",
          body,
          String(item.messageTimestamp ?? item.date ?? item.receivedAt ?? ""),
        );
        count++;
      }
      audit(
        state,
        actor,
        input.projectId,
        null,
        "fetch_inbox",
        `Imported ${count} matched messages; skipped ${skipped} private unmatched messages`,
      );
      return count;
    });
    return {
      message: `Imported ${imported} Gmail messages; skipped ${skipped} unmatched private messages.`,
      imported,
      skipped,
      limitedTo: 25,
    };
  }
  private async syncCalendar(
    actor: ActorContext,
    input: Mutation,
    c: Connection,
  ) {
    const data = this.success(
        await this.execute(c, "GOOGLECALENDAR_EVENTS_LIST", {
          calendarId: "primary",
          timeMin: new Date(Date.now() - 7 * 86400000).toISOString(),
          timeMax: new Date(Date.now() + 60 * 86400000).toISOString(),
          maxResults: 100,
          singleEvents: true,
          orderBy: "startTime",
          showDeleted: true,
          fields:
            "items(id,status,summary,start,end,attendees(email),hangoutLink),nextPageToken",
        }),
      ),
      events = list(data.items ?? data.events);
    let skipped = 0;
    const imported = await transact(this.db, (state) => {
      this.actor(state, actor, input.projectId);
      let count = 0;
      skipped = 0;
      for (const item of events) {
        const eventId = String(item.id ?? "");
        if (!eventId) continue;
        const contacts = list(item.attendees)
          .map((a) =>
            this.contact(state, input.projectId, String(a.email ?? "")),
          )
          .filter((r): r is CrmRecord => !!r);
        if (!contacts.length) {
          skipped++;
          continue;
        }
        let record = state.records.find(
          (r) =>
            r.projectId === input.projectId &&
            r.kind === "meeting" &&
            r.data.providerEventId === eventId &&
            r.data.connectedAccountId === c.accountId,
        );
        const at = now(),
          startsAt = String(
            object(item.start).dateTime ?? object(item.start).date ?? "",
          ),
          endsAt = String(
            object(item.end).dateTime ?? object(item.end).date ?? "",
          ),
          meetUrl = safeMeetUrl(item.hangout_link ?? item.hangoutLink),
          fields: Fields = {
            startsAt,
            endsAt,
            attendees: contacts.map((r) => String(r.data.email)),
            providerEventId: eventId,
            connectedAccountId: c.accountId,
            syncedAt: at,
            ...(meetUrl ? { meetUrl } : {}),
          };
        if (record) {
          record.title = String(item.summary ?? record.title).slice(0, 500);
          record.status =
            item.status === "cancelled" ? "cancelled" : "scheduled";
          record.data = { ...record.data, ...fields };
          record.version++;
          record.updatedAt = at;
        } else {
          record = {
            id: crypto.randomUUID(),
            projectId: input.projectId,
            kind: "meeting",
            title: String(item.summary ?? "Project meeting").slice(0, 500),
            status: item.status === "cancelled" ? "cancelled" : "scheduled",
            ownerId: actor.member.id,
            contactId: contacts[0].id,
            dueAt: Number.isFinite(Date.parse(startsAt)) ? startsAt : null,
            data: fields,
            version: 1,
            createdAt: at,
            updatedAt: at,
          };
          state.records.push(record);
        }
        count++;
      }
      audit(
        state,
        actor,
        input.projectId,
        null,
        "sync_calendar",
        `Synchronized ${count} project-contact events; skipped ${skipped} unmatched events`,
      );
      return count;
    });
    return {
      message: `Synchronized ${imported} Calendar events; skipped ${skipped} private unmatched events.`,
      imported,
      skipped,
      truncated: typeof data.nextPageToken === "string",
      windowDays: 67,
    };
  }
  private async syncInstagram(
    actor: ActorContext,
    input: Mutation,
    c: Connection,
  ) {
    const response = await this.execute(c, "INSTAGRAM_LIST_ALL_CONVERSATIONS", {
      limit: 25,
      fields: "id,participants,updated_time",
      platform: "instagram",
    });
    this.success(response);
    const conversations = providerList(response.data),
      incoming: { item: Data; conversationId: string; contactId: string }[] =
        [];
    let skipped = 0;
    const snapshot = await this.db.snapshot();
    for (const conversation of conversations) {
      const conversationId = String(conversation.id ?? "");
      if (!conversationId) continue;
      const participants = list(
          object(conversation.participants).data ?? conversation.participants,
        ),
        match = participants
          .map((p) => ({
            p,
            contact: snapshot.records.find(
              (r) =>
                r.projectId === input.projectId &&
                r.kind === "contact" &&
                String(r.data.instagramUserId ?? "") === String(p.id) &&
                String(p.id) !== c.providerUserId,
            ),
          }))
          .find((m) => m.contact);
      if (!match?.contact) {
        skipped++;
        continue;
      }
      const messages = await this.execute(c, "INSTAGRAM_LIST_ALL_MESSAGES", {
        conversation_id: conversationId,
        limit: 25,
        fields: "id,from,to,message,created_time",
      });
      this.success(messages);
      for (const item of providerList(messages.data))
        if (String(object(item.from).id ?? "") === String(match.p.id))
          incoming.push({ item, conversationId, contactId: match.contact.id });
    }
    const imported = await transact(this.db, (state) => {
      this.actor(state, actor, input.projectId);
      let count = 0;
      for (const entry of incoming) {
        const messageId = String(entry.item.id ?? ""),
          at = String(entry.item.created_time ?? "");
        if (
          !messageId ||
          !Number.isFinite(Date.parse(at)) ||
          Date.parse(at) > Date.now() ||
          state.records.some(
            (r) =>
              r.projectId === input.projectId &&
              r.data.providerMessageId === messageId &&
              r.data.connectedAccountId === c.accountId,
          )
        )
          continue;
        const contact = requireRecord(state, input.projectId, entry.contactId),
          body = String(entry.item.message ?? "").slice(0, 10000);
        state.records.push({
          id: crypto.randomUUID(),
          projectId: input.projectId,
          kind: "message",
          title: "Instagram inbound reply",
          status: "received",
          ownerId: actor.member.id,
          contactId: contact.id,
          dueAt: null,
          data: {
            direction: "inbound",
            channel: "instagram",
            body,
            receivedAt: at,
            providerMessageId: messageId,
            providerConversationId: entry.conversationId,
            instagramUserId: String(object(entry.item.from).id),
            connectedAccountId: c.accountId,
            fetchedAt: now(),
          },
          version: 1,
          createdAt: now(),
          updatedAt: now(),
        });
        state.private.requests[
          "instagram-inbound:" +
            c.fingerprint +
            ":" +
            contact.id +
            ":" +
            messageId
        ] = {
          at: Date.now(),
          result: {
            projectId: input.projectId,
            contactId: contact.id,
            recipientId: String(object(entry.item.from).id),
            receivedAt: at,
            accountId: c.accountId,
          },
        };
        this.inbound(state, contact, "instagram", body, at);
        count++;
      }
      audit(
        state,
        actor,
        input.projectId,
        null,
        "sync_instagram",
        `Imported ${count} verified inbound replies; skipped ${skipped} unmatched conversations`,
      );
      return count;
    });
    return {
      message: `Imported ${imported} Instagram replies; skipped ${skipped} unmatched conversations.`,
      imported,
      skipped,
      limitedToConversations: 25,
    };
  }
  private ceiling(state: State, c: Connection, projectId: string) {
    assert(c.fingerprint, "Provider identity is unverified.", 403);
    const project = state.projects.find((p) => p.id === projectId)!,
      limit = Math.min(
        Number(project.settings.dailySendLimit ?? 25),
        c.provider === "instagram" ? 15 : 100,
      ),
      hourly = Math.min(Number(project.settings.hourlySendLimit ?? 5), 20),
      bindings = Object.values(state.private.connections ?? {}) as Connection[];
    const attempts = state.records
      .filter(
        (r) =>
          r.kind === "draft" &&
          r.data.sendState &&
          typeof r.data.sentAt === "string",
      )
      .filter((r) =>
        bindings.some(
          (other) =>
            other.accountId === r.data.connectedAccountId &&
            other.provider === c.provider &&
            (!other.fingerprint || other.fingerprint === c.fingerprint),
        ),
      );
    assert(
      attempts.filter(
        (r) => istDay(String(r.data.sentAt)) === istDay(Date.now()),
      ).length < limit,
      "Provider account daily ceiling reached across all projects and members.",
      429,
    );
    assert(
      attempts.filter(
        (r) => Date.now() - Date.parse(String(r.data.sentAt)) < 3600000,
      ).length < hourly,
      "Provider account hourly ceiling reached.",
      429,
    );
  }
  private async send(
    actor: ActorContext,
    input: Mutation,
    c: Connection,
    origin: string,
  ) {
    assert(
      input.payload.attestation === true,
      "Confirm you want to send the exact approved message now.",
    );
    const snapshot = await this.db.snapshot(),
      record = requireRecord(snapshot, input.projectId, input.recordId),
      contact = record.contactId
        ? requireRecord(snapshot, input.projectId, record.contactId)
        : undefined;
    assert(
      record.data.connectedAccountId === c.accountId &&
        record.data.deliveryMode === "provider",
      "Choose this connected account and provider delivery, then approve that exact draft.",
      409,
    );
    assert(contact, "Link a project contact first.");
    let args: Data, tool: string;
    if (c.provider === "gmail") {
      assert(
        String(record.data.channel).toLowerCase() === "email",
        "Choose an email draft.",
      );
      const recipient = emailAddress(record.data.recipient);
      assert(
        String(contact.data.email ?? "").toLowerCase() === recipient,
        "Recipient must match the selected project contact email.",
      );
      tool = "GMAIL_SEND_EMAIL";
      args = {
        user_id: "me",
        recipient_email: recipient,
        subject: String(record.data.subject ?? record.title),
        body: String(record.data.body ?? record.data.text),
        is_html: false,
      };
    } else {
      assert(
        String(record.data.channel).toLowerCase() === "instagram",
        "Choose an Instagram draft.",
      );
      const recipient = cleanString(
        record.data.recipient,
        "Instagram recipient ID",
        200,
      );
      assert(
        /^\d+$/.test(recipient) && contact.data.instagramUserId === recipient,
        "Recipient must be the Instagram-scoped ID of the selected contact.",
      );
      const evidence = snapshot.records
        .filter(
          (r) =>
            r.projectId === input.projectId &&
            r.kind === "message" &&
            r.contactId === contact.id &&
            r.data.direction === "inbound" &&
            r.data.channel === "instagram" &&
            r.data.connectedAccountId === c.accountId &&
            r.data.instagramUserId === recipient &&
            r.data.providerMessageId &&
            typeof r.data.receivedAt === "string",
        )
        .sort((a, b) =>
          String(b.data.receivedAt).localeCompare(String(a.data.receivedAt)),
        )[0];
      const trusted = evidence
        ? snapshot.private.requests[
            "instagram-inbound:" +
              c.fingerprint +
              ":" +
              contact.id +
              ":" +
              String(evidence.data.providerMessageId)
          ]
        : undefined;
      const trustedData = object(trusted?.result);
      assert(
        evidence &&
          trustedData.projectId === input.projectId &&
          trustedData.contactId === contact.id &&
          trustedData.recipientId === recipient &&
          trustedData.receivedAt === evidence.data.receivedAt &&
          trustedData.accountId === c.accountId &&
          Date.now() - Date.parse(String(evidence.data.receivedAt)) <
            86400000 &&
          Date.parse(String(evidence.data.receivedAt)) <= Date.now(),
        "Instagram API replies require provider-verified inbound evidence in this account within 24 hours.",
        409,
      );
      tool = "INSTAGRAM_SEND_TEXT_MESSAGE";
      args = {
        recipient_id: recipient,
        text: String(record.data.body ?? record.data.text),
        reply_to_message_id: String(evidence.data.providerMessageId),
      };
    }
    const key = "provider:" + actor.member.id + ":" + input.requestId,
      fingerprint = await digest(JSON.stringify(input));
    const reservation = await transact(this.db, async (state) => {
      this.actor(state, actor, input.projectId);
      const prior = state.private.requests[key];
      if (prior) {
        assert(
          prior.fingerprint === fingerprint,
          "Request ID was already used differently.",
          409,
        );
        return {
          duplicate: true,
          record: requireRecord(state, input.projectId, input.recordId),
        };
      }
      this.ceiling(state, c, input.projectId);
      const result = await applyMutation(
        state,
        { ...actor, internalProvider: true },
        { ...input, action: "provider_send_reserved" },
        origin,
      );
      state.private.requests[key] = {
        at: Date.now(),
        fingerprint,
        result: { recordId: input.recordId },
      };
      return { duplicate: false, record: result.record! };
    });
    if (reservation.duplicate)
      return {
        record: reservation.record,
        duplicate: true,
        message: "Already attempted. No provider send was retried.",
      };
    let accepted = false,
      receipt = "";
    try {
      const response = await this.execute(c, tool, args);
      accepted = response.successful === true && !response.error;
      const data = unwrap(response.data);
      receipt = String(
        data.id ?? data.messageId ?? data.message_id ?? response.log_id ?? "",
      ).slice(0, 500);
    } catch {
      /* Never retry: a timeout may follow acceptance. */
    }
    return transact(this.db, (state) => {
      const current = requireRecord(state, input.projectId, input.recordId);
      assert(
        current.data.sendState === "sending",
        "Send state changed during execution.",
        409,
      );
      current.data.sendState = accepted ? "accepted" : "uncertain";
      current.status = accepted ? "accepted" : "uncertain";
      current.data.providerReceipt = receipt;
      current.updatedAt = now();
      current.version++;
      audit(
        state,
        actor,
        input.projectId,
        current.id,
        "provider_send",
        accepted
          ? "Provider accepted; delivery unconfirmed."
          : "Uncertain outcome; reconcile before any further action.",
      );
      return {
        record: current,
        message: accepted
          ? "Provider accepted the message. Delivery is unconfirmed."
          : "Uncertain outcome. Check the provider; no automatic retry will occur.",
      };
    });
  }
  private async createEvent(
    actor: ActorContext,
    input: Mutation,
    c: Connection,
  ) {
    assert(
      input.payload.attestation === true &&
        typeof input.payload.inviteAttendees === "boolean",
      "Review the exact event and explicitly choose whether attendee notifications are sent.",
    );
    const state = await this.db.snapshot(),
      record = requireRecord(state, input.projectId, input.recordId);
    assert(record.kind === "meeting", "Choose a meeting.");
    assert(
      record.version === input.version,
      "Meeting changed. Refresh before creating it.",
      409,
    );
    assert(record.contactId, "Link a project contact first.");
    const startsAt = cleanString(record.data.startsAt, "Meeting start", 100);
    assert(
      Number.isFinite(Date.parse(startsAt)),
      "Meeting start must be valid.",
    );
    const duration = Number(record.data.durationMinutes ?? 30);
    assert(
      Number.isInteger(duration) && duration > 0 && duration <= 1440,
      "Duration must be 1–1440 minutes.",
    );
    const endsAt =
      typeof record.data.endsAt === "string" && record.data.endsAt
        ? record.data.endsAt
        : new Date(Date.parse(startsAt) + duration * 60000).toISOString();
    assert(
      Number.isFinite(Date.parse(endsAt)) &&
        Date.parse(endsAt) > Date.parse(startsAt),
      "End must follow start.",
    );
    assert(
      /([zZ]|[+-]\d{2}:\d{2})$/.test(startsAt) &&
        /([zZ]|[+-]\d{2}:\d{2})$/.test(endsAt),
      "Meeting times must contain an explicit UTC offset.",
    );
    const selected = requireRecord(state, input.projectId, record.contactId),
      raw = record.data.attendees,
      attendees = (
        Array.isArray(raw)
          ? raw
          : typeof raw === "string"
            ? raw.split(/[,;\n]/)
            : [selected.data.email]
      ).map(emailAddress);
    assert(
      attendees.length > 0 && attendees.length <= 20,
      "Choose 1–20 project contact attendees.",
    );
    for (const email of attendees)
      assert(
        this.contact(state, input.projectId, email),
        "Every attendee must be an existing contact in this project.",
      );
    assert(
      attendees.includes(String(selected.data.email).toLowerCase()),
      "Include the linked contact.",
    );
    const key = "calendar:" + actor.member.id + ":" + input.requestId,
      recordKey = "calendar-record:" + record.id,
      fingerprint = await digest(JSON.stringify(input));
    const duplicate = await transact(this.db, (state) => {
      this.actor(state, actor, input.projectId);
      const prior = state.private.requests[key];
      if (prior) {
        assert(
          prior.fingerprint === fingerprint,
          "Request ID was reused differently.",
          409,
        );
        return true;
      }
      const live = requireRecord(state, input.projectId, input.recordId);
      assert(live.version === input.version, "Meeting changed.", 409);
      assert(
        !state.private.requests[recordKey],
        "This meeting already entered an event creation flow. Reconcile; do not retry.",
        409,
      );
      live.data.calendarState = "creating";
      live.version++;
      live.updatedAt = now();
      state.private.requests[key] = {
        at: Date.now(),
        fingerprint,
        result: { recordId: record.id },
      };
      state.private.requests[recordKey] = {
        at: Date.now(),
        result: { requestId: input.requestId },
      };
      audit(
        state,
        actor,
        input.projectId,
        record.id,
        "calendar_create_reserved",
        input.payload.inviteAttendees
          ? "Human confirmed event creation with attendee notifications."
          : "Human confirmed event creation without notifications.",
      );
      return false;
    });
    if (duplicate)
      return {
        record: requireRecord(
          await this.db.snapshot(),
          input.projectId,
          input.recordId,
        ),
        duplicate: true,
        message: "Already attempted. No provider write was retried.",
      };
    let accepted = false,
      eventId = "",
      meetUrl = "";
    try {
      const response = await this.execute(c, "GOOGLECALENDAR_CREATE_EVENT", {
        calendar_id: "primary",
        summary: record.title,
        start_datetime: startsAt,
        end_datetime: endsAt,
        attendees,
        description: String(
          record.data.description ??
            record.data.agenda ??
            record.data.notes ??
            "",
        ),
        create_meeting_room: true,
        send_updates: input.payload.inviteAttendees ? "all" : "none",
        visibility: "private",
        guestsCanModify: false,
        guestsCanInviteOthers: false,
        guestsCanSeeOtherGuests: false,
      });
      const data = unwrap(response.data);
      eventId = String(data.id ?? data.event_id ?? "").slice(0, 500);
      accepted = response.successful === true && !response.error && !!eventId;
      meetUrl = safeMeetUrl(data.hangout_link ?? data.hangoutLink);
    } catch {
      /* Never retry an uncertain event creation. */
    }
    return transact(this.db, (state) => {
      const live = requireRecord(state, input.projectId, input.recordId);
      live.data.calendarState = accepted ? "accepted" : "uncertain";
      live.data.providerEventId = eventId;
      live.data.connectedAccountId = c.accountId;
      live.data.attendeeNotifications = input.payload.inviteAttendees
        ? "requested"
        : "not_requested";
      if (meetUrl) live.data.meetUrl = meetUrl;
      live.status = accepted ? "scheduled" : "uncertain";
      live.version++;
      live.updatedAt = now();
      audit(
        state,
        actor,
        input.projectId,
        live.id,
        "calendar_create_event",
        accepted
          ? meetUrl
            ? "Created event; provider returned a Google Meet link."
            : "Created event; provider did not return a Meet link."
          : "Uncertain event creation; reconcile Calendar before further action.",
      );
      return {
        record: live,
        message: accepted
          ? meetUrl
            ? "Event created with the returned Google Meet link."
            : "Event created. Google did not return a Meet link."
          : "Uncertain outcome. Check Calendar; no automatic retry will occur.",
      };
    });
  }
}
function providerList(v: unknown): Data[] {
  const d = object(v);
  return Array.isArray(v)
    ? list(v)
    : Array.isArray(d.data)
      ? list(d.data)
      : Array.isArray(object(d.data).data)
        ? list(object(d.data).data)
        : [];
}
function safeMeetUrl(v: unknown) {
  if (typeof v !== "string") return "";
  try {
    const u = new URL(v);
    return u.protocol === "https:" && u.hostname === "meet.google.com"
      ? u.toString()
      : "";
  } catch {
    return "";
  }
}
