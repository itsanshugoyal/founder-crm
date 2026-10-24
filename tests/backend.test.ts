import test from "node:test";
import assert from "node:assert/strict";
import { createApplication } from "../src/server/app";
import { createLocalDatabase } from "../src/server/local";
import type { CrmRecord, MutationResult } from "../src/shared/types";

test("private persistent Postgres HTTP workflows and authorization", async (t) => {
  const db = await createLocalDatabase(":memory:");
  const { app } = await createApplication({ db, mode: "local" });
  let cookie = "",
    csrf = "",
    projectId = "";
  const send = async (
    path: string,
    data?: unknown,
    extra: Record<string, string> = {},
  ) =>
    app.request("http://localhost" + path, {
      method: data ? "POST" : "GET",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
        ...extra,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  const mutate = async (
    action: string,
    payload: unknown = {},
    record?: CrmRecord,
    project = projectId,
    requestId = crypto.randomUUID(),
  ) =>
    send("/api/mutate", {
      action,
      projectId: project,
      recordId: record?.id,
      version: record?.version,
      requestId,
      payload,
    });
  const create = async (
    kind: string,
    title: string,
    data: unknown = {},
    contactId?: string,
  ) => {
    const response = await mutate("create_record", {
      kind,
      title,
      data,
      contactId: contactId ?? null,
    });
    assert.equal(response.status, 200, await response.clone().text());
    return ((await response.json()) as MutationResult).record!;
  };
  try {
    await t.test(
      "fails closed before individual setup and rejects weak credentials",
      async () => {
        assert.equal((await send("/api/workspace")).status, 401);
        const session = await (await send("/api/session")).json();
        assert.equal(session.setupRequired, true);
        assert.equal(
          (
            await send("/api/auth/setup", {
              name: "Owner",
              email: "owner@example.test",
              password: "short",
            })
          ).status,
          400,
        );
      },
    );
    await t.test(
      "creates private owner and HttpOnly signed session",
      async () => {
        const response = await send("/api/auth/setup", {
          name: "Owner",
          email: "owner@example.test",
          password: "correct horse battery staple",
        });
        assert.equal(response.status, 200);
        cookie = response.headers.get("set-cookie")!.split(";")[0];
        assert.match(response.headers.get("set-cookie")!, /HttpOnly/);
        const session = await response.json();
        csrf = session.csrfToken;
        const workspace = await (await send("/api/workspace")).json();
        projectId = workspace.projects[0].id;
        assert.equal(
          workspace.records.filter((r: CrmRecord) => r.kind === "contact")
            .length,
          0,
        );
      },
    );
    await t.test("rejects missing csrf and hostile origins", async () => {
      const input = {
        action: "create_record",
        projectId,
        requestId: crypto.randomUUID(),
        payload: { kind: "task", title: "bad" },
      };
      assert.equal(
        (await send("/api/mutate", input, { "X-CSRF-Token": "" })).status,
        403,
      );
      assert.equal(
        (await send("/api/mutate", input, { Origin: "https://evil.test" }))
          .status,
        403,
      );
    });
    let contact: CrmRecord, draft: CrmRecord;
    await t.test(
      "persists edits, rejects stale versions and idempotently applies requests",
      async () => {
        contact = await create("contact", "A real test fixture", {
          email: "fixture@example.test",
        });
        const requestId = crypto.randomUUID();
        const first = await mutate(
          "create_record",
          { kind: "task", title: "Follow up" },
          undefined,
          projectId,
          requestId,
        );
        const one = await first.json();
        const second = await (
          await mutate(
            "create_record",
            { kind: "task", title: "Follow up" },
            undefined,
            projectId,
            requestId,
          )
        ).json();
        assert.equal(one.record.id, second.record.id);
        assert.equal(second.duplicate, true);
        const edited = await mutate(
          "update_record",
          { title: "Updated contact" },
          contact,
        );
        assert.equal(edited.status, 200);
        assert.equal(
          (await mutate("update_record", { title: "stale" }, contact)).status,
          409,
        );
        contact = (await edited.json()).record;
      },
    );
    await t.test("isolates references between projects", async () => {
      const created = await (
        await mutate("create_project", { name: "Second venture" })
      ).json();
      const foreign = await create("company", "Scoped company");
      const result = await mutate(
        "create_record",
        {
          kind: "opportunity",
          title: "Foreign reference",
          data: { companyId: foreign.id },
        },
        undefined,
        created.project.id,
      );
      assert.equal(result.status, 400);
    });
    await t.test(
      "requires exact approval, human attestation and prevents repeat sends",
      async () => {
        draft = await create(
          "draft",
          "Reply",
          {
            body: "Hello, this is a fixture.",
            channel: "Email",
            recipient: "fixture@example.test",
          },
          contact.id,
        );
        assert.equal(
          (await mutate("confirm_send", { attestation: true }, draft)).status,
          409,
        );
        let approved = (await (await mutate("approve_draft", {}, draft)).json())
          .record;
        assert.equal((await mutate("confirm_send", {}, approved)).status, 400);
        const sent = await mutate(
          "confirm_send",
          { attestation: true },
          approved,
        );
        assert.equal(sent.status, 200);
        approved = (await sent.json()).record;
        assert.equal(
          (await mutate("confirm_send", { attestation: true }, approved))
            .status,
          409,
        );
      },
    );
    await t.test(
      "blocks opt-outs, reserved creator handles, expired Instagram windows",
      async () => {
        for (const [title, data, channel] of [
          ["Opted out", { optOut: true }, "Email"],
          ["mrsumitreview", {}, "Instagram"],
          ["Expired reply", {}, "Instagram"],
        ] as const) {
          const c = await create("contact", title, data);
          const d = await create(
            "draft",
            "Blocked draft",
            {
              body: "Must not send",
              channel,
              deliveryMode: channel === "Instagram" ? "provider" : "manual",
            },
            c.id,
          );
          assert.equal((await mutate("approve_draft", {}, d)).status, 409);
        }
      },
    );
    await t.test(
      "scoped MCP token can write tasks but cannot approve or cross projects",
      async () => {
        const result = await (
          await mutate("create_mcp_token", { label: "test", expiresInDays: 1 })
        ).json();
        const auth = {
          Authorization: "Bearer " + result.token,
          "X-CSRF-Token": "",
        };
        const mutation = {
          action: "create_record",
          projectId,
          requestId: crypto.randomUUID(),
          payload: { kind: "task", title: "MCP task" },
        };
        assert.equal((await send("/api/mutate", mutation, auth)).status, 200);
        assert.equal(
          (
            await send(
              "/api/mutate",
              {
                ...mutation,
                action: "approve_draft",
                recordId: draft.id,
                version: draft.version,
                requestId: crypto.randomUUID(),
              },
              auth,
            )
          ).status,
          403,
        );
      },
    );
    await t.test(
      "validates integer money and produces invoice PDF with a redacted read-only share",
      async () => {
        assert.equal(
          (
            await mutate("create_record", {
              kind: "invoice",
              title: "Invalid",
              data: { amountCents: 1.5 },
            })
          ).status,
          400,
        );
        let invoice = await create("invoice", "Fixture invoice", {
          currency: "INR",
          invoiceNumber: "INV-TEST",
          items: [{ description: "Pilot", quantity: 1, unitCents: 400000 }],
          privateNotes: "Never shared",
        });
        invoice = (await (await mutate("invoice_issue", {}, invoice)).json())
          .record;
        assert.equal(invoice.status, "issued");
        const pdf = await send("/api/invoices/" + invoice.id + "/pdf");
        assert.equal(pdf.status, 200);
        assert.equal(pdf.headers.get("content-type"), "application/pdf");
        const shared = await (await mutate("create_share", {}, invoice)).json();
        const view = await (await send("/api/share/" + shared.token)).json();
        assert.equal(view.data.privateNotes, undefined);
        assert.equal(
          (await mutate("update_record", { title: "changed" }, invoice)).status,
          409,
        );
      },
    );
    await t.test(
      "denies production when configuration is missing",
      async () => {
        const { app: production } = await createApplication();
        const session = await (await production.request("/api/session")).json();
        assert.equal(session.authenticated, false);
        assert.equal(session.setupRequired, true);
        assert.equal((await production.request("/api/workspace")).status, 401);
        assert.equal(
          (await production.request("/api/auth/setup", { method: "POST" }))
            .status,
          403,
        );
      },
    );
  } finally {
    await db.close?.();
  }
});
