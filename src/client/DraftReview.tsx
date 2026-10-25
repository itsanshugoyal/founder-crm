import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowSquareOutIcon as ArrowSquareOut } from "@phosphor-icons/react/dist/csr/ArrowSquareOut";
import { MagnifyingGlassIcon as MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/csr/ShieldCheck";

import type { CrmRecord } from "../shared/types";
import { dateLabel, safeUrl, text } from "./models";
import { Badge, Button, cn } from "./ui";
import {
  draftPurpose as draftStep,
  type DraftPurpose as Step,
} from "../shared/draft-purpose";

type DraftGroup = { id: string; contact?: CrmRecord; drafts: CrmRecord[] };
const contactText = (contact: CrmRecord | undefined, key: string) =>
  contact ? text(contact, key) : "";

const steps: { id: Step; channel: string; label: string; condition: string }[] =
  [
    {
      id: "reply",
      channel: "REPLY",
      label: "Reply to a conversation",
      condition: "Check the actual incoming message before replying",
    },
    {
      id: "followup",
      channel: "FOLLOW-UP",
      label: "Follow-up message",
      condition: "Verify the earlier interaction and timing first",
    },
    {
      id: "instagram",
      channel: "IG",
      label: "Instagram first message",
      condition: "First outreach on Instagram",
    },
    {
      id: "connection",
      channel: "LI",
      label: "LinkedIn connection request",
      condition: "Short note with the connection request",
    },
    {
      id: "accepted",
      channel: "LI",
      label: "LinkedIn after acceptance",
      condition: "Use only after the connection is accepted",
    },
    {
      id: "other",
      channel: "OTHER",
      label: "Other draft",
      condition: "Check the intended channel and timing",
    },
  ];

export function draftReviewNote(contact?: CrmRecord, draft?: CrmRecord) {
  if (
    contact?.data.suppressed === true ||
    /do not contact/i.test(contact?.status || "")
  )
    return "Do not contact is recorded for this person. Review the restriction before any outreach.";
  if (
    /not a fit/i.test(contact?.status || "") ||
    /dead/i.test(String(contact?.data.qualificationStatus || ""))
  )
    return "This person is marked not a fit in the saved record. Review that decision before outreach.";
  if (contact?.data.sequenceClosed === true)
    return "The outreach sequence is closed. Review the conversation before considering another message.";
  if (draft?.data.experimentBlocked === true)
    return "This experiment is held until its offer and review criteria are approved.";
  if (draft?.data.needsFreshEvidence === true)
    return "This draft needs fresh evidence before approval. The saved message may reflect older research.";
  if (draft?.data.reviewHold === true)
    return "A review hold is recorded for this draft. Check its evidence and qualification before considering approval.";
  if (
    /hold|pending|unknown/i.test(
      String(contact?.data.qualificationStatus || ""),
    )
  )
    return "Qualification is unresolved in the saved record. Check the evidence before outreach.";
  return "Check the recipient, evidence, and sending account in the message review before approval.";
}

export function DraftReview({
  drafts,
  contacts,
  knowledge,
  openRecord,
}: {
  drafts: CrmRecord[];
  contacts: CrmRecord[];
  knowledge: CrmRecord[];
  openRecord: (record: CrmRecord) => void;
}) {
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [selectedStep, setSelectedStep] = useState<Step | "">("");
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const backRef = useRef<HTMLButtonElement>(null);

  const groups = useMemo(() => {
    const byId = new Map(contacts.map((contact) => [contact.id, contact]));
    const grouped = new Map<string, DraftGroup>();
    for (const draft of drafts) {
      const id = draft.contactId || `unlinked:${draft.id}`;
      const group = grouped.get(id) || {
        id,
        contact: byId.get(id),
        drafts: [],
      };
      group.drafts.push(draft);
      grouped.set(id, group);
    }
    return [...grouped.values()]
      .map((group) => ({
        ...group,
        drafts: group.drafts.sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt),
        ),
      }))
      .sort(
        (a, b) =>
          Number(b.drafts.some((d) => d.data.reviewHold === false)) -
            Number(a.drafts.some((d) => d.data.reviewHold === false)) ||
          (a.contact?.title ?? a.id).localeCompare(b.contact?.title ?? b.id),
      );
  }, [contacts, drafts]);

  const visible = groups.filter((group) => {
    const matchesChannel =
      channel === "all" ||
      group.drafts.some((draft) =>
        channel === "linkedin"
          ? text(draft, "channel").toLowerCase() === "linkedin"
          : channel === "other"
            ? !["instagram", "linkedin"].includes(
                text(draft, "channel").toLowerCase(),
              )
            : text(draft, "channel").toLowerCase() === channel,
      );
    const term = search.trim().toLowerCase();
    return (
      matchesChannel &&
      (!term ||
        [
          group.contact?.title || "",
          contactText(group.contact, "handle"),
          contactText(group.contact, "company"),
          ...group.drafts.flatMap((draft) => [
            draft.title,
            text(draft, "body"),
          ]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(term))
    );
  });
  const group = visible.find((item) => item.id === selectedId) || visible[0];
  const groupDrafts =
    group?.drafts.filter(
      (draft) =>
        channel === "all" ||
        (channel === "other"
          ? !["instagram", "linkedin"].includes(
              text(draft, "channel").toLowerCase(),
            )
          : text(draft, "channel").toLowerCase() === channel),
    ) || [];
  const groupSteps = steps.filter((step) =>
    groupDrafts.some((draft) => draftStep(draft) === step.id),
  );
  const preferredStep =
    groupSteps.find((step) => step.id === "instagram")?.id || groupSteps[0]?.id;
  const stepId = groupSteps.some((step) => step.id === selectedStep)
    ? selectedStep
    : preferredStep;
  const options = groupDrafts.filter((draft) => draftStep(draft) === stepId);
  const draft =
    options.find((item) => item.id === selectedDraftId) || options[0];
  const handle = contactText(group?.contact, "handle");
  const evidence = contactText(group?.contact, "observation");
  const evidenceUrl = group?.contact
    ? safeUrl(text(group.contact, "evidenceUrl"))
    : "";
  const checkedAt = contactText(group?.contact, "checkedAt");
  const checkedDate =
    checkedAt && Number.isFinite(Date.parse(checkedAt))
      ? new Intl.DateTimeFormat(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(checkedAt))
      : "Unknown";
  const linkedKnowledge = knowledge.filter(
    (record) => record.contactId && record.contactId === group?.contact?.id,
  );
  const nextStep = preferredStep;
  const reviewHeld =
    group?.contact?.data.suppressed === true ||
    group?.contact?.data.sequenceClosed === true ||
    /do not contact|not a fit/i.test(group?.contact?.status || "") ||
    /hold|pending|unknown|dead/i.test(
      String(group?.contact?.data.qualificationStatus || ""),
    ) ||
    draft?.data.experimentBlocked === true ||
    draft?.data.reviewHold === true ||
    draft?.data.needsFreshEvidence === true;

  useEffect(() => {
    if (showDetail && matchMedia("(max-width: 767px)").matches) {
      backRef.current?.scrollIntoView({ block: "start" });
      backRef.current?.focus({ preventScroll: true });
    }
  }, [showDetail, group?.id]);

  return (
    <section
      className={cn("draft-review", showDetail && "draft-show-detail")}
      aria-label="Draft review workspace"
    >
      <div className="draft-review-toolbar">
        <div>
          <h2>Review by person</h2>
          <p aria-live="polite">
            {visible.length} {visible.length === 1 ? "person" : "people"} ·{" "}
            {drafts.length} drafts in this queue
          </p>
        </div>
        <div className="draft-review-filters">
          <label className="draft-review-search">
            <MagnifyingGlass size={16} aria-hidden="true" />
            <span className="sr-only">Search draft contacts and messages</span>
            <input
              name="draft-search"
              type="search"
              autoComplete="off"
              placeholder="Search people or drafts…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="draft-review-channel">
            <span className="sr-only">Filter drafts by channel</span>
            <select
              name="draft-channel"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
            >
              <option value="all">All channels</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
      </div>
      {group ? (
        <div className="draft-review-grid">
          <div className="draft-people" aria-label="People with drafts">
            {visible.map((item) => {
              const selected = item.id === group.id;
              const count = item.drafts.length;
              const blocked =
                item.contact?.data.suppressed === true ||
                item.contact?.data.sequenceClosed === true ||
                item.drafts.every(
                  (d) =>
                    d.data.experimentBlocked === true ||
                    d.data.reviewHold === true ||
                    d.data.needsFreshEvidence === true,
                );
              return (
                <button
                  key={item.id}
                  className={cn(
                    "draft-person",
                    selected && "draft-person-active",
                  )}
                  aria-current={selected ? "true" : undefined}
                  onClick={() => {
                    setShowDetail(true);
                    setShowOptions(false);
                    setSelectedId(item.id);
                    setSelectedStep("");
                    setSelectedDraftId("");
                  }}
                >
                  <span className="draft-person-top">
                    <strong>
                      {item.contact?.title || item.drafts[0].title}
                    </strong>
                    <span>{count}</span>
                  </span>
                  <span className="draft-person-sub">
                    {contactText(item.contact, "company") ||
                      contactText(item.contact, "handle") ||
                      (item.contact
                        ? "No company or handle saved"
                        : "No linked person")}
                  </span>
                  <span className="draft-person-steps">
                    {item.drafts.some((d) => draftStep(d) === "instagram") && (
                      <span>Instagram</span>
                    )}
                    {item.drafts.some((d) => draftStep(d) === "connection") && (
                      <span>Connection</span>
                    )}
                    {item.drafts.some((d) => draftStep(d) === "accepted") && (
                      <span>After acceptance</span>
                    )}
                    {blocked && <span className="draft-held">Review hold</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="draft-work-area">
            <button
              className="draft-mobile-back"
              ref={backRef}
              type="button"
              onClick={() => setShowDetail(false)}
            >
              Back to {visible.length}{" "}
              {visible.length === 1 ? "person" : "people"}
            </button>
            <header className="draft-contact-head">
              <div>
                <p className="eyebrow">PERSON & CONTEXT</p>
                <h3>
                  {group.contact?.title || "Draft without a linked person"}
                </h3>
                <p>
                  {[
                    contactText(group.contact, "company"),
                    handle !== group.contact?.title ? handle : "",
                  ]
                    .filter(Boolean)
                    .join(" · ") ||
                    "Review a message, then check the person’s context."}
                </p>
              </div>
              {group.contact && (
                <Button onClick={() => openRecord(group.contact!)}>
                  View Person <ArrowRight size={15} aria-hidden="true" />
                </Button>
              )}
            </header>
            <div className="draft-step-heading">
              <div>
                <h4>Message purpose</h4>
                <p>
                  Review one message. Other channels and purposes are
                  alternatives, not a sequence you need to send.
                </p>
              </div>
              <span>
                {groupDrafts.length}{" "}
                {groupDrafts.length === 1 ? "draft" : "drafts"}
              </span>
            </div>
            <details
              className="draft-other-options"
              open={showOptions}
              onToggle={(event) => setShowOptions(event.currentTarget.open)}
            >
              <summary>Other message options ({groupDrafts.length})</summary>
              <div
                className="draft-step-list"
                role="group"
                aria-label="Message purposes"
              >
                {groupSteps.map((step) => {
                  const count = groupDrafts.filter(
                    (item) => draftStep(item) === step.id,
                  ).length;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      className={cn(
                        "draft-step",
                        stepId === step.id && "draft-step-active",
                      )}
                      aria-pressed={stepId === step.id}
                      onClick={() => {
                        setSelectedStep(step.id);
                        setSelectedDraftId("");
                        setShowOptions(false);
                      }}
                    >
                      <span className="draft-step-number">{step.channel}</span>
                      <span>
                        <strong>{step.label}</strong>
                        <small>{step.condition}</small>
                      </span>
                      <span className="draft-step-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </details>
            {draft && (
              <div className="draft-preview">
                <div className="draft-preview-top">
                  <div>
                    <p className="eyebrow">SELECTED DRAFT</p>
                    <h4>{steps.find((step) => step.id === stepId)?.label}</h4>
                  </div>
                  <Badge>{draft.status.replaceAll("_", " ")}</Badge>
                </div>
                {stepId === nextStep && !reviewHeld && (
                  <p className="draft-suggestion">
                    Start here to review one option. Confirm the channel and
                    context before choosing a message.
                  </p>
                )}
                {options.length > 1 && (
                  <label className="draft-variant">
                    Choose a version
                    <select
                      name="draft-variant"
                      value={draft.id}
                      onChange={(event) =>
                        setSelectedDraftId(event.target.value)
                      }
                    >
                      {options.map((option, index) => (
                        <option key={option.id} value={option.id}>
                          Version {index + 1} · {option.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="draft-preview-meta">
                  <span>Channel: {text(draft, "channel") || "Unknown"}</span>
                  <span>Updated: {dateLabel(draft.updatedAt)}</span>
                  <span>
                    Sending account:{" "}
                    {text(draft, "accountContext") || "Unknown"}
                  </span>
                  <span>
                    Recipient: {text(draft, "recipient") || "Unknown"}
                  </span>
                </div>
                <p className="draft-preview-body">
                  {text(draft, "body") || "No message text is saved."}
                </p>
                <div className="draft-review-note">
                  <ShieldCheck size={17} aria-hidden="true" />
                  <span>{draftReviewNote(group.contact, draft)}</span>
                </div>
                {stepId === "accepted" && (
                  <p className="draft-review-note">
                    Confirm that this person accepted the connection before
                    using this draft. Its presence does not establish
                    acceptance.
                  </p>
                )}
                <div className="draft-preview-actions">
                  <Button tone="primary" onClick={() => openRecord(draft)}>
                    Review This Draft{" "}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                  <span>
                    Check the details and approve the message before an
                    individual send.
                  </span>
                </div>
              </div>
            )}
            <details className="draft-research">
              <summary>
                Research &amp; contact context{" "}
                <span>Checked: {checkedDate}</span>
              </summary>
              <div className="draft-context">
                <strong>
                  {evidence
                    ? "Saved observation · verify before use"
                    : "Evidence to check"}
                </strong>
                <p>
                  {evidence ||
                    "No observation is recorded for this person. Verify context before approving a message."}
                </p>
                <div className="draft-context-meta">
                  <span>
                    Contact status:{" "}
                    {group.contact?.status.replaceAll("_", " ") || "Unknown"}
                  </span>
                  <span>Evidence checked: {checkedDate}</span>
                </div>
                {evidenceUrl && (
                  <a
                    href={evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open evidence source{" "}
                    <ArrowSquareOut size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
              {linkedKnowledge.length > 0 && (
                <div className="draft-linked-knowledge">
                  <strong>Linked research</strong>
                  <div>
                    {linkedKnowledge.map((record) => (
                      <button
                        type="button"
                        key={record.id}
                        onClick={() => openRecord(record)}
                      >
                        {record.title}
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </details>
          </div>
        </div>
      ) : (
        <div className="draft-review-empty">
          <h3>
            {search || channel !== "all"
              ? "No matching people"
              : "No drafts to review"}
          </h3>
          <p>
            {search || channel !== "all"
              ? "Try another search or channel."
              : "New drafts linked to a person will appear here for review."}
          </p>
          {(search || channel !== "all") && (
            <Button
              onClick={() => {
                setSearch("");
                setChannel("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
