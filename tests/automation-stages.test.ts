import test from "node:test";
import assert from "node:assert/strict";
import { draftingPacket } from "../src/shared/automation";
import type { CrmRecord } from "../src/shared/types";
test("drafting requires a completed fresh same-project source packet and rechecks suppression", () => {
  const at = Date.parse("2026-10-25T04:00:00Z");
  const contact: CrmRecord = {
    id: "contact",
    projectId: "project",
    kind: "contact",
    title: "A real contact",
    status: "Researching",
    ownerId: null,
    contactId: null,
    dueAt: null,
    version: 1,
    createdAt: new Date(at).toISOString(),
    updatedAt: new Date(at).toISOString(),
    data: { segment: "owned_offer" },
  };
  const receipt: CrmRecord = {
    id: "receipt",
    projectId: "project",
    kind: "knowledge",
    title: "Research receipt",
    status: "running",
    ownerId: null,
    contactId: null,
    dueAt: null,
    version: 1,
    createdAt: new Date(at).toISOString(),
    updatedAt: new Date(at).toISOString(),
    data: {
      stage: "research",
      completedAt: new Date(at).toISOString(),
      packets: [
        {
          contactId: contact.id,
          contactVersion: contact.version,
          draftEligible: true,
          facts: [
            {
              url: "https://example.test/offer",
              observation: "Owned course page",
              checkedAt: new Date(at).toISOString(),
            },
          ],
        },
      ],
    },
  };
  assert(draftingPacket([contact], "project", at).blocked);
  assert(draftingPacket([contact, receipt], "project", at).blocked);
  receipt.status = "completed";
  assert.equal(
    draftingPacket([contact, receipt], "project", at).packets.length,
    1,
  );
  assert(draftingPacket([contact, receipt], "other", at).blocked);
  const consumed: CrmRecord = {
    ...receipt,
    id: "draft-receipt",
    data: { stage: "drafts", predecessorReceiptId: receipt.id },
  };
  const repeat = draftingPacket([contact, receipt, consumed], "project", at);
  assert(repeat.blocked);
  assert.equal(repeat.alreadyProcessed, true);
  assert.equal(repeat.packets.length, 0);
  contact.version = 2;
  assert(draftingPacket([contact, receipt], "project", at).blocked);
  contact.version = 1;
  contact.data.suppressed = true;
  assert(draftingPacket([contact, receipt], "project", at).blocked);
  delete contact.data.suppressed;
  contact.data.segment = "brand_deal";
  assert(draftingPacket([contact, receipt], "project", at).blocked);
  contact.data.segment = "owned_offer";
  assert(
    draftingPacket([contact, receipt], "project", at + 8 * 86400000).blocked,
  );
});
