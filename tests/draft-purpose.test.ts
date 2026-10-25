import assert from "node:assert/strict";
import test from "node:test";
import { draftPurpose } from "../src/shared/draft-purpose";

test("draft purposes distinguish introductions, actual replies and conditional follow-ups", () => {
  assert.equal(
    draftPurpose({ title: "Reply to enquiry", data: { channel: "Instagram" } }),
    "reply",
  );
  assert.equal(
    draftPurpose({
      title: "Instagram introduction",
      data: { channel: "Instagram", purpose: "reply" },
    }),
    "reply",
  );
  assert.equal(
    draftPurpose({ title: "New message", data: { channel: "Instagram" } }),
    "other",
  );
  assert.equal(
    draftPurpose({
      title: "Mira · Instagram introduction",
      data: { channel: "Instagram" },
    }),
    "instagram",
  );
  assert.equal(
    draftPurpose({
      title: "LinkedIn follow-up",
      data: { channel: "LinkedIn" },
    }),
    "followup",
  );
  assert.equal(
    draftPurpose({
      title: "LinkedIn follow-up",
      data: {
        channel: "LinkedIn",
        usage:
          "Only after a human confirms this person accepted the connection.",
      },
    }),
    "accepted",
  );
  assert.equal(
    draftPurpose({ title: "connection note", data: { channel: "LinkedIn" } }),
    "connection",
  );
  assert.equal(
    draftPurpose({
      title: "Instagram introduction",
      data: { channel: "Instagram", purpose: "custom experiment" },
    }),
    "other",
  );
});
