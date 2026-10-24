import test from "node:test";
import assert from "node:assert/strict";
import { createLocalDatabase } from "../src/server/local";
import { transact } from "../src/server/database";
import { Providers } from "../src/server/providers";
import {
  applyMutation,
  seedProject,
  type ActorContext,
} from "../src/server/operations";
import type { Mutation } from "../src/shared/types";

test("fixed Gmail adapter verifies binding, scopes inbox, and never retries an uncertain send (mock transport)", async () => {
  const db = await createLocalDatabase(":memory:");
  let sends = 0,
    accepted = true;
  let userId = "";
  const actor: ActorContext = {
    member: {
      id: crypto.randomUUID(),
      name: "Provider fixture",
      email: "fixture@example.test",
      role: "owner",
      projectIds: [],
    },
    machine: false,
  };
  let projectId = "";
  await transact(db, (state) => {
    state.members.push(actor.member);
    projectId = seedProject(state, actor.member.id).id;
    actor.member.projectIds.push(projectId);
  });
  const fetcher: typeof fetch = async (input, options) => {
    const path = String(input);
    assert.ok(path.startsWith("https://backend.composio.dev/api/v3.1/"));
    if (path.endsWith("/connected_accounts/link")) {
      userId = JSON.parse(String(options?.body)).user_id;
      return Response.json({
        connected_account_id: "ca_fixture",
        redirect_url: "https://connect.composio.dev/fixture",
      });
    }
    if (path.endsWith("/connected_accounts/ca_fixture"))
      return Response.json({
        id: "ca_fixture",
        user_id: userId,
        status: "ACTIVE",
        toolkit: { slug: "gmail" },
        auth_config: { id: "ac_fixture" },
      });
    if (path.endsWith("/tools/execute/GMAIL_GET_PROFILE"))
      return Response.json({
        successful: true,
        data: { emailAddress: "sender@example.test" },
      });
    if (path.endsWith("/tools/execute/GMAIL_FETCH_EMAILS"))
      return Response.json({
        successful: true,
        data: {
          messages: [
            {
              id: "matched-1",
              from: "known@example.test",
              subject: "Known reply",
              body: "Known project reply",
            },
            {
              id: "private-other",
              from: "unmatched@example.test",
              subject: "Unrelated private message",
              body: "Do not import",
            },
          ],
        },
      });
    if (path.endsWith("/tools/execute/GMAIL_SEND_EMAIL")) {
      sends++;
      const body = JSON.parse(String(options?.body));
      assert.equal(body.connected_account_id, "ca_fixture");
      assert.equal(body.arguments.recipient_email, "known@example.test");
      return Response.json(
        accepted
          ? { successful: true, data: { id: "provider-fixture-receipt" } }
          : { successful: false, error: "fixture uncertain failure" },
      );
    }
    throw new Error("Unexpected provider operation");
  };
  const providers = new Providers(
    db,
    {
      COMPOSIO_API_KEY: "fixture-not-a-real-key",
      COMPOSIO_GMAIL_AUTH_CONFIG_ID: "ac_fixture",
      COMPOSIO_GMAIL_TOOL_VERSION: "20261024_00",
    },
    fetcher,
  );
  const input = (
    action: string,
    payload: Mutation["payload"],
    recordId?: string,
    version?: number,
  ): Mutation => ({
    action,
    payload,
    projectId,
    recordId,
    version,
    requestId: crypto.randomUUID(),
  });
  try {
    const link = await providers.action(
      actor,
      input("connect_provider", { provider: "gmail" }),
      "https://crm.example.test",
    );
    assert.match(String(link.url), /^https:\/\/connect\.composio\.dev\//);
    const state = await db.snapshot(),
      connectionId = Object.keys(state.private.connections!)[0];
    await providers.action(
      actor,
      input("provider_connection_status", { connectionId }),
      "https://crm.example.test",
    );
    const contact = await transact(
      db,
      async (state) =>
        (
          await applyMutation(
            state,
            actor,
            input("create_record", {
              kind: "contact",
              title: "Known fixture",
              data: { email: "known@example.test" },
            }),
            "",
          )
        ).record!,
    );
    await providers.action(actor, input("fetch_inbox", { connectionId }), "");
    const messages = (await db.snapshot()).records.filter(
      (r) => r.kind === "message",
    );
    assert.equal(messages.length, 1);
    assert.equal(messages[0].data.providerMessageId, "matched-1");
    const draft = async () => {
      let record = await transact(
        db,
        async (state) =>
          (
            await applyMutation(
              state,
              actor,
              input("create_record", {
                kind: "draft",
                title: "Fixture email",
                contactId: contact.id,
                data: {
                  body: "Exact approved fixture",
                  channel: "Email",
                  deliveryMode: "provider",
                  recipient: "known@example.test",
                  connectedAccountId: "ca_fixture",
                },
              }),
              "",
            )
          ).record!,
      );
      record = await transact(
        db,
        async (state) =>
          (
            await applyMutation(
              state,
              actor,
              input("approve_draft", {}, record.id, record.version),
              "",
            )
          ).record!,
      );
      return record;
    };
    const first = await draft(),
      send = input(
        "provider_send",
        { connectionId, attestation: true },
        first.id,
        first.version,
      );
    const sent = await providers.action(actor, send, "");
    assert.equal(sent.record?.status, "accepted");
    assert.equal(sends, 1);
    await providers.action(actor, send, "");
    assert.equal(sends, 1);
    accepted = false;
    const second = await draft(),
      uncertain = input(
        "provider_send",
        { connectionId, attestation: true },
        second.id,
        second.version,
      );
    const result = await providers.action(actor, uncertain, "");
    assert.equal(result.record?.status, "uncertain");
    await providers.action(actor, uncertain, "");
    assert.equal(sends, 2);
    await assert.rejects(
      () =>
        providers.action(
          { ...actor, machine: true },
          input(
            "provider_send",
            { connectionId, attestation: true },
            second.id,
            second.version,
          ),
          "",
        ),
      /individual/,
    );
  } finally {
    await db.close?.();
  }
});

async function fixture() {
  const db = await createLocalDatabase(":memory:");
  const actor: ActorContext = {
    member: {
      id: crypto.randomUUID(),
      name: "Integration fixture",
      email: "integration@example.test",
      role: "owner",
      projectIds: [],
    },
    machine: false,
  };
  let projectId = "";
  await transact(db, (state) => {
    state.members.push(actor.member);
    const project = seedProject(state, actor.member.id);
    project.settings.hourlySendLimit = 20;
    projectId = project.id;
    actor.member.projectIds.push(projectId);
  });
  const input = (
    action: string,
    payload: Mutation["payload"],
    recordId?: string,
    version?: number,
  ): Mutation => ({
    action,
    payload,
    recordId,
    version,
    projectId,
    requestId: crypto.randomUUID(),
  });
  const create = async (
    kind: string,
    title: string,
    data: Mutation["payload"] = {},
    contactId?: string,
  ) =>
    transact(
      db,
      async (state) =>
        (
          await applyMutation(
            state,
            actor,
            input("create_record", {
              kind,
              title,
              data,
              ...(contactId ? { contactId } : {}),
            }),
            "",
          )
        ).record!,
    );
  return { db, actor, input, create, projectId };
}

test("Calendar sync scopes private events and individually creates reviewed events with actual returned Meet links (mock transport)", async () => {
  const f = await fixture();
  let userId = "",
    creates = 0,
    uncertain = false,
    notifications: string[] = [];
  const fetcher: typeof fetch = async (url, options) => {
    const path = String(url),
      body = options?.body ? JSON.parse(String(options.body)) : {};
    if (path.endsWith("/connected_accounts/link")) {
      userId = body.user_id;
      return Response.json({
        connected_account_id: "ca_calendar",
        redirect_url: "https://connect.composio.dev/calendar-fixture",
      });
    }
    if (path.endsWith("/connected_accounts/ca_calendar"))
      return Response.json({
        id: "ca_calendar",
        user_id: userId,
        status: "ACTIVE",
        toolkit: { slug: "googlecalendar" },
        auth_config: { id: "ac_calendar" },
      });
    if (path.endsWith("/tools/execute/GOOGLECALENDAR_GET_CURRENT_USER"))
      return Response.json({
        successful: true,
        data: { email: "calendar-owner@example.test" },
      });
    if (path.endsWith("/tools/execute/GOOGLECALENDAR_EVENTS_LIST")) {
      assert.equal(body.arguments.calendarId, "primary");
      assert.equal(body.arguments.singleEvents, true);
      assert.ok(body.arguments.timeMin && body.arguments.timeMax);
      assert.equal(body.arguments.calendar_id, undefined);
      return Response.json({
        successful: true,
        data: {
          items: [
            {
              id: "project-event",
              summary: "Project discovery",
              attendees: [
                { email: "known-calendar@example.test" },
                { email: "private-coattendee@example.test" },
              ],
              start: { dateTime: "2026-10-25T10:00:00+05:30" },
              end: { dateTime: "2026-10-25T10:30:00+05:30" },
            },
            {
              id: "private-event",
              summary: "Private family event",
              attendees: [{ email: "unmatched@example.test" }],
            },
          ],
          nextPageToken: "more-provider-items",
        },
      });
    }
    if (path.endsWith("/tools/execute/GOOGLECALENDAR_CREATE_EVENT")) {
      creates++;
      assert.equal(body.arguments.calendar_id, "primary");
      assert.equal(body.arguments.create_meeting_room, true);
      assert.deepEqual(body.arguments.attendees, [
        "known-calendar@example.test",
      ]);
      assert.equal(body.arguments.guestsCanInviteOthers, false);
      notifications.push(body.arguments.send_updates);
      if (uncertain)
        throw new Error("Mock timeout after possible provider acceptance");
      return Response.json({
        successful: true,
        data: {
          response_data: {
            id: "created-" + creates,
            hangout_link: "https://meet.google.com/abc-defg-hij",
          },
        },
      });
    }
    throw Error("Unexpected fixed Calendar endpoint");
  };
  const provider = new Providers(
    f.db,
    {
      COMPOSIO_API_KEY: "fixture-only",
      COMPOSIO_GOOGLECALENDAR_AUTH_CONFIG_ID: "ac_calendar",
      COMPOSIO_GOOGLECALENDAR_TOOL_VERSION: "20261010_00",
    },
    fetcher,
  );
  try {
    const contact = await f.create("contact", "Known Calendar person", {
      email: "known-calendar@example.test",
    });
    const connected = await provider.action(
      f.actor,
      f.input("connect_provider", { provider: "googlecalendar" }),
      "https://crm.example.test",
    );
    const connectionId = String(connected.connectionId);
    const sync = await provider.action(
      f.actor,
      f.input("sync_calendar", { connectionId }),
      "",
    );
    assert.equal(sync.imported, 1);
    assert.equal(sync.skipped, 1);
    assert.equal(sync.truncated, true);
    const meetings = (await f.db.snapshot()).records.filter(
      (r) => r.kind === "meeting",
    );
    assert.equal(meetings.length, 1);
    assert.deepEqual(meetings[0].data.attendees, [
      "known-calendar@example.test",
    ]);
    assert.equal(
      JSON.stringify(meetings).includes("private-coattendee"),
      false,
    );
    const meeting = await f.create(
      "meeting",
      "Reviewed discovery",
      {
        startsAt: "2026-10-26T10:00:00+05:30",
        durationMinutes: 45,
        attendees: ["known-calendar@example.test"],
      },
      contact.id,
    );
    await assert.rejects(
      () =>
        provider.action(
          f.actor,
          f.input(
            "calendar_create_event",
            { connectionId, attestation: false, inviteAttendees: true },
            meeting.id,
            meeting.version,
          ),
          "",
        ),
      /Review/,
    );
    assert.equal(creates, 0);
    const result = await provider.action(
      f.actor,
      f.input(
        "calendar_create_event",
        { connectionId, attestation: true, inviteAttendees: false },
        meeting.id,
        meeting.version,
      ),
      "",
    );
    assert.equal(
      result.record?.data.meetUrl,
      "https://meet.google.com/abc-defg-hij",
    );
    assert.equal(result.record?.status, "scheduled");
    assert.equal(notifications[0], "none");
    await assert.rejects(
      () =>
        provider.action(
          f.actor,
          f.input(
            "calendar_create_event",
            { connectionId, attestation: true, inviteAttendees: true },
            meeting.id,
            meeting.version,
          ),
          "",
        ),
      /changed/,
    );
    assert.equal(creates, 1);
    const second = await f.create(
      "meeting",
      "Explicit invitation",
      {
        startsAt: "2026-10-27T10:00:00+05:30",
        endsAt: "2026-10-27T11:00:00+05:30",
        attendees: ["known-calendar@example.test"],
      },
      contact.id,
    );
    uncertain = true;
    const failed = await provider.action(
      f.actor,
      f.input(
        "calendar_create_event",
        { connectionId, attestation: true, inviteAttendees: true },
        second.id,
        second.version,
      ),
      "",
    );
    assert.equal(failed.record?.data.calendarState, "uncertain");
    assert.equal(notifications[1], "all");
    const current = (await f.db.snapshot()).records.find(
      (r) => r.id === second.id,
    )!;
    await assert.rejects(
      () =>
        provider.action(
          f.actor,
          f.input(
            "calendar_create_event",
            { connectionId, attestation: true, inviteAttendees: true },
            current.id,
            current.version,
          ),
          "",
        ),
      /already entered/,
    );
    assert.equal(creates, 2);
    await assert.rejects(
      () =>
        provider.action(
          { ...f.actor, machine: true },
          f.input("sync_calendar", { connectionId }),
          "",
        ),
      /individual/,
    );
  } finally {
    await f.db.close?.();
  }
});

test("Instagram accepts only provider-verified recent inbound replies while manual cold drafts remain available (mock transport)", async () => {
  const f = await fixture();
  let userId = "",
    sends = 0;
  const fetcher: typeof fetch = async (url, options) => {
    const path = String(url),
      body = options?.body ? JSON.parse(String(options.body)) : {};
    if (path.endsWith("/connected_accounts/link")) {
      userId = body.user_id;
      return Response.json({
        connected_account_id: "ca_instagram",
        redirect_url: "https://connect.composio.dev/instagram-fixture",
      });
    }
    if (path.endsWith("/connected_accounts/ca_instagram"))
      return Response.json({
        id: "ca_instagram",
        user_id: userId,
        status: "ACTIVE",
        toolkit: { slug: "instagram" },
        auth_config: { id: "ac_instagram" },
      });
    if (path.endsWith("/tools/execute/INSTAGRAM_GET_USER_INFO"))
      return Response.json({
        successful: true,
        data: { data: { id: "10001", account_type: "BUSINESS" } },
      });
    if (path.endsWith("/tools/execute/INSTAGRAM_LIST_ALL_CONVERSATIONS"))
      return Response.json({
        successful: true,
        data: {
          data: [
            {
              id: "known-conversation",
              participants: { data: [{ id: "10001" }, { id: "20002" }] },
            },
            {
              id: "private-conversation",
              participants: { data: [{ id: "10001" }, { id: "30003" }] },
            },
          ],
        },
      });
    if (path.endsWith("/tools/execute/INSTAGRAM_LIST_ALL_MESSAGES")) {
      assert.equal(body.arguments.conversation_id, "known-conversation");
      return Response.json({
        successful: true,
        data: {
          data: [
            {
              id: "provider-real-inbound",
              from: { id: "20002" },
              to: { data: [{ id: "10001" }] },
              message: "I would like details.",
              created_time: new Date(Date.now() - 60000).toISOString(),
            },
          ],
        },
      });
    }
    if (path.endsWith("/tools/execute/INSTAGRAM_SEND_TEXT_MESSAGE")) {
      sends++;
      assert.equal(body.arguments.recipient_id, "20002");
      assert.equal(body.arguments.reply_to_message_id, "provider-real-inbound");
      assert.equal(body.arguments.text, "Here are the details you requested.");
      return Response.json({
        successful: true,
        data: { message_id: "provider-accepted-reply" },
      });
    }
    throw Error("Unexpected fixed Instagram endpoint");
  };
  const provider = new Providers(
    f.db,
    {
      COMPOSIO_API_KEY: "fixture-only",
      COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID: "ac_instagram",
      COMPOSIO_INSTAGRAM_TOOL_VERSION: "20261014_00",
    },
    fetcher,
  );
  try {
    const contact = await f.create("contact", "Known Instagram person", {
      instagramUserId: "20002",
      handle: "known_fixture",
    });
    const connection = await provider.action(
        f.actor,
        f.input("connect_provider", { provider: "instagram" }),
        "https://crm.example.test",
      ),
      connectionId = String(connection.connectionId);
    const cold = await f.create(
      "draft",
      "Manual cold draft",
      {
        body: "Human will copy and send this manually.",
        channel: "Instagram",
        deliveryMode: "manual",
      },
      contact.id,
    );
    const coldApproved = await transact(f.db, async (state) =>
      applyMutation(
        state,
        f.actor,
        f.input("approve_draft", {}, cold.id, cold.version),
        "",
      ),
    );
    assert.equal(coldApproved.record?.status, "approved");
    const before = await f.create(
      "draft",
      "Provider cold attempt",
      {
        body: "Must not send",
        channel: "Instagram",
        deliveryMode: "provider",
        recipient: "20002",
        connectedAccountId: "ca_instagram",
      },
      contact.id,
    );
    await assert.rejects(
      () =>
        provider.action(
          f.actor,
          f.input(
            "provider_send",
            { connectionId, attestation: true },
            before.id,
            before.version,
          ),
          "",
        ),
      /provider-verified inbound/,
    );
    assert.equal(sends, 0);
    const sync = await provider.action(
      f.actor,
      f.input("fetch_instagram_inbox", { connectionId }),
      "",
    );
    assert.equal(sync.imported, 1);
    assert.equal(sync.skipped, 1);
    assert.equal(
      (await f.db.snapshot()).records.filter((r) => r.kind === "message")
        .length,
      1,
    );
    let draft = await f.create(
      "draft",
      "Reviewed Instagram reply",
      {
        body: "Here are the details you requested.",
        channel: "Instagram",
        deliveryMode: "provider",
        recipient: "20002",
        connectedAccountId: "ca_instagram",
      },
      contact.id,
    );
    draft = (
      await transact(f.db, async (state) =>
        applyMutation(
          state,
          f.actor,
          f.input("approve_draft", {}, draft.id, draft.version),
          "",
        ),
      )
    ).record!;
    const sent = await provider.action(
      f.actor,
      f.input(
        "provider_send",
        { connectionId, attestation: true },
        draft.id,
        draft.version,
      ),
      "",
    );
    assert.equal(sent.record?.status, "accepted");
    assert.equal(sends, 1);
    await transact(f.db, (state) => {
      for (const entry of Object.values(state.private.requests)) {
        const value = entry.result as Record<string, unknown>;
        if (value && value.recipientId === "20002") {
          value.receivedAt = new Date(Date.now() - 90000000).toISOString();
        }
      }
      for (const message of state.records.filter((r) => r.kind === "message"))
        message.data.receivedAt = new Date(Date.now() - 90000000).toISOString();
    });
    const expired = await f.create(
      "draft",
      "Expired provider reply",
      {
        body: "Do not send after the window",
        channel: "Instagram",
        deliveryMode: "provider",
        recipient: "20002",
        connectedAccountId: "ca_instagram",
      },
      contact.id,
    );
    await assert.rejects(
      () =>
        provider.action(
          f.actor,
          f.input(
            "provider_send",
            { connectionId, attestation: true },
            expired.id,
            expired.version,
          ),
          "",
        ),
      /within 24 hours/,
    );
    assert.equal(sends, 1);
  } finally {
    await f.db.close?.();
  }
});

test("duplicate Gmail OAuth connections to one mailbox share transactional sending ceilings across projects (mock transport)", async () => {
  const f = await fixture();
  let connectionCount = 0,
    sends = 0;
  const users: Record<string, string> = {};
  const fetcher: typeof fetch = async (url, options) => {
    const path = String(url),
      body = options?.body ? JSON.parse(String(options.body)) : {};
    if (path.endsWith("/connected_accounts/link")) {
      const id = "ca_duplicate_" + ++connectionCount;
      users[id] = body.user_id;
      return Response.json({
        connected_account_id: id,
        redirect_url: "https://connect.composio.dev/mailbox-fixture",
      });
    }
    const id = path.split("/").at(-1)!;
    if (users[id])
      return Response.json({
        id,
        user_id: users[id],
        status: "ACTIVE",
        toolkit: { slug: "gmail" },
        auth_config: { id: "ac_duplicate" },
      });
    if (path.endsWith("/tools/execute/GMAIL_GET_PROFILE"))
      return Response.json({
        successful: true,
        data: { data: { emailAddress: "same-physical-mailbox@example.test" } },
      });
    if (path.endsWith("/tools/execute/GMAIL_SEND_EMAIL")) {
      sends++;
      return Response.json({
        successful: true,
        data: { id: "accepted-" + sends },
      });
    }
    throw Error("Unexpected endpoint");
  };
  const provider = new Providers(
    f.db,
    {
      COMPOSIO_API_KEY: "fixture-only",
      COMPOSIO_GMAIL_AUTH_CONFIG_ID: "ac_duplicate",
      COMPOSIO_GMAIL_TOOL_VERSION: "20261018_00",
    },
    fetcher,
  );
  try {
    const firstLink = await provider.action(
      f.actor,
      f.input("connect_provider", { provider: "gmail" }),
      "https://crm.example.test",
    );
    await provider.action(
      f.actor,
      f.input("provider_connection_status", {
        connectionId: firstLink.connectionId as string,
      }),
      "",
    );
    const contact = await f.create("contact", "First project person", {
      email: "first@example.test",
    });
    let draft = await f.create(
      "draft",
      "First send",
      {
        body: "First approved",
        channel: "Email",
        deliveryMode: "provider",
        recipient: "first@example.test",
        connectedAccountId: "ca_duplicate_1",
      },
      contact.id,
    );
    draft = (
      await transact(f.db, async (state) =>
        applyMutation(
          state,
          f.actor,
          f.input("approve_draft", {}, draft.id, draft.version),
          "",
        ),
      )
    ).record!;
    await provider.action(
      f.actor,
      f.input(
        "provider_send",
        { connectionId: firstLink.connectionId as string, attestation: true },
        draft.id,
        draft.version,
      ),
      "",
    );
    const secondProject = await transact(f.db, (state) => {
      const p = seedProject(state, f.actor.member.id, "Second fixture project");
      p.settings.dailySendLimit = 1;
      f.actor.member.projectIds.push(p.id);
      state.members
        .find((m) => m.id === f.actor.member.id)!
        .projectIds.push(p.id);
      return p;
    });
    const secondInput = (
      action: string,
      payload: Mutation["payload"],
      recordId?: string,
      version?: number,
    ) => ({
      ...f.input(action, payload, recordId, version),
      projectId: secondProject.id,
    });
    const second = await provider.action(
      f.actor,
      secondInput("connect_provider", { provider: "gmail" }),
      "https://crm.example.test",
    );
    await provider.action(
      f.actor,
      secondInput("provider_connection_status", {
        connectionId: second.connectionId as string,
      }),
      "",
    );
    const c2 = await transact(
      f.db,
      async (state) =>
        (
          await applyMutation(
            state,
            f.actor,
            secondInput("create_record", {
              kind: "contact",
              title: "Second project person",
              data: { email: "second@example.test" },
            }),
            "",
          )
        ).record!,
    );
    let d2 = await transact(
      f.db,
      async (state) =>
        (
          await applyMutation(
            state,
            f.actor,
            secondInput("create_record", {
              kind: "draft",
              title: "Second project attempt",
              contactId: c2.id,
              data: {
                body: "Second approved",
                channel: "Email",
                deliveryMode: "provider",
                recipient: "second@example.test",
                connectedAccountId: "ca_duplicate_2",
              },
            }),
            "",
          )
        ).record!,
    );
    d2 = (
      await transact(f.db, async (state) =>
        applyMutation(
          state,
          f.actor,
          secondInput("approve_draft", {}, d2.id, d2.version),
          "",
        ),
      )
    ).record!;
    await assert.rejects(
      () =>
        provider.action(
          f.actor,
          secondInput(
            "provider_send",
            { connectionId: second.connectionId as string, attestation: true },
            d2.id,
            d2.version,
          ),
          "",
        ),
      /daily ceiling/,
    );
    assert.equal(sends, 1);
  } finally {
    await f.db.close?.();
  }
});
