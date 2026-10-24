import {
  EXPERIMENT_HANDLES,
  KINDS,
  type CrmRecord,
  type Fields,
  type Member,
  type Mutation,
  type MutationResult,
  type Project,
} from "../shared/types";
import type { State } from "./database";
import {
  assert,
  cleanString,
  digest,
  emailAddress,
  passwordHash,
  randomToken,
} from "./security";
export interface ActorContext {
  member: Member;
  machine: boolean;
  projectId?: string;
  internalProvider?: boolean;
}
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const suppressedStatus = (status: string) =>
  ["opted_out", "unsubscribed", "do_not_contact"].includes(
    status.toLowerCase(),
  );
export function contactIdentities(data: Fields): string[] {
  const identities: string[] = [];
  if (typeof data.email === "string" && data.email.trim())
    identities.push("email:" + data.email.trim().toLowerCase());
  if (typeof data.handle === "string" && data.handle.trim())
    identities.push(
      "instagram:" + data.handle.trim().replace(/^@/, "").toLowerCase(),
    );
  for (const key of ["profileUrl", "linkedinUrl"])
    if (typeof data[key] === "string" && data[key]) {
      try {
        const u = new URL(data[key] as string);
        const host = u.hostname.replace(/^www\./, "").toLowerCase(),
          path = u.pathname.replace(/\/+$/, "").toLowerCase();
        if (host === "instagram.com" && path)
          identities.push("instagram:" + path.split("/").filter(Boolean)[0]);
        else if (path) identities.push("profile:" + host + path);
      } catch {
        /* Invalid URLs are rejected by input validation. */
      }
    }
  if (Array.isArray(data.identityAliases))
    identities.push(
      ...data.identityAliases.filter(
        (value): value is string => typeof value === "string",
      ),
    );
  return [...new Set(identities)];
}
function checkContactUnique(
  state: State,
  projectId: string,
  data: Fields,
  except?: string,
) {
  const keys = contactIdentities(data);
  assert(
    !state.records.some(
      (r) =>
        r.id !== except &&
        r.projectId === projectId &&
        r.kind === "contact" &&
        r.status !== "archived" &&
        contactIdentities(r.data).some((k) => keys.includes(k)),
    ),
    "A contact with this email or social identity already exists in this project.",
    409,
  );
}
export function requireProject(
  state: State,
  actor: ActorContext,
  projectId: string,
) {
  assert(
    actor.member.projectIds.includes(projectId),
    "You do not have access to this project.",
    403,
  );
  assert(
    !actor.machine || actor.projectId === projectId,
    "Token is scoped to a different project.",
    403,
  );
  const p = state.projects.find((p) => p.id === projectId);
  assert(p, "Project not found.", 404);
  return p;
}
export function requireRecord(
  state: State,
  projectId: string,
  recordId: unknown,
) {
  const record = state.records.find(
    (r) => r.id === recordId && r.projectId === projectId,
  );
  assert(record, "Record not found in this project.", 404);
  return record;
}
function owner(actor: ActorContext) {
  assert(
    !actor.machine && actor.member.role === "owner",
    "An individual owner must perform this action.",
    403,
  );
}
function human(actor: ActorContext) {
  assert(
    !actor.machine,
    "AI and MCP tokens cannot approve, send, share, invite, issue invoices, or manage access.",
    403,
  );
}
function writable(actor: ActorContext) {
  assert(actor.member.role !== "viewer", "Viewers cannot make changes.", 403);
}
export function audit(
  state: State,
  actor: ActorContext,
  projectId: string,
  recordId: string | null,
  action: string,
  detail: string,
) {
  state.activities.push({
    id: id(),
    projectId,
    recordId,
    actor: actor.machine ? `${actor.member.name} (MCP)` : actor.member.name,
    action,
    at: now(),
    detail,
  });
}
function checkVersion(record: CrmRecord, version: unknown) {
  assert(
    Number.isInteger(version) && version === record.version,
    "This record changed. Refresh before saving.",
    409,
  );
}
function dataObject(value: unknown): Fields {
  assert(
    value !== null && typeof value === "object" && !Array.isArray(value),
    "Record data must be an object.",
  );
  assert(JSON.stringify(value).length <= 100000, "Record data is too large.");
  return structuredClone(value as Fields);
}
const controlled = new Set([
  "identityAliases",
  "deliveryRecordedAt",
  "deliveryChannel",
  "deliveryReference",
  "approvedHash",
  "approvedAt",
  "approvedBy",
  "sendState",
  "sentAt",
  "providerReceipt",
  "issuedAt",
  "paidAt",
  "paidCents",
  "shareToken",
  "sendError",
  "lastSendRequestId",
]);
function validateData(
  state: State,
  projectId: string,
  kind: string,
  data: Fields,
) {
  if (kind === "contact") {
    if (data.email) emailAddress(data.email);
    if (typeof data.segment === "string")
      data.segment = data.segment.trim().toLowerCase().replace(/[ -]+/g, "_");
    if (
      data.qualificationScore !== undefined &&
      data.qualificationScore !== null
    )
      assert(
        Number.isInteger(data.qualificationScore) &&
          Number(data.qualificationScore) >= 0 &&
          Number(data.qualificationScore) <= 10,
        "Qualification score must be an integer from 0 to 10.",
      );
  }
  for (const key of [
    "profileUrl",
    "linkedinUrl",
    "evidenceUrl",
    "destinationUrl",
    "meetingUrl",
    "receiptUrl",
    "publishedUrl",
    "sourceUrl",
    "website",
  ])
    if (data[key]) {
      let u: URL;
      try {
        u = new URL(String(data[key]));
      } catch {
        assert(false, `${key} must be a valid HTTP or HTTPS URL.`);
      }
      assert(
        ["http:", "https:"].includes(u!.protocol),
        `${key} must use HTTP or HTTPS.`,
      );
    }
  if (data.collaboratorIds !== undefined) {
    assert(
      Array.isArray(data.collaboratorIds) &&
        data.collaboratorIds.every(
          (v) =>
            typeof v === "string" &&
            state.members.some(
              (m) => m.id === v && m.projectIds.includes(projectId),
            ),
        ),
      "Collaborators must be members of this project.",
    );
  }
  for (const key of Object.keys(data)) {
    assert(
      !controlled.has(key) || (kind === "payment" && key === "paidAt"),
      `${key} is managed by the server.`,
    );
    if (
      /Id$/.test(key) &&
      key !== "externalId" &&
      key !== "accountId" &&
      typeof data[key] === "string" &&
      data[key]
    ) {
      const target = state.records.find((r) => r.id === data[key]);
      if (target)
        assert(
          target.projectId === projectId,
          "References must stay within this project.",
        );
      else if (
        [
          "companyId",
          "opportunityId",
          "campaignId",
          "draftId",
          "invoiceId",
          "proposalId",
          "experimentId",
          "onboardingId",
          "taskId",
          "contactId",
        ].includes(key)
      )
        assert(false, `${key} does not identify a record in this project.`);
    }
  }
  if (kind === "invoice" || kind === "expense" || kind === "payment") {
    for (const key of [
      "amountCents",
      "subtotalCents",
      "taxCents",
      "totalCents",
    ])
      if (data[key] !== undefined && data[key] !== null)
        assert(
          Number.isSafeInteger(data[key]) &&
            Number(data[key]) >= 0 &&
            Number(data[key]) <= 100000000000,
          `${key} must be a non-negative integer in minor currency units.`,
        );
    if (data.taxBps !== undefined && data.taxBps !== null)
      assert(
        Number.isInteger(data.taxBps) &&
          Number(data.taxBps) >= 0 &&
          Number(data.taxBps) <= 10000,
        "Tax must be integer basis points between 0 and 10000.",
      );
    if (data.currency !== undefined)
      assert(
        typeof data.currency === "string" && /^[A-Z]{3}$/.test(data.currency),
        "Currency must be a three-letter uppercase code.",
      );
    if (data.items !== undefined) {
      assert(
        Array.isArray(data.items) && data.items.length <= 100,
        "Invoice items must be a list of at most 100 items.",
      );
      for (const item of data.items) {
        assert(
          item && typeof item === "object" && !Array.isArray(item),
          "Invalid line item.",
        );
        assert(
          Number.isSafeInteger(item.quantity) &&
            Number(item.quantity) > 0 &&
            Number(item.quantity) <= 100000,
          "Line quantity must be a positive integer.",
        );
        assert(
          Number.isSafeInteger(item.unitCents) && Number(item.unitCents) >= 0,
          "Line price must be integer minor units.",
        );
        assert(
          Number.isSafeInteger(Number(item.quantity) * Number(item.unitCents)),
          "Line item amount is too large.",
        );
      }
    }
  }
}
function recordFields(
  state: State,
  projectId: string,
  payload: Fields,
  kind: string,
  base?: CrmRecord,
) {
  const title =
    payload.title === undefined && base
      ? base.title
      : cleanString(payload.title, "Title", 500);
  const status =
    payload.status === undefined
      ? (base?.status ?? "active")
      : cleanString(payload.status, "Status", 80);
  const ownerId =
    payload.ownerId === undefined ? (base?.ownerId ?? null) : payload.ownerId;
  const contactId =
    payload.contactId === undefined
      ? (base?.contactId ?? null)
      : payload.contactId;
  assert(
    ownerId === null ||
      state.members.some(
        (m) => m.id === ownerId && m.projectIds.includes(projectId),
      ),
    "Owner must be a project member.",
  );
  if (contactId !== null)
    assert(
      requireRecord(state, projectId, contactId).kind === "contact",
      "Contact reference must identify a contact.",
    );
  const dueAt =
    payload.dueAt === undefined ? (base?.dueAt ?? null) : payload.dueAt;
  assert(
    dueAt === null ||
      (typeof dueAt === "string" && Number.isFinite(Date.parse(dueAt))),
    "Due date must be valid.",
  );
  const data =
    payload.data === undefined ? (base?.data ?? {}) : dataObject(payload.data);
  validateData(state, projectId, kind, data);
  return {
    title,
    status,
    ownerId: ownerId as string | null,
    contactId: contactId as string | null,
    dueAt: dueAt as string | null,
    data,
  };
}
export async function draftHash(record: CrmRecord, project?: Project) {
  return digest(
    JSON.stringify({
      title: record.title,
      contactId: record.contactId,
      body: record.data.body ?? record.data.text ?? "",
      channel: record.data.channel ?? "",
      recipient: record.data.recipient ?? "",
      subject: record.data.subject ?? "",
      accountId:
        record.data.connectedAccountId ?? record.data.accountId ?? "manual",
      deliveryMode: record.data.deliveryMode ?? "manual",
      accountContext: record.data.accountContext ?? "",
      offerVersion: project?.version ?? 1,
    }),
  );
}
export function outboundChecks(state: State, record: CrmRecord) {
  const contact = record.contactId
    ? requireRecord(state, record.projectId, record.contactId)
    : undefined;
  assert(contact, "A specific contact is required before sending.");
  assert(contact.kind === "contact", "Choose a person as the draft recipient.");
  const identities = contactIdentities(contact.data);
  assert(
    !state.records.some(
      (r) =>
        r.kind === "contact" &&
        contactIdentities(r.data).some((k) => identities.includes(k)) &&
        (r.data.optOut === true ||
          r.data.optedOut === true ||
          r.data.doNotContact === true ||
          r.data.suppressed === true ||
          ["opted_out", "unsubscribed", "do_not_contact"].includes(
            r.status.toLowerCase(),
          )),
    ),
    "This contact identity is suppressed from outreach.",
    409,
  );
  assert(
    contact.data.suppressed !== true,
    "This contact is suppressed from outreach.",
    409,
  );
  assert(
    contact.data.segment !== "brand_deal",
    "Brand-deal experiments need a separately approved offer and campaign.",
    409,
  );
  if (record.data.legacyDraft === true) {
    const raw = Array.isArray(contact.data.evidence)
      ? contact.data.evidence
      : [];
    const fresh = [
      ...raw,
      {
        url: contact.data.evidenceUrl,
        text: contact.data.observation,
        checkedAt: contact.data.checkedAt,
      },
    ].some((e) => {
      if (!e || typeof e !== "object" || Array.isArray(e)) return false;
      const item = e as Fields;
      const checked =
        typeof item.checkedAt === "string" ? Date.parse(item.checkedAt) : NaN;
      return (
        typeof item.url === "string" &&
        /^https?:\/\//.test(item.url) &&
        typeof item.text === "string" &&
        !!item.text.trim() &&
        checked <= Date.now() &&
        Date.now() - checked <= 30 * 86400000
      );
    });
    assert(
      fresh,
      "Reverify actual evidence before approving an imported legacy draft.",
      409,
    );
  }
  assert(
    contact.data.optOut !== true &&
      contact.data.optedOut !== true &&
      contact.data.doNotContact !== true &&
      !["opted_out", "unsubscribed", "do_not_contact"].includes(
        contact.status.toLowerCase(),
      ),
    "This contact has opted out of outreach.",
    409,
  );
  const handles = [
    contact.title,
    contact.data.handle,
    contact.data.instagramHandle,
    record.data.recipient,
  ]
    .filter((x) => typeof x === "string")
    .map((x) => String(x).toLowerCase().replace(/^@/, ""));
  assert(
    !EXPERIMENT_HANDLES.some((handle) =>
      handles.some(
        (value) =>
          value === handle ||
          value.endsWith("/" + handle) ||
          value.endsWith("/" + handle + "/"),
      ),
    ),
    "This handle is reserved for an isolated experiment and is blocked from outreach.",
    409,
  );
  const channel = String(record.data.channel ?? "").toLowerCase();
  assert(
    ["email", "instagram", "linkedin", "whatsapp", "manual"].includes(channel),
    "Choose a supported outreach channel.",
  );
  if (channel === "instagram" && record.data.deliveryMode === "provider") {
    const last = contact.data.lastInboundAt;
    assert(
      contact.data.lastInboundChannel === "instagram" &&
        typeof last === "string" &&
        Date.now() - Date.parse(last) <= 24 * 60 * 60 * 1000 &&
        Date.parse(last) <= Date.now(),
      "Instagram replies require a recorded Instagram inbound message within the last 24 hours.",
      409,
    );
  }
  assert(
    typeof (record.data.body ?? record.data.text) === "string" &&
      String(record.data.body ?? record.data.text).trim().length > 0,
    "A non-empty draft body is required.",
  );
}
export function sendAccount(record: CrmRecord) {
  return record.data.deliveryMode === "provider" &&
    record.data.connectedAccountId
    ? String(record.data.connectedAccountId)
    : "manual:" + String(record.data.channel).toLowerCase();
}
export function istDay(date: string | number) {
  return new Date(new Date(date).getTime() + 19800000)
    .toISOString()
    .slice(0, 10);
}
function countSend(state: State, record: CrmRecord, project: Project) {
  const current = Date.now(),
    account = sendAccount(record),
    channel = String(record.data.channel).toLowerCase(),
    day = istDay(current);
  const sends = state.records.filter(
    (r) =>
      r.kind === "draft" &&
      r.data.sendState &&
      sendAccount(r) === account &&
      typeof r.data.sentAt === "string",
  );
  const daily = Math.min(
      Number(project.settings.dailySendLimit ?? 25),
      channel === "instagram" ? 15 : channel === "linkedin" ? 25 : 100,
    ),
    hourly = Math.min(Number(project.settings.hourlySendLimit ?? 5), 20);
  assert(
    sends.filter((r) => istDay(String(r.data.sentAt)) === day).length < daily,
    "Account daily send ceiling reached. Wait until a later day before sending.",
    429,
  );
  assert(
    sends.filter((r) => current - Date.parse(String(r.data.sentAt)) < 3600000)
      .length < hourly,
    "Account hourly send limit reached.",
    429,
  );
}
export function seedProject(
  state: State,
  memberId: string,
  name = "DealDock",
  description = "Founder workspace for honest, human-reviewed operations.",
): Project {
  const project: Project = {
    id: id(),
    name,
    slug:
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + id().slice(0, 6),
    description,
    settings: {
      dailySendLimit: 25,
      hourlySendLimit: 5,
      sourceOfTruth:
        "Postgres CRM; original Airtable preserved until verified cutover",
    },
    createdAt: now(),
    version: 1,
  };
  state.projects.push(project);
  state.records.push({
    id: id(),
    projectId: project.id,
    kind: "knowledge",
    title: "Operating instructions",
    status: "active",
    ownerId: memberId,
    contactId: null,
    dueAt: null,
    data: {
      body: "Use honest design-partner positioning. Never invent customers, testimonials, revenue, results, or integrations. Every outbound message needs human review and an individual send. AI and MCP cannot approve or send. Opt-outs and Instagram reply windows are enforced. Keep the five creator experiments isolated. No paid AI APIs or n8n activation. Original Airtable remains preserved until a verified cutover.",
    },
    version: 1,
    createdAt: now(),
    updatedAt: now(),
  });
  return project;
}
export async function applyMutation(
  state: State,
  actor: ActorContext,
  mutation: Mutation,
  origin: string,
): Promise<MutationResult> {
  const { action, payload, projectId } = mutation;
  assert(
    payload && typeof payload === "object" && !Array.isArray(payload),
    "Payload must be an object.",
  );
  if (action === "accept_invite") {
    human(actor);
    throw new Error(
      "Invite acceptance uses the public authenticated setup handler.",
    );
  }
  writable(actor);
  if (action === "create_project") {
    owner(actor);
    const name = cleanString(payload.name, "Project name", 100);
    const project = seedProject(
      state,
      actor.member.id,
      name,
      typeof payload.description === "string" ? payload.description : "",
    );
    actor.member.projectIds.push(project.id);
    audit(state, actor, project.id, null, action, "Created project");
    return { project };
  }
  const project = requireProject(state, actor, projectId);
  const allowedMachine = [
    "create_record",
    "update_record",
    "archive_record",
    "apply_changeset",
  ];
  if (actor.machine)
    assert(
      allowedMachine.includes(action),
      "MCP tokens cannot perform this action.",
      403,
    );
  if (action === "create_record") {
    const kind = String(payload.kind);
    assert(
      (KINDS as readonly string[]).includes(kind),
      "Unsupported record kind.",
    );
    assert(
      !actor.machine || !["payment", "expense"].includes(kind),
      "Financial writes require a human.",
      403,
    );
    const fields = recordFields(state, projectId, payload, kind);
    if (["draft", "message", "conversation"].includes(kind))
      assert(
        !["approved", "sent", "sending", "accepted", "delivered"].includes(
          fields.status.toLowerCase(),
        ),
        "Outbound state requires dedicated approval and send actions.",
      );
    if (kind === "invoice")
      assert(
        !["issued", "paid", "partially_paid"].includes(
          fields.status.toLowerCase(),
        ),
        "Invoices must be explicitly issued.",
      );
    if (actor.machine) {
      assert(
        !["paid", "paying", "issued", "sent", "accepted", "delivered"].includes(
          fields.status.toLowerCase(),
        ),
        "MCP cannot create financial or outbound outcome claims.",
        403,
      );
      assert(
        ![
          "lastInboundAt",
          "optOut",
          "optedOut",
          "doNotContact",
          "connectedAccountId",
          "accountId",
        ].some((key) => key in fields.data),
        "MCP cannot set consent, inbound-window, or sending-account evidence.",
        403,
      );
    }
    assert(
      !("lastInboundAt" in fields.data) &&
        !("lastInboundChannel" in fields.data),
      "Record an inbound reply through the dedicated action.",
    );
    if (kind === "contact") checkContactUnique(state, projectId, fields.data);
    if (kind === "contact" && suppressedStatus(fields.status))
      fields.data.suppressed = true;
    const record: CrmRecord = {
      id: id(),
      projectId,
      kind: kind as CrmRecord["kind"],
      ...fields,
      version: 1,
      createdAt: now(),
      updatedAt: now(),
    };
    state.records.push(record);
    audit(state, actor, projectId, record.id, action, `Created ${kind}`);
    return { record };
  }
  if (action === "update_project") {
    owner(actor);
    assert(
      mutation.version === project.version,
      "Project changed. Refresh before saving.",
      409,
    );
    if (payload.name !== undefined)
      project.name = cleanString(payload.name, "Project name", 100);
    if (payload.description !== undefined)
      project.description = cleanString(
        payload.description,
        "Description",
        5000,
      );
    if (payload.settings !== undefined) {
      const settings = dataObject(payload.settings);
      for (const key of ["dailySendLimit", "hourlySendLimit"])
        if (settings[key] !== undefined)
          assert(
            Number.isInteger(settings[key]) &&
              Number(settings[key]) > 0 &&
              Number(settings[key]) <= 100,
            "Send limits must be positive integers no greater than 100.",
          );
      project.settings = { ...project.settings, ...settings };
    }
    project.version = (project.version ?? 1) + 1;
    for (const draft of state.records.filter(
      (r) =>
        r.projectId === projectId &&
        r.kind === "draft" &&
        r.status === "approved",
    )) {
      draft.status = "draft";
      delete draft.data.approvedHash;
      delete draft.data.approvedAt;
      delete draft.data.approvedBy;
      draft.version++;
      draft.updatedAt = now();
    }
    audit(
      state,
      actor,
      projectId,
      null,
      action,
      "Updated project settings and revoked affected approvals",
    );
    return { project };
  }
  if (["create_member", "invite_member", "invite"].includes(action)) {
    owner(actor);
    const email = emailAddress(payload.email);
    assert(
      !state.members.some((m) => m.email === email),
      "A member with that email already exists.",
    );
    const role = payload.role ?? "member";
    assert(
      ["owner", "member", "viewer"].includes(String(role)),
      "Invalid role.",
    );
    const projectIds = Array.isArray(payload.projectIds)
      ? (payload.projectIds as string[])
      : [projectId];
    assert(projectIds.length > 0, "Select at least one project.");
    for (const p of projectIds) requireProject(state, actor, p);
    const member: Member = {
      id: id(),
      name: cleanString(payload.name, "Name", 100),
      email,
      role: role as Member["role"],
      projectIds,
    };
    state.members.push(member);
    const token = randomToken();
    state.private.invites[await digest(token)] = {
      memberId: member.id,
      expires: Date.now() + 7 * 86400000,
    };
    audit(
      state,
      actor,
      projectId,
      null,
      "invite_member",
      "Created a private invite link; no email sent",
    );
    return {
      url: origin + "/?invite=" + token,
      message: "Invite link created. No email was sent.",
    };
  }
  if (action === "create_mcp_token") {
    owner(actor);
    const token = randomToken();
    const days = Number(payload.expiresInDays ?? 7);
    assert(
      Number.isInteger(days) && days >= 1 && days <= 30,
      "Token lifetime must be 1–30 days.",
    );
    state.private.tokens[await digest(token)] = {
      memberId: actor.member.id,
      projectId,
      expires: Date.now() + days * 86400000,
      label: typeof payload.label === "string" ? payload.label : "MCP",
    };
    audit(
      state,
      actor,
      projectId,
      null,
      action,
      "Created a project-scoped expiring token",
    );
    return {
      token,
      message: "Copy this token now. It will not be shown again.",
    };
  }
  if (action === "list_mcp_tokens") {
    owner(actor);
    return {
      tokens: Object.entries(state.private.tokens)
        .filter(([, t]) => t.projectId === projectId)
        .map(([id, t]) => ({
          id,
          label: t.label,
          expires: t.expires,
          projectId: t.projectId,
        })),
    };
  }
  if (action === "revoke_mcp_token") {
    owner(actor);
    const key = cleanString(payload.tokenId, "Token identifier", 100);
    assert(
      state.private.tokens[key]?.projectId === projectId,
      "Token not found.",
      404,
    );
    delete state.private.tokens[key];
    audit(state, actor, projectId, null, action, "Revoked MCP token");
    return { message: "Token revoked." };
  }
  if (action === "apply_changeset") {
    const changes = payload.changes;
    assert(
      Array.isArray(changes) && changes.length > 0 && changes.length <= 50,
      "A changeset must contain 1–50 changes.",
    );
    const preview = structuredClone(state);
    const results: MutationResult[] = [];
    for (const change of changes) {
      assert(
        change && typeof change === "object" && !Array.isArray(change),
        "Invalid changeset entry.",
      );
      assert(
        ["create_record", "update_record", "archive_record"].includes(
          String(change.action),
        ),
        "Changesets can only create, update, or archive records.",
      );
      results.push(
        await applyMutation(
          preview,
          actor,
          {
            ...(change as unknown as Mutation),
            projectId,
            requestId: mutation.requestId,
            payload: (change.payload ?? {}) as Fields,
          },
          origin,
        ),
      );
    }
    if (payload.apply === true) {
      Object.assign(state, preview);
      return { message: "Changes applied atomically.", results };
    }
    return {
      message: "Preview only. Submit apply: true to apply these changes.",
      preview: results,
    };
  }
  const record = requireRecord(state, projectId, mutation.recordId);
  checkVersion(record, mutation.version);
  if (record.kind === "contact" && suppressedStatus(record.status))
    record.data.suppressed = true;
  if (action === "merge_contacts") {
    human(actor);
    assert(record.kind === "contact", "Choose a contact to merge.");
    const target = requireRecord(state, projectId, payload.targetId);
    assert(
      target.kind === "contact" &&
        target.id !== record.id &&
        target.status !== "archived",
      "Choose a different active contact in this project.",
    );
    checkVersion(target, payload.targetVersion);
    if (suppressedStatus(target.status)) target.data.suppressed = true;
    target.data.identityAliases = [
      ...new Set([
        ...contactIdentities(target.data),
        ...contactIdentities(record.data),
      ]),
    ];
    const protectedKeys = new Set([
      "lastInboundAt",
      "lastInboundChannel",
      "optOut",
      "optedOut",
      "doNotContact",
      "suppressed",
    ]);
    for (const [key, value] of Object.entries(record.data))
      if (
        !protectedKeys.has(key) &&
        (target.data[key] === undefined ||
          target.data[key] === null ||
          target.data[key] === "")
      )
        target.data[key] = value;
    for (const key of ["optOut", "optedOut", "doNotContact", "suppressed"])
      if (record.data[key] === true) target.data[key] = true;
    const prior = Array.isArray(target.data.mergedFromIds)
      ? target.data.mergedFromIds
      : [];
    target.data.mergedFromIds = [...prior, record.id];
    record.data.mergedIntoId = target.id;
    record.status = "archived";
    for (const linked of state.records.filter(
      (r) => r.contactId === record.id && !r.data.sendState,
    )) {
      linked.contactId = target.id;
      if (linked.kind === "draft") {
        delete linked.data.approvedHash;
        delete linked.data.approvedAt;
        delete linked.data.approvedBy;
        linked.status = "draft";
      }
      linked.version++;
      linked.updatedAt = now();
    }
    record.version++;
    target.version++;
    record.updatedAt = target.updatedAt = now();
    audit(
      state,
      actor,
      projectId,
      target.id,
      action,
      "Merged contact relationships; original archived record and notes retained.",
    );
    return {
      record: target,
      message:
        "Contacts merged. Original history is preserved and affected drafts need review.",
    };
  }
  if (actor.machine)
    assert(
      !["payment", "expense"].includes(record.kind),
      "Financial writes require a human.",
      403,
    );
  if (action === "release_suppression") {
    owner(actor);
    assert(record.kind === "contact", "Choose a contact.");
    assert(
      payload.attestation === true,
      "Confirm the contact explicitly consented to further outreach.",
    );
    const reason = cleanString(payload.reason, "Consent evidence", 2000);
    delete record.data.optOut;
    delete record.data.optedOut;
    delete record.data.doNotContact;
    delete record.data.suppressed;
    record.data.consentEvidence = reason;
    record.status = "active";
    record.version++;
    record.updatedAt = now();
    audit(
      state,
      actor,
      projectId,
      record.id,
      action,
      "Owner recorded explicit renewed consent",
    );
    return { record };
  }
  if (action === "update_record") {
    assert(
      !record.data.sendState,
      "A draft already entered a send flow. Do not retry or edit it.",
      409,
    );
    assert(
      !(record.kind === "invoice" && record.data.issuedAt),
      "Issued invoices are immutable; create a correction.",
      409,
    );
    if (actor.machine)
      assert(
        !["payment", "expense"].includes(record.kind),
        "Financial writes require a human.",
        403,
      );
    const base = {
      ...record,
      data: Object.fromEntries(
        Object.entries(record.data).filter(([key]) => !controlled.has(key)),
      ),
    };
    const fields = recordFields(state, projectId, payload, record.kind, base);
    if (record.kind === "contact") {
      if (suppressedStatus(fields.status)) fields.data.suppressed = true;
      fields.data.identityAliases = [
        ...new Set([
          ...contactIdentities(record.data),
          ...contactIdentities(fields.data),
        ]),
      ];
      checkContactUnique(state, projectId, fields.data, record.id);
      if (record.data.suppressed === true) fields.data.suppressed = true;
    }
    for (const key of ["lastInboundAt", "lastInboundChannel"]) {
      assert(
        fields.data[key] === undefined || fields.data[key] === record.data[key],
        "Inbound-window evidence is set only by the reply action.",
      );
      if (record.data[key] !== undefined) fields.data[key] = record.data[key];
    }
    for (const key of ["optOut", "optedOut", "doNotContact"])
      if (record.data[key] === true) fields.data[key] = true;
    if (["draft", "message", "conversation"].includes(record.kind))
      assert(
        !["approved", "sent", "sending", "accepted", "delivered"].includes(
          fields.status.toLowerCase(),
        ),
        "Approval and send status are managed through dedicated actions.",
      );
    if (actor.machine) {
      assert(
        !["paid", "paying", "issued", "sent", "accepted", "delivered"].includes(
          fields.status.toLowerCase(),
        ),
        "MCP cannot create financial or outbound outcome claims.",
        403,
      );
      for (const key of [
        "lastInboundAt",
        "optOut",
        "optedOut",
        "doNotContact",
        "connectedAccountId",
        "accountId",
      ])
        assert(
          JSON.stringify(fields.data[key]) === JSON.stringify(record.data[key]),
          "MCP cannot alter consent, inbound-window, or account evidence.",
          403,
        );
    }
    Object.assign(record, fields);
    if (record.kind === "draft" && record.data.approvedHash) {
      delete record.data.approvedHash;
      delete record.data.approvedAt;
      delete record.data.approvedBy;
    }
    if (record.kind === "draft" && record.status === "approved")
      record.status = "draft";
  } else if (action === "archive_record") {
    assert(
      !record.data.issuedAt && !record.data.sendState,
      "Issued invoices and send receipts cannot be archived.",
      409,
    );
    record.status = "archived";
  } else if (action === "approve_draft") {
    human(actor);
    assert(record.kind === "draft", "Only a draft can be approved.");
    assert(
      !record.data.sendState,
      "This draft has already entered a send flow.",
      409,
    );
    outboundChecks(state, record);
    record.data.approvedHash = await draftHash(record, project);
    record.data.approvedAt = now();
    record.data.approvedBy = actor.member.id;
    record.status = "approved";
  } else if (action === "confirm_send" || action === "provider_send_reserved") {
    human(actor);
    if (action === "provider_send_reserved")
      assert(
        actor.internalProvider,
        "Provider reservations are internal only.",
        403,
      );
    assert(record.kind === "draft", "Only an approved draft can be sent.");
    assert(
      record.status === "approved" &&
        record.data.approvedHash === (await draftHash(record, project)),
      "Approve the exact current draft before sending.",
      409,
    );
    assert(
      !record.data.sendState,
      "This draft has already entered a send flow. Do not retry.",
      409,
    );
    outboundChecks(state, record);
    countSend(state, record, project);
    record.data.sentAt = now();
    if (action === "confirm_send") {
      assert(
        record.data.deliveryMode !== "provider",
        "Use the verified provider send action for this draft.",
      );
      assert(
        payload.attestation === true,
        "Confirm that you manually sent this exact approved message.",
      );
      record.data.sendState = "manually_confirmed";
      record.status = "sent";
    } else {
      record.data.sendState = "sending";
      record.status = "sending";
    }
  } else if (action === "invoice_confirm_sent") {
    human(actor);
    assert(
      record.kind === "invoice" && record.data.issuedAt,
      "Issue the invoice before recording delivery.",
    );
    assert(
      payload.attestation === true,
      "Confirm you personally shared this invoice.",
    );
    assert(
      !record.data.deliveryRecordedAt,
      "Invoice delivery is already recorded.",
      409,
    );
    record.data.deliveryRecordedAt = now();
    record.data.deliveryChannel = String(payload.channel ?? "manual");
    record.data.deliveryReference =
      typeof payload.reference === "string"
        ? payload.reference.slice(0, 300)
        : "";
    record.status = record.data.paidAt
      ? "paid"
      : Number(record.data.paidCents) > 0
        ? "partially_paid"
        : "sent";
  } else if (action === "record_reply") {
    human(actor);
    const body = cleanString(payload.body ?? payload.text, "Reply text", 20000);
    const contactId = record.kind === "contact" ? record.id : record.contactId;
    assert(contactId, "Choose a contact before recording a reply.");
    const contact = requireRecord(state, projectId, contactId);
    contact.data.lastInboundAt = now();
    contact.data.lastInboundChannel = String(
      payload.channel ?? "manual",
    ).toLowerCase();
    contact.updatedAt = now();
    contact.version++;
    if (
      payload.optOut === true ||
      /^(stop|unsubscribe|do not contact( me)?|remove me)[.!\s]*$/i.test(
        body.trim(),
      )
    ) {
      contact.data.optOut = true;
      contact.status = "opted_out";
    }
    for (const followup of state.records.filter(
      (r) =>
        r.projectId === projectId &&
        r.contactId === contactId &&
        ["task", "draft", "automation"].includes(r.kind) &&
        ["queued", "scheduled", "pending"].includes(r.status),
    )) {
      followup.status = "cancelled";
      followup.data.cancellationReason =
        "Contact replied; follow-up sequence stopped";
      followup.version++;
      followup.updatedAt = now();
    }
    const reply: CrmRecord = {
      id: id(),
      projectId,
      kind: "message",
      title: "Inbound reply",
      status: "received",
      ownerId: actor.member.id,
      contactId,
      dueAt: null,
      data: {
        body,
        channel: payload.channel ?? "manual",
        direction: "inbound",
        receivedAt: now(),
      },
      version: 1,
      createdAt: now(),
      updatedAt: now(),
    };
    state.records.push(reply);
  } else if (action === "invoice_issue" || action === "issue_invoice") {
    human(actor);
    assert(record.kind === "invoice", "Choose an invoice.");
    assert(!record.data.issuedAt, "This invoice has already been issued.", 409);
    validateData(state, projectId, record.kind, record.data);
    assert(typeof record.data.currency === "string", "A currency is required.");
    const items = record.data.items;
    const subtotal = Array.isArray(items)
      ? items.reduce<number>(
          (n, item) =>
            n +
            Number((item as Fields).quantity) *
              Number((item as Fields).unitCents),
          0,
        )
      : Number(record.data.amountCents ?? record.data.totalCents);
    const tax = Array.isArray(items)
      ? Math.round((subtotal * Number(record.data.taxBps ?? 0)) / 10000)
      : 0;
    const total = subtotal + tax;
    assert(
      Number.isSafeInteger(total) && total > 0 && total <= 100000000000,
      "Invoice total must be a positive integer in minor units.",
    );
    record.data.subtotalCents = subtotal;
    record.data.taxCents = tax;
    record.data.totalCents = total;
    record.data.issuedAt = now();
    record.status = "issued";
  } else if (action === "record_payment" || action === "invoice_payment") {
    human(actor);
    assert(
      record.kind === "invoice" && record.data.issuedAt,
      "Issue the invoice before recording a payment.",
    );
    assert(!record.data.paidAt, "Invoice is already marked paid.", 409);
    assert(
      payload.attestation === true,
      "Confirm you have verified this payment.",
    );
    const outstanding =
        Number(record.data.totalCents) - Number(record.data.paidCents ?? 0),
      amount = Number(payload.amountCents ?? outstanding);
    assert(
      Number.isSafeInteger(amount) && amount > 0 && amount <= outstanding,
      "Payment must be positive integer minor units and cannot exceed the outstanding amount.",
    );
    const reference = cleanString(payload.reference, "Payment reference", 300);
    record.data.paidCents = Number(record.data.paidCents ?? 0) + amount;
    record.data.paymentReference = reference;
    record.status =
      Number(record.data.paidCents) === Number(record.data.totalCents)
        ? "paid"
        : "partially_paid";
    if (record.status === "paid") record.data.paidAt = now();
    state.records.push({
      id: id(),
      projectId,
      kind: "payment",
      title: "Payment for " + record.title,
      status: "observed",
      ownerId: actor.member.id,
      contactId: record.contactId,
      dueAt: null,
      data: {
        invoiceId: record.id,
        amountCents: amount,
        currency: record.data.currency,
        reference,
        observedAt: now(),
      },
      version: 1,
      createdAt: now(),
      updatedAt: now(),
    });
  } else if (action === "create_share") {
    human(actor);
    assert(
      ["invoice", "proposal", "onboarding"].includes(record.kind),
      "Only invoices, proposals, and onboarding summaries can be shared.",
    );
    const days = Number(payload.expiresInDays ?? 7);
    assert(
      Number.isInteger(days) && days > 0 && days <= 30,
      "Share lifetime must be 1–30 days.",
    );
    const token = randomToken();
    state.private.shares[await digest(token)] = {
      recordId: record.id,
      expires: Date.now() + days * 86400000,
      snapshot: redactedSnapshot(record),
    };
    audit(
      state,
      actor,
      projectId,
      record.id,
      action,
      "Created a reviewed frozen redacted read-only share",
    );
    return { url: origin + "/share/" + token, token };
  } else assert(false, "Unsupported mutation action.");
  record.version++;
  record.updatedAt = now();
  audit(
    state,
    actor,
    projectId,
    record.id,
    action,
    action === "confirm_send"
      ? "Human attested the exact approved message was sent manually"
      : action.replaceAll("_", " "),
  );
  return { record, receiptId: state.activities.at(-1)?.id };
}
export function redactedSnapshot(record: CrmRecord) {
  const allowed =
    record.kind === "invoice"
      ? [
          "currency",
          "totalCents",
          "subtotalCents",
          "taxCents",
          "issuedAt",
          "dueDate",
          "invoiceNumber",
          "publicNotes",
        ]
      : record.kind === "proposal"
        ? [
            "customerName",
            "summary",
            "scope",
            "deliverables",
            "amountCents",
            "currency",
            "validUntil",
            "terms",
            "publicNotes",
          ]
        : ["summary", "milestones", "successCriteria", "steps", "publicNotes"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    const value = record.data[key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      data[key] = value;
    else if (Array.isArray(value))
      data[key] = value.filter((v) => typeof v === "string");
  }
  if (record.kind === "invoice" && Array.isArray(record.data.items))
    data.items = record.data.items.map((value) => {
      const item =
        value && typeof value === "object" && !Array.isArray(value)
          ? value
          : {};
      return {
        description:
          typeof item.description === "string" ? item.description : "",
        quantity: Number(item.quantity ?? 0),
        unitCents: Number(item.unitCents ?? 0),
      };
    });
  return {
    title: record.title,
    kind: record.kind,
    status: record.status,
    data,
  };
}
