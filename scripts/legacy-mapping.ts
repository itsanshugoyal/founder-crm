import { createHash } from "node:crypto";
import type {
  Activity,
  CrmRecord,
  Fields,
  Member,
  Project,
} from "../src/shared/types";
import { EXPERIMENT_HANDLES } from "../src/shared/types";
export interface AirtableRecord {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
}
export interface LegacySnapshot {
  exportedAt: string;
  tables: Record<string, AirtableRecord[]>;
  missingTables: string[];
  counts: Record<string, number>;
}
const marker = "\n\n--- DealDock CRM metadata ---\n";
export function legacyId(source: string) {
  const h = createHash("sha256")
    .update("founder-crm-airtable-v1:" + source)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
function json(value: unknown): Fields {
  return JSON.parse(JSON.stringify(value ?? {})) as Fields;
}
export function legacyCounts(tables: Record<string, AirtableRecord[]>) {
  const leads = tables.Leads ?? [];
  return {
    leads: leads.length,
    qualified: leads.filter(
      (r) => r.fields.qualification_status === "qualified",
    ).length,
    hold: leads.filter((r) => r.fields.qualification_status === "hold").length,
    dead: leads.filter((r) => r.fields.qualification_status === "dead").length,
    pending: leads.filter((r) => r.fields.qualification_status === "pending")
      .length,
    qualifiedMissingDraft: leads.filter(
      (r) =>
        r.fields.qualification_status === "qualified" &&
        !r.fields.outreach_drafted,
    ).length,
    operations: (tables["CRM Operations"] ?? []).length,
    calls: (tables.Calls ?? []).length,
    counters: (tables["Daily Counters"] ?? []).length,
  };
}
export function mapLegacy(
  snapshot: LegacySnapshot,
  project: Project,
  members: Member[],
) {
  const records: CrmRecord[] = [],
    activities: Activity[] = [],
    warnings: string[] = [];
  const owner = (name: unknown) =>
    members.find(
      (m) => m.name.toLowerCase() === String(name ?? "").toLowerCase(),
    )?.id ?? null;
  const make = (
    key: string,
    kind: CrmRecord["kind"],
    title: string,
    status: string,
    data: Fields,
    legacy: AirtableRecord,
    meta: Fields = {},
    contactId: string | null = null,
  ): CrmRecord => ({
    id: legacyId(key),
    projectId: project.id,
    kind,
    title,
    status,
    ownerId: owner(meta.owner),
    contactId,
    dueAt: typeof meta.nextDue === "string" ? meta.nextDue : null,
    data: {
      ...data,
      legacySource: "airtable",
      legacyId: legacy.id,
      legacyKey: key,
      legacyRaw: json(legacy.fields),
    },
    version: 1,
    createdAt: legacy.createdTime ?? snapshot.exportedAt,
    updatedAt: snapshot.exportedAt,
  });
  for (const lead of snapshot.tables.Leads ?? []) {
    const f = lead.fields;
    let notes = String(f.notes ?? ""),
      meta: Fields = {};
    const index = notes.lastIndexOf(marker);
    if (index >= 0) {
      try {
        meta = json(JSON.parse(notes.slice(index + marker.length)));
        notes = notes.slice(0, index);
      } catch {
        warnings.push(
          `${lead.id}: metadata was invalid; preserved raw notes without interpretation.`,
        );
      }
    }
    const handle = String(f.ig_handle ?? "")
      .replace(/^@/, "")
      .toLowerCase();
    const experimental =
      EXPERIMENT_HANDLES.includes(handle) || meta.segment === "brand_deal";
    const evidence = Array.isArray(meta.evidence) ? meta.evidence : [];
    const first = evidence.find(
      (e) => e && typeof e === "object" && !Array.isArray(e),
    ) as Fields | undefined;
    const status =
      (
        {
          qualified: "Qualified",
          hold: "Nurture",
          dead: "Not a fit",
          pending: "Researching",
        } as Record<string, string>
      )[String(f.qualification_status)] ?? "Researching";
    const contact = make(
      "Leads:" + lead.id,
      "contact",
      handle || "Unlabelled legacy contact",
      status,
      {
        handle,
        email: typeof f.email === "string" ? f.email : "",
        profileUrl: handle
          ? "https://www.instagram.com/" + encodeURIComponent(handle) + "/"
          : "",
        website: typeof f.ig_website === "string" ? f.ig_website : "",
        linkedinUrl: typeof f.linkedin_url === "string" ? f.linkedin_url : "",
        bio: typeof f.ig_bio === "string" ? f.ig_bio : "",
        followers: typeof f.ig_followers === "number" ? f.ig_followers : null,
        segment: experimental
          ? "brand_deal"
          : typeof meta.segment === "string"
            ? meta.segment
            : "unknown",
        qualificationScore: typeof f.score === "number" ? f.score : null,
        qualificationStatus: String(f.qualification_status ?? "pending"),
        qualificationVersion: "legacy-preserved-not-rescored",
        personalizationHook: String(f.personalization_hook ?? ""),
        source: String(f.source ?? ""),
        sourceDetail: String(f.source_detail ?? ""),
        evidence,
        evidenceUrl: first?.url ?? "",
        observation: first?.text ?? "",
        checkedAt: first?.checkedAt ?? "",
        notes,
        legacyOwner: meta.owner ?? null,
        legacyMetadata: meta,
        suppressed:
          meta.suppressed === true || f.reply_sentiment === "unsubscribe",
        sequenceClosed: meta.sequenceClosed === true || f.replied === true,
        legacyStage: String(f.stage ?? ""),
        legacyFirstMessageDate:
          typeof f.date_first_msg_sent === "string"
            ? f.date_first_msg_sent
            : null,
      },
      lead,
      meta,
    );
    records.push(contact);
    for (const [field, channel] of [
      ["ig_dm_draft", "Instagram"],
      ["li_connection_note", "LinkedIn"],
      ["li_followup_note", "LinkedIn"],
    ] as const) {
      if (typeof f[field] === "string" && f[field])
        records.push(
          make(
            "Leads:" + lead.id + ":" + field,
            "draft",
            `${handle} · ${field === "li_connection_note" ? "connection note" : field === "li_followup_note" ? "LinkedIn follow-up" : "Instagram introduction"}`,
            "Needs review",
            {
              body: f[field] as string,
              channel,
              recipient:
                channel === "Instagram" ? handle : String(f.linkedin_url ?? ""),
              accountContext: "Unassigned",
              accountId: "",
              destinationUrl:
                channel === "Instagram"
                  ? String(contact.data.profileUrl)
                  : String(f.linkedin_url ?? ""),
              legacyDraft: true,
              needsFreshEvidence: true,
              experimentBlocked: experimental,
            },
            lead,
            meta,
            contact.id,
          ),
        );
    }
    if (Array.isArray(meta.events))
      for (const [i, event] of meta.events.entries()) {
        if (event && typeof event === "object" && !Array.isArray(event)) {
          const e = event as Fields;
          activities.push({
            id: legacyId(lead.id + ":activity:" + i),
            projectId: project.id,
            recordId: contact.id,
            actor: String(e.actor ?? "Legacy import"),
            action: "legacy_" + String(e.type ?? "note"),
            at: typeof e.at === "string" ? e.at : snapshot.exportedAt,
            detail: JSON.stringify(e),
          });
        }
      }
    const stageMap: Record<string, string> = {
      "Outreach Sent": "Conversation",
      Replied: "Conversation",
      "Call Booked": "Call booked",
      "Call Done": "Discovery done",
      "Pilot Active": "Pilot active",
      Paying: "Paying",
    };
    if (stageMap[String(f.stage)])
      records.push(
        make(
          "Leads:" + lead.id + ":opportunity",
          "opportunity",
          `${handle} · DealDock`,
          stageMap[String(f.stage)],
          {
            nextAction: String(
              f.next_action ?? "Review the imported opportunity",
            ),
            currency: "INR",
            legacyStage: String(f.stage),
          },
          lead,
          meta,
          contact.id,
        ),
      );
  }
  for (const op of snapshot.tables["CRM Operations"] ?? []) {
    let p: Fields = {};
    try {
      p =
        typeof op.fields.payload === "string"
          ? json(JSON.parse(op.fields.payload))
          : json(op.fields.payload);
    } catch {
      warnings.push(
        `${op.id}: operation payload was invalid and is retained in raw data.`,
      );
    }
    const kind = op.fields.kind === "campaign" ? "campaign" : "task";
    records.push(
      make(
        "CRM Operations:" + op.id,
        kind,
        String(p.title ?? op.fields.key ?? "Imported operation"),
        String(p.status ?? "To do"),
        { ...p, legacyKey: String(op.fields.key ?? op.id) },
        op,
        { ...p, nextDue: p.nextDue ?? p.due ?? null },
      ),
    );
  }
  for (const table of ["Calls", "Daily Counters"])
    for (const entry of snapshot.tables[table] ?? []) {
      const kind = table === "Calls" ? "meeting" : "knowledge";
      records.push(
        make(
          table + ":" + entry.id,
          kind,
          String(
            entry.fields.title ??
              entry.fields.name ??
              (table === "Calls" ? "Imported call" : "Legacy daily counter"),
          ),
          "Legacy imported",
          {
            body: JSON.stringify(entry.fields, null, 2),
            importCategory: table,
          },
          entry,
        ),
      );
    }
  return {
    records,
    activities,
    warnings,
    counts: legacyCounts(snapshot.tables),
  };
}
