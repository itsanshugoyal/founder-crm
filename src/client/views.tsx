import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Dialog } from "@base-ui/react/dialog";

import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { MagnifyingGlassIcon as MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { DownloadSimpleIcon as DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { UsersIcon as Users } from "@phosphor-icons/react/dist/csr/Users";
import { CheckCircleIcon as CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { ClockIcon as Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { FunnelSimpleIcon as FunnelSimple } from "@phosphor-icons/react/dist/csr/FunnelSimple";
import { DotsThreeIcon as DotsThree } from "@phosphor-icons/react/dist/csr/DotsThree";
import { ListBulletsIcon as ListBullets } from "@phosphor-icons/react/dist/csr/ListBullets";
import { SquaresFourIcon as SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { CalendarBlankIcon as CalendarBlank } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { TrayIcon as Tray } from "@phosphor-icons/react/dist/csr/Tray";
import { KanbanIcon as Kanban } from "@phosphor-icons/react/dist/csr/Kanban";
import { NotePencilIcon as NotePencil } from "@phosphor-icons/react/dist/csr/NotePencil";
import { ArrowSquareOutIcon as ArrowSquareOut } from "@phosphor-icons/react/dist/csr/ArrowSquareOut";
import { PencilSimpleIcon as PencilSimple } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { ArchiveIcon as Archive } from "@phosphor-icons/react/dist/csr/Archive";
import { XIcon as X } from "@phosphor-icons/react/dist/csr/X";
import { ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { LightningIcon as Lightning } from "@phosphor-icons/react/dist/csr/Lightning";
import { CopyIcon as Copy } from "@phosphor-icons/react/dist/csr/Copy";
import { WarningCircleIcon as WarningCircle } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { CheckIcon as Check } from "@phosphor-icons/react/dist/csr/Check";
import { EnvelopeSimpleIcon as EnvelopeSimple } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { BuildingsIcon as Buildings } from "@phosphor-icons/react/dist/csr/Buildings";
import { BookOpenIcon as BookOpen } from "@phosphor-icons/react/dist/csr/BookOpen";
import { CurrencyInrIcon as CurrencyInr } from "@phosphor-icons/react/dist/csr/CurrencyInr";
import { CaretLeftIcon as CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRightIcon as CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { LinkSimpleIcon as LinkSimple } from "@phosphor-icons/react/dist/csr/LinkSimple";
import { ArrowCounterClockwiseIcon as ArrowCounterClockwise } from "@phosphor-icons/react/dist/csr/ArrowCounterClockwise";

import { PLAYBOOKS } from "../shared/playbooks";

import type { CrmRecord, Fields, RecordKind } from "../shared/types";

import { useCRM } from "./App";

import {
  modules,
  text,
  active,
  complete,
  dateLabel,
  money,
  initials,
  safeUrl,
} from "./models";

import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  Modal,
  Confirm,
  CopyButton,
  ExternalLink,
  SectionHead,
  cn,
} from "./ui";

import { csvExport, mutate, downloadInvoice } from "./api";
import { DraftReview, draftReviewNote } from "./DraftReview";
import { draftPurpose } from "../shared/draft-purpose";

export const label = (s: string) =>
  s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const statusKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const statusIs = (r: CrmRecord, ...statuses: string[]) =>
  statuses.some((status) => statusKey(r.status) === statusKey(status));

const isComplete = (r: CrmRecord) =>
  complete({ ...r, status: label(r.status) });

function useRecords(kind?: RecordKind) {
  const { workspace } = useCRM();
  return workspace.records.filter(
    (r) => active(r) && (!kind || r.kind === kind),
  );
}

function PageHead({
  eyebrow,
  title,
  description,
  action,
  onAction,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <div className="eyebrow">{eyebrow || "PROJECT WORKSPACE"}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="head-actions">
        {children}
        {action && (
          <Button tone="primary" onClick={onAction}>
            <Plus size={17} />
            {action}
          </Button>
        )}
      </div>
    </header>
  );
}

function Person({
  record,
  small = false,
}: {
  record: CrmRecord;
  small?: boolean;
}) {
  return (
    <div className="person-cell">
      <span className={cn("avatar", small && "avatar-small")}>
        {initials(record.title)}
      </span>
      <div>
        <strong>{record.title}</strong>
        <span>
          {text(record, "company") ||
            text(record, "email") ||
            text(record, "handle") ||
            "Details to be added"}
        </span>
      </div>
    </div>
  );
}

function Owner({ id, record }: { id: string | null; record?: CrmRecord }) {
  const { workspace } = useCRM();
  const member = workspace.members.find((m) => m.id === id);
  return member ? (
    <span className="owner-cell">
      <span className="avatar avatar-tiny">{initials(member.name)}</span>
      {Array.isArray(record?.data.collaboratorIds) &&
      record!.data.collaboratorIds.length > 1
        ? "Both"
        : member.name}
    </span>
  ) : (
    <span className="muted">Unassigned</span>
  );
}

const serverManagedData = new Set([
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

function editableData(record: CrmRecord): Fields {
  return Object.fromEntries(
    Object.entries(record.data).filter(([key]) => !serverManagedData.has(key)),
  );
}

function QuickRecordControls({
  record,
  statuses,
  compact = false,
}: {
  record: CrmRecord;
  statuses: string[];
  compact?: boolean;
}) {
  const { act, toast, workspace } = useCRM();
  const [busy, setBusy] = useState(false);
  const members = workspace.members.filter((member) =>
    member.projectIds.includes(record.projectId),
  );
  const founderMembers = members.filter((member) =>
    /anshu|nahush/i.test(member.name),
  );
  const collaborators = Array.isArray(record.data.collaboratorIds)
    ? record.data.collaboratorIds.filter(
        (id): id is string => typeof id === "string",
      )
    : [];
  const selectedOwner =
    collaborators.length > 1 ? "__both" : record.ownerId || "";
  const currentStatuses = [...statuses, label(record.status)].filter(
    (status, index, all) =>
      all.findIndex(
        (candidate) => statusKey(candidate) === statusKey(status),
      ) === index,
  );

  async function change(payload: Fields) {
    setBusy(true);
    try {
      await act("update_record", payload, record);
    } catch (error) {
      toast((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "quick-record-controls",
        compact && "quick-record-controls-compact",
      )}
    >
      <label>
        <span className="sr-only">Status for {record.title}</span>
        <select
          aria-label={`Change status for ${record.title}`}
          disabled={busy}
          value={label(record.status)}
          onChange={(event) =>
            void change({
              status: event.target.value.toLowerCase().replaceAll(" ", "_"),
            })
          }
        >
          {currentStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Assignee for {record.title}</span>
        <select
          aria-label={`Change assignee for ${record.title}`}
          disabled={busy}
          value={selectedOwner}
          onChange={(event) => {
            const nextOwner = event.target.value;
            const data = editableData(record);
            if (nextOwner === "__both") {
              data.collaboratorIds = founderMembers.map((member) => member.id);
            } else if (collaborators.length) {
              data.collaboratorIds = [];
            }
            void change({
              ownerId:
                nextOwner === "__both"
                  ? founderMembers.find((member) => /anshu/i.test(member.name))
                      ?.id ||
                    founderMembers[0]?.id ||
                    null
                  : nextOwner || null,
              ...(data.collaboratorIds !== undefined ? { data } : {}),
            });
          }}
        >
          <option value="">Unassigned</option>
          {founderMembers.length >= 2 && (
            <option value="__both">Both founders</option>
          )}
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function MiniList({ records, empty }: { records: CrmRecord[]; empty: string }) {
  const { openRecord } = useCRM();
  return records.length ? (
    <div className="mini-list">
      {records.map((r) => (
        <button key={r.id} onClick={() => openRecord(r)}>
          <span
            className={cn("task-check", isComplete(r) && "task-check-done")}
          >
            {isComplete(r) && <Check size={12} />}
          </span>
          <div>
            <strong>{r.title}</strong>
            <span>
              {modules[r.kind].singular} <span>·</span> {dateLabel(r.dueAt)}
            </span>
          </div>
          <Badge>{label(r.status)}</Badge>
          <ArrowUpRight size={16} />
        </button>
      ))}
    </div>
  ) : (
    <div className="quiet-empty">
      <CheckCircle size={21} />
      <p>{empty}</p>
    </div>
  );
}

export function TodayView() {
  const { workspace, projectId, openCreate, setPage, openRecord } = useCRM();
  const records = useRecords();
  const [queue, setQueue] = useState("tasks");
  const [onlyMine, setOnlyMine] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const tasks = records.filter(
    (r) => ["task", "promise", "onboarding"].includes(r.kind) && !isComplete(r),
  );
  const due = tasks.filter((r) => r.dueAt && new Date(r.dueAt) <= endOfDay);
  const replies = records.filter(
    (r) => r.kind === "conversation" && statusIs(r, "Open", "Needs action"),
  );
  const drafts = records.filter(
    (r) => r.kind === "draft" && statusIs(r, "Draft", "Needs review"),
  );
  const opportunities = records.filter(
    (r) => r.kind === "opportunity" && !statusIs(r, "Lost", "Paying"),
  );
  const meetings = records
    .filter((r) => r.kind === "meeting" && !isComplete(r))
    .sort((a, b) =>
      (text(a, "startsAt") || a.dueAt || "").localeCompare(
        text(b, "startsAt") || b.dueAt || "",
      ),
    );
  const focusRecord =
    due
      .slice()
      .sort((a, b) => (a.dueAt || "").localeCompare(b.dueAt || ""))[0] ||
    replies[0] ||
    drafts[0] ||
    tasks[0] ||
    meetings[0];
  const focusType = due.length
    ? "EARLIEST DUE WORK"
    : replies.length
      ? "NEEDS A REPLY"
      : drafts.length
        ? "DRAFT TO INSPECT"
        : tasks.length
          ? "OPEN WORK"
          : "UPCOMING MEETING";
  const queues = [
    { id: "tasks", name: "Open work", count: tasks.length, icon: CheckCircle },
    { id: "replies", name: "Needs a reply", count: replies.length, icon: Tray },
    {
      id: "drafts",
      name: "Draft review",
      count: drafts.length,
      icon: NotePencil,
    },
    {
      id: "meetings",
      name: "Meetings",
      count: meetings.length,
      icon: CalendarBlank,
    },
  ];
  const source =
    queue === "replies"
      ? replies
      : queue === "drafts"
        ? drafts
        : queue === "meetings"
          ? meetings
          : tasks;
  const shown = source
    .filter(
      (r) =>
        (!onlyMine ||
          r.ownerId === workspace.actor.id ||
          (Array.isArray(r.data.collaboratorIds) &&
            r.data.collaboratorIds.includes(workspace.actor.id))) &&
        (!dueOnly || (r.dueAt && new Date(r.dueAt) <= endOfDay)),
    )
    .sort((a, b) => (a.dueAt || "9999").localeCompare(b.dueAt || "9999"));
  const project = workspace.projects.find((p) => p.id === projectId);
  return (
    <>
      <header className="today-page-head daily-brief">
        <div className="brief-main">
          <div className="date-index">
            <span>
              {new Date()
                .toLocaleDateString(undefined, { month: "short" })
                .toUpperCase()}
            </span>
            <strong>{new Date().getDate().toString().padStart(2, "0")}</strong>
            <span>
              {new Date()
                .toLocaleDateString(undefined, { weekday: "short" })
                .toUpperCase()}
            </span>
          </div>
          <div className="today-heading-copy">
            <span className="eyebrow">
              {project?.name || "Current project"} / DAILY BRIEF
            </span>
            <h1>Today’s Brief</h1>
            <p>
              {due.length > 0
                ? `${due.length} ${due.length === 1 ? "commitment needs" : "commitments need"} attention by today.`
                : "Review the work and conversations that need your attention."}
            </p>
            <div className="head-actions">
              <Button onClick={() => openCreate("contact")}>
                <Users size={16} />
                Add person
              </Button>
              <Button tone="primary" onClick={() => openCreate("task")}>
                <Plus size={16} />
                New task
              </Button>
            </div>
          </div>
        </div>
        <div className="brief-focus">
          <span className="eyebrow">OPEN NEXT / {focusType}</span>
          {focusRecord ? (
            <button onClick={() => openRecord(focusRecord)}>
              <strong>{focusRecord.title}</strong>
              <span>
                Open {modules[focusRecord.kind].singular.toLowerCase()}
                <ArrowUpRight size={17} />
              </span>
            </button>
          ) : (
            <div className="brief-focus-empty">
              <strong>No open review items</strong>
              <span>
                There are no open tasks, replies, drafts, or meetings.
              </span>
            </div>
          )}
          {focusRecord && (
            <div className="brief-focus-meta">
              <span>
                {focusRecord.dueAt
                  ? `Due ${dateLabel(focusRecord.dueAt)}`
                  : focusRecord.kind === "meeting" &&
                      text(focusRecord, "startsAt")
                    ? `Starts ${dateLabel(text(focusRecord, "startsAt"))}`
                    : "No due date recorded"}
              </span>
              <span>
                {workspace.members.find(
                  (member) => member.id === focusRecord.ownerId,
                )?.name || "Unassigned"}
              </span>
            </div>
          )}
        </div>
      </header>
      <div className="attention-strip">
        <button
          onClick={() => {
            setQueue("tasks");
            setDueOnly(true);
          }}
        >
          <Clock size={16} />
          <strong>{due.length}</strong> commitments due by today
          <ArrowRight size={14} />
        </button>
        <button
          onClick={() => {
            setQueue("replies");
            setDueOnly(false);
          }}
        >
          <Tray size={16} />
          <strong>{replies.length}</strong> need a reply
          <ArrowRight size={14} />
        </button>
        <button
          onClick={() => {
            setQueue("drafts");
            setDueOnly(false);
          }}
        >
          <NotePencil size={16} />
          <strong>{drafts.length}</strong> drafts to review
          <ArrowRight size={14} />
        </button>
        <button onClick={() => setPage("pipeline")}>
          <Kanban size={16} />
          <strong>{opportunities.length}</strong> open opportunities
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="today-columns">
        <section className="panel today-queue">
          <div className="queue-intro">
            <span className="eyebrow">THE REVIEW DESK</span>
            <h2>What needs a decision?</h2>
            <p>Open a record to review its context and next action.</p>
          </div>
          <div className="queue-tabs" role="group" aria-label="Today queues">
            {queues.map((item) => (
              <button
                key={item.id}
                className={cn(queue === item.id && "queue-active")}
                aria-pressed={queue === item.id}
                onClick={() => {
                  setQueue(item.id);
                  setDueOnly(false);
                }}
              >
                <item.icon size={16} />
                {item.name}
                <span>{item.count}</span>
              </button>
            ))}
          </div>
          <div className="queue-toolbar">
            <span>
              {shown.length} {shown.length === 1 ? "record" : "records"}
            </span>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={onlyMine}
                  onChange={(e) => setOnlyMine(e.target.checked)}
                />
                Assigned to me
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={dueOnly}
                  onChange={(e) => setDueOnly(e.target.checked)}
                />
                Due by today
              </label>
            </div>
          </div>
          {shown.length ? (
            <div className="table-scroll">
              <table className="attention-table">
                <thead>
                  <tr>
                    <th>Record</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th aria-label="Open record" />
                  </tr>
                </thead>
                <tbody>
                  {shown.slice(0, 12).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <button
                          className="queue-record"
                          onClick={() => openRecord(r)}
                        >
                          <span
                            className={cn(
                              "queue-record-icon",
                              queue === "replies" && "queue-record-reply",
                            )}
                          >
                            {queue === "drafts" ? (
                              <NotePencil size={17} />
                            ) : queue === "meetings" ? (
                              <CalendarBlank size={17} />
                            ) : queue === "replies" ? (
                              <Tray size={17} />
                            ) : (
                              <CheckCircle size={17} />
                            )}
                          </span>
                          <span>
                            <strong>{r.title}</strong>
                            <small>
                              {modules[r.kind].singular}
                              {r.contactId
                                ? ` · ${records.find((c) => c.id === r.contactId)?.title || "Linked person"}`
                                : ""}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <Owner id={r.ownerId} record={r} />
                      </td>
                      <td>
                        <Badge>{label(r.status)}</Badge>
                      </td>
                      <td>
                        <span
                          className={cn(
                            "date-label",
                            r.dueAt &&
                              new Date(r.dueAt) < new Date() &&
                              "date-overdue",
                          )}
                        >
                          {dateLabel(r.dueAt)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          aria-label={`Open ${r.title}`}
                          onClick={() => openRecord(r)}
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title={
                source.length
                  ? "No records match these filters"
                  : queue === "drafts"
                    ? "No drafts to review"
                    : queue === "replies"
                      ? "No conversations need a reply"
                      : queue === "meetings"
                        ? "No meetings scheduled"
                        : "No open work"
              }
              description={
                source.length
                  ? "Clear the assignment or date filter to see other records."
                  : queue === "drafts"
                    ? "Create a draft linked to a person. Approval and sending remain separate actions."
                    : "Create a record to add it to this project."
              }
              action={
                source.length
                  ? "Clear filters"
                  : queue === "drafts"
                    ? "Create draft"
                    : queue === "replies"
                      ? "Add conversation"
                      : queue === "meetings"
                        ? "Schedule meeting"
                        : "Create task"
              }
              onAction={() =>
                source.length
                  ? (setOnlyMine(false), setDueOnly(false))
                  : openCreate(
                      queue === "drafts"
                        ? "draft"
                        : queue === "replies"
                          ? "conversation"
                          : queue === "meetings"
                            ? "meeting"
                            : "task",
                    )
              }
              icon={<Tray size={24} />}
            />
          )}
          <div className="queue-footer">
            <span>
              {shown.length > 12
                ? `Showing 12 of ${shown.length}`
                : "Records from this project"}
            </span>
            <button
              className="text-link"
              onClick={() =>
                setPage(
                  queue === "drafts" || queue === "replies" ? "inbox" : "work",
                )
              }
            >
              Open{" "}
              {queue === "drafts" || queue === "replies" ? "inbox" : "work"}
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
        <aside className="today-aside">
          <section className="project-overview index-section">
            <div className="index-heading">
              <span>PROJECT</span>
              <h2>At a glance</h2>
            </div>
            <div className="project-overview-name">
              <span className="project-symbol">
                {initials(project?.name || "Project")}
              </span>
              <div>
                <strong>{project?.name || "Current project"}</strong>
                <span>
                  {workspace.members.length} project{" "}
                  {workspace.members.length === 1 ? "member" : "members"}
                </span>
              </div>
            </div>
            <dl>
              <div>
                <dt>People</dt>
                <dd>{records.filter((r) => r.kind === "contact").length}</dd>
              </div>
              <div>
                <dt>Open opportunities</dt>
                <dd>{opportunities.length}</dd>
              </div>
              <div>
                <dt>Unassigned open work</dt>
                <dd>{tasks.filter((r) => !r.ownerId).length}</dd>
              </div>
            </dl>
            <button className="text-link" onClick={() => setPage("reports")}>
              Project reports
              <ArrowRight size={14} />
            </button>
          </section>
          <section className="compact-panel index-section">
            <div className="index-heading">
              <span>NEXT</span>
              <h2>Next meetings</h2>
              <strong>{meetings.length}</strong>
            </div>
            {meetings.length ? (
              meetings.slice(0, 3).map((r) => (
                <button
                  className="meeting-item"
                  key={r.id}
                  onClick={() => openRecord(r)}
                >
                  <CalendarBlank size={18} />
                  <span>
                    <strong>{r.title}</strong>
                    <small>
                      {text(r, "startsAt")
                        ? new Date(text(r, "startsAt")).toLocaleString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )
                        : "Time not set"}
                    </small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
              ))
            ) : (
              <p className="compact-empty">No meetings scheduled.</p>
            )}
            <Button tone="quiet" onClick={() => openCreate("meeting")}>
              <Plus size={15} />
              Schedule meeting
            </Button>
          </section>
        </aside>
      </div>
      <section className="panel activity-panel today-activity">
        <div className="index-heading activity-heading">
          <span>LOG</span>
          <h2>Recent activity</h2>
        </div>
        <ActivityList
          activities={workspace.activities
            .slice()
            .sort((a, b) => b.at.localeCompare(a.at))
            .slice(0, 5)}
          records={records}
        />
      </section>
    </>
  );
}

function CheckSquareIcon() {
  return <CheckCircle size={25} />;
}

type ActivityEntry = {
  id: string;
  actor: string;
  recordId?: string | null;
  detail: string;
  at: string;
  action: string;
};

function activitySummary(activity: ActivityEntry, records: CrmRecord[]) {
  const related = records.find((record) => record.id === activity.recordId);
  if (activity.action.startsWith("legacy_")) {
    const kind = activity.action.slice(7).replaceAll("_", " ");
    const action =
      kind === "created"
        ? "created a contact record"
        : kind === "updated"
          ? "updated a contact record"
          : kind === "note"
            ? "added a note"
            : `recorded ${kind} activity`;
    return `${action}${related ? ` for ${related.title}` : ""} in the previous CRM.`;
  }
  const detail = activity.detail.trim();
  if (detail.startsWith("{") || detail.startsWith("[")) {
    try {
      JSON.parse(detail);
      return `${label(activity.action)}${related ? ` for ${related.title}` : ""}.`;
    } catch {
      // A normal note may begin with punctuation; leave it unchanged.
    }
  }
  return (
    detail ||
    `${label(activity.action)}${related ? ` for ${related.title}` : ""}.`
  );
}

function ActivityList({
  activities,
  records = [],
}: {
  activities: ActivityEntry[];
  records?: CrmRecord[];
}) {
  return activities.length ? (
    <div className="activity-list">
      {activities.map((a) => (
        <div key={a.id}>
          <span className="activity-dot" />
          <div>
            <p>
              <strong>{a.actor}</strong> {activitySummary(a, records)}
            </p>
            <small>
              {new Date(a.at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </small>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="quiet-empty">
      <Clock size={21} />
      <p>No activity recorded yet.</p>
    </div>
  );
}

type Filter = { search: string; status: string; owner: string };

export function RecordsView({
  kind,
  title,
  description,
  hideHead = false,
  extra,
}: {
  kind: RecordKind;
  title?: string;
  description?: string;
  hideHead?: boolean;
  extra?: ReactNode;
}) {
  const { openCreate, openRecord, workspace, projectId } = useCRM();
  const records = useRecords(kind);
  const [filter, setFilter] = useState<Filter>({
    search: "",
    status: "all",
    owner: "all",
  });
  const [page, setPage] = useState(0);
  const [savedName, setSavedName] = useState("");
  const [savingView, setSavingView] = useState(false);
  const key = `founder-views-${projectId}-${kind}`;
  const [savedViews, setViews] = useState<{ name: string; filter: Filter }[]>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(key) || "[]");
      } catch {
        return [];
      }
    },
  );
  const filtered = records.filter(
    (r) =>
      (filter.status === "all" ||
        label(r.status).toLowerCase() === label(filter.status).toLowerCase()) &&
      (filter.owner === "all" || (r.ownerId || "none") === filter.owner) &&
      `${r.title} ${JSON.stringify(r.data)}`
        .toLowerCase()
        .includes(filter.search.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const shown = filtered.slice(
    Math.min(page, pages - 1) * 15,
    Math.min(page, pages - 1) * 15 + 15,
  );
  const statuses = Array.from(
    new Set([
      ...modules[kind].statuses,
      ...records.map((r) => label(r.status)),
    ]),
  );
  const contacts = workspace.records.filter((r) => r.kind === "contact");
  const mod = modules[kind];
  function updateFilter(next: Partial<Filter>) {
    setFilter({ ...filter, ...next });
    setPage(0);
  }
  return (
    <>
      {!hideHead && (
        <PageHead
          title={title || mod.label}
          description={description || mod.description}
          action={`New ${mod.singular}`}
          onAction={() => openCreate(kind)}
        />
      )}
      <div className="records-toolbar">
        <div className="saved-views">
          <button
            className={cn(
              "view-pill",
              filter.status === "all" &&
                filter.owner === "all" &&
                "view-pill-active",
            )}
            onClick={() => {
              setFilter({ search: "", status: "all", owner: "all" });
              setPage(0);
            }}
          >
            All {mod.label.toLowerCase()}
            <span>{records.length}</span>
          </button>
          {savedViews.map((v, i) => (
            <button
              className="view-pill"
              key={v.name + i}
              onClick={() => {
                setFilter(v.filter);
                setPage(0);
              }}
            >
              {v.name}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          {hideHead && (
            <Button tone="primary" onClick={() => openCreate(kind)}>
              <Plus size={16} />
              New {mod.singular}
            </Button>
          )}
          <Button
            aria-label={`Export ${mod.label.toLowerCase()}`}
            onClick={() => {
              csvExport(
                `${kind}-${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  [
                    "Title",
                    "Status",
                    "Owner",
                    "Due date",
                    "Email",
                    "Company",
                    "Details",
                  ],
                  ...filtered.map((r) => [
                    r.title,
                    label(r.status),
                    workspace.members.find((m) => m.id === r.ownerId)?.name ||
                      "",
                    r.dueAt || "",
                    text(r, "email"),
                    text(r, "company"),
                    JSON.stringify(r.data),
                  ]),
                ],
              );
            }}
            disabled={!filtered.length}
          >
            <DownloadSimple size={16} />
            <span className="hide-small">Export</span>
          </Button>
        </div>
      </div>
      {extra}
      <div className="table-panel">
        <div className="filter-bar">
          <div className="search-input">
            <MagnifyingGlass size={17} />
            <input
              aria-label={`Search ${mod.label.toLowerCase()}`}
              placeholder={`Search ${mod.label.toLowerCase()}…`}
              value={filter.search}
              onChange={(e) => updateFilter({ search: e.target.value })}
            />
            {filter.search && (
              <button
                className="icon-btn"
                aria-label="Clear search"
                onClick={() => updateFilter({ search: "" })}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="filter-select">
            <FunnelSimple size={15} />
            <select
              aria-label="Filter by status"
              value={filter.status}
              onChange={(e) => updateFilter({ status: e.target.value })}
            >
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
          <select
            aria-label="Filter by owner"
            className="owner-filter"
            value={filter.owner}
            onChange={(e) => updateFilter({ owner: e.target.value })}
          >
            <option value="all">All owners</option>
            <option value="none">Unassigned</option>
            {workspace.members.map((m) => (
              <option value={m.id} key={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <Button tone="quiet" onClick={() => setSavingView(true)}>
            Save view
          </Button>
        </div>
        {records.length === 0 ? (
          <Empty
            title={`No ${mod.label.toLowerCase()} yet`}
            description={
              kind === "contact"
                ? "Add a person with a known identity. Leave unverified details blank until you have evidence."
                : kind === "knowledge"
                  ? "Save project guidance or research with its source and date. Link person-specific research to a contact."
                  : kind === "automation"
                    ? "Queue a job to prepare work for review. A completed receipt confirms what actually ran."
                    : kind === "task"
                      ? "Add a concrete next action, owner, and due date to start the work list."
                      : `Create a ${mod.singular} to track the next step.`
            }
            action={`Add ${mod.singular}`}
            onAction={() => openCreate(kind)}
            icon={
              kind === "contact" ? (
                <Users size={25} />
              ) : (
                <ListBullets size={25} />
              )
            }
          />
        ) : filtered.length === 0 ? (
          <Empty
            title="No matching records"
            description="Try another search or clear your filters."
            action="Clear filters"
            onAction={() =>
              setFilter({ search: "", owner: "all", status: "all" })
            }
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>
                      {kind === "contact"
                        ? "Name"
                        : kind === "company"
                          ? "Company"
                          : "Title"}
                    </th>
                    <th>Status</th>
                    {kind === "contact" ? (
                      <>
                        <th>Segment / fit</th>
                        <th>Evidence</th>
                      </>
                    ) : (
                      <>
                        <th>Person / context</th>
                        <th>
                          {[
                            "invoice",
                            "expense",
                            "payment",
                            "proposal",
                          ].includes(kind)
                            ? "Amount"
                            : kind === "opportunity"
                              ? "Next action"
                              : "Details"}
                        </th>
                      </>
                    )}
                    <th>Owner</th>
                    <th>
                      {kind === "contact" ? "Next follow-up" : "Due date"}
                    </th>
                    <th aria-label="Open record" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <button
                          className="table-title"
                          onClick={() => openRecord(r)}
                        >
                          {kind === "contact" ? (
                            <Person record={r} />
                          ) : (
                            <span>
                              <strong>{r.title}</strong>
                              {kind === "invoice" && (
                                <small>
                                  {text(r, "invoiceNumber") ||
                                    text(r, "number")}
                                </small>
                              )}
                            </span>
                          )}
                        </button>
                      </td>
                      <td>
                        <QuickRecordControls
                          record={r}
                          statuses={modules[kind].statuses}
                          compact
                        />
                      </td>
                      {kind === "contact" ? (
                        <>
                          <td>
                            <span className="segment">
                              {label(text(r, "segment") || "unknown")}
                            </span>
                            <small className="cell-sub">
                              {r.data.qualificationScore != null
                                ? `${text(r, "qualificationScore")} / 10 fit`
                                : "Not assessed"}
                            </small>
                          </td>
                          <td>
                            {text(r, "checkedAt") ? (
                              <>
                                <span className="evidence-label">
                                  <span className="small-dot" />
                                  Observed
                                </span>
                                <small className="cell-sub">
                                  {dateLabel(text(r, "checkedAt"))}
                                </small>
                              </>
                            ) : (
                              <span className="muted">Not checked</span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            {contacts.find((c) => c.id === r.contactId)
                              ?.title ||
                              text(r, "customerName") ||
                              text(r, "category") ||
                              text(r, "channel") ||
                              "—"}
                          </td>
                          <td className="table-details">
                            {[
                              "invoice",
                              "expense",
                              "payment",
                              "proposal",
                            ].includes(kind) ? (
                              <span className="numeric">
                                {money(
                                  Number(
                                    r.data.totalCents ??
                                      r.data.amountCents ??
                                      0,
                                  ),
                                  text(r, "currency") || "INR",
                                )}
                              </span>
                            ) : (
                              text(r, "nextAction") ||
                              text(r, "description") ||
                              text(r, "goal") ||
                              text(r, "summary") ||
                              text(r, "category") ||
                              text(r, "priority") ||
                              "—"
                            )}
                          </td>
                        </>
                      )}
                      <td>
                        <Owner id={r.ownerId} record={r} />
                      </td>
                      <td>
                        <span
                          className={cn(
                            "date-label",
                            r.dueAt &&
                              new Date(r.dueAt) < new Date() &&
                              !isComplete(r) &&
                              "date-overdue",
                          )}
                        >
                          {dateLabel(r.dueAt)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          aria-label={`Open ${r.title}`}
                          onClick={() => openRecord(r)}
                        >
                          <ArrowUpRight size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>
                {filtered.length} {filtered.length === 1 ? "record" : "records"}
                {filtered.length !== records.length && ` of ${records.length}`}
              </span>
              <div>
                <span>
                  Page {Math.min(page, pages - 1) + 1} of {pages}
                </span>
                <button
                  className="icon-btn"
                  aria-label="Previous page"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <CaretLeft size={17} />
                </button>
                <button
                  className="icon-btn"
                  aria-label="Next page"
                  disabled={page >= pages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  <CaretRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <Modal
        open={savingView}
        onClose={() => setSavingView(false)}
        title="Save this view"
        description="Save the current filters for this project."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const next = [...savedViews, { name: savedName, filter }];
            localStorage.setItem(key, JSON.stringify(next));
            setViews(next);
            setSavedName("");
            setSavingView(false);
          }}
        >
          <div className="modal-body">
            <div className="field">
              <label htmlFor="view-name">View name</label>
              <input
                id="view-name"
                required
                value={savedName}
                onChange={(e) => setSavedName(e.target.value)}
                placeholder="For example, My qualified people"
              />
            </div>
          </div>
          <div className="form-footer">
            <Button type="button" onClick={() => setSavingView(false)}>
              Cancel
            </Button>
            <Button tone="primary">Save view</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function PeopleView() {
  const [tab, setTab] = useState<"contact" | "company">("contact");
  const records = useRecords("contact");
  const followUpsDue = records.filter(
    (record) => record.dueAt && new Date(record.dueAt) <= new Date(),
  ).length;
  const unassigned = records.filter((record) => !record.ownerId).length;
  const duplicates = useMemo(() => {
    const seen = new Set<string>();
    return records.filter((r) => {
      const keys = [
        text(r, "email").trim().toLowerCase(),
        ...(text(r, "handle") || text(r, "profileUrl")
          ? [text(r, "handle") || text(r, "profileUrl")].map((v) =>
              v
                .toLowerCase()
                .replace(/^https?:\/\/(www\.)?/, "")
                .replace(/instagram\.com\//, "")
                .replace(/^@/, "")
                .replace(/[?#].*$/, "")
                .replace(/\/$/, ""),
            )
          : []),
      ].filter(Boolean);
      const duplicate = keys.some((key) => seen.has(key));
      keys.forEach((key) => seen.add(key));
      return duplicate;
    });
  }, [records]);
  return (
    <>
      <PageHead
        eyebrow="RELATIONSHIP WORKSPACE"
        title="People"
        description="A working record of who you know, what you know, and when to follow up."
      />
      <div className="directory-summary" aria-label="Relationship overview">
        <span>
          <strong>{followUpsDue}</strong> follow-ups due
        </span>
        <span>
          <strong>{unassigned}</strong> without an owner
        </span>
      </div>
      <Tabs
        items={[
          ["contact", "People"],
          ["company", "Companies"],
        ]}
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
      />
      <RecordsView
        key={tab}
        kind={tab}
        hideHead
        extra={
          duplicates.length ? (
            <div className="inline-notice">
              <WarningCircle size={17} />
              {duplicates.length} possible duplicate{" "}
              {duplicates.length === 1 ? "person" : "people"} share an email or
              handle. Review before contacting.
            </div>
          ) : undefined
        }
      />
    </>
  );
}

function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[][];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="tabs" role="group" aria-label="View category">
      {items.map(([key, title]) => (
        <button
          aria-pressed={value === key}
          className={cn(value === key && "tab-active")}
          key={key}
          onClick={() => onChange(key)}
        >
          {title}
        </button>
      ))}
    </div>
  );
}

export function PipelineView() {
  const { openCreate, openRecord, act, toast } = useCRM();
  const records = useRecords("opportunity");
  const [mode, setMode] = useState("board");
  const stages = modules.opportunity.statuses;
  const currencies = [
    ...new Set(records.map((r) => text(r, "currency") || "INR")),
  ];
  return (
    <>
      <PageHead
        eyebrow="OPPORTUNITY BOARD"
        title="Pipeline"
        description="Track opportunities by stage, value, and next action."
        action="New opportunity"
        onAction={() => openCreate("opportunity")}
      />
      <div className="pipeline-toolbar">
        <div className="segmented">
          <button
            className={mode === "board" ? "selected" : ""}
            onClick={() => setMode("board")}
          >
            <SquaresFour size={16} />
            Board
          </button>
          <button
            className={mode === "list" ? "selected" : ""}
            onClick={() => setMode("list")}
          >
            <ListBullets size={16} />
            List
          </button>
        </div>
        <div className="pipeline-values">
          {currencies.map((c) => (
            <span key={c}>
              <strong>
                {money(
                  records
                    .filter(
                      (r) => text(r, "currency") === c && !statusIs(r, "Lost"),
                    )
                    .reduce((s, r) => s + Number(r.data.amountCents || 0), 0),
                  c,
                )}
              </strong>{" "}
              pipeline
            </span>
          ))}
        </div>
      </div>
      {mode === "list" ? (
        <RecordsView kind="opportunity" hideHead />
      ) : (
        <div className="pipeline-board">
          {stages.map((stage, i) => {
            const stageRecords = records.filter((r) => statusIs(r, stage));
            return (
              <section className="pipeline-column" key={stage}>
                <div className="stage-head">
                  <span className={`stage-dot stage-${i}`} />
                  <h2>{stage}</h2>
                  <span>{stageRecords.length}</span>
                </div>
                <div className="stage-cards">
                  {stageRecords.map((r) => (
                    <article className="opportunity-card" key={r.id}>
                      <button
                        className="opportunity-title"
                        onClick={() => openRecord(r)}
                      >
                        {r.title}
                        <ArrowUpRight size={15} />
                      </button>
                      <span className="numeric opportunity-value">
                        {money(
                          Number(r.data.amountCents || 0),
                          text(r, "currency") || "INR",
                        )}
                      </span>
                      <p>{text(r, "nextAction") || "Add a next action"}</p>
                      <div className="opportunity-meta">
                        <Owner id={r.ownerId} record={r} />
                        <span
                          className={cn(
                            r.dueAt &&
                              new Date(r.dueAt) < new Date() &&
                              "date-overdue",
                          )}
                        >
                          {dateLabel(r.dueAt)}
                        </span>
                      </div>
                      <label className="move-stage">
                        Stage
                        <select
                          aria-label={`Move ${r.title} to stage`}
                          value={label(r.status)}
                          onChange={async (e) => {
                            try {
                              await act(
                                "update_record",
                                {
                                  status: e.target.value
                                    .toLowerCase()
                                    .replaceAll(" ", "_"),
                                },
                                r,
                              );
                            } catch (e) {
                              toast((e as Error).message);
                            }
                          }}
                        >
                          {stages.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))}
                  {!stageRecords.length && (
                    <button
                      className="stage-empty"
                      onClick={() => openCreate("opportunity")}
                    >
                      <Plus size={16} />
                      Add opportunity
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <p className="view-footnote">
        Pipeline values are potential amounts, separated by currency. They do
        not represent collected revenue.
      </p>
    </>
  );
}

function TaskBoard({ tasks }: { tasks: CrmRecord[] }) {
  const { act, openCreate, openRecord, toast } = useCRM();
  const [draggingId, setDraggingId] = useState("");
  const [dropStatus, setDropStatus] = useState("");
  const statuses = [
    ...modules.task.statuses,
    ...tasks.map((task) => label(task.status)),
  ].filter(
    (status, index, all) =>
      all.findIndex(
        (candidate) => statusKey(candidate) === statusKey(status),
      ) === index,
  );

  async function moveTask(id: string, status: string) {
    const task = tasks.find((record) => record.id === id);
    if (!task || statusIs(task, status)) return;
    try {
      await act(
        "update_record",
        { status: status.toLowerCase().replaceAll(" ", "_") },
        task,
      );
    } catch (error) {
      toast((error as Error).message);
    }
  }

  return (
    <div className="task-board" aria-label="Task Kanban board">
      {statuses.map((status) => {
        const cards = tasks.filter((task) => statusIs(task, status));
        const isDropTarget = dropStatus === status;
        return (
          <section
            key={status}
            className={cn(
              "task-column",
              isDropTarget && "task-column-drop-target",
            )}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropStatus(status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node))
                setDropStatus("");
            }}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("text/plain") || draggingId;
              setDropStatus("");
              setDraggingId("");
              void moveTask(id, status);
            }}
          >
            <header className="task-column-head">
              <span>{status}</span>
              <strong>{cards.length}</strong>
            </header>
            <div className="task-column-cards">
              {cards.map((task) => (
                <article
                  key={task.id}
                  className={cn(
                    "task-card",
                    draggingId === task.id && "task-card-dragging",
                  )}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", task.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDraggingId(task.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId("");
                    setDropStatus("");
                  }}
                >
                  <button
                    className="task-card-title"
                    onClick={() => openRecord(task)}
                  >
                    {task.title}
                    <ArrowUpRight size={15} />
                  </button>
                  <p>{text(task, "description") || "Add a clear next step"}</p>
                  <div className="task-card-meta">
                    <Owner id={task.ownerId} record={task} />
                    <span
                      className={cn(
                        task.dueAt &&
                          new Date(task.dueAt) < new Date() &&
                          !isComplete(task) &&
                          "date-overdue",
                      )}
                    >
                      {dateLabel(task.dueAt)}
                    </span>
                  </div>
                  <QuickRecordControls
                    record={task}
                    statuses={statuses}
                    compact
                  />
                </article>
              ))}
              {!cards.length && (
                <button
                  className="task-board-empty"
                  onClick={() => openCreate("task")}
                >
                  <Plus size={15} />
                  Add task
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function WorkView() {
  const [tab, setTab] = useState("task");
  const [taskView, setTaskView] = useState<"board" | "list">("board");
  const { openRecord, openCreate } = useCRM();
  const records = useRecords();
  const openTasks = records
    .filter((record) => record.kind === "task" && !isComplete(record))
    .sort((a, b) => (a.dueAt || "9999").localeCompare(b.dueAt || "9999"));
  const nextTask = openTasks[0];
  const sections: { kind: RecordKind; icon: typeof CheckCircle }[] = [
    { kind: "task", icon: CheckCircle },
    { kind: "content", icon: NotePencil },
    { kind: "campaign", icon: SquaresFour },
    { kind: "onboarding", icon: Users },
    { kind: "meeting", icon: CalendarBlank },
    { kind: "experiment", icon: Lightning },
    { kind: "promise", icon: Clock },
  ];
  return (
    <>
      <PageHead
        eyebrow="EXECUTION PLAN"
        title="Work"
        description="Commitments, campaigns, meetings, and the next concrete action."
      />
      <section className="work-focus" aria-label="Next open task">
        <div className="work-focus-index">
          <span>UP NEXT</span>
          <CheckCircle size={27} />
        </div>
        <div className="work-focus-copy">
          <span className="eyebrow">
            EXECUTION PLAN · {openTasks.length} OPEN{" "}
            {openTasks.length === 1 ? "TASK" : "TASKS"}
          </span>
          <h2>{nextTask?.title || "Set your next action"}</h2>
          <p>
            {nextTask
              ? `${nextTask.dueAt ? `Due ${dateLabel(nextTask.dueAt)} · ` : ""}${text(nextTask, "description") || "Open the task to review its details."}`
              : "Create a task with an owner and due date to give this project a clear starting point."}
          </p>
        </div>
        <Button
          tone="primary"
          onClick={() => (nextTask ? openRecord(nextTask) : openCreate("task"))}
        >
          {nextTask ? "Open task" : "Create task"}
          <ArrowUpRight size={16} />
        </Button>
      </section>
      <div className="workspace-section-heading">
        <div>
          <span className="eyebrow">WORKSTREAMS</span>
          <h2>Choose what to work on</h2>
        </div>
        <p>Each workstream has its own records, owners, and progress.</p>
      </div>
      <div
        className="work-navigation"
        role="group"
        aria-label="Work categories"
      >
        {sections.map((section) => (
          <button
            key={section.kind}
            aria-pressed={tab === section.kind}
            className={cn(tab === section.kind && "work-nav-active")}
            onClick={() => setTab(section.kind)}
          >
            <section.icon size={17} />
            <span>{modules[section.kind].label}</span>
            <strong>
              {records.filter((r) => r.kind === section.kind).length}
            </strong>
          </button>
        ))}
        <button
          aria-pressed={tab === "playbooks"}
          className={cn(tab === "playbooks" && "work-nav-active")}
          onClick={() => setTab("playbooks")}
        >
          <BookOpen size={17} />
          <span>Playbooks</span>
        </button>
      </div>
      {tab === "playbooks" ? (
        <PlaybooksView />
      ) : tab === "task" ? (
        <>
          <div className="work-view-toolbar">
            <div className="segmented" aria-label="Task view">
              <button
                className={taskView === "board" ? "selected" : ""}
                aria-pressed={taskView === "board"}
                onClick={() => setTaskView("board")}
              >
                <Kanban size={16} />
                Board
              </button>
              <button
                className={taskView === "list" ? "selected" : ""}
                aria-pressed={taskView === "list"}
                onClick={() => setTaskView("list")}
              >
                <ListBullets size={16} />
                List
              </button>
            </div>
            <p>
              Drag a card to move it. Use its status menu for a keyboard-safe
              move.
            </p>
          </div>
          {taskView === "board" ? (
            <TaskBoard
              tasks={records.filter((record) => record.kind === "task")}
            />
          ) : (
            <RecordsView key={tab} kind="task" hideHead />
          )}
        </>
      ) : (
        <RecordsView key={tab} kind={tab as RecordKind} hideHead />
      )}
    </>
  );
}

export function MoneyView() {
  const [tab, setTab] = useState<RecordKind>("invoice");
  const records = useRecords();
  const payments = records.filter(
    (r) => r.kind === "payment" && statusIs(r, "Received", "Observed"),
  );
  const currencies = [
    ...new Set(
      records
        .filter((r) => ["invoice", "payment", "expense"].includes(r.kind))
        .map((r) => text(r, "currency") || "INR"),
    ),
  ];
  return (
    <>
      <PageHead
        eyebrow="FINANCIAL RECORDS"
        title="Money"
        description="Manage invoices, proposals, payments, and expenses by currency."
      />
      <div className="money-summary">
        {currencies.length ? (
          currencies.map((c) => {
            const expenses = records
              .filter(
                (r) =>
                  r.kind === "expense" &&
                  !statusIs(r, "Cancelled") &&
                  (text(r, "currency") || "INR") === c,
              )
              .reduce((s, r) => s + Number(r.data.amountCents || 0), 0);
            const paidInvoices = records.filter(
              (r) =>
                r.kind === "invoice" &&
                statusIs(r, "Paid") &&
                (text(r, "currency") || "INR") === c,
            );
            return (
              <div key={c}>
                <span className="eyebrow">{c} · CONFIRMED RECORDS</span>
                <div>
                  <span>
                    Received
                    <strong>
                      {money(
                        payments
                          .filter((r) => (text(r, "currency") || "INR") === c)
                          .reduce(
                            (s, r) => s + Number(r.data.amountCents || 0),
                            0,
                          ) +
                          paidInvoices
                            .filter(
                              (i) =>
                                !payments.some(
                                  (p) => p.data.invoiceId === i.id,
                                ),
                            )
                            .reduce(
                              (s, r) =>
                                s +
                                Number(
                                  r.data.totalCents ?? r.data.amountCents ?? 0,
                                ),
                              0,
                            ),
                        c,
                      )}
                    </strong>
                  </span>
                  <span>
                    Expenses<strong>{money(expenses, c)}</strong>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="money-start">
            <WalletIcon />
            <span>
              No financial records yet. Add an invoice, payment, or expense to
              build a clear picture.
            </span>
          </div>
        )}
      </div>
      <Tabs
        items={["invoice", "proposal", "payment", "expense"].map((k) => [
          k,
          modules[k as RecordKind].label,
        ])}
        value={tab}
        onChange={(v) => setTab(v as RecordKind)}
      />
      <RecordsView key={tab} kind={tab} hideHead />
    </>
  );
}

function WalletIcon() {
  return <CurrencyInr size={25} />;
}
function PlaybooksView() {
  const { act, workspace } = useCRM();
  const [chosen, setChosen] = useState(PLAYBOOKS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create(kind: "tasks" | "onboarding" | "knowledge") {
    setBusy(true);
    setError("");
    try {
      if (kind === "tasks")
        await act("apply_changeset", {
          apply: true,
          changes: chosen.steps.map((step, i) => ({
            action: "create_record",
            payload: {
              kind: "task",
              title: `${chosen.title}: ${i + 1}. ${step}`,
              status: "to_do",
              ownerId: workspace.actor.id,
              data: {
                description: step,
                playbookId: chosen.id,
                priority: "Normal",
              },
            },
          })),
        });
      else
        await act("create_record", {
          kind,
          title: chosen.title,
          status: kind === "onboarding" ? "not_started" : "current",
          ownerId: workspace.actor.id,
          data:
            kind === "onboarding"
              ? {
                  milestones: chosen.steps
                    .map((s, i) => `${i + 1}. ${s}`)
                    .join("\n"),
                  successCriteria: chosen.description,
                }
              : {
                  body: chosen.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
                  category: "Process",
                },
        });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="playbooks-layout">
      <div className="playbook-picker">
        {PLAYBOOKS.map((p) => (
          <button
            key={p.id}
            className={cn(chosen.id === p.id && "playbook-selected")}
            onClick={() => setChosen(p)}
          >
            <BookOpen size={19} />
            <span>
              <strong>{p.title}</strong>
              <small>{p.description}</small>
            </span>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
      <section className="panel playbook-detail">
        <span className="eyebrow">OPERATING PLAYBOOK</span>
        <h2>{chosen.title}</h2>
        <p>{chosen.description}</p>
        <ol>
          {chosen.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <ErrorBox error={error} />
        <div className="playbook-actions">
          <Button
            tone="primary"
            disabled={busy}
            onClick={() => void create("tasks")}
          >
            <Plus size={16} />
            {busy ? "Creating…" : "Create task checklist"}
          </Button>
          <Button disabled={busy} onClick={() => void create("onboarding")}>
            Use as onboarding
          </Button>
          <Button disabled={busy} onClick={() => void create("knowledge")}>
            Save to Knowledge
          </Button>
        </div>
        <p className="form-note">
          Creates real records in this project. No external messages, purchases,
          or publications are triggered.
        </p>
      </section>
    </div>
  );
}

export function KnowledgeView() {
  const records = useRecords("knowledge");
  const linked = records.filter((record) => Boolean(record.contactId)).length;
  return (
    <>
      <PageHead
        eyebrow="RESEARCH LIBRARY"
        title="Knowledge"
        description="The source-backed notes and decisions behind your work."
      />
      <section className="library-brief" aria-label="Research library overview">
        <div>
          <span className="eyebrow">THE RESEARCH LIBRARY</span>
          <h2>Research you can trace</h2>
          <p>
            Save the source and date with each finding. Open linked person
            research from draft review.
          </p>
        </div>
        <div className="library-count">
          <strong>{records.length}</strong>
          <span>
            saved {records.length === 1 ? "note" : "notes"}
            <br />
            {linked} linked to people
          </span>
        </div>
      </section>
      <div className="workspace-section-heading">
        <div>
          <span className="eyebrow">CATALOGUE</span>
          <h2>Saved knowledge</h2>
        </div>
        <p>Search by title or recorded detail.</p>
      </div>
      <RecordsView kind="knowledge" hideHead />
    </>
  );
}

export function AutomationView() {
  const { workspace } = useCRM();
  return (
    <>
      <PageHead
        eyebrow="PREPARED WORK"
        title="Automation"
        description="Queue Codex work and inspect the recorded output and receipt."
      />
      <div className="runtime-banner">
        <span className="runtime-icon">
          <Lightning size={24} />
        </span>
        <div>
          <strong>Local Codex runtime</strong>
          <p>
            Queued jobs wait for a connected runtime. A queue entry alone does
            not mean a job ran. Completion and outputs require a recorded
            receipt.
          </p>
        </div>
        <Badge>
          {workspace.integrations.some(
            (item) => item.provider === "mcp" && item.status === "connected",
          )
            ? "MCP verified"
            : "Connection not verified"}
        </Badge>
      </div>
      <RecordsView kind="automation" hideHead />
      <div className="automation-guidance">
        <ShieldCheck size={20} />
        <p>
          Codex may research, prepare drafts, and propose changes inside this
          project. Approval, external messages, invitations, publication, and
          spending require an individual human action.
        </p>
      </div>
    </>
  );
}

const INBOX_QUEUE_IDS = ["action", "waiting", "drafts", "replies", "all"];

export function InboxView() {
  const { openCreate, openRecord, workspace, setPage } = useCRM();
  const [tabChoice, setTab] = useState(() => {
    const requested = new URLSearchParams(location.search).get("inbox") || "";
    return INBOX_QUEUE_IDS.includes(requested) ? requested : "";
  });
  const [search, setSearch] = useState("");
  const records = useRecords();
  const conversations = records.filter((r) => r.kind === "conversation");
  const drafts = records.filter(
    (r) => r.kind === "draft" && !statusIs(r, "Sent", "Rejected"),
  );
  const inbound = records.filter(
    (r) =>
      r.kind === "message" && text(r, "direction").toLowerCase() === "inbound",
  );
  const needsReply = conversations.filter((r) =>
    statusIs(r, "Open", "Needs action"),
  );
  const tab =
    tabChoice ||
    (needsReply.length ? "action" : drafts.length ? "drafts" : "action");
  useEffect(() => {
    const url = new URL(location.href);
    if (url.searchParams.get("inbox") !== tab) {
      url.searchParams.set("inbox", tab);
      history.replaceState(
        history.state,
        "",
        url.pathname + url.search + url.hash,
      );
    }
  }, [tab]);
  useEffect(() => {
    const syncQueue = () => {
      const requested = new URLSearchParams(location.search).get("inbox") || "";
      setTab(INBOX_QUEUE_IDS.includes(requested) ? requested : "");
    };
    window.addEventListener("popstate", syncQueue);
    return () => window.removeEventListener("popstate", syncQueue);
  }, []);
  const queues = [
    {
      id: "action",
      label: "Needs a reply",
      records: needsReply,
      icon: Tray,
    },
    {
      id: "waiting",
      label: "Waiting for reply",
      records: conversations.filter((r) => statusIs(r, "Awaiting reply")),
      icon: Clock,
    },
    { id: "drafts", label: "Draft review", records: drafts, icon: NotePencil },
    {
      id: "replies",
      label: "Recorded replies",
      records: inbound,
      icon: EnvelopeSimple,
    },
    {
      id: "all",
      label: "All conversations",
      records: conversations,
      icon: ListBullets,
    },
  ];
  const selectedQueue = queues.find((q) => q.id === tab)!;
  const shown = selectedQueue.records.filter((r) =>
    `${r.title} ${text(r, "body")} ${text(r, "summary")} ${records.find((c) => c.id === r.contactId)?.title || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const connected = workspace.integrations.filter(
    (i) =>
      i.status === "connected" && i.mode !== "codex" && i.provider !== "mcp",
  );
  return (
    <>
      <PageHead
        eyebrow="MESSAGE REVIEW"
        title="Inbox"
        description="Review conversations, prepare drafts, and track the next response."
        action={tab === "drafts" ? "New draft" : "Add conversation"}
        onAction={() => openCreate(tab === "drafts" ? "draft" : "conversation")}
      />
      <div className="inbox-safety">
        <ShieldCheck size={16} />
        <span>
          Approval, copying, and sending are separate actions. Every outbound
          message requires individual human review.
        </span>
        <button onClick={() => setPage("settings")}>
          {connected.length} CRM inbox{" "}
          {connected.length === 1 ? "account" : "accounts"}
          <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="inbox-layout">
        <aside className="inbox-navigation">
          <span className="nav-label">Queues</span>
          {queues.map((q) => (
            <button
              key={q.id}
              className={cn(tab === q.id && "inbox-nav-active")}
              aria-pressed={tab === q.id}
              onClick={() => {
                setTab(q.id);
                setSearch("");
              }}
            >
              <q.icon size={17} />
              <span>{q.label}</span>
              <strong>{q.records.length}</strong>
            </button>
          ))}
          <div className="inbox-navigation-note">
            <h3>Manual and connected accounts</h3>
            <p>
              Record replies manually, or sync a supported account from
              Settings.
            </p>
            <button className="text-link" onClick={() => setPage("settings")}>
              Manage connections
              <ArrowRight size={14} />
            </button>
          </div>
        </aside>
        <section className="panel inbox-workspace">
          {tab !== "drafts" && (
            <div className="inbox-list-heading">
              <h2>
                {selectedQueue.label}
                <span className="count">{shown.length}</span>
              </h2>
              <div className="search-input">
                <MagnifyingGlass size={16} />
                <input
                  aria-label="Search inbox queue"
                  placeholder="Search this queue…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}
          {tab === "drafts" ? (
            <DraftReview
              drafts={drafts}
              contacts={records.filter((record) => record.kind === "contact")}
              knowledge={records.filter(
                (record) => record.kind === "knowledge",
              )}
              openRecord={openRecord}
            />
          ) : shown.length ? (
            <div className="inbox-list">
              {shown.map((r) => {
                const contact = records.find((c) => c.id === r.contactId);
                return (
                  <button
                    className="inbox-row"
                    key={r.id}
                    onClick={() => openRecord(r)}
                  >
                    <span className="avatar">
                      {initials(contact?.title || r.title)}
                    </span>
                    <div>
                      <div className="inbox-row-title">
                        <strong>{contact?.title || r.title}</strong>
                        <time>{dateLabel(r.updatedAt)}</time>
                      </div>
                      <span className="inbox-subject">{r.title}</span>
                      <p>
                        {text(r, "body") ||
                          text(r, "summary") ||
                          "No message or context recorded."}
                      </p>
                      <div className="inbox-row-meta">
                        <Badge>{label(r.status)}</Badge>
                        <span>{label(text(r, "channel") || "manual")}</span>
                        <Owner id={r.ownerId} record={r} />
                      </div>
                    </div>
                    <ArrowUpRight size={17} />
                  </button>
                );
              })}
            </div>
          ) : (
            <Empty
              title={
                search
                  ? "No matching records"
                  : tab === "drafts"
                    ? "No drafts awaiting review"
                    : tab === "waiting"
                      ? "No conversations waiting for a reply"
                      : "No records in this queue"
              }
              description={
                search
                  ? "Try another name or search term."
                  : tab === "drafts"
                    ? "Create a draft linked to a contact, then review and approve the exact message."
                    : "Add a conversation or record an actual received reply to keep the project inbox current."
              }
              action={
                search
                  ? "Clear search"
                  : tab === "drafts"
                    ? "Create draft"
                    : "Add conversation"
              }
              onAction={() =>
                search
                  ? setSearch("")
                  : openCreate(tab === "drafts" ? "draft" : "conversation")
              }
              icon={<Tray size={25} />}
            />
          )}
        </section>
      </div>
    </>
  );
}

export function ReportsView() {
  const records = useRecords();
  const contacts = records.filter((r) => r.kind === "contact");
  const opportunities = records.filter((r) => r.kind === "opportunity");
  const drafts = records.filter((r) => r.kind === "draft");
  const sent = drafts.filter((r) => statusIs(r, "sent"));
  const replies = records.filter(
    (r) =>
      r.kind === "message" && text(r, "direction").toLowerCase() === "inbound",
  );
  const stages = modules.opportunity.statuses;
  const max = Math.max(
    1,
    ...stages.map((s) => opportunities.filter((r) => statusIs(r, s)).length),
  );
  const tasks = records.filter((r) => r.kind === "task");
  return (
    <>
      <PageHead
        eyebrow="PROJECT SIGNALS"
        title="Reports"
        description="Current project counts, pipeline stages, and record completeness."
      />
      <div className="report-metrics">
        {[
          ["People in your workspace", contacts.length],
          ["Messages confirmed sent", sent.length],
          ["Recorded inbound replies", replies.length],
          ["Tasks completed", tasks.filter(isComplete).length],
        ].map(([name, value]) => (
          <div key={name}>
            <span>{name}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="reports-grid">
        <section className="panel report-panel">
          <SectionHead
            title="Opportunity stages"
            count={opportunities.length}
          />
          <p className="muted small-copy">
            Current record counts, not conversion attribution.
          </p>
          <div className="funnel-chart">
            {stages.map((s) => {
              const count = opportunities.filter((r) => statusIs(r, s)).length;
              return (
                <div key={s}>
                  <span>{s}</span>
                  <div>
                    <div style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel report-panel">
          <SectionHead title="Evidence & follow-through" />
          <dl className="report-stat-list">
            <div>
              <dt>People with observed evidence</dt>
              <dd>
                {
                  contacts.filter(
                    (r) => text(r, "observation") && text(r, "checkedAt"),
                  ).length
                }{" "}
                / {contacts.length}
              </dd>
            </div>
            <div>
              <dt>People with a qualification score</dt>
              <dd>
                {
                  contacts.filter((r) => r.data.qualificationScore != null)
                    .length
                }{" "}
                / {contacts.length}
              </dd>
            </div>
            <div>
              <dt>Open work with no owner</dt>
              <dd>
                {
                  records.filter(
                    (r) =>
                      ["task", "opportunity", "onboarding"].includes(r.kind) &&
                      !isComplete(r) &&
                      !r.ownerId,
                  ).length
                }
              </dd>
            </div>
            <div>
              <dt>Overdue open commitments</dt>
              <dd>
                {
                  records.filter(
                    (r) =>
                      ["task", "promise"].includes(r.kind) &&
                      !isComplete(r) &&
                      r.dueAt &&
                      new Date(r.dueAt) < new Date(),
                  ).length
                }
              </dd>
            </div>
            <div>
              <dt>Drafts awaiting review</dt>
              <dd>
                {
                  drafts.filter((r) => statusIs(r, "draft", "needs review"))
                    .length
                }
              </dd>
            </div>
          </dl>
        </section>
      </div>
      <p className="view-footnote">
        Manual records may be incomplete. Reply counts include recorded
        messages, and do not imply a verified campaign response rate.
      </p>
    </>
  );
}

export function SettingsView() {
  const { workspace, projectId, csrf, refresh, toast, act } = useCRM();
  const project = workspace.projects.find((p) => p.id === projectId);
  const [tab, setTab] = useState("project");
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [daily, setDaily] = useState(
    String(project?.settings.dailySendLimit || 25),
  );
  const [hourly, setHourly] = useState(
    String(project?.settings.hourlySendLimit || 5),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [resultLink, setResultLink] = useState("");
  const [token, setToken] = useState("");
  const [tokenOpen, setTokenOpen] = useState(false);
  const [tokenLabel, setTokenLabel] = useState("Local Codex");
  const [expires, setExpires] = useState("7");
  const [provider, setProvider] = useState("gmail");
  const [setupOpen, setSetupOpen] = useState(false);
  const [providerKey, setProviderKey] = useState("");
  const [projectTokens, setProjectTokens] = useState<
    Array<{ id: string; label: string; expires: number | null }>
  >([]);
  const owner = ["owner", "admin"].includes(workspace.actor.role);
  const mcpConnected = workspace.integrations.some(
    (i) => i.provider === "mcp" && i.status === "connected",
  );
  useEffect(() => {
    if (tab === "codex" && owner)
      void act("list_mcp_tokens", {})
        .then((result) =>
          setProjectTokens((result.tokens ?? []) as typeof projectTokens),
        )
        .catch(() =>
          setError("Could not load project tokens. Refresh and try again."),
        );
  }, [tab, projectId]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="PROJECT SETUP"
        title="Settings"
        description="Set up the project, decide who has access, and manage connected tools."
      />
      <div className="settings-workbench">
        <aside className="settings-menu">
          <span className="eyebrow">SETUP SECTIONS</span>
          <h2>Keep the workspace yours.</h2>
          <p>
            Choose a section to review its settings. Changes take effect when
            you save them.
          </p>
          <Tabs
            items={[
              ["project", "Project"],
              ["members", "People & access"],
              ["integrations", "Connections"],
              ["codex", "Codex & MCP"],
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v);
              setError("");
            }}
          />
        </aside>
        <div className="settings-content">
          <ErrorBox error={error} />
          {tab === "project" && (
            <div className="settings-layout">
              <form
                className="panel settings-panel"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    await mutate(
                      csrf,
                      projectId,
                      "update_project",
                      {
                        name,
                        description,
                        settings: {
                          dailySendLimit: Number(daily),
                          hourlySendLimit: Number(hourly),
                        },
                      },
                      undefined,
                      project?.version,
                    );
                    await refresh();
                    toast("Project settings saved");
                  });
                }}
              >
                <SectionHead title="Project details" />
                <p className="muted small-copy">
                  Update the project name, description, and individual send
                  limits.
                </p>
                <div className="field">
                  <label htmlFor="settings-name">Project name</label>
                  <input
                    id="settings-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!owner}
                  />
                </div>
                <div className="field">
                  <label htmlFor="settings-description">Description</label>
                  <textarea
                    id="settings-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!owner}
                  />
                </div>
                <div className="settings-divider" />
                <h3>Individual send limits</h3>
                <p className="muted small-copy">
                  Caps apply to manual send confirmations as well as supported
                  provider sends.
                </p>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="limit-daily">Per day</label>
                    <input
                      id="limit-daily"
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={daily}
                      onChange={(e) => setDaily(e.target.value)}
                      disabled={!owner}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="limit-hourly">Per hour</label>
                    <input
                      id="limit-hourly"
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={hourly}
                      onChange={(e) => setHourly(e.target.value)}
                      disabled={!owner}
                    />
                  </div>
                </div>
                {owner ? (
                  <Button tone="primary" disabled={busy}>
                    {busy ? "Saving…" : "Save project settings"}
                  </Button>
                ) : (
                  <p className="form-note">
                    Only project owners and admins can change these settings.
                  </p>
                )}
              </form>
              <aside className="settings-aside">
                <ShieldCheck size={29} />
                <h3>Project access</h3>
                <p>
                  Members see the projects they have access to. Codex tokens are
                  scoped to one project and remain revocable, with a fixed
                  lifetime or access until revoked.
                </p>
                <dl>
                  <dt>Storage</dt>
                  <dd>{workspace.readiness.sourceOfTruth}</dd>
                  <dt>Mode</dt>
                  <dd>{label(workspace.readiness.mode)}</dd>
                </dl>
              </aside>
            </div>
          )}
          {tab === "members" && (
            <section className="panel">
              <div className="settings-section-head">
                <SectionHead
                  title="Project members"
                  count={
                    workspace.members.filter((m) =>
                      m.projectIds.includes(projectId),
                    ).length
                  }
                />
                {owner && (
                  <Button
                    tone="primary"
                    onClick={() => {
                      setResultLink("");
                      setInvite(true);
                    }}
                  >
                    <Plus size={16} />
                    Invite member
                  </Button>
                )}
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Project access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspace.members
                      .filter((m) => m.projectIds.includes(projectId))
                      .map((m) => (
                        <tr key={m.id}>
                          <td>
                            <span className="owner-cell">
                              <span className="avatar">{initials(m.name)}</span>
                              <strong>{m.name}</strong>
                            </span>
                          </td>
                          <td>{m.email || "Not provided"}</td>
                          <td>
                            <Badge>{label(m.role)}</Badge>
                          </td>
                          <td>
                            {workspace.projects
                              .filter((p) => m.projectIds.includes(p.id))
                              .map((p) => p.name)
                              .join(", ")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <p className="panel-footnote">
                Invitations create a private link. No email is sent
                automatically. Send the link to the intended teammate yourself.
              </p>
            </section>
          )}
          {tab === "integrations" && (
            <>
              <div className="connections-toolbar">
                <div>
                  <strong>Connect your inbox and calendar</strong>
                  <p>
                    Codex connections and CRM connections are shown separately.
                    CRM accounts require their own authorization.
                  </p>
                </div>
                {owner && (
                  <div className="connect-controls">
                    <select
                      aria-label="Provider to connect"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                    >
                      <option value="gmail">Gmail</option>
                      <option value="googlecalendar">Google Calendar</option>
                      <option value="instagram">Instagram</option>
                    </select>
                    <Button
                      tone="primary"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          if (
                            workspace.integrations.some(
                              (i) =>
                                i.id === "setup-" + provider && i.setupRequired,
                            )
                          ) {
                            setSetupOpen(true);
                            return;
                          }
                          const result = await act("connect_provider", {
                            provider,
                          });
                          if (result.url && safeUrl(String(result.url)))
                            location.assign(String(result.url));
                        })
                      }
                    >
                      <LinkSimple size={16} />
                      Connect account
                    </Button>
                  </div>
                )}
              </div>
              <div className="connections-grid">
                {workspace.integrations.map((i) => (
                  <section className="panel integration-panel" key={i.id}>
                    <div className="integration-heading">
                      <span className="integration-icon">
                        {initials(i.provider)}
                      </span>
                      <Badge>{label(i.status)}</Badge>
                    </div>
                    <h2>{i.label}</h2>
                    <p>
                      {i.reason || "Connection status reported by the server."}
                    </p>
                    {i.accountId && (
                      <span className="small-copy">Account: {i.accountId}</span>
                    )}
                    <div className="integration-capabilities">
                      {i.capabilities.map((c) => (
                        <span key={c}>{label(c)}</span>
                      ))}
                    </div>
                    {i.status !== "connected" && (
                      <div className="connection-pending">
                        <WarningCircle size={17} />
                        {i.provider === "mcp"
                          ? "Connect Codex using a project token"
                          : i.setupRequired
                            ? "Connection setup needed · choose Connect account"
                            : i.mode === "codex"
                              ? "Refresh this connection in Codex"
                              : "Authorize and verify this account"}
                      </div>
                    )}
                    {i.accountId && (
                      <div className="provider-actions">
                        <Button
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await act("provider_connection_status", {
                                connectionId: i.id,
                              });
                            })
                          }
                        >
                          Check connection
                        </Button>
                        {i.status === "connected" && (
                          <Button
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                await act(
                                  i.provider === "googlecalendar"
                                    ? "sync_calendar"
                                    : i.provider === "instagram"
                                      ? "sync_instagram"
                                      : "fetch_inbox",
                                  { connectionId: i.id },
                                );
                              })
                            }
                          >
                            <Tray size={15} />
                            {i.provider === "googlecalendar"
                              ? "Sync calendar"
                              : i.provider === "instagram"
                                ? "Sync conversations"
                                : "Fetch inbox"}
                          </Button>
                        )}
                      </div>
                    )}
                  </section>
                ))}
                {!workspace.integrations.length && (
                  <Empty
                    title="No connections configured"
                    description="An administrator can connect supported accounts. The workspace’s manual workflows are available now."
                  />
                )}
              </div>
            </>
          )}
          {tab === "codex" && (
            <div className="settings-layout">
              <section className="panel settings-panel">
                <SectionHead title="Codex access" />
                <p>
                  Use a project token to let your local Codex runtime read
                  project context and prepare changes.
                </p>
                <div className="permission-list">
                  <div>
                    <CheckCircle size={19} />
                    <span>
                      Read this project and its operating instructions
                    </span>
                  </div>
                  <div>
                    <CheckCircle size={19} />
                    <span>
                      Research, prepare drafts, and queue proposed work
                    </span>
                  </div>
                  <div>
                    <ShieldCheck size={19} />
                    <span>
                      Human approval and individual sending remain in Founder
                    </span>
                  </div>
                </div>
                <div className="inline-notice">
                  <WarningCircle size={18} />
                  {mcpConnected
                    ? "Connected. Codex has successfully used this project’s MCP tools."
                    : "Not verified yet. Connect Codex with a project token, then run a connection check."}
                </div>
                {owner && (
                  <Button
                    tone="primary"
                    onClick={() => {
                      setToken("");
                      setTokenOpen(true);
                    }}
                  >
                    <LinkSimple size={16} />
                    Create project token
                  </Button>
                )}
                {owner && projectTokens.length > 0 && (
                  <div className="permission-list" aria-label="Project tokens">
                    {projectTokens.map((item) => (
                      <div key={item.id}>
                        <span>
                          {item.label} ·{" "}
                          {item.expires === null
                            ? "Never expires"
                            : "Expires " +
                              new Date(item.expires).toLocaleDateString(
                                "en-IN",
                              )}
                        </span>
                        <Button
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await act("revoke_mcp_token", {
                                tokenId: item.id,
                              });
                              const result = await act("list_mcp_tokens", {});
                              setProjectTokens(
                                (result.tokens ?? []) as typeof projectTokens,
                              );
                            })
                          }
                        >
                          Revoke
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <aside className="settings-aside">
                <BookOpen size={28} />
                <h3>Project instructions</h3>
                <p>
                  Add project instructions in Knowledge. Codex should read the
                  latest version before preparing work. Review receipts in
                  Automation and record history.
                </p>
              </aside>
            </div>
          )}
        </div>
      </div>
      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title={resultLink ? "Your invitation is ready" : "Invite a teammate"}
        description="Access is limited to this project. Invitations expire after seven days."
      >
        {resultLink ? (
          <div className="modal-body">
            <p>
              Share this link privately with {inviteEmail}. No invitation email
              has been sent.
            </p>
            <div className="token-value">{resultLink}</div>
            <CopyButton value={resultLink} label="Copy invitation link" />
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const result = await act("invite_member", {
                  name: inviteName,
                  email: inviteEmail,
                  role: inviteRole,
                  projectIds: [projectId],
                });
                setResultLink(String(result.url || ""));
              });
            }}
          >
            <div className="modal-body">
              <ErrorBox error={error} />
              <div className="field">
                <label htmlFor="invite-name">Name</label>
                <input
                  id="invite-name"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="invite-email">Email</label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="invite-role">Role</label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="member">Member · can manage records</option>
                  <option value="admin">
                    Admin · manage people, settings and records
                  </option>
                  <option value="owner">Owner · full cofounder access</option>
                  <option value="viewer">Viewer · read only</option>
                </select>
              </div>
            </div>
            <div className="form-footer">
              <Button type="button" onClick={() => setInvite(false)}>
                Cancel
              </Button>
              <Button tone="primary" disabled={busy}>
                {busy ? "Creating…" : "Create invite link"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        open={tokenOpen}
        onClose={() => setTokenOpen(false)}
        title={token ? "Copy your project token" : "Create a Codex token"}
        description="Treat this like a password. It grants access only to the current project."
      >
        {token ? (
          <div className="modal-body">
            <p>
              This token will only be displayed now. Store it in the local
              runtime’s secure configuration.
            </p>
            <div className="token-value">{token}</div>
            <CopyButton value={token} label="Copy token" />
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const result = await act("create_mcp_token", {
                  label: tokenLabel,
                  ...(expires === "never"
                    ? { neverExpires: true }
                    : { expiresInDays: Number(expires) }),
                });
                setToken(String(result.token || ""));
                const listed = await act("list_mcp_tokens", {});
                setProjectTokens((listed.tokens ?? []) as typeof projectTokens);
              });
            }}
          >
            <div className="modal-body">
              <ErrorBox error={error} />
              <div className="field">
                <label htmlFor="token-label">Token name</label>
                <input
                  id="token-label"
                  required
                  value={tokenLabel}
                  onChange={(e) => setTokenLabel(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="token-expiry">Token lifetime</label>
                <select
                  id="token-expiry"
                  required
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="never">Never expires · until revoked</option>
                </select>
                {expires === "never" && (
                  <p className="small-copy">
                    This token stays active until you revoke it here. Its
                    project scope and read/draft-only permissions stay the same.
                  </p>
                )}
              </div>
            </div>
            <div className="form-footer">
              <Button type="button" onClick={() => setTokenOpen(false)}>
                Cancel
              </Button>
              <Button tone="primary" disabled={busy}>
                {busy ? "Creating…" : "Create token"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        open={setupOpen}
        onClose={() => {
          setSetupOpen(false);
          setProviderKey("");
        }}
        title="Connection setup"
        description="One-time setup for this project's CRM connections. Your Codex sign-in is separate."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await act("configure_provider", {
                provider,
                apiKey: providerKey,
              });
              setProviderKey("");
              setSetupOpen(false);
              toast(
                "Setup verified. Choose Connect account to authorize your account.",
              );
            });
          }}
        >
          <div className="modal-body">
            <ErrorBox error={error} />
            <p>
              Add your Composio developer project key privately. The CRM checks
              the provider tools and pins their versions. Then you authorize
              Gmail, Calendar or Instagram on the provider’s consent screen.
            </p>
            <a
              href="https://dashboard.composio.dev"
              target="_blank"
              rel="noreferrer"
            >
              Open Composio developer settings
            </a>
            <div className="field">
              <label htmlFor="provider-project-key">
                Composio project API key
              </label>
              <input
                id="provider-project-key"
                type="password"
                autoComplete="off"
                value={providerKey}
                onChange={(event) => setProviderKey(event.target.value)}
              />
            </div>
            <p className="small-copy">
              Stored only in private server configuration. Leave blank to reuse
              a previously saved key. Setup does not connect an account or send
              a message.
            </p>
          </div>
          <div className="form-footer">
            <Button
              type="button"
              onClick={() => {
                setSetupOpen(false);
                setProviderKey("");
              }}
            >
              Cancel
            </Button>
            <Button tone="primary" disabled={busy}>
              {busy ? "Checking setup…" : "Verify and save setup"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function RecordDetail({
  record: r,
  onClose,
}: {
  record: CrmRecord;
  onClose: () => void;
}) {
  const { workspace, editRecord, openRecord, openCreate, act } = useCRM();
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<
    "archive" | "send" | "provider" | "issue" | null
  >(null);
  const [reply, setReply] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [payment, setPayment] = useState(false);
  const [reference, setReference] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(
    String(
      (Number(r.data.totalCents ?? r.data.amountCents ?? 0) -
        Number(r.data.paidCents ?? 0)) /
        100,
    ),
  );
  const [share, setShare] = useState("");
  const [invoiceSendOpen, setInvoiceSendOpen] = useState(false);
  const [deliveryReference, setDeliveryReference] = useState("");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");
  const [mergeReview, setMergeReview] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarId, setCalendarId] = useState("");
  const [inviteAttendees, setInviteAttendees] = useState(false);
  const records = workspace.records.filter(active);
  const linked = records.filter(
    (rec) =>
      rec.contactId === (r.kind === "contact" ? r.id : r.contactId) &&
      rec.id !== r.id,
  );
  const contact = records.find((c) => c.id === r.contactId);
  const status = label(r.status);
  const draft = r.kind === "draft";
  const invoice = r.kind === "invoice";
  const sent = statusIs(r, "sent", "sending");
  const approved = statusIs(r, "approved");
  const issued = Boolean(r.data.issuedAt);
  const protectedFields = new Set([
    "identityAliases",
    "approvedHash",
    "approvedAt",
    "approvedBy",
    "sendState",
    "sentAt",
    "providerReceipt",
    "issuedAt",
    "paidAt",
  ]);
  async function run(action: string, payload: Fields = {}, close = false) {
    setBusy(true);
    setError("");
    try {
      const result = await act(action, payload, r);
      if (close) onClose();
      return result;
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  const detailTabs =
    r.kind === "contact"
      ? [
          ["overview", "Overview"],
          ["evidence", "Evidence"],
          ["drafts", "Messages & drafts"],
          ["work", "Linked work"],
          ["history", "History"],
        ]
      : [
          ["overview", "Overview"],
          ["history", "History"],
        ];
  const fields = modules[r.kind].fields;
  return (
    <Dialog.Root open onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="detail-backdrop" />
        <Dialog.Popup className="detail-panel">
          <div className="detail-top">
            <span className="eyebrow">
              {modules[r.kind].singular.toUpperCase()} <span> / </span>{" "}
              {workspace.projects.find((p) => p.id === r.projectId)?.name}
            </span>
            <Dialog.Close className="icon-btn" aria-label="Close record">
              <X size={21} />
            </Dialog.Close>
          </div>
          <div className="detail-heading">
            {r.kind === "contact" && (
              <div className="avatar avatar-large">{initials(r.title)}</div>
            )}
            <div>
              <Dialog.Title>{r.title}</Dialog.Title>
              <Dialog.Description>
                {r.kind === "contact"
                  ? text(r, "role") +
                    (text(r, "company") ? ` at ${text(r, "company")}` : "")
                  : contact
                    ? `With ${contact.title}`
                    : `${modules[r.kind].label} · Created ${dateLabel(r.createdAt)}`}
              </Dialog.Description>
            </div>
          </div>
          <div className="detail-actions">
            <Badge>{status}</Badge>
            {!(invoice && issued) && !sent && (
              <Button tone="quiet" onClick={() => editRecord(r)}>
                <PencilSimple size={15} />
                Edit
              </Button>
            )}
            {r.kind === "contact" && (
              <Button tone="quiet" onClick={() => setMergeOpen(true)}>
                <Users size={15} />
                Merge
              </Button>
            )}
            {!issued && !sent && (
              <Button tone="quiet" onClick={() => setConfirm("archive")}>
                <Archive size={15} />
                Archive
              </Button>
            )}
          </div>
          <Tabs items={detailTabs} value={tab} onChange={setTab} />
          <div className="detail-body">
            <ErrorBox error={error} />
            {tab === "history" ? (
              <ActivityList
                activities={workspace.activities
                  .filter((a) => a.recordId === r.id)
                  .slice()
                  .reverse()}
                records={[r]}
              />
            ) : tab === "drafts" ? (
              <>
                <SectionHead
                  title="Messages & drafts"
                  action="New draft"
                  onAction={() =>
                    openCreate(
                      "draft",
                      r.kind === "contact" ? r.id : r.contactId || undefined,
                    )
                  }
                />
                {linked.some((rec) =>
                  ["draft", "message", "conversation"].includes(rec.kind),
                ) ? (
                  <MiniList
                    records={linked.filter((rec) =>
                      ["draft", "message", "conversation"].includes(rec.kind),
                    )}
                    empty=""
                  />
                ) : (
                  <p className="muted">
                    No messages recorded for this person yet.
                  </p>
                )}
                <Button onClick={() => setReplyOpen(true)}>
                  <Plus size={16} />
                  Record a received reply
                </Button>
              </>
            ) : tab === "work" ? (
              <>
                <SectionHead
                  title="Linked commitments"
                  action="Add task"
                  onAction={() =>
                    openCreate(
                      "task",
                      r.kind === "contact" ? r.id : r.contactId || undefined,
                    )
                  }
                />
                <MiniList
                  records={linked.filter((rec) =>
                    [
                      "task",
                      "opportunity",
                      "meeting",
                      "onboarding",
                      "promise",
                    ].includes(rec.kind),
                  )}
                  empty="No linked work yet."
                />
              </>
            ) : tab === "evidence" ? (
              <>
                <SectionHead title="Observed evidence" />
                <div className="evidence-card">
                  <span className="eyebrow">
                    {text(r, "checkedAt")
                      ? `CHECKED ${dateLabel(text(r, "checkedAt")).toUpperCase()}`
                      : "NOT YET VERIFIED"}
                  </span>
                  <p>
                    {text(r, "observation") ||
                      "No observation has been recorded. Keep assumptions separate from things you have actually seen."}
                  </p>
                  {text(r, "evidenceUrl") && (
                    <ExternalLink url={text(r, "evidenceUrl")}>
                      Open evidence source
                    </ExternalLink>
                  )}
                </div>
                <EvidenceList record={r} />
                <dl className="detail-fields">
                  <div>
                    <dt>Qualification</dt>
                    <dd>
                      {r.data.qualificationScore != null
                        ? `${r.data.qualificationScore} / 10`
                        : "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt>Segment</dt>
                    <dd>{label(text(r, "segment") || "unknown")}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <dl className="detail-summary">
                  <div>
                    <dt>Owner</dt>
                    <dd>
                      <Owner id={r.ownerId} record={r} />
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {r.kind === "opportunity"
                        ? "Next action due"
                        : "Due date"}
                    </dt>
                    <dd>{dateLabel(r.dueAt)}</dd>
                  </div>
                  {contact && (
                    <div>
                      <dt>Person</dt>
                      <dd>
                        <button
                          className="text-link"
                          onClick={() => openRecord(contact)}
                        >
                          {contact.title}
                          <ArrowUpRight size={14} />
                        </button>
                      </dd>
                    </div>
                  )}
                </dl>
                {draft ? (
                  <>
                    <div className="message-context">
                      <EnvelopeSimple size={19} />
                      <span>
                        {label(text(r, "channel") || "Unspecified channel")}{" "}
                        <span>·</span>{" "}
                        {text(r, "accountContext") ||
                          "Account context not specified"}
                      </span>
                    </div>
                    <dl className="detail-fields">
                      <div>
                        <dt>Recipient</dt>
                        <dd>
                          {text(r, "recipient") ||
                            "Unknown — verify before approval"}
                        </dd>
                      </div>
                      <div>
                        <dt>Message purpose</dt>
                        <dd>
                          {
                            {
                              instagram: "Instagram first message",
                              connection: "LinkedIn connection request",
                              accepted: "LinkedIn after acceptance",
                              reply: "Reply to a conversation",
                              followup: "Follow-up message",
                              other: "Other draft — verify intended use",
                            }[draftPurpose(r)]
                          }
                        </dd>
                      </div>
                    </dl>
                    <p className="draft-review-note">
                      <ShieldCheck size={17} aria-hidden="true" />
                      {draftReviewNote(contact, r)}
                    </p>
                    {draftPurpose(r) === "accepted" && (
                      <p className="form-note">
                        Confirm the connection was accepted before using this
                        message. A saved draft is not proof of acceptance.
                      </p>
                    )}
                    {text(r, "subject") && (
                      <h3 className="draft-subject">{text(r, "subject")}</h3>
                    )}
                    <div className="draft-body">{text(r, "body")}</div>
                    <div className="draft-controls">
                      <CopyButton value={text(r, "body")} />
                      {text(r, "destinationUrl") && (
                        <ExternalLink url={text(r, "destinationUrl")}>
                          Open conversation
                        </ExternalLink>
                      )}
                    </div>
                    <div className="approval-box">
                      <ShieldCheck size={22} />
                      <div>
                        <strong>
                          {sent
                            ? "Manually confirmed sent"
                            : approved
                              ? "This exact message is approved"
                              : "Review the exact message above"}
                        </strong>
                        <p>
                          {sent
                            ? "The record reflects a human send confirmation."
                            : approved
                              ? "Copy and send it in the real account, then confirm that individual send below."
                              : "Approval records your review. It does not send or publish the message."}
                        </p>
                      </div>
                    </div>
                    {!approved && !sent && (
                      <Button
                        tone="primary"
                        onClick={() => void run("approve_draft")}
                        disabled={busy}
                      >
                        {busy ? "Approving…" : "Approve exact message"}
                        <Check size={17} />
                      </Button>
                    )}
                    {approved && !sent && (
                      <div className="approved-actions">
                        <Button
                          tone="primary"
                          onClick={() => setConfirm("send")}
                        >
                          Confirm I manually sent this
                          <ArrowUpRight size={17} />
                        </Button>
                        {workspace.integrations.some(
                          (i) =>
                            i.status === "connected" &&
                            i.accountId === r.data.connectedAccountId,
                        ) && (
                          <Button onClick={() => setConfirm("provider")}>
                            Send via connected account
                            <EnvelopeSimple size={16} />
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="detail-field-list">
                      {fields
                        .filter(
                          (f) => text(r, f.key) && !protectedFields.has(f.key),
                        )
                        .map((field) => (
                          <div
                            key={field.key}
                            className={cn(
                              "detail-field",
                              field.type === "textarea" && "detail-field-long",
                            )}
                          >
                            <span>{field.label}</span>
                            {field.type === "url" ? (
                              <a
                                href={safeUrl(text(r, field.key))}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {text(r, field.key)}
                                <ArrowSquareOut size={14} />
                              </a>
                            ) : (
                              <p>
                                {field.key.endsWith("Cents")
                                  ? money(
                                      Number(r.data[field.key]),
                                      text(r, "currency") || "INR",
                                    )
                                  : field.key === "taxBps"
                                    ? `${Number(r.data.taxBps) / 100}%`
                                    : text(r, field.key)}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                    {invoice && (
                      <>
                        <InvoiceLines record={r} />
                        <div className="detail-finance-actions">
                          <Button
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              try {
                                await downloadInvoice(r.id);
                              } catch (e) {
                                setError((e as Error).message);
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            <DownloadSimple size={16} />
                            Download PDF
                          </Button>
                          {!issued && (
                            <Button
                              tone="primary"
                              disabled={busy}
                              onClick={() => setConfirm("issue")}
                            >
                              Issue invoice
                            </Button>
                          )}
                          {issued && !r.data.deliveryRecordedAt && (
                            <Button onClick={() => setInvoiceSendOpen(true)}>
                              <EnvelopeSimple size={16} />
                              Confirm I shared this invoice
                            </Button>
                          )}
                          {issued && !r.data.paidAt && (
                            <Button
                              tone="primary"
                              onClick={() => setPayment(true)}
                            >
                              Record verified payment
                            </Button>
                          )}
                        </div>
                        <p className="form-note">
                          Downloading or issuing a PDF does not send an email.
                          Share or send the document through your own account.
                        </p>
                      </>
                    )}
                    {r.kind === "onboarding" && (
                      <OnboardingChecklist record={r} />
                    )}{" "}
                    {r.kind === "meeting" && (
                      <div className="calendar-actions">
                        {text(r, "meetUrl") && (
                          <ExternalLink url={text(r, "meetUrl")}>
                            Join Google Meet
                          </ExternalLink>
                        )}
                        <Button onClick={() => setCalendarOpen(true)}>
                          <CalendarBlank size={16} />
                          Create calendar event
                        </Button>
                        <p className="form-note">
                          Creating an event is an explicit external action.
                          Attendees are invited only if you select that option.
                        </p>
                      </div>
                    )}
                    {r.kind === "automation" && (
                      <div className="receipt-box">
                        <h3>Execution receipt</h3>
                        <p>
                          {text(r, "receipt") ||
                            text(r, "receiptId") ||
                            "No execution receipt has been recorded. This job has not been verified as completed."}
                        </p>
                        {text(r, "output") && <pre>{text(r, "output")}</pre>}
                      </div>
                    )}
                    {["contact", "conversation"].includes(r.kind) && (
                      <div className="record-followup">
                        <Button onClick={() => setReplyOpen(true)}>
                          <Plus size={16} />
                          Record received reply
                        </Button>
                        <p className="muted small-copy">
                          Reply classification stays pending until reviewed by
                          Codex or a person.
                        </p>
                      </div>
                    )}
                    {["invoice", "proposal", "onboarding"].includes(r.kind) && (
                      <div className="share-section">
                        <SectionHead title="Share a read-only summary" />
                        <p className="muted small-copy">
                          Anyone with the link can read this summary for seven
                          days, subject to the hosting access settings. Private
                          notes and internal fields are excluded.
                        </p>
                        {share ? (
                          <>
                            <div className="token-value">{share}</div>
                            <CopyButton value={share} label="Copy share link" />
                          </>
                        ) : (
                          <Button
                            disabled={busy}
                            onClick={async () => {
                              const result = await run("create_share", {
                                expiresInDays: 7,
                              });
                              if (result?.url) setShare(String(result.url));
                            }}
                          >
                            <LinkSimple size={16} />
                            Create expiring share link
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            <div className="record-meta">
              <span>Version {r.version}</span>
              <span>Updated {dateLabel(r.updatedAt)}</span>
            </div>
          </div>
          <Confirm
            open={Boolean(confirm)}
            onClose={() => setConfirm(null)}
            busy={busy}
            title={
              confirm === "archive"
                ? "Archive this record?"
                : confirm === "issue"
                  ? "Issue this invoice?"
                  : confirm === "provider"
                    ? "Send this approved message now?"
                    : "Confirm this message was sent?"
            }
            description={
              confirm === "archive"
                ? "It will leave active views. The record and activity history remain stored."
                : confirm === "issue"
                  ? "Issuing locks this invoice for an accurate financial trail. Review the customer, currency, and line items first."
                  : confirm === "provider"
                    ? "This sends the exact approved message through the selected connected account to this person. This is an individual external send."
                    : "Confirm that you personally sent this exact approved message to the selected person in the real account. Copying or opening a conversation does not count."
            }
            onConfirm={async () => {
              const result = await run(
                confirm === "archive"
                  ? "archive_record"
                  : confirm === "issue"
                    ? "issue_invoice"
                    : confirm === "provider"
                      ? "provider_send"
                      : "confirm_send",
                {
                  attestation: true,
                  ...(confirm === "provider"
                    ? {
                        connectionId:
                          workspace.integrations.find(
                            (i) => i.accountId === r.data.connectedAccountId,
                          )?.id || "",
                      }
                    : {}),
                },
                confirm === "archive",
              );
              if (result) setConfirm(null);
            }}
          />
          <Modal
            open={replyOpen}
            onClose={() => setReplyOpen(false)}
            title="Record a received reply"
            description="Paste the actual inbound message from the real account."
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  const result = await run("record_reply", {
                    body: reply,
                    channel: text(r, "channel") || "manual",
                  });
                  if (result) {
                    setReply("");
                    setReplyOpen(false);
                  }
                })();
              }}
            >
              <div className="modal-body">
                <ErrorBox error={error} />
                <div className="field">
                  <label htmlFor="reply-body">Received message</label>
                  <textarea
                    id="reply-body"
                    rows={7}
                    required
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                </div>
                <p className="form-note">
                  The message is saved as received. Intent classification is not
                  fabricated locally.
                </p>
              </div>
              <div className="form-footer">
                <Button type="button" onClick={() => setReplyOpen(false)}>
                  Cancel
                </Button>
                <Button tone="primary" disabled={busy}>
                  {busy ? "Recording…" : "Record reply"}
                </Button>
              </div>
            </form>
          </Modal>
          <Modal
            open={payment}
            onClose={() => setPayment(false)}
            title="Record a verified payment"
            description="Only confirm funds you have actually checked."
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  const result = await run("record_payment", {
                    attestation: true,
                    reference,
                    amountCents: Math.round(Number(paymentAmount) * 100),
                  });
                  if (result) setPayment(false);
                })();
              }}
            >
              <div className="modal-body">
                <ErrorBox error={error} />
                <p className="payment-amount">
                  {money(
                    Number(r.data.totalCents ?? r.data.amountCents ?? 0),
                    text(r, "currency") || "INR",
                  )}
                </p>
                <div className="field">
                  <label htmlFor="payment-amount">
                    Amount received ({text(r, "currency") || "INR"})
                  </label>
                  <input
                    id="payment-amount"
                    type="number"
                    required
                    min="0.01"
                    max={
                      (Number(r.data.totalCents ?? r.data.amountCents ?? 0) -
                        Number(r.data.paidCents ?? 0)) /
                      100
                    }
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="payment-reference">
                    Bank or payment reference
                  </label>
                  <input
                    id="payment-reference"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <label className="checkbox-label">
                  <input type="checkbox" required />I have verified that this
                  payment was received.
                </label>
              </div>
              <div className="form-footer">
                <Button type="button" onClick={() => setPayment(false)}>
                  Cancel
                </Button>
                <Button tone="primary" disabled={busy}>
                  {busy ? "Recording…" : "Confirm payment received"}
                </Button>
              </div>
            </form>
          </Modal>
          <Modal
            open={invoiceSendOpen}
            onClose={() => setInvoiceSendOpen(false)}
            title="Confirm you shared this invoice"
            description="Record an individual delivery through your own account."
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  const result = await run("invoice_confirm_sent", {
                    attestation: true,
                    channel: "manual",
                    reference: deliveryReference,
                  });
                  if (result) setInvoiceSendOpen(false);
                })();
              }}
            >
              <div className="modal-body">
                <ErrorBox error={error} />
                <div className="field">
                  <label htmlFor="invoice-delivery-reference">
                    Delivery reference or note (optional)
                  </label>
                  <input
                    id="invoice-delivery-reference"
                    value={deliveryReference}
                    onChange={(e) => setDeliveryReference(e.target.value)}
                    placeholder="For example, emailed from my business inbox"
                  />
                </div>
                <label className="checkbox-label">
                  <input type="checkbox" required />I personally shared this
                  issued invoice with the intended recipient.
                </label>
                <p className="form-note">
                  This records your confirmation. It does not send an email,
                  message, or payment request.
                </p>
              </div>
              <div className="form-footer">
                <Button type="button" onClick={() => setInvoiceSendOpen(false)}>
                  Cancel
                </Button>
                <Button tone="primary" disabled={busy}>
                  {busy ? "Recording…" : "Confirm manual delivery"}
                </Button>
              </div>
            </form>
          </Modal>
          <Modal
            open={mergeOpen}
            onClose={() => setMergeOpen(false)}
            title="Merge duplicate people"
            description="Choose the person whose record you want to keep."
          >
            <div className="modal-body">
              <ErrorBox error={error} />
              <div className="field">
                <label htmlFor="merge-target">Keep this person</label>
                <select
                  id="merge-target"
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                >
                  <option value="">Choose a person…</option>
                  {records
                    .filter((c) => c.kind === "contact" && c.id !== r.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}{" "}
                        {text(c, "email") ? `(${text(c, "email")})` : ""}
                      </option>
                    ))}
                </select>
              </div>
              <p className="form-note">
                This record will be archived. Linked work and unsent messages
                move to the person you keep. Draft approvals are revoked for
                review; sent history remains accurate. Suppression is preserved.
              </p>
            </div>
            <div className="form-footer">
              <Button onClick={() => setMergeOpen(false)}>Cancel</Button>
              <Button
                tone="primary"
                disabled={!mergeTarget || busy}
                onClick={() => setMergeReview(true)}
              >
                Review merge
              </Button>
            </div>
          </Modal>
          <Confirm
            open={mergeReview}
            onClose={() => setMergeReview(false)}
            title="Merge these two people?"
            description={`Archive ${r.title} and merge their records into ${records.find((c) => c.id === mergeTarget)?.title || "the selected person"}? Review both identities before confirming.`}
            busy={busy}
            onConfirm={async () => {
              const target = records.find((c) => c.id === mergeTarget);
              if (!target) return;
              const result = await run("merge_contacts", {
                targetId: target.id,
                targetVersion: target.version,
              });
              if (result) {
                setMergeReview(false);
                setMergeOpen(false);
                onClose();
                if (result.record) openRecord(result.record);
              }
            }}
          />
          <Modal
            open={calendarOpen}
            onClose={() => setCalendarOpen(false)}
            title="Create a real calendar event"
            description="Review the meeting time and attendees before continuing."
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  const result = await run("calendar_create_event", {
                    connectionId: calendarId,
                    attestation: true,
                    inviteAttendees,
                  });
                  if (result) setCalendarOpen(false);
                })();
              }}
            >
              <div className="modal-body">
                <ErrorBox error={error} />
                <div className="field">
                  <label htmlFor="calendar-account">
                    Connected calendar account
                  </label>
                  <select
                    id="calendar-account"
                    required
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                  >
                    <option value="">Select a calendar…</option>
                    {workspace.integrations
                      .filter(
                        (i) =>
                          i.provider === "googlecalendar" &&
                          i.status === "connected",
                      )
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.label}
                        </option>
                      ))}
                  </select>
                </div>
                <p>
                  {text(r, "startsAt")
                    ? new Date(text(r, "startsAt")).toLocaleString()
                    : "Set a meeting time before creating an event."}
                </p>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={inviteAttendees}
                    onChange={(e) => setInviteAttendees(e.target.checked)}
                  />
                  Send calendar invitations to the saved attendees
                </label>
                <p className="form-note">
                  A Meet link appears only after the provider returns one. No
                  calendar account connected? Set it up in Settings →
                  Connections.
                </p>
              </div>
              <div className="form-footer">
                <Button type="button" onClick={() => setCalendarOpen(false)}>
                  Cancel
                </Button>
                <Button
                  tone="primary"
                  disabled={busy || !calendarId || !text(r, "startsAt")}
                >
                  {busy ? "Creating…" : "Create calendar event"}
                </Button>
              </div>
            </form>
          </Modal>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function InvoiceLines({ record: r }: { record: CrmRecord }) {
  const lines = Array.isArray(r.data.items) ? (r.data.items as Fields[]) : [];
  return (
    <div className="invoice-preview">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i}>
              <td>{String(line.description)}</td>
              <td>{String(line.quantity)}</td>
              <td>{money(Number(line.unitCents), text(r, "currency"))}</td>
              <td>
                {money(
                  Number(line.unitCents) * Number(line.quantity),
                  text(r, "currency"),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="invoice-total">
        Total{" "}
        <strong>
          {money(
            Number(r.data.totalCents ?? r.data.amountCents ?? 0),
            text(r, "currency") || "INR",
          )}
        </strong>
      </div>
    </div>
  );
}
function EvidenceList({ record }: { record: CrmRecord }) {
  const evidence = record.data.evidence;
  if (!Array.isArray(evidence)) return null;
  return (
    <>
      {evidence.map((item, i) => {
        if (!item || typeof item !== "object" || Array.isArray(item))
          return null;
        return (
          <div className="evidence-card" key={i}>
            <span className="eyebrow">
              {item.checkedAt
                ? `CHECKED ${dateLabel(String(item.checkedAt))}`
                : "CHECK DATE UNKNOWN"}
            </span>
            <p>
              {String(
                item.observation || item.summary || "No observation recorded.",
              )}
            </p>
            {(item.url || item.sourceUrl) && (
              <ExternalLink url={String(item.url || item.sourceUrl)}>
                Open evidence source
              </ExternalLink>
            )}
          </div>
        );
      })}
    </>
  );
}
function OnboardingChecklist({ record }: { record: CrmRecord }) {
  const { act } = useCRM();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const steps: Fields[] = Array.isArray(record.data.milestoneItems)
    ? record.data.milestoneItems.filter(
        (step): step is Fields =>
          Boolean(step) && typeof step === "object" && !Array.isArray(step),
      )
    : text(record, "milestones")
        .split("\n")
        .filter((s) => s.trim())
        .map((title, i) => ({
          id: String(i),
          title: title.replace(/^\s*[-*]?\s*\[[ xX]\]\s*/, ""),
          done: /\[[xX]\]/.test(title),
        }));
  if (!steps.length) return null;
  return (
    <section className="onboarding-checklist">
      <SectionHead
        title="Milestone checklist"
        count={steps.filter((s) => s.done).length}
      />
      <p className="muted small-copy">
        {steps.filter((s) => s.done).length} of {steps.length} complete. Check a
        milestone only after verifying it happened.
      </p>
      <ErrorBox error={error} />
      {steps.map((step, index) => (
        <label
          key={String(step.id || index)}
          className={cn("milestone-row", step.done && "milestone-done")}
        >
          <input
            type="checkbox"
            disabled={busy}
            checked={Boolean(step.done)}
            onChange={async (e) => {
              setBusy(true);
              setError("");
              const done = e.target.checked;
              const next = steps.map((s, i) =>
                i === index
                  ? {
                      ...s,
                      done,
                      completedAt: done ? new Date().toISOString() : null,
                    }
                  : s,
              );
              try {
                await act(
                  "update_record",
                  {
                    data: {
                      ...record.data,
                      milestoneItems: next,
                      milestones: next
                        .map((s) => `${s.done ? "[x]" : "[ ]"} ${s.title}`)
                        .join("\n"),
                    },
                    status: next.every((s) => s.done)
                      ? "completed"
                      : "in_progress",
                  },
                  record,
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
          <span>
            {String(step.title || "Untitled milestone")}
            {Boolean(step.completedAt) && (
              <small>Completed {dateLabel(String(step.completedAt))}</small>
            )}
          </span>
        </label>
      ))}
    </section>
  );
}
