import test from "node:test";
import assert from "node:assert/strict";
import { createApplication } from "../src/server/app";
import { createLocalDatabase } from "../src/server/local";
import type { CrmRecord, Fields, MutationResult } from "../src/shared/types";

test("security review regressions through authenticated HTTP boundaries", async (t) => {
  const db = await createLocalDatabase(":memory:");
  const { app } = await createApplication({ db, mode: "local" });
  let cookie = "",
    csrf = "",
    projectId = "";
  const send = (url: string, data?: unknown, token?: string) =>
    app.request(`http://localhost${url}`, {
      method: data === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : { Cookie: cookie, "X-CSRF-Token": csrf }),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  const mutate = (
    action: string,
    payload: Fields = {},
    record?: CrmRecord,
    token?: string,
    project = projectId,
    requestId = crypto.randomUUID(),
  ) =>
    send(
      "/api/mutate",
      {
        action,
        payload,
        projectId: project,
        recordId: record?.id,
        version: record?.version,
        requestId,
      },
      token,
    );
  const okay = async (response: Response) => {
    assert.equal(response.status, 200, await response.clone().text());
    return (await response.json()) as MutationResult;
  };
  const denied = async (response: Response) =>
    assert.ok(
      response.status >= 400 && response.status < 500,
      `Expected client rejection; received ${response.status}`,
    );
  const create = async (
    kind: string,
    title: string,
    data: Fields = {},
    contactId: string | null = null,
  ) => {
    const result = await okay(
      await mutate("create_record", { kind, title, data, contactId }),
    );
    assert.ok(result.record);
    return result.record;
  };
  const current = async (id: string) => {
    const response = await send("/api/workspace");
    assert.equal(response.status, 200);
    const body = await response.json();
    const record = body.records.find((r: CrmRecord) => r.id === id) as
      CrmRecord | undefined;
    assert.ok(record);
    return record;
  };
  try {
    const response = await send("/api/auth/setup", {
      name: "Security fixture owner",
      email: "security-review@example.test",
      password: "A dedicated security fixture password",
    });
    assert.equal(response.status, 200, await response.clone().text());
    cookie = response.headers.get("set-cookie")!.split(";")[0];
    csrf = (await response.json()).csrfToken;
    const login = await send("/api/auth/login", {
      email: "security-review@example.test",
      password: "A dedicated security fixture password",
    });
    assert.equal(login.status, 200);
    cookie = login.headers.get("set-cookie")!.split(";")[0];
    csrf = (await login.json()).csrfToken;
    projectId = (await (await send("/api/workspace")).json()).projects[0].id;
    const token = (
      await okay(
        await mutate("create_mcp_token", {
          label: "Security fixture",
          expiresInDays: 1,
        }),
      )
    ).token;
    assert.ok(token);

    await t.test(
      "MCP cannot replay human secret-bearing request results",
      async () => {
        const sensitiveRequest = crypto.randomUUID();
        const humanToken = await okay(
          await mutate(
            "create_mcp_token",
            { label: "Human-only credential" },
            undefined,
            undefined,
            projectId,
            sensitiveRequest,
          ),
        );
        assert.ok(humanToken.token);
        await denied(
          await mutate(
            "create_mcp_token",
            { label: "Human-only credential" },
            undefined,
            token,
            projectId,
            sensitiveRequest,
          ),
        );
      },
    );
    await t.test("MCP cannot replay a cached human invitation", async () => {
      const inviteRequest = crypto.randomUUID();
      await okay(
        await mutate(
          "invite_member",
          {
            name: "Invited fixture",
            email: "invite-security@example.test",
            role: "viewer",
          },
          undefined,
          undefined,
          projectId,
          inviteRequest,
        ),
      );
      await denied(
        await mutate(
          "invite_member",
          {
            name: "Invited fixture",
            email: "invite-security@example.test",
            role: "viewer",
          },
          undefined,
          token,
          projectId,
          inviteRequest,
        ),
      );
    });
    await t.test(
      "MCP cannot replay a cached mutation from another project",
      async () => {
        const foreign = (
          await okay(
            await mutate("create_project", {
              name: "Confidential second project",
            }),
          )
        ).project!;
        const foreignRequest = crypto.randomUUID();
        await okay(
          await mutate(
            "create_record",
            {
              kind: "knowledge",
              title: "Private cross-project fixture",
              data: { body: "Not visible to first-project token" },
            },
            undefined,
            undefined,
            foreign.id,
            foreignRequest,
          ),
        );
        await denied(
          await mutate(
            "create_record",
            {
              kind: "knowledge",
              title: "Private cross-project fixture",
              data: { body: "Not visible to first-project token" },
            },
            undefined,
            token,
            foreign.id,
            foreignRequest,
          ),
        );
      },
    );

    await t.test(
      "completed send records retain immutable send receipts",
      async () => {
        const contact = await create("contact", "Send fixture", {
          email: "send-security@example.test",
        });
        let draft = await create(
          "draft",
          "Exact approved fixture",
          {
            body: "A fixture sent manually.",
            channel: "email",
            recipient: "send-security@example.test",
          },
          contact.id,
        );
        draft = (await okay(await mutate("approve_draft", {}, draft))).record!;
        draft = (
          await okay(await mutate("confirm_send", { attestation: true }, draft))
        ).record!;
        await denied(
          await mutate(
            "update_record",
            {
              status: "draft",
              data: {
                body: "A fixture sent manually.",
                channel: "email",
                recipient: "send-security@example.test",
              },
            },
            draft,
          ),
        );
        const unchanged = await current(draft.id);
        assert.equal(unchanged.data.sendState, draft.data.sendState);
        assert.equal(unchanged.data.sentAt, draft.data.sentAt);
        assert.equal(unchanged.status, draft.status);
      },
    );

    await t.test(
      "MCP cannot update or archive existing payment and expense records",
      async () => {
        for (const kind of ["payment", "expense"]) {
          const record = await create(kind, `Human ${kind}`, {
            amountCents: 10000,
            currency: "INR",
          });
          await denied(
            await mutate(
              "update_record",
              { data: { amountCents: 1, currency: "INR" } },
              record,
              token,
            ),
          );
          await denied(
            await mutate("archive_record", {}, await current(record.id), token),
          );
          const unchanged = await current(record.id);
          assert.equal(unchanged.data.amountCents, 10000);
          assert.notEqual(unchanged.status, "archived");
        }
      },
    );

    await t.test(
      "generic machine edits cannot remove opt-out suppression",
      async () => {
        const contact = await create("contact", "Suppressed fixture", {
          optOut: true,
          email: "suppressed@example.test",
        });
        const result = await mutate(
          "update_record",
          {
            status: "active",
            data: {
              email: "suppressed@example.test",
              optOut: false,
              optedOut: false,
              doNotContact: false,
            },
          },
          contact,
          token,
        );
        if (result.status !== 200) await denied(result);
        const draft = await create(
          "draft",
          "Suppressed message",
          {
            body: "Must remain blocked",
            channel: "email",
            recipient: "suppressed@example.test",
          },
          contact.id,
        );
        await denied(await mutate("approve_draft", {}, draft));
      },
    );

    await t.test(
      "machine-authored timestamps never qualify as verified Instagram inbound evidence",
      async () => {
        const contact = await create("contact", "No verified inbound", {
          handle: "security_fixture_only",
        });
        const forgedTime = new Date().toISOString();
        const update = await mutate(
          "update_record",
          {
            data: {
              handle: "security_fixture_only",
              lastInboundAt: forgedTime,
            },
          },
          contact,
          token,
        );
        if (update.status !== 200) await denied(update);
        const draftResult = await mutate(
          "create_record",
          {
            kind: "draft",
            title: "Forged reply-window fixture",
            contactId: contact.id,
            data: {
              body: "Must remain blocked",
              channel: "instagram",
              lastInboundAt: forgedTime,
            },
          },
          undefined,
          token,
        );
        if (draftResult.status === 200) {
          const draft = ((await draftResult.json()) as MutationResult).record!;
          await denied(await mutate("approve_draft", {}, draft));
        } else await denied(draftResult);
      },
    );

    await t.test(
      "shared public views redact nested private fields",
      async () => {
        const marker = "PRIVATE_NESTED_SECURITY_FIXTURE";
        const invoice = await create("invoice", "Public invoice fixture", {
          currency: "INR",
          items: [
            {
              description: "Visible line",
              quantity: 1,
              unitCents: 10000,
              privateNotes: marker,
              internal: { memo: marker },
            },
          ],
          privateNotes: marker,
        });
        const invoiceShare = await okay(
          await mutate("create_share", {}, invoice),
        );
        assert.ok(invoiceShare.token);
        const publicInvoice = await send(`/api/share/${invoiceShare.token}`);
        assert.equal(publicInvoice.status, 200);
        const renderedInvoice = await publicInvoice.text();
        assert.ok(renderedInvoice.includes("Visible line"));
        assert.ok(
          !renderedInvoice.includes(marker),
          "Nested invoice private fields must not be public",
        );
      },
    );
    await t.test(
      "public links do not publish subsequent machine edits",
      async () => {
        const proposal = await create("proposal", "Reviewed public proposal", {
          scope: "Human reviewed scope",
          deliverables: "Reviewed deliverable",
          currency: "INR",
          amountCents: 10000,
        });
        const shared = await okay(await mutate("create_share", {}, proposal));
        assert.ok(shared.token);
        const initial = await send(`/api/share/${shared.token}`);
        assert.equal(initial.status, 200);
        const initialPublic = await initial.json();
        const edit = await mutate(
          "update_record",
          {
            title: "Machine modified public title",
            data: {
              scope: "Machine inserted unreviewed scope",
              deliverables: "Changed deliverable",
            },
          },
          proposal,
          token,
        );
        if (edit.status !== 200) await denied(edit);
        const after = await send(`/api/share/${shared.token}`);
        if (after.status === 200)
          assert.deepEqual(
            await after.json(),
            initialPublic,
            "A human-created public link must not publish later machine edits",
          );
        else await denied(after);
      },
    );
  } finally {
    await db.close?.();
  }
});
