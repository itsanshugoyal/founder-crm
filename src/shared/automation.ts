import { EXPERIMENT_HANDLES, type CrmRecord } from "./types";

/** Timers do not establish dependencies. Only a completed, fresh research receipt does. */
export function draftingPacket(
  records: CrmRecord[],
  projectId: string,
  at = Date.now(),
) {
  const receipt = records
    .filter(
      (record) =>
        record.projectId === projectId &&
        record.kind === "knowledge" &&
        record.data.stage === "research" &&
        ["completed", "completed_with_limits"].includes(record.status) &&
        Date.parse(String(record.data.completedAt)) <= at &&
        at - Date.parse(String(record.data.completedAt)) <= 7 * 86400000,
    )
    .sort((a, b) =>
      String(b.data.completedAt).localeCompare(String(a.data.completedAt)),
    )[0];
  if (!receipt)
    return {
      blocked: true,
      reason: "No completed, fresh research receipt.",
      receiptId: null,
      packets: [],
    };
  const consumed = records.find(
    (record) =>
      record.projectId === projectId &&
      record.kind === "knowledge" &&
      record.data.stage === "drafts" &&
      ["completed", "completed_with_limits"].includes(record.status) &&
      (record.data.predecessorReceiptId === receipt.id ||
        (Array.isArray(record.data.predecessorReceiptIds) &&
          record.data.predecessorReceiptIds.includes(receipt.id))),
  );
  if (consumed)
    return {
      blocked: true,
      alreadyProcessed: true,
      reason:
        "This research packet already has drafting output. Review existing drafts; do not create duplicates.",
      receiptId: receipt.id,
      draftReceiptId: consumed.id,
      packets: [],
    };
  const packets = (
    Array.isArray(receipt.data.packets) ? receipt.data.packets : []
  )
    .filter((packet) => {
      if (
        !packet ||
        typeof packet !== "object" ||
        Array.isArray(packet) ||
        packet.draftEligible !== true
      )
        return false;
      const contact = records.find(
        (record) =>
          record.id === packet.contactId &&
          record.projectId === projectId &&
          record.kind === "contact",
      );
      if (
        !contact ||
        contact.status === "archived" ||
        contact.data.suppressed === true ||
        contact.data.optOut === true ||
        contact.data.optedOut === true ||
        contact.data.doNotContact === true ||
        contact.data.sequenceClosed === true ||
        contact.data.segment !== "owned_offer" ||
        /^(not a fit|dead|do not contact)$/i.test(contact.status) ||
        EXPERIMENT_HANDLES.includes(
          String(contact.data.handle ?? "")
            .toLowerCase()
            .replace(/^@/, ""),
        ) ||
        typeof packet.contactVersion !== "number" ||
        packet.contactVersion !== contact.version
      )
        return false;
      const facts = Array.isArray(packet.facts) ? packet.facts : [];
      return facts.some((fact) => {
        if (!fact || typeof fact !== "object" || Array.isArray(fact))
          return false;
        const checked = Date.parse(String(fact.checkedAt));
        return (
          typeof fact.url === "string" &&
          /^https?:\/\//.test(fact.url) &&
          typeof fact.observation === "string" &&
          fact.observation.trim().length > 0 &&
          checked <= at &&
          at - checked <= 7 * 86400000
        );
      });
    })
    .slice(0, 3);
  return {
    blocked: packets.length === 0,
    reason: packets.length
      ? "Verified research packet available; human review still required."
      : "Research exists but no eligible, unsuppressed evidence packets.",
    receiptId: receipt.id,
    packets,
  };
}
