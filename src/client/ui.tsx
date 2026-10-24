import { useState, type ReactNode, type FormEvent } from "react";

import { Dialog } from "@base-ui/react/dialog";

import { AlertDialog } from "@base-ui/react/alert-dialog";

import { XIcon as X } from "@phosphor-icons/react/dist/csr/X";
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { WarningCircleIcon as WarningCircle } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { CheckIcon as Check } from "@phosphor-icons/react/dist/csr/Check";
import { ArchiveIcon as Archive } from "@phosphor-icons/react/dist/csr/Archive";
import { CopyIcon as Copy } from "@phosphor-icons/react/dist/csr/Copy";
import { ArrowSquareOutIcon as ArrowSquareOut } from "@phosphor-icons/react/dist/csr/ArrowSquareOut";

import { clsx, type ClassValue } from "clsx";

import { twMerge } from "tailwind-merge";

import type {
  CrmRecord,
  Fields,
  Member,
  RecordKind,
  Integration,
} from "../shared/types";

import { modules, type Field, text, money, safeUrl } from "./models";

export const cn = (...values: ClassValue[]) => twMerge(clsx(values));

export function Button({
  children,
  tone = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "default" | "primary" | "quiet" | "danger";
}) {
  return (
    <button className={cn("btn", `btn-${tone}`, className)} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  const status = String(children).trim().toLowerCase().replaceAll("_", " ");
  const good = [
    "done",
    "completed",
    "paid",
    "approved",
    "qualified",
    "paying",
    "connected",
    "current",
    "received",
    "active",
    "pilot active",
  ].includes(status);
  const warn = [
    "overdue",
    "failed",
    "lost",
    "blocked",
    "rejected",
    "not a fit",
    "uncertain",
  ].includes(status);
  return (
    <span className={cn("badge", good && "badge-good", warn && "badge-warn")}>
      {children}
    </span>
  );
}

export function ErrorBox({ error }: { error: string }) {
  return error ? (
    <div role="alert" className="error-box">
      <WarningCircle size={18} />
      <span>{error}</span>
    </div>
  ) : null;
}

export function Empty({
  title,
  description,
  action,
  onAction,
  icon,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon || <Plus size={24} />}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <Button tone="primary" onClick={onAction}>
          <Plus size={16} />
          {action}
        </Button>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-backdrop" />
        <Dialog.Popup className={cn("modal", wide && "modal-wide")}>
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              {description && (
                <Dialog.Description>{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="icon-btn" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  description,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  busy?: boolean;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="modal-backdrop" />
        <AlertDialog.Popup className="modal confirm">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description>{description}</AlertDialog.Description>
          <div className="form-footer">
            <Button onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button tone="danger" onClick={onConfirm} disabled={busy}>
              {busy ? "Working…" : "Confirm"}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `field-${field.key}`;
  const props = {
    id,
    name: field.key,
    value,
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => onChange(event.target.value),
    required: field.required,
    "aria-describedby": field.help ? `${id}-help` : undefined,
  };
  return (
    <div className={cn("field", field.type === "textarea" && "field-full")}>
      <label htmlFor={id}>
        {field.label}
        {field.required && <span className="required"> *</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea {...props} rows={field.key === "body" ? 7 : 3} />
      ) : field.type === "select" ? (
        <select {...props}>
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o}>
              {o.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...props}
          type={field.type || "text"}
          min={field.min}
          max={field.key === "qualificationScore" ? 10 : undefined}
          step={
            field.type === "number"
              ? field.key === "qualificationScore" ||
                field.key === "durationMinutes"
                ? "1"
                : field.key.endsWith("Cents") || field.key === "taxBps"
                  ? "0.01"
                  : "any"
              : undefined
          }
        />
      )}
      {field.help && <small id={`${id}-help`}>{field.help}</small>}
    </div>
  );
}

function dateTimeInput(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
type LineItem = { description: string; quantity: number; unitCents: number };

export function RecordForm({
  kind,
  record,
  members,
  contacts,
  integrations = [],
  initialContactId = "",
  onDirty,
  onSave,
  onClose,
}: {
  kind: RecordKind;
  record?: CrmRecord;
  members: Member[];
  contacts: CrmRecord[];
  integrations?: Integration[];
  initialContactId?: string;
  onDirty?: () => void;
  onSave: (payload: Fields, version?: number) => Promise<void>;
  onClose: () => void;
}) {
  const mod = modules[kind];
  const [title, setTitle] = useState(record?.title || "");
  const [status, setStatus] = useState(
    mod.statuses.find(
      (s) =>
        s.toLowerCase() === record?.status.replaceAll("_", " ").toLowerCase(),
    ) || mod.statuses[0],
  );
  const [ownerId, setOwner] = useState(
    Array.isArray(record?.data.collaboratorIds) &&
      record!.data.collaboratorIds.length > 1
      ? "__both"
      : record?.ownerId || "",
  );
  const [contactId, setContact] = useState(
    record?.contactId || initialContactId,
  );
  const [dueAt, setDue] = useState(record?.dueAt?.slice(0, 10) || "");
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      [
        ...mod.fields,
        ...(kind === "draft"
          ? [{ key: "connectedAccountId" }, { key: "recipient" }]
          : []),
      ].map((f) => [
        f.key,
        record
          ? f.key.endsWith("Cents") || f.key === "taxBps"
            ? record.data[f.key] == null
              ? ""
              : String(Number(record.data[f.key]) / 100)
            : mod.fields.find((field) => field.key === f.key)?.type ===
                "datetime-local"
              ? dateTimeInput(text(record, f.key))
              : mod.fields.find((field) => field.key === f.key)?.type === "date"
                ? text(record, f.key).slice(0, 10)
                : text(record, f.key)
          : f.key === "currency"
            ? "INR"
            : "",
      ]),
    ),
  );
  const [lines, setLines] = useState<LineItem[]>(() =>
    Array.isArray(record?.data.items)
      ? (record!.data.items as unknown as LineItem[])
      : [{ description: "", quantity: 1, unitCents: 0 }],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const managed = new Set([
        "identityAliases",
        "approvedHash",
        "approvedAt",
        "approvedBy",
        "sendState",
        "sentAt",
        "providerReceipt",
        "issuedAt",
        "paidAt",
        "shareToken",
        "sendError",
        "lastSendRequestId",
        "lastInboundAt",
      ]);
      const data: Fields = Object.fromEntries(
        Object.entries(record?.data || {}).filter(([key]) => !managed.has(key)),
      );
      if (ownerId === "__both")
        data.collaboratorIds = members
          .filter((m) => /anshu|nahush/i.test(m.name))
          .map((m) => m.id);
      else if (record?.data.collaboratorIds) data.collaboratorIds = [];
      for (const field of mod.fields) {
        if (
          field.type === "number" &&
          values[field.key] === "" &&
          field.key !== "qualificationScore"
        ) {
          delete data[field.key];
          continue;
        }
        data[field.key] =
          field.type === "number"
            ? values[field.key] === ""
              ? null
              : Math.round(
                  Number(values[field.key]) *
                    (field.key.endsWith("Cents") || field.key === "taxBps"
                      ? 100
                      : 1),
                )
            : field.type === "datetime-local" && values[field.key]
              ? new Date(values[field.key]).toISOString()
              : values[field.key] || null;
      }
      if (kind === "draft") {
        data.connectedAccountId = values.connectedAccountId || null;
        data.deliveryMode = values.connectedAccountId ? "provider" : "manual";
        data.recipient = values.recipient || null;
      }
      if (kind === "invoice") {
        if (
          lines.some(
            (l) => !l.description.trim() || l.quantity <= 0 || l.unitCents < 0,
          )
        )
          throw Error(
            "Each line item needs a description, a positive quantity, and a valid price.",
          );
        data.items = lines as unknown as Fields["items"];
        data.amountCents = Math.round(
          lines.reduce((sum, l) => sum + l.quantity * l.unitCents, 0) *
            (1 + Number(values.taxBps || 0) / 100),
        );
      }
      await onSave(
        {
          kind,
          title: title.trim(),
          status: status.toLowerCase().replaceAll(" ", "_"),
          ownerId:
            ownerId === "__both"
              ? members.find((m) => /anshu/i.test(m.name))?.id ||
                members[0]?.id ||
                null
              : ownerId || null,
          contactId: contactId || null,
          dueAt: dueAt ? new Date(`${dueAt}T12:00:00`).toISOString() : null,
          data,
        },
        record?.version,
      );
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} onChange={onDirty}>
      <div className="modal-body">
        <ErrorBox error={error} />
        <div className="form-grid">
          <FieldInput
            field={{
              key: "title",
              label:
                kind === "contact"
                  ? "Name or handle"
                  : kind === "company"
                    ? "Company name"
                    : "Title",
              required: true,
            }}
            value={title}
            onChange={setTitle}
          />
          <FieldInput
            field={{
              key: "status",
              label: "Status",
              type: "select",
              options: mod.statuses,
            }}
            value={status}
            onChange={setStatus}
          />
          <div className="field">
            <label htmlFor="record-owner">Owner</label>
            <select
              id="record-owner"
              value={ownerId}
              onChange={(e) => setOwner(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.filter((m) => /anshu|nahush/i.test(m.name)).length >=
                2 && <option value="__both">Both · Anshu and Nahush</option>}
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {kind !== "contact" && kind !== "company" && (
            <div className="field">
              <label htmlFor="record-contact">Linked person</label>
              <select
                id="record-contact"
                value={contactId}
                onChange={(e) => {
                  setContact(e.target.value);
                  if (kind === "draft") {
                    const c = contacts.find((c) => c.id === e.target.value);
                    setValues((v) => ({
                      ...v,
                      recipient: c
                        ? text(
                            c,
                            values.channel?.toLowerCase() === "instagram"
                              ? "instagramUserId"
                              : "email",
                          )
                        : "",
                    }));
                  }
                }}
              >
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <FieldInput
            field={{
              key: "dueAt",
              label: kind === "opportunity" ? "Next action due" : "Due date",
              type: "date",
            }}
            value={dueAt}
            onChange={setDue}
          />
          {kind === "draft" && (
            <>
              <div className="field">
                <label htmlFor="draft-account">Sending account</label>
                <select
                  id="draft-account"
                  value={values.connectedAccountId || ""}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      connectedAccountId: e.target.value,
                    }))
                  }
                >
                  <option value="">Manual · use your own account</option>
                  {integrations
                    .filter(
                      (i) =>
                        i.status === "connected" &&
                        i.accountId &&
                        (values.channel?.toLowerCase() === "instagram"
                          ? i.provider === "instagram"
                          : i.provider === "gmail"),
                    )
                    .map((i) => (
                      <option key={i.id} value={i.accountId}>
                        {i.label}
                      </option>
                    ))}
                </select>
              </div>
              <FieldInput
                field={{
                  key: "recipient",
                  label:
                    values.channel?.toLowerCase() === "instagram"
                      ? "Instagram recipient ID"
                      : "Recipient email",
                  type:
                    values.channel?.toLowerCase() === "instagram"
                      ? undefined
                      : "email",
                }}
                value={values.recipient || ""}
                onChange={(v) =>
                  setValues((prev) => ({ ...prev, recipient: v }))
                }
              />
            </>
          )}
          {mod.fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] || ""}
              onChange={(v) =>
                setValues((prev) => {
                  const next = { ...prev, [field.key]: v };
                  if (kind === "draft" && field.key === "channel") {
                    const person = contacts.find((c) => c.id === contactId);
                    next.recipient = person
                      ? text(
                          person,
                          v.toLowerCase() === "instagram"
                            ? "instagramUserId"
                            : "email",
                        )
                      : "";
                    next.connectedAccountId = "";
                  }
                  return next;
                })
              }
            />
          ))}
        </div>
        {kind === "invoice" && (
          <section className="line-items">
            <div className="section-title">
              <h3>Line items</h3>
              <Button
                type="button"
                tone="quiet"
                onClick={() =>
                  setLines([
                    ...lines,
                    { description: "", quantity: 1, unitCents: 0 },
                  ])
                }
              >
                <Plus size={15} />
                Add line
              </Button>
            </div>
            {lines.map((line, i) => (
              <div className="line-item" key={i}>
                <label>
                  Description
                  <input
                    required
                    aria-label={`Item ${i + 1} description`}
                    value={line.description}
                    onChange={(e) =>
                      setLines(
                        lines.map((l, j) =>
                          j === i ? { ...l, description: e.target.value } : l,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Quantity
                  <input
                    required
                    aria-label={`Item ${i + 1} quantity`}
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity}
                    onChange={(e) =>
                      setLines(
                        lines.map((l, j) =>
                          j === i
                            ? { ...l, quantity: Number(e.target.value) }
                            : l,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Unit price
                  <input
                    required
                    aria-label={`Item ${i + 1} unit price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitCents / 100}
                    onChange={(e) =>
                      setLines(
                        lines.map((l, j) =>
                          j === i
                            ? {
                                ...l,
                                unitCents: Math.round(
                                  Number(e.target.value) * 100,
                                ),
                              }
                            : l,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={lines.length === 1}
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => setLines(lines.filter((_, j) => j !== i))}
                >
                  <X size={17} />
                </button>
              </div>
            ))}
            <div className="invoice-total">
              Total including tax{" "}
              <strong>
                {money(
                  Math.round(
                    lines.reduce((s, l) => s + l.quantity * l.unitCents, 0) *
                      (1 + Number(values.taxBps || 0) / 100),
                  ),
                  values.currency || "INR",
                )}
              </strong>
            </div>
          </section>
        )}
        {kind === "draft" && (
          <p className="form-note">
            Saving a draft does not approve or send it. Approval applies to the
            exact saved message.
          </p>
        )}
        {kind === "automation" && (
          <p className="form-note">
            Jobs wait for the local Codex runtime. Creating a job does not start
            an external service, send a message, or spend money.
          </p>
        )}
        {kind === "invoice" && (
          <p className="form-note">
            A PDF can be downloaded after saving. Issuing an invoice and
            manually confirming it was sent are separate actions.
          </p>
        )}
      </div>
      <div className="form-footer">
        <span className="muted">
          {record
            ? `Editing version ${record.version}`
            : "Saved to this project"}
        </span>
        <Button type="button" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button tone="primary" disabled={busy}>
          {busy
            ? "Saving…"
            : record
              ? "Save changes"
              : `Create ${mod.singular}`}
          <Check size={16} />
        </Button>
      </div>
    </form>
  );
}

export function CopyButton({
  value,
  label = "Copy message",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Button
        disabled={!value}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
          } catch {
            setError("Copy failed. Select and copy the text manually.");
          }
        }}
      >
        <Copy size={16} />
        {copied ? "Copied" : label}
      </Button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}

export function ExternalLink({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  const href = safeUrl(url);
  return href ? (
    <a
      className="btn btn-default"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowSquareOut size={15} />
    </a>
  ) : null;
}

export function SectionHead({
  title,
  count,
  action,
  onAction,
}: {
  title: string;
  count?: number;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-title">
      <h2>
        {title}
        {count !== undefined && <span className="count">{count}</span>}
      </h2>
      {action && (
        <Button tone="quiet" onClick={onAction}>
          {action}
          <ArrowRight size={15} />
        </Button>
      )}
    </div>
  );
}
