import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AnimationItem } from "lottie-web";

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
import { ChartBarIcon as ChartBar } from "@phosphor-icons/react/dist/csr/ChartBar";

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
import greetingBunny from "./assets/dashboard/greeting-bunny.webp";
import dashboardPeopleMascot from "./assets/dashboard/metric-people-kitten.webp";
import dashboardPipelineMascot from "./assets/dashboard/metric-pipeline-panda.webp";
import dashboardDueMascot from "./assets/dashboard/metric-due-dinosaur.webp";
import dashboardReplyMascot from "./assets/dashboard/metric-reply-chick.webp";
import draftMascot from "./assets/dashboard/metric-draft-kitten.webp";
import moneyMascot from "./assets/dashboard/metric-money-raccoon.webp";
import knowledgeMascot from "./assets/dashboard/metric-knowledge-owl.webp";
import automationMascot from "./assets/dashboard/metric-automation-robot.webp";
import companiesMascot from "./assets/dashboard/metric-companies.webp";
import followupsMascot from "./assets/dashboard/metric-followups.webp";
import unassignedMascot from "./assets/dashboard/metric-unassigned.webp";
import opportunitiesMascot from "./assets/dashboard/metric-opportunities.webp";
import payingMascot from "./assets/dashboard/metric-paying.webp";
import completedTasksMascot from "./assets/dashboard/metric-completed-tasks.webp";
import overdueTasksMascot from "./assets/dashboard/metric-overdue-tasks.webp";
import meetingsMascot from "./assets/dashboard/metric-meetings.webp";
import invoicesMascot from "./assets/dashboard/metric-invoices.webp";
import overdueInvoicesMascot from "./assets/dashboard/metric-overdue-invoices.webp";
import currentKnowledgeMascot from "./assets/dashboard/metric-current-knowledge.webp";
import reviewKnowledgeMascot from "./assets/dashboard/metric-review-knowledge.webp";
import linkedKnowledgeMascot from "./assets/dashboard/metric-linked-knowledge.webp";
import completedRunsMascot from "./assets/dashboard/metric-completed-runs.webp";
import reviewRunsMascot from "./assets/dashboard/metric-review-runs.webp";
import humanApprovalMascot from "./assets/dashboard/metric-human-approval.webp";
import waitingReplyMascot from "./assets/dashboard/metric-waiting-reply.webp";
import recordedReplyMascot from "./assets/dashboard/metric-recorded-reply.webp";
import sentMessagesMascot from "./assets/dashboard/metric-sent-messages.webp";

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
      <div className="page-head-copy">
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
      <span className="page-head-mark" aria-hidden="true" />
    </header>
  );
}

const metricMascots = {
  companies: companiesMascot,
  followups: followupsMascot,
  unassigned: unassignedMascot,
  opportunities: opportunitiesMascot,
  paying: payingMascot,
  completedTasks: completedTasksMascot,
  overdueTasks: overdueTasksMascot,
  meetings: meetingsMascot,
  invoices: invoicesMascot,
  overdueInvoices: overdueInvoicesMascot,
  currentKnowledge: currentKnowledgeMascot,
  reviewKnowledge: reviewKnowledgeMascot,
  linkedKnowledge: linkedKnowledgeMascot,
  completedRuns: completedRunsMascot,
  reviewRuns: reviewRunsMascot,
  humanApproval: humanApprovalMascot,
  waitingReply: waitingReplyMascot,
  recordedReply: recordedReplyMascot,
  sentMessages: sentMessagesMascot,
  people: dashboardPeopleMascot,
  pipeline: dashboardPipelineMascot,
  task: dashboardDueMascot,
  reply: dashboardReplyMascot,
  draft: draftMascot,
  money: moneyMascot,
  knowledge: knowledgeMascot,
  automation: automationMascot,
};

function MetricSummary({ title, items }: {
  title: string;
  items: { label: string; value: number | string; detail: string; mascot: keyof typeof metricMascots; onClick?: () => void }[];
}) {
  return (
    <section className="metric-summary" aria-label={title} data-count={items.length}>
      {items.map((item) => {
        const content = <>
          <img src={metricMascots[item.mascot]} width={64} height={70} alt="" decoding="async" />
          <span><small>{item.label}</small><strong>{item.value}</strong><em>{item.detail}</em></span>
          {item.onClick && <ArrowRight size={15} aria-hidden="true" />}
        </>;
        return item.onClick ? (
          <button key={item.label} type="button" onClick={item.onClick}>{content}</button>
        ) : <article key={item.label}>{content}</article>;
      })}
    </section>
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

function RecordContext({
  record,
  eyebrow,
}: {
  record?: CrmRecord;
  eyebrow: string;
}) {
  const { openRecord } = useCRM();
  const records = useRecords();
  if (!record)
    return (
      <aside
        className="record-context record-context-empty"
        aria-label="Selected record context"
      >
        <span className="eyebrow">{eyebrow}</span>
        <h2>Select a record</h2>
        <p>
          Choose an item to see its owner, status, and the next useful step
          without opening a drawer.
        </p>
      </aside>
    );
  const contact = record.contactId
    ? records.find((item) => item.id === record.contactId)
    : undefined;
  const nextStep =
    text(record, "nextAction") ||
    text(record, "description") ||
    text(record, "agenda") ||
    text(record, "summary") ||
    "Add the next useful step in the full record.";
  return (
    <aside
      className="record-context"
      aria-label={`Context for ${record.title}`}
    >
      <div className="record-context-top">
        <div>
          <strong>The useful context</strong>
          <span>{eyebrow}</span>
        </div>
        <span className="context-mark" aria-hidden="true" />
      </div>
      <div className="record-context-person">
        <span className="avatar">
          {initials(contact?.title || record.title)}
        </span>
        <div>
          <strong>{contact?.title || modules[record.kind].singular}</strong>
          <span>
            {contact
              ? text(contact, "company") || "Linked person"
              : label(record.kind)}
          </span>
        </div>
      </div>
      <h2>{record.title}</h2>
      <div className="record-context-meta">
        <Owner id={record.ownerId} record={record} />
        <span>
          {record.dueAt ? `Due ${dateLabel(record.dueAt)}` : "No due date"}
        </span>
      </div>
      <QuickRecordControls
        record={record}
        statuses={modules[record.kind].statuses}
      />
      <div className="context-section">
        <span>WHY IT IS HERE</span>
        <p>
          {record.kind === "draft"
            ? "This draft is stored for review. Approval and any individual send are separate actions."
            : `${label(record.status)} · ${modules[record.kind].description}`}
        </p>
      </div>
      <div className="context-section">
        <span>NEXT USEFUL STEP</span>
        <p>{nextStep}</p>
      </div>
      <Button tone="primary" onClick={() => openRecord(record)}>
        Open full record
        <ArrowUpRight size={16} />
      </Button>
    </aside>
  );
}

function DaybookCard({
  record,
  icon,
  selected,
  onSelect,
}: {
  record: CrmRecord;
  icon: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const records = useRecords();
  const linkedPerson = record.contactId
    ? records.find((candidate) => candidate.id === record.contactId)
    : undefined;
  const timestamp =
    (record.kind === "meeting" && text(record, "startsAt")) || record.dueAt;
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const timing =
    timestamp && new Date(timestamp) < dayStart
      ? `Overdue · ${dateLabel(timestamp)}`
      : record.kind === "meeting" && timestamp
        ? new Date(timestamp).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })
        : "Anytime";
  return (
    <article
      className={cn("daybook-card", selected && "daybook-card-selected")}
    >
      <div className="daybook-time">{timing}</div>
      <button
        className="daybook-card-main"
        aria-pressed={selected}
        onClick={onSelect}
      >
        <span className="daybook-record-type">
          {icon}
          {modules[record.kind].singular}
        </span>
        <strong>{record.title}</strong>
        {(linkedPerson?.title || text(record, "company")) && (
          <span className="daybook-record-meta">
            {linkedPerson?.title || text(record, "company")}
          </span>
        )}
      </button>
      <div className="daybook-card-actions">
        <Owner id={record.ownerId} record={record} />
        <span>{label(record.status)}</span>
      </div>
    </article>
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

function GreetingHello({ intro, onComplete }: { intro: boolean; onComplete: () => void }) {
  const animationHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let animation: AnimationItem | undefined;
    let movement: Animation | undefined;
    let removeIntroComplete: (() => void) | undefined;
    let fallbackTimer: number | undefined;
    const host = animationHost.current;
    if (!host) return;
    const canvas = document.createElement("div");
    canvas.className = "dashboard-greeting-canvas";
    const overlay = document.createElement("div");
    overlay.className = "dashboard-welcome";
    const shouldAnimate = intro && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dock = () => {
      if (disposed) return;
      movement?.cancel();
      movement = undefined;
      canvas.className = "dashboard-greeting-canvas";
      canvas.removeAttribute("style");
      host.appendChild(canvas);
      host.dataset.ready = "true";
      overlay.remove();
      animation?.goToAndStop(110, true);
      onComplete();
    };
    const land = async () => {
      if (disposed || !animation) return;
      removeIntroComplete?.();
      removeIntroComplete = undefined;
      animation.goToAndStop(110, true);
      const target = host.getBoundingClientRect();
      const start = canvas.getBoundingClientRect();
      const dx = target.left + target.width / 2 - (start.left + start.width / 2);
      const dy = target.top + target.height / 2 - (start.top + start.height / 2);
      const scale = target.width / start.width;
      overlay.classList.add("is-settling");
      movement = canvas.animate([
        { transform: "translate(-50%, -50%) scale(1)" },
        { transform: `translate(calc(-50% + ${dx * .5}px), calc(-50% + ${dy * .5 - 25}px)) scale(.58)`, offset: .5 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})` },
      ], { duration: 950, easing: "cubic-bezier(.4, 0, .2, 1)", fill: "forwards" });
      try { await movement.finished; dock(); } catch { /* Unmounted during the greeting. */ }
    };
    void Promise.all([
      import("lottie-web"),
      import("./assets/dashboard/dashboard-welcome.lottie.json"),
    ]).then(([lottieModule, animationData]) => {
      if (disposed) return;
      if (shouldAnimate) {
        canvas.classList.add("dashboard-welcome-character");
        overlay.appendChild(canvas);
        document.body.appendChild(overlay);
      } else host.appendChild(canvas);
      animation = lottieModule.default.loadAnimation({
        container: canvas,
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData: structuredClone(animationData.default),
        rendererSettings: { preserveAspectRatio: "xMidYMid meet", viewBoxSize: "278.887 458.406 543.882 160.537" },
      });
      const showHello = () => {
        if (disposed || !animation) return;
        if (shouldAnimate) {
          animation.setSpeed(1.5);
          removeIntroComplete = animation.addEventListener("complete", () => void land());
          animation.playSegments([0, 110], true);
        } else {
          animation.goToAndStop(110, true);
          dock();
        }
      };
      if (animation.isLoaded) showHello();
      else animation.addEventListener("DOMLoaded", showHello);
      fallbackTimer = window.setTimeout(() => {
        if (!host.dataset.ready && !disposed) dock();
      }, 8000);
    }).catch(() => {
      if (!disposed) { overlay.remove(); onComplete(); }
    });
    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      removeIntroComplete?.();
      movement?.cancel();
      animation?.destroy();
      canvas.remove();
      overlay.remove();
    };
  }, []);

  return <div ref={animationHost} className="dashboard-greeting-hello" aria-hidden="true"><span className="dashboard-hello-fallback">Hello!</span></div>;
}

export function TodayView() {
  const { workspace, projectId, setPage, openCreate, openRecord } = useCRM();
  const records = useRecords();
  const [assignee, setAssignee] = useState("everyone");
  const [selectedId, setSelectedId] = useState("");
  const [indiaNow, setIndiaNow] = useState(() => new Date());
  const greetingMascot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const interval = window.setInterval(() => setIndiaNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrowStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const members = workspace.members.filter((member) =>
    member.projectIds.includes(projectId),
  );
  const founders = members.filter((member) =>
    /anshu|nahush/i.test(member.name),
  );
  const when = (record: CrmRecord) =>
    (record.kind === "meeting" && text(record, "startsAt")) ||
    record.dueAt ||
    "";
  const matchesOwner = (record: CrmRecord) => {
    const collaborators = Array.isArray(record.data.collaboratorIds)
      ? record.data.collaboratorIds.filter(
          (id): id is string => typeof id === "string",
        )
      : [];
    if (assignee === "everyone") return true;
    if (assignee === "__both")
      return (
        founders.length >= 2 &&
        founders.every(
          (member) =>
            record.ownerId === member.id || collaborators.includes(member.id),
        )
      );
    return record.ownerId === assignee || collaborators.includes(assignee);
  };
  const relevant = records
    .filter((record) => {
      if (["task", "promise", "onboarding", "meeting"].includes(record.kind))
        return !isComplete(record);
      if (record.kind === "draft")
        return statusIs(record, "Draft", "Needs review");
      if (record.kind === "conversation")
        return statusIs(record, "Open", "Needs action");
      return false;
    })
    .filter((record) => {
      const date = when(record);
      return (
        date &&
        !Number.isNaN(Date.parse(date)) &&
        new Date(date) < dayAfterTomorrow &&
        matchesOwner(record)
      );
    })
    .sort((a, b) => when(a).localeCompare(when(b)));
  const today = relevant.filter(
    (record) => new Date(when(record)) < tomorrowStart,
  );
  const tomorrow = relevant.filter(
    (record) => new Date(when(record)) >= tomorrowStart,
  );
  const selected =
    relevant.find((record) => record.id === selectedId) ||
    today[0] ||
    tomorrow[0];
  const longDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  const indiaParts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(indiaNow);
  const indiaHour = Number(indiaParts.find((part) => part.type === "hour")?.value || 0);
  const greeting =
    indiaHour < 12
      ? "Good morning"
      : indiaHour < 17
        ? "Good afternoon"
        : indiaHour < 21
          ? "Good evening"
          : "Hello";
  const firstName = workspace.actor.name.trim().split(/\s+/)[0] || "there";
  const welcomeStorageKey = `founder-crm-dashboard-welcome:v3:${projectId}:${workspace.actor.id}`;
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !window.sessionStorage.getItem(welcomeStorageKey);
    } catch {
      return false;
    }
  });
  const finishWelcome = () => {
    try {
      window.sessionStorage.setItem(welcomeStorageKey, "seen");
    } catch {
      // The greeting is still usable when storage is unavailable.
    }
    setShowWelcome(false);
  };
  const indiaTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(indiaNow);
  const indiaDate = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(indiaNow);
  const indiaMonth = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "long",
  }).format(indiaNow);
  const indiaDay = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
  }).format(indiaNow);
  const openOpportunities = records.filter(
    (record) =>
      record.kind === "opportunity" &&
      !statusIs(record, "Lost", "Paying"),
  );
  const needsReply = records.filter(
    (record) =>
      (record.kind === "conversation" && statusIs(record, "Open", "Needs action")) ||
      (record.kind === "draft" && statusIs(record, "Needs review")),
  );
  const dashboardMetrics = [
    { label: "People", value: records.filter((record) => record.kind === "contact").length, detail: "people in this project", mascot: dashboardPeopleMascot, page: "people" as const },
    { label: "Open pipeline", value: openOpportunities.length, detail: "opportunities in progress", mascot: dashboardPipelineMascot, page: "pipeline" as const },
    { label: "Due today", value: today.length, detail: "commitments for today", mascot: dashboardDueMascot, page: "work" as const },
    { label: "Needs reply", value: needsReply.length, detail: "items needing attention", mascot: dashboardReplyMascot, page: "inbox" as const },
  ];
  const iconFor = (record: CrmRecord) =>
    record.kind === "draft" ? (
      <NotePencil size={14} />
    ) : record.kind === "meeting" ? (
      <CalendarBlank size={14} />
    ) : record.kind === "conversation" ? (
      <Tray size={14} />
    ) : (
      <CheckCircle size={14} />
    );
  const renderSection = (title: string, date: Date, items: CrmRecord[]) => (
    <section
      className={cn(
        "daybook-section",
        title === "Tomorrow" && "daybook-section-later",
      )}
      aria-label={title}
    >
      <div className="daybook-section-head">
        <span className="daybook-section-dot" />
        <h2>{title}</h2>
        <span>{longDate(date)}</span>
      </div>
      {items.length ? (
        items.map((record) => (
          <DaybookCard
            key={record.id}
            record={record}
            icon={iconFor(record)}
            selected={selected?.id === record.id}
            onSelect={() => setSelectedId(record.id)}
          />
        ))
      ) : (
        <p className="daybook-empty">
          Nothing scheduled {title.toLowerCase()}.
        </p>
      )}
    </section>
  );
  return (
    <div className={cn("daybook-home", showWelcome && "dashboard-welcome-active")}>
      <header className="today-page-head daily-brief">
        <div className="brief-main">
          <div className="date-index">
            <span>{indiaMonth.toUpperCase()}</span>
            <strong>{indiaDay}</strong>
            <span>{indiaDate.split(",")[1]?.trim() || "India"}</span>
          </div>
          <div className="dashboard-greeting-content">
            <div ref={greetingMascot} className="dashboard-greeting-mascot" aria-label="Hello">
              <div className="dashboard-greeting-bubble">
                <GreetingHello intro={showWelcome} onComplete={finishWelcome} />
              </div>
              <img src={greetingBunny} alt="A friendly mascot waving hello" />
            </div>
            <div className="today-heading-copy">
              <div className="dashboard-time">
                <time dateTime={indiaNow.toISOString()}>{indiaTime} <em>IST</em></time>
                <button
                  className="dashboard-reminder-button"
                  type="button"
                  title="Set a reminder"
                  aria-label="Set a reminder"
                  onClick={() => openCreate("task")}
                >
                  <Plus size={16} />
                </button>
              </div>
              <h1>{greeting}, {firstName}!</h1>
              <p>Here’s your dashboard for {indiaDate}.</p>
            </div>
          </div>
        </div>
        <aside className="dashboard-brief-focus" aria-label="Today’s focus">
          <span className="eyebrow">TODAY’S FOCUS</span>
          <strong>{selected ? selected.title : "Your calendar is clear"}</strong>
          <p>
            {selected
              ? `${label(selected.kind)} · ${selected.dueAt ? `due ${dateLabel(selected.dueAt)}` : "choose its next useful step"}`
              : "Your schedule is clear. Review open work when you are ready."}
          </p>
          <button
            type="button"
            onClick={() => (selected ? openRecord(selected) : setPage("work"))}
          >
            {selected ? "View selected work" : "Open work"}
            <ArrowRight size={15} />
          </button>
        </aside>
      </header>
      <section className="dashboard-summary" aria-label="Dashboard summary">
        {dashboardMetrics.map(({ label: metricLabel, value, detail, mascot, page }) => (
          <button type="button" key={metricLabel} onClick={() => setPage(page)}>
            <img className="dashboard-summary-mascot" src={mascot} alt="" />
            <span>
              <small>{metricLabel}</small>
              <strong>{value}</strong>
              <em>{detail}</em>
            </span>
            <ArrowRight size={15} />
          </button>
        ))}
      </section>
      <div className="daybook-filter-bar">
        <div
          className="daybook-owner-filter"
          role="group"
          aria-label="Show work for"
        >
          <span>Show work for</span>
          <button
            className={cn(assignee === "everyone" && "selected")}
            aria-pressed={assignee === "everyone"}
            onClick={() => setAssignee("everyone")}
          >
            Everyone
          </button>
          {members.map((member) => (
            <button
              key={member.id}
              className={cn(assignee === member.id && "selected")}
              aria-pressed={assignee === member.id}
              onClick={() => setAssignee(member.id)}
            >
              {member.name}
            </button>
          ))}
          {founders.length >= 2 && (
            <button
              className={cn(assignee === "__both" && "selected")}
              aria-pressed={assignee === "__both"}
              onClick={() => setAssignee("__both")}
            >
              Both
            </button>
          )}
        </div>
        <span className="daybook-total">
          {relevant.length}{" "}
          {relevant.length === 1 ? "commitment" : "commitments"}
        </span>
      </div>
      <div className="today-columns">
        <div className="daybook-agenda">
          {renderSection("Today", now, today)}
          {renderSection("Tomorrow", tomorrowStart, tomorrow)}
          <div className="daybook-agenda-footer">
            <p>Unscheduled and later work lives in Work.</p>
            <button className="text-link" onClick={() => setPage("work")}>
              Open work <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <RecordContext record={selected} eyebrow="SELECTED WORK" />
      </div>
    </div>
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
  const companies = useRecords("company");
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
      <MetricSummary title="Relationship overview" items={[
        { label: "People", value: records.length, detail: "contacts in this project", mascot: "people", onClick: () => setTab("contact") },
        { label: "Companies", value: companies.length, detail: "organisations in this project", mascot: "companies", onClick: () => setTab("company") },
        { label: "Follow-ups due", value: followUpsDue, detail: "contacts needing follow-through", mascot: "followups" },
        { label: "Without an owner", value: unassigned, detail: "contacts needing assignment", mascot: "unassigned" },
      ]} />
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

function StatusGraph({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: { label: string; value: number; detail?: string }[];
}) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return (
    <section className="status-graph" aria-label={title}>
      <header>
        <div>
          <span className="eyebrow">GRAPH VIEW</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <ChartBar size={22} aria-hidden="true" />
      </header>
      <div className="status-graph-bars">
        {items.map((item) => (
          <div className="status-graph-row" key={item.label}>
            <span>{item.label}</span>
            <div
              className="status-graph-track"
              role="img"
              aria-label={`${item.label}: ${item.value}`}
            >
              <span
                className="status-graph-fill"
                style={{ width: `${(item.value / maximum) * 100}%` }}
              />
            </div>
            <strong>{item.value}</strong>
            {item.detail && <small>{item.detail}</small>}
          </div>
        ))}
      </div>
      {!items.some((item) => item.value) && (
        <p className="status-graph-empty">
          Create records to see this graph populate.
        </p>
      )}
    </section>
  );
}

function dailyCounts(
  records: CrmRecord[],
  when: (record: CrmRecord) => string,
) {
  const dates = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - offset));
    return date;
  });
  return {
    labels: dates.map((date) =>
      date.toLocaleDateString(undefined, { weekday: "short" }),
    ),
    values: dates.map((date) => {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      return records.filter((record) => {
        const recordedAt = new Date(when(record));
        return recordedAt >= date && recordedAt < next;
      }).length;
    }),
  };
}

function TrendGraph({
  title,
  description,
  labels,
  primary,
  primaryLabel,
  secondary,
  secondaryLabel,
}: {
  title: string;
  description: string;
  labels: string[];
  primary: number[];
  primaryLabel: string;
  secondary: number[];
  secondaryLabel: string;
}) {
  const maximum = Math.max(...primary, ...secondary, 1);
  const points = (values: number[]) =>
    values
      .map((value, index) => {
        const x = 24 + (index * 552) / Math.max(values.length - 1, 1);
        const y = 154 - (value / maximum) * 118;
        return `${x},${y}`;
      })
      .join(" ");
  const recent = primary.slice(-3).reduce((sum, value) => sum + value, 0);
  const previous = primary.slice(0, 3).reduce((sum, value) => sum + value, 0);
  const direction = recent > previous ? "Up" : recent < previous ? "Down" : "Steady";
  return (
    <section className="trend-graph" aria-label={title}>
      <header>
        <div>
          <span className="eyebrow">TREND VIEW</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="trend-direction">{direction}</span>
      </header>
      <div className="trend-legend" aria-label="Graph legend">
        <span className="trend-primary">{primaryLabel}</span>
        <span className="trend-secondary">{secondaryLabel}</span>
      </div>
      <svg viewBox="0 0 600 180" role="img" aria-label={description}>
        {[36, 76, 116, 154].map((y) => (
          <line key={y} x1="24" x2="576" y1={y} y2={y} />
        ))}
        <polyline className="trend-line-secondary" points={points(secondary)} />
        <polyline className="trend-line-primary" points={points(primary)} />
      </svg>
      <div className="trend-axis">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <p className="trend-note">
        Based on dated CRM records; it does not infer historical backlog.
      </p>
    </section>
  );
}

export function PipelineView() {
  const { openCreate, act, toast, workspace } = useCRM();
  const records = useRecords("opportunity");
  const [mode, setMode] = useState("board");
  const [graphMode, setGraphMode] = useState<"distribution" | "trend">(
    "distribution",
  );
  const [selectedId, setSelectedId] = useState("");
  const [draggingId, setDraggingId] = useState("");
  const [dropStage, setDropStage] = useState("");
  const stages = modules.opportunity.statuses;
  const currencies = [
    ...new Set(records.map((r) => text(r, "currency") || "INR")),
  ];
  const selectedRecord =
    records.find((record) => record.id === selectedId) || records[0];

  async function moveOpportunity(id: string, stage: string) {
    const opportunity = records.find((record) => record.id === id);
    if (!opportunity || statusIs(opportunity, stage)) return;
    try {
      await act(
        "update_record",
        { status: stage.toLowerCase().replaceAll(" ", "_") },
        opportunity,
      );
      toast(`${opportunity.title} moved to ${stage}.`);
    } catch (error) {
      toast((error as Error).message);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="OPPORTUNITY BOARD"
        title="Pipeline"
        description="Track opportunities by stage, value, and next action."
        action="New opportunity"
        onAction={() => openCreate("opportunity")}
      />
      <MetricSummary title="Pipeline overview" items={[
        { label: "Opportunities", value: records.length, detail: "all recorded deals", mascot: "opportunities" },
        { label: "Open pipeline", value: records.filter((record) => !statusIs(record, "Lost", "Paying")).length, detail: "active sales conversations", mascot: "pipeline" },
        { label: "Paying", value: records.filter((record) => statusIs(record, "Paying")).length, detail: "customers converted", mascot: "paying" },
        { label: "Needs an owner", value: records.filter((record) => !record.ownerId && !statusIs(record, "Lost", "Paying")).length, detail: "unassigned open opportunities", mascot: "unassigned" },
      ]} />
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
          <button
            className={mode === "graph" ? "selected" : ""}
            onClick={() => setMode("graph")}
          >
            <ChartBar size={16} />
            Graph
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
      {mode === "graph" ? (
        <>
          <div className="graph-controls" role="group" aria-label="Pipeline graph type">
            <button
              className={cn(graphMode === "distribution" && "selected")}
              onClick={() => setGraphMode("distribution")}
            >
              Distribution
            </button>
            <button
              className={cn(graphMode === "trend" && "selected")}
              onClick={() => setGraphMode("trend")}
            >
              Trend
            </button>
          </div>
          {graphMode === "distribution" ? (
            <div className="graph-grid">
            <StatusGraph
            title="Pipeline by stage"
            description="Open opportunities grouped by their current stage."
            items={stages.map((stage) => {
              const stageRecords = records.filter((record) =>
                statusIs(record, stage),
              );
              return {
                label: stage,
                value: stageRecords.length,
                detail: currencies
                  .map((currency) =>
                    money(
                      stageRecords
                        .filter(
                          (record) => text(record, "currency") === currency,
                        )
                        .reduce(
                          (sum, record) =>
                            sum + Number(record.data.amountCents || 0),
                          0,
                        ),
                      currency,
                    ),
                  )
                  .join(" · "),
              };
            })}
          />
          <StatusGraph
            title="Pipeline by owner"
            description="Open opportunities grouped by their assigned owner."
            items={[
              ...workspace.members.map((member) => ({
                label: member.name,
                value: records.filter(
                  (record) =>
                    !statusIs(record, "Lost") && record.ownerId === member.id,
                ).length,
              })),
              {
                label: "Unassigned",
                value: records.filter(
                  (record) => !statusIs(record, "Lost") && !record.ownerId,
                ).length,
              },
            ].filter((item) => item.value || item.label === "Unassigned")}
            />
            </div>
          ) : (
            <TrendGraph
              title="Pipeline activity trend"
              description="New opportunities and opportunity updates across the last seven days."
              labels={dailyCounts(records, (record) => record.createdAt).labels}
              primary={dailyCounts(records, (record) => record.createdAt).values}
              primaryLabel="New opportunities"
              secondary={dailyCounts(records, (record) => record.updatedAt).values}
              secondaryLabel="Opportunity updates"
            />
          )}
        </>
      ) : mode === "list" ? (
        <RecordsView kind="opportunity" hideHead />
      ) : (
        <div className="pipeline-workbench">
          <div
            className="pipeline-board"
            aria-label="Opportunity pipeline board"
          >
            {stages.map((stage, i) => {
              const stageRecords = records.filter((r) => statusIs(r, stage));
              const isDropTarget = dropStage === stage;
              return (
                <section
                  className={cn(
                    "pipeline-column",
                    isDropTarget && "pipeline-column-drop-target",
                  )}
                  key={stage}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDropStage(stage);
                  }}
                  onDragLeave={(event) => {
                    if (
                      !event.currentTarget.contains(event.relatedTarget as Node)
                    )
                      setDropStage("");
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const id =
                      event.dataTransfer.getData("text/plain") || draggingId;
                    setDropStage("");
                    setDraggingId("");
                    void moveOpportunity(id, stage);
                  }}
                >
                  <div className="stage-head">
                    <span className={`stage-dot stage-${i}`} />
                    <h2>{stage}</h2>
                    <span>{stageRecords.length}</span>
                  </div>
                  <div className="stage-cards">
                    {stageRecords.map((r) => (
                      <article
                        className={cn(
                          "opportunity-card",
                          selectedRecord?.id === r.id &&
                            "opportunity-card-selected",
                          draggingId === r.id && "opportunity-card-dragging",
                        )}
                        draggable
                        key={r.id}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", r.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDraggingId(r.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId("");
                          setDropStage("");
                        }}
                      >
                        <button
                          className="opportunity-title"
                          aria-pressed={selectedRecord?.id === r.id}
                          onClick={() => setSelectedId(r.id)}
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
                        <QuickRecordControls
                          record={r}
                          statuses={stages}
                          compact
                        />
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
          <RecordContext record={selectedRecord} eyebrow="PIPELINE CONTEXT" />
        </div>
      )}
      <p className="view-footnote">
        Pipeline values are potential amounts, separated by currency. They do
        not represent collected revenue. Drag a card between stages, or use its
        stage control when you prefer the keyboard.
      </p>
    </>
  );
}

export function AnalyticsView({ embedded = false }: { embedded?: boolean }) {
  const { workspace, setPage } = useCRM();
  const records = useRecords();
  const opportunities = records.filter(
    (record) => record.kind === "opportunity" && !statusIs(record, "Lost"),
  );
  const tasks = records.filter(
    (record) => record.kind === "task" && !isComplete(record),
  );
  const payments = records.filter(
    (record) =>
      record.kind === "payment" && statusIs(record, "Received", "Observed"),
  );
  const currencies = [
    ...new Set(
      opportunities.concat(payments).map((record) => text(record, "currency") || "INR"),
    ),
  ];
  const dates = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - offset));
    return date;
  });
  const dailyActivity = dates.map((date) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return records.filter((record) => {
      const updated = new Date(record.updatedAt);
      return updated >= date && updated < next;
    }).length;
  });
  const activityMaximum = Math.max(...dailyActivity, 1);
  const sources = [
    {
      name: "Google Analytics 4",
      detail: "Website traffic and events",
      keys: ["ga4", "google analytics"],
    },
    {
      name: "Google Tag Manager",
      detail: "Tracking configuration, not reporting",
      keys: ["gtm", "tag manager"],
    },
    {
      name: "Microsoft Clarity",
      detail: "Behaviour and recordings",
      keys: ["clarity"],
    },
    {
      name: "Bing Webmaster Tools",
      detail: "Search performance",
      keys: ["bing", "webmaster"],
    },
    {
      name: "Vercel Analytics",
      detail: "Web performance",
      keys: ["vercel"],
    },
  ];
  const sourceStatus = (keys: string[]) => {
    const found = workspace.integrations.find((integration) =>
      keys.some((key) =>
        `${integration.provider} ${integration.label}`
          .toLowerCase()
          .includes(key),
      ),
    );
    return found?.status === "connected" ? "Connected" : "Not connected";
  };

  return (
    <>
      {!embedded && (
        <PageHead
          eyebrow="PROJECT INSIGHTS"
          title="Analytics"
          description="See CRM activity, pipeline movement, and connected marketing signals."
        />
      )}
      {!embedded && (
        <section className="analytics-hero">
          <div>
            <span className="eyebrow">CRM ANALYTICS</span>
            <h2>Insights, in context.</h2>
            <p>
              Start with your CRM signals, then connect your marketing sources.
            </p>
          </div>
          <Button tone="quiet" onClick={() => setPage("settings")}>
            Manage sources
            <ArrowUpRight size={16} />
          </Button>
        </section>
      )}
      <MetricSummary title="Analytics overview" items={[
        { label: "Open pipeline", value: opportunities.length, detail: "active opportunities", mascot: "pipeline", onClick: () => setPage("pipeline") },
        { label: "People", value: records.filter((record) => record.kind === "contact").length, detail: "CRM contacts", mascot: "people", onClick: () => setPage("people") },
        { label: "Open work", value: tasks.length, detail: "tasks awaiting completion", mascot: "task", onClick: () => setPage("work") },
        { label: "Recorded payments", value: payments.length, detail: "received or observed", mascot: "money", onClick: () => setPage("money") },
      ]} />
      <div className="analytics-grid">
        <section className="analytics-panel analytics-activity">
          <header>
            <div>
              <span className="eyebrow">LAST 7 DAYS</span>
              <h2>CRM activity</h2>
              <p>Records updated each day.</p>
            </div>
            <ChartBar size={20} />
          </header>
          <div className="analytics-activity-bars" aria-label="CRM activity chart">
            {dailyActivity.map((value, index) => (
              <div key={dates[index].toISOString()}>
                <span
                  style={{ height: `${Math.max((value / activityMaximum) * 100, 4)}%` }}
                  title={`${value} records updated`}
                />
                <small>{dates[index].toLocaleDateString(undefined, { weekday: "short" })}</small>
              </div>
            ))}
          </div>
        </section>
        <StatusGraph
          title="Pipeline by stage"
          description="Active opportunities grouped by their current stage."
          items={modules.opportunity.statuses.map((stage) => ({
            label: stage,
            value: opportunities.filter((record) => statusIs(record, stage)).length,
            detail: currencies
              .map((currency) =>
                money(
                  opportunities
                    .filter(
                      (record) =>
                        statusIs(record, stage) &&
                        (text(record, "currency") || "INR") === currency,
                    )
                    .reduce(
                      (sum, record) => sum + Number(record.data.amountCents || 0),
                      0,
                    ),
                  currency,
                ),
              )
              .join(" · "),
          }))}
        />
        <section className="analytics-panel analytics-sources">
          <header>
            <div>
              <span className="eyebrow">INTEGRATIONS</span>
              <h2>Connected sources</h2>
              <p>Connect a source before its data appears here.</p>
            </div>
            <LinkSimple size={20} />
          </header>
          <div className="analytics-source-list">
            {sources.map((source) => {
              const status = sourceStatus(source.keys);
              return (
                <div key={source.name}>
                  <ChartBar size={16} />
                  <span>
                    <strong>{source.name}</strong>
                    <small>{source.detail}</small>
                  </span>
                  <em className={status === "Connected" ? "source-connected" : ""}>
                    {status}
                  </em>
                </div>
              );
            })}
          </div>
          <Button tone="quiet" onClick={() => setPage("settings")}>
            Connect a data source
            <Plus size={15} />
          </Button>
        </section>
      </div>
      <p className="view-footnote">
        CRM figures are live project records. External analytics remain separate
        until a source is connected and verified.
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
  const [taskView, setTaskView] = useState<"board" | "list" | "graph">(
    "board",
  );
  const [graphMode, setGraphMode] = useState<"distribution" | "trend">(
    "distribution",
  );
  const { openRecord, openCreate, workspace } = useCRM();
  const records = useRecords();
  const openTasks = records
    .filter((record) => record.kind === "task" && !isComplete(record))
    .sort((a, b) => (a.dueAt || "9999").localeCompare(b.dueAt || "9999"));
  const nextTask = openTasks[0];
  const sections: { kind: RecordKind; mascot: keyof typeof metricMascots }[] = [
    { kind: "task", mascot: "task" },
    { kind: "content", mascot: "draft" },
    { kind: "campaign", mascot: "pipeline" },
    { kind: "onboarding", mascot: "people" },
    { kind: "meeting", mascot: "task" },
    { kind: "experiment", mascot: "automation" },
    { kind: "promise", mascot: "task" },
  ];
  return (
    <>
      <PageHead
        eyebrow="EXECUTION PLAN"
        title="Work"
        description="Commitments, campaigns, meetings, and the next concrete action."
      />
      <MetricSummary title="Work overview" items={[
        { label: "Open tasks", value: openTasks.length, detail: "tasks awaiting completion", mascot: "task", onClick: () => setTab("task") },
        { label: "Completed tasks", value: records.filter((record) => record.kind === "task" && statusIs(record, "Done", "Completed")).length, detail: "finished tasks", mascot: "completedTasks", onClick: () => setTab("task") },
        { label: "Overdue tasks", value: openTasks.filter((record) => record.dueAt && Date.parse(record.dueAt) < Date.now()).length, detail: "open tasks past their due time", mascot: "overdueTasks" },
        { label: "Upcoming meetings", value: records.filter((record) => record.kind === "meeting" && !isComplete(record) && Date.parse(text(record, "startsAt") || record.dueAt || "") >= Date.now()).length, detail: "scheduled for the future", mascot: "meetings", onClick: () => setTab("meeting") },
      ]} />
      <section className="work-focus" aria-label="Next open task">
        <div className="work-focus-index">
          <span>UP NEXT</span>
          <img src={metricMascots.task} width={54} height={60} alt="" />
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
            <img src={metricMascots[section.mascot]} width={30} height={32} alt="" decoding="async" />
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
          <img src={metricMascots.knowledge} width={30} height={32} alt="" decoding="async" />
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
              <button
                className={taskView === "graph" ? "selected" : ""}
                aria-pressed={taskView === "graph"}
                onClick={() => setTaskView("graph")}
              >
                <ChartBar size={16} />
                Graph
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
          ) : taskView === "graph" ? (
            <>
              <div className="graph-controls" role="group" aria-label="Work graph type">
                <button
                  className={cn(graphMode === "distribution" && "selected")}
                  onClick={() => setGraphMode("distribution")}
                >
                  Distribution
                </button>
                <button
                  className={cn(graphMode === "trend" && "selected")}
                  onClick={() => setGraphMode("trend")}
                >
                  Trend
                </button>
              </div>
              {graphMode === "distribution" ? (
                <div className="graph-grid">
              <StatusGraph
                title="Tasks by status"
                description="Open and completed work grouped by its current status."
                items={[
                  ...modules.task.statuses,
                  ...records
                    .filter((record) => record.kind === "task")
                    .map((record) => label(record.status)),
                ]
                  .filter(
                    (status, index, all) =>
                      all.findIndex(
                        (candidate) =>
                          statusKey(candidate) === statusKey(status),
                      ) === index,
                  )
                  .map((status) => ({
                    label: status,
                    value: records.filter(
                      (record) =>
                        record.kind === "task" && statusIs(record, status),
                    ).length,
                  }))}
              />
              <StatusGraph
                title="Tasks by owner"
                description="Tasks grouped by their assigned owner."
                items={[
                  ...workspace.members.map((member) => ({
                    label: member.name,
                    value: records.filter(
                      (record) =>
                        record.kind === "task" && record.ownerId === member.id,
                    ).length,
                  })),
                  {
                    label: "Unassigned",
                    value: records.filter(
                      (record) => record.kind === "task" && !record.ownerId,
                    ).length,
                  },
                ].filter((item) => item.value || item.label === "Unassigned")}
              />
                </div>
              ) : (
                <TrendGraph
                  title="Work activity trend"
                  description="Completed and newly created tasks across the last seven days."
                  labels={dailyCounts(
                    records.filter(
                      (record) => record.kind === "task" && isComplete(record),
                    ),
                    (record) => record.updatedAt,
                  ).labels}
                  primary={dailyCounts(
                    records.filter(
                      (record) => record.kind === "task" && isComplete(record),
                    ),
                    (record) => record.updatedAt,
                  ).values}
                  primaryLabel="Completed tasks"
                  secondary={dailyCounts(
                    records.filter((record) => record.kind === "task"),
                    (record) => record.createdAt,
                  ).values}
                  secondaryLabel="New tasks"
                />
              )}
            </>
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
      <MetricSummary title="Money overview" items={[
        { label: "Open invoices", value: records.filter((record) => record.kind === "invoice" && !isComplete(record)).length, detail: "invoices awaiting payment", mascot: "invoices", onClick: () => setTab("invoice") },
        { label: "Overdue invoices", value: records.filter((record) => record.kind === "invoice" && !isComplete(record) && record.dueAt && Date.parse(record.dueAt) < Date.now()).length, detail: "open invoices past their due time", mascot: "overdueInvoices", onClick: () => setTab("invoice") },
        { label: "Received payments", value: payments.length, detail: "confirmed payment records", mascot: "money", onClick: () => setTab("payment") },
        { label: "Open proposals", value: records.filter((record) => record.kind === "proposal" && !statusIs(record, "Accepted", "Declined")).length, detail: "proposals awaiting a decision", mascot: "draft", onClick: () => setTab("proposal") },
      ]} />
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
      <MetricSummary title="Knowledge overview" items={[
        { label: "Saved notes", value: records.length, detail: "knowledge records", mascot: "knowledge" },
        { label: "Current", value: records.filter((record) => statusIs(record, "Current")).length, detail: "up-to-date knowledge", mascot: "currentKnowledge" },
        { label: "Review needed", value: records.filter((record) => statusIs(record, "Review needed")).length, detail: "notes needing a fresh review", mascot: "reviewKnowledge" },
        { label: "Linked to people", value: linked, detail: "notes with a related contact", mascot: "linkedKnowledge" },
      ]} />
      <section className="library-brief" aria-label="Research library overview">
        <div>
          <span className="eyebrow">THE RESEARCH LIBRARY</span>
          <h2>Research you can trace</h2>
          <p>
            Save the source and date with each finding. Open linked person
            research from draft review.
          </p>
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

const AUTOMATION_BLUEPRINTS = [
  {
    id: "lead-follow-up",
    title: "New lead follow-up",
    trigger: "A qualified lead is added",
    action: "Create an owned follow-up task and alert the owner",
    detail: "Keeps new demand from sitting unassigned.",
    jobType: "Review evidence",
    approval: "No external action",
  },
  {
    id: "reply-sla",
    title: "Reply SLA reminder",
    trigger: "A conversation has no reply for 3 days",
    action: "Create a follow-up task and notify the conversation owner",
    detail: "Escalates attention without sending a message for you.",
    jobType: "Classify replies",
    approval: "No external action",
  },
  {
    id: "deal-handoff",
    title: "Pipeline handoff",
    trigger: "An opportunity moves to a new stage",
    action: "Assign the next task and post an internal reminder",
    detail: "Makes ownership explicit at each sales handoff.",
    jobType: "Review evidence",
    approval: "No external action",
  },
  {
    id: "meeting-brief",
    title: "Meeting brief",
    trigger: "A meeting is completed",
    action: "Prepare a summary, next steps, and a draft task list",
    detail: "Uses Codex for preparation; a person reviews the result.",
    jobType: "Summarize meeting",
    approval: "Human review required",
  },
] as const;

export function AutomationView() {
  const { act, openCreate, workspace } = useCRM();
  const records = useRecords("automation");
  const [tab, setTab] = useState<"rules" | "runs">("rules");
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const activeRuns = records.filter((record) =>
    statusIs(record, "Queued", "Running", "Needs review"),
  ).length;
  const completedRuns = records.filter((record) => statusIs(record, "Completed"));

  async function createSetupBrief(
    blueprint: (typeof AUTOMATION_BLUEPRINTS)[number],
  ) {
    setCreating(blueprint.id);
    setError("");
    try {
      await act("create_record", {
        kind: "automation",
        title: `Set up: ${blueprint.title}`,
        status: "needs_review",
        ownerId: workspace.actor.id,
        data: {
          jobType: blueprint.jobType,
          instructions: `Configure this CRM workflow. Trigger: ${blueprint.trigger}. Action: ${blueprint.action}. Do not send external messages or make financial changes.`,
          successCriteria: `Document the trigger, owner, exception path, and verification step. ${blueprint.approval}.`,
          automationBlueprint: blueprint.id,
          trigger: blueprint.trigger,
          plannedAction: blueprint.action,
          approval: blueprint.approval,
        },
      });
      setTab("runs");
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setCreating(null);
    }
  }

  return (
    <>
      <PageHead
        eyebrow="OPERATIONAL RULES"
        title="Automation"
        description="Keep routine CRM follow-through reliable. Use Codex only for preparation and review."
        action="New request"
        onAction={() => openCreate("automation")}
      />
      <div className="runtime-banner">
        <span className="runtime-icon">
          <Lightning size={24} />
        </span>
        <div>
          <strong>Local Codex runtime</strong>
          <p>
            Codex assists prepare work. Critical CRM rules should run from a
            connected worker and record each result before they are trusted.
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
      <MetricSummary title="Automation overview" items={[
        { label: "Active queue", value: activeRuns, detail: "queued, running, or awaiting review", mascot: "automation", onClick: () => setTab("runs") },
        { label: "Completed runs", value: completedRuns.length, detail: "recorded completed requests", mascot: "completedRuns", onClick: () => setTab("runs") },
        { label: "Needs review", value: records.filter((record) => statusIs(record, "Needs review")).length, detail: "requests needing a human review", mascot: "reviewRuns", onClick: () => setTab("runs") },
        { label: "Safe by default", value: "Human", detail: "approval for external or financial actions", mascot: "humanApproval" },
      ]} />
      <div className="automation-tabs" role="tablist" aria-label="Automation sections">
        <button
          role="tab"
          aria-selected={tab === "rules"}
          className={cn(tab === "rules" && "active")}
          onClick={() => setTab("rules")}
        >
          Rule blueprints
        </button>
        <button
          role="tab"
          aria-selected={tab === "runs"}
          className={cn(tab === "runs" && "active")}
          onClick={() => setTab("runs")}
        >
          Requests & runs <span>{records.length}</span>
        </button>
      </div>
      {tab === "rules" ? (
        <>
          <section className="automation-intro">
            <div>
              <span className="eyebrow">START SMALL</span>
              <h2>Make the next step automatic, not the decision.</h2>
            </div>
            <p>Each blueprint opens a reviewable setup request. Nothing is activated or sent automatically.</p>
          </section>
          <div className="automation-blueprints">
            {AUTOMATION_BLUEPRINTS.map((blueprint) => (
              <article className="automation-blueprint" key={blueprint.id}>
                <Lightning size={20} aria-hidden="true" />
                <div>
                  <h3>{blueprint.title}</h3>
                  <dl>
                    <div>
                      <dt>When</dt>
                      <dd>{blueprint.trigger}</dd>
                    </div>
                    <div>
                      <dt>Then</dt>
                      <dd>{blueprint.action}</dd>
                    </div>
                  </dl>
                  <p>{blueprint.detail}</p>
                </div>
                <footer>
                  <Badge>{blueprint.approval}</Badge>
                  <Button
                    tone="quiet"
                    disabled={creating === blueprint.id}
                    onClick={() => void createSetupBrief(blueprint)}
                  >
                    {creating === blueprint.id ? "Creating…" : "Create setup brief"}
                    <ArrowRight size={15} />
                  </Button>
                </footer>
              </article>
            ))}
          </div>
          {error && <ErrorBox error={error} />}
        </>
      ) : (
        <RecordsView kind="automation" hideHead />
      )}
      <div className="automation-guidance">
        <ShieldCheck size={20} />
        <p>
          Use Codex to research, classify, summarize, and draft. Keep external
          messages, invitations, publication, payments, and irreversible
          changes behind a named human approval.
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
      <MetricSummary title="Inbox overview" items={[
        { label: "Needs a reply", value: needsReply.length, detail: "conversations needing attention", mascot: "reply", onClick: () => setTab("action") },
        { label: "Waiting for reply", value: queues.find((queue) => queue.id === "waiting")!.records.length, detail: "awaiting a response", mascot: "waitingReply", onClick: () => setTab("waiting") },
        { label: "Draft review", value: drafts.length, detail: "drafts awaiting a decision", mascot: "draft", onClick: () => setTab("drafts") },
        { label: "Recorded replies", value: inbound.length, detail: "inbound messages recorded", mascot: "recordedReply", onClick: () => setTab("replies") },
      ]} />
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

export function InsightsView({
  initialTab = "analytics",
}: {
  initialTab?: "analytics" | "reports";
}) {
  const [tab, setTab] = useState(initialTab);
  return (
    <>
      <PageHead
        eyebrow="PROJECT INSIGHTS"
        title="Insights"
        description="Marketing signals, pipeline health, and record follow-through in one place."
      />
      <div className="insights-tabs" role="tablist" aria-label="Insights view">
        <button
          role="tab"
          aria-selected={tab === "analytics"}
          className={cn(tab === "analytics" && "insights-tab-active")}
          onClick={() => setTab("analytics")}
        >
          <ChartBar size={16} />
          Analytics
        </button>
        <button
          role="tab"
          aria-selected={tab === "reports"}
          className={cn(tab === "reports" && "insights-tab-active")}
          onClick={() => setTab("reports")}
        >
          <ListBullets size={16} />
          Reports
        </button>
      </div>
      {tab === "analytics" ? (
        <AnalyticsView embedded />
      ) : (
        <ReportsView embedded />
      )}
    </>
  );
}

export function ReportsView({ embedded = false }: { embedded?: boolean }) {
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
      {!embedded && (
        <PageHead
          eyebrow="PROJECT SIGNALS"
          title="Reports"
          description="Current project counts, pipeline stages, and record completeness."
        />
      )}
      <MetricSummary title="Reports overview" items={[
        { label: "People", value: contacts.length, detail: "contacts in this project", mascot: "people" },
        { label: "Messages confirmed sent", value: sent.length, detail: "drafts recorded as sent", mascot: "sentMessages" },
        { label: "Recorded inbound replies", value: replies.length, detail: "inbound messages recorded", mascot: "recordedReply" },
        { label: "Tasks completed", value: tasks.filter((record) => statusIs(record, "Done", "Completed")).length, detail: "finished tasks", mascot: "completedTasks" },
      ]} />
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
  const remoteMcpUrl = "https://founder-crm-rouge.vercel.app/mcp";
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
  const [tokenLabel, setTokenLabel] = useState("Remote MCP");
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
                <SectionHead title="Codex & MCP access" />
                <p>
                  Connect an online MCP client to this project using a
                  revocable, project-scoped token.
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
                <div className="mcp-endpoint">
                  <div>
                    <span className="eyebrow">REMOTE STREAMABLE HTTP</span>
                    <strong>Remote MCP endpoint</strong>
                    <p>
                      Use this URL for Codex or an OpenAI API client. Create a
                      short-lived project token first and pass it privately as
                      a Bearer token.
                    </p>
                  </div>
                  <div className="token-value">{remoteMcpUrl}</div>
                  <CopyButton value={remoteMcpUrl} label="Copy endpoint" />
                  <p className="mcp-chatgpt-note">
                    ChatGPT custom apps require OAuth. Do not use a project
                    token in a ChatGPT chat or paste it into a URL.
                  </p>
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
                <ShieldCheck size={28} />
                <h3>Remote access safety</h3>
                <p>
                  This endpoint is scoped to one project. It can read records
                  and prepare work, but cannot approve, send, invite, issue
                  invoices, record payments, or manage access.
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
