import type { CrmRecord, RecordKind } from "../shared/types";

import { OPPORTUNITY_STAGES } from "../shared/types";

export type Field = {
  key: string;
  label: string;
  type?:
    | "textarea"
    | "email"
    | "url"
    | "number"
    | "date"
    | "datetime-local"
    | "select";
  options?: string[];
  help?: string;
  required?: boolean;
  min?: number;
};

export type Module = {
  label: string;
  singular: string;
  description: string;
  statuses: string[];
  fields: Field[];
};

const notes: Field = { key: "notes", label: "Notes", type: "textarea" };

const currency: Field = {
  key: "currency",
  label: "Currency",
  type: "select",
  options: ["INR", "USD", "EUR", "GBP"],
};

export const modules: Record<RecordKind, Module> = {
  contact: {
    label: "People",
    singular: "person",
    description: "Relationships with context. Keep the next step close.",
    statuses: [
      "New",
      "Researching",
      "Qualified",
      "Contacted",
      "Replied",
      "Nurture",
      "Not a fit",
      "Do not contact",
    ],
    fields: [
      { key: "email", label: "Email", type: "email" },
      { key: "company", label: "Company" },
      { key: "role", label: "Role" },
      { key: "handle", label: "Social handle" },
      {
        key: "instagramUserId",
        label: "Instagram recipient ID",
        help: "For connected Instagram replies, use the account-scoped ID supplied by Instagram. A public handle is different.",
      },
      { key: "profileUrl", label: "Profile URL", type: "url" },
      {
        key: "segment",
        label: "Segment",
        type: "select",
        options: [
          "unknown",
          "owned_offer",
          "brand_deal",
          "partner",
          "customer",
          "other",
        ],
      },
      {
        key: "qualificationScore",
        label: "Qualification score",
        type: "number",
        min: 0,
        help: "Use 0–10 only when supported by evidence.",
      },
      { key: "evidenceUrl", label: "Evidence URL", type: "url" },
      {
        key: "observation",
        label: "Observed evidence",
        type: "textarea",
        help: "Record what you actually observed; leave unknown facts blank.",
      },
      { key: "checkedAt", label: "Evidence checked on", type: "date" },
      notes,
    ],
  },

  company: {
    label: "Companies",
    singular: "company",
    description: "The organizations behind your relationships.",
    statuses: ["Researching", "Qualified", "Active", "Inactive"],
    fields: [
      { key: "website", label: "Website", type: "url" },
      { key: "industry", label: "Industry" },
      { key: "size", label: "Team size" },
      notes,
    ],
  },

  opportunity: {
    label: "Pipeline",
    singular: "opportunity",
    description: "Move every conversation toward a clear next decision.",
    statuses: OPPORTUNITY_STAGES,
    fields: [
      {
        key: "amountCents",
        label: "Potential value",
        type: "number",
        min: 0,
        help: "For example, ₹4,000 = 400000 paise.",
      },
      currency,
      { key: "nextAction", label: "Next action", required: true },
      { key: "expectedClose", label: "Expected close", type: "date" },
      { key: "lostReason", label: "Reason lost" },
      notes,
    ],
  },

  task: {
    label: "Tasks",
    singular: "task",
    description: "A useful place for everything you said you would do.",
    statuses: ["To do", "In progress", "Waiting", "Done"],
    fields: [
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: ["Normal", "High", "Low"],
      },
      { key: "description", label: "What needs to happen?", type: "textarea" },
      notes,
    ],
  },

  content: {
    label: "Content",
    singular: "content item",
    description: "Plan, review, and track the work behind each publication.",
    statuses: ["Idea", "Draft", "Review", "Ready", "Published"],
    fields: [
      {
        key: "channel",
        label: "Channel",
        type: "select",
        options: [
          "Website",
          "LinkedIn",
          "Instagram",
          "Email",
          "YouTube",
          "Other",
        ],
      },
      { key: "body", label: "Content", type: "textarea" },
      {
        key: "publishAt",
        label: "Planned publication",
        type: "datetime-local",
      },
      { key: "publishedUrl", label: "Published URL", type: "url" },
      { key: "goal", label: "Goal" },
      notes,
    ],
  },

  campaign: {
    label: "Campaigns",
    singular: "campaign",
    description: "Give each campaign a goal, owner, and measurable outcome.",
    statuses: ["Planning", "Active", "Paused", "Completed"],
    fields: [
      { key: "goal", label: "Campaign goal", required: true },
      { key: "audience", label: "Audience" },
      { key: "channel", label: "Channel" },
      { key: "startDate", label: "Start date", type: "date" },
      { key: "endDate", label: "End date", type: "date" },
      { key: "budgetCents", label: "Budget", type: "number", min: 0 },
      currency,
      { key: "successMetric", label: "Success metric" },
      { key: "actualResult", label: "Observed result" },
      notes,
    ],
  },

  meeting: {
    label: "Meetings",
    singular: "meeting",
    description: "Prepare well, capture decisions, and follow through.",
    statuses: ["Scheduled", "Completed", "Cancelled"],
    fields: [
      { key: "startsAt", label: "Meeting time", type: "datetime-local" },
      {
        key: "durationMinutes",
        label: "Duration (minutes)",
        type: "number",
        min: 1,
      },
      {
        key: "attendees",
        label: "Attendee emails",
        help: "Comma-separated email addresses. Attendees are invited only after an explicit calendar action.",
      },
      { key: "meetingUrl", label: "Meeting link", type: "url" },
      { key: "agenda", label: "Agenda", type: "textarea" },
      { key: "decisions", label: "Decisions", type: "textarea" },
      { key: "actionItems", label: "Follow-up actions", type: "textarea" },
      notes,
    ],
  },

  onboarding: {
    label: "Onboarding",
    singular: "onboarding plan",
    description: "Help every new partner reach their first useful outcome.",
    statuses: ["Not started", "In progress", "Blocked", "Completed"],
    fields: [
      {
        key: "milestones",
        label: "Milestones",
        type: "textarea",
        help: "One milestone per line. Record completion dates alongside completed steps.",
      },
      {
        key: "successCriteria",
        label: "What does success look like?",
        type: "textarea",
      },
      { key: "blockers", label: "Blockers", type: "textarea" },
      { key: "firstValueAt", label: "First value reached", type: "date" },
      notes,
    ],
  },

  invoice: {
    label: "Invoices",
    singular: "invoice",
    description: "Accurate invoices, with an explicit issue and payment trail.",
    statuses: ["Draft"],
    fields: [
      { key: "invoiceNumber", label: "Invoice number", required: true },
      { key: "customerName", label: "Bill to", required: true },
      { key: "customerEmail", label: "Billing email", type: "email" },
      { key: "billingAddress", label: "Billing address", type: "textarea" },
      currency,
      { key: "taxBps", label: "Tax (%)", type: "number", min: 0 },
      {
        key: "paymentInstructions",
        label: "Payment instructions",
        type: "textarea",
      },
      notes,
    ],
  },

  expense: {
    label: "Expenses",
    singular: "expense",
    description: "See what your project costs, in its original currency.",
    statuses: ["Recorded", "Pending", "Reimbursed", "Cancelled"],
    fields: [
      {
        key: "amountCents",
        label: "Amount",
        type: "number",
        min: 0,
        required: true,
      },
      currency,
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          "Software",
          "Marketing",
          "Operations",
          "Travel",
          "Professional services",
          "Other",
        ],
      },
      { key: "vendor", label: "Vendor" },
      { key: "incurredAt", label: "Expense date", type: "date" },
      { key: "receiptUrl", label: "Receipt URL", type: "url" },
      notes,
    ],
  },

  payment: {
    label: "Payments",
    singular: "payment",
    description:
      "Record confirmed money movement and reconcile it to an invoice.",
    statuses: ["Received", "Pending", "Refunded", "Failed"],
    fields: [
      {
        key: "amountCents",
        label: "Amount",
        type: "number",
        min: 0,
        required: true,
      },
      currency,
      { key: "invoiceId", label: "Invoice ID" },
      { key: "receivedAt", label: "Payment date", type: "date" },
      { key: "reference", label: "Payment reference" },
      {
        key: "method",
        label: "Method",
        type: "select",
        options: ["Bank transfer", "UPI", "Card", "Cash", "Other"],
      },
      notes,
    ],
  },

  proposal: {
    label: "Proposals",
    singular: "proposal",
    description: "Document the scope, price, and next decision.",
    statuses: ["Draft", "Review", "Shared", "Accepted", "Declined"],
    fields: [
      { key: "customerName", label: "Prepared for" },
      {
        key: "scope",
        label: "Scope of work",
        type: "textarea",
        required: true,
      },
      { key: "deliverables", label: "Deliverables", type: "textarea" },
      { key: "amountCents", label: "Proposed value", type: "number", min: 0 },
      currency,
      { key: "validUntil", label: "Valid until", type: "date" },
      { key: "terms", label: "Terms", type: "textarea" },
      notes,
    ],
  },

  knowledge: {
    label: "Knowledge",
    singular: "document",
    description: "Your project’s working memory. Make decisions easy to find.",
    statuses: ["Current", "Review needed", "Superseded"],
    fields: [
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          "Project instructions",
          "Positioning",
          "Process",
          "Research",
          "Decision",
          "Reference",
        ],
      },
      { key: "body", label: "Document", type: "textarea", required: true },
      { key: "sourceUrl", label: "Source URL", type: "url" },
      notes,
    ],
  },

  automation: {
    label: "Automation",
    singular: "Codex job",
    description: "Queue focused work for your local Codex runtime.",
    statuses: [
      "Queued",
      "Running",
      "Needs review",
      "Completed",
      "Failed",
      "Cancelled",
    ],
    fields: [
      {
        key: "jobType",
        label: "Job type",
        type: "select",
        options: [
          "Research contacts",
          "Classify replies",
          "Draft outreach",
          "Summarize meeting",
          "Review evidence",
          "Custom",
        ],
      },
      {
        key: "instructions",
        label: "Instructions",
        type: "textarea",
        required: true,
      },
      {
        key: "inputRecordIds",
        label: "Input record IDs",
        help: "Comma-separated IDs from this project.",
      },
      {
        key: "successCriteria",
        label: "Completion criteria",
        type: "textarea",
      },
      notes,
    ],
  },

  draft: {
    label: "Drafts",
    singular: "draft",
    description: "Review the exact words before each individual send.",
    statuses: ["Draft", "Needs review", "Rejected"],
    fields: [
      {
        key: "channel",
        label: "Channel",
        type: "select",
        options: ["email", "instagram", "linkedin", "whatsapp", "manual"],
      },
      { key: "subject", label: "Subject" },
      { key: "body", label: "Message", type: "textarea", required: true },
      { key: "destinationUrl", label: "Open conversation URL", type: "url" },
      { key: "accountContext", label: "Sending account context" },
      notes,
    ],
  },

  conversation: {
    label: "Conversations",
    singular: "conversation",
    description: "Replies, context, and the next human action.",
    statuses: ["Open", "Awaiting reply", "Needs action", "Closed"],
    fields: [
      {
        key: "channel",
        label: "Channel",
        type: "select",
        options: ["email", "instagram", "linkedin", "whatsapp", "manual"],
      },
      { key: "accountContext", label: "Account / inbox" },
      { key: "conversationUrl", label: "Conversation URL", type: "url" },
      { key: "summary", label: "Context", type: "textarea" },
      notes,
    ],
  },

  message: {
    label: "Messages",
    singular: "message",
    description: "Recorded messages from real conversations.",
    statuses: ["Received", "Sent", "Pending classification"],
    fields: [
      { key: "body", label: "Message", type: "textarea", required: true },
      { key: "conversationId", label: "Conversation ID" },
      {
        key: "direction",
        label: "Direction",
        type: "select",
        options: ["Inbound", "Outbound"],
      },
      notes,
    ],
  },

  promise: {
    label: "Promises",
    singular: "promise",
    description: "Commitments made to the people you work with.",
    statuses: ["Open", "Fulfilled", "Cancelled"],
    fields: [
      {
        key: "description",
        label: "Commitment",
        type: "textarea",
        required: true,
      },
      notes,
    ],
  },

  experiment: {
    label: "Experiments",
    singular: "experiment",
    description: "Keep a hypothesis separate from a verified result.",
    statuses: ["Proposed", "Running", "Review", "Completed", "Stopped"],
    fields: [
      {
        key: "hypothesis",
        label: "Hypothesis",
        type: "textarea",
        required: true,
      },
      { key: "cohort", label: "Experiment cohort / handles" },
      { key: "successMetric", label: "Success metric" },
      { key: "baseline", label: "Observed baseline" },
      { key: "budgetCents", label: "Budget", type: "number", min: 0 },
      currency,
      { key: "result", label: "Observed result", type: "textarea" },
      { key: "decision", label: "Decision", type: "textarea" },
      notes,
    ],
  },
};

export const text = (r: CrmRecord, key: string): string =>
  r.data[key] == null ? "" : String(r.data[key]);

export const active = (r: CrmRecord) => r.status.toLowerCase() !== "archived";

export const complete = (r: CrmRecord) =>
  [
    "done",
    "completed",
    "paid",
    "fulfilled",
    "cancelled",
    "void",
    "lost",
    "not_a_fit",
    "closed",
    "superseded",
    "rejected",
  ].includes(r.status.toLowerCase().replaceAll(" ", "_"));

export const dateLabel = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
          new Date(value).getFullYear() !== new Date().getFullYear()
            ? "numeric"
            : undefined,
      })
    : "No date";

export const money = (cents: number, code = "INR") => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${code} ${(cents / 100).toFixed(2)}`;
  }
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

export const safeUrl = (value: string) => {
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol)
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
};
