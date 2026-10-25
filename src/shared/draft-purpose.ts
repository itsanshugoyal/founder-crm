import type { CrmRecord } from "./types";

export type DraftPurpose =
  "instagram" | "connection" | "accepted" | "reply" | "followup" | "other";

/** Channel alone never establishes a message's purpose or a prior interaction. */
export function draftPurpose(
  draft: Pick<CrmRecord, "title" | "data">,
): DraftPurpose {
  const channel = String(draft.data.channel || "").toLowerCase();
  const purpose = String(draft.data.purpose || "")
    .toLowerCase()
    .replace(/[ _-]+/g, " ")
    .trim();
  if (["reply", "response", "inbound reply"].includes(purpose)) return "reply";
  if (["followup", "follow up"].includes(purpose)) return "followup";
  if (
    ["after acceptance", "linkedin after acceptance"].includes(purpose) &&
    channel === "linkedin"
  )
    return "accepted";
  if (
    ["connection", "connection request", "connection note"].includes(purpose) &&
    channel === "linkedin"
  )
    return "connection";
  if (
    ["introduction", "first message", "instagram introduction"].includes(
      purpose,
    ) &&
    channel === "instagram"
  )
    return "instagram";
  // Explicit but unrecognised metadata is not overruled by a legacy title.
  if (purpose) return "other";
  const title = draft.title.toLowerCase();
  if (/\b(reply|response)\b/.test(title)) return "reply";
  if (channel === "instagram" && /\binstagram introduction\b/.test(title))
    return "instagram";
  if (channel === "linkedin" && /\bconnection (note|request)\b/.test(title))
    return "connection";
  if (
    channel === "linkedin" &&
    /after.?accept|after.*accept/i.test(String(draft.data.usage || ""))
  )
    return "accepted";
  if (/\bfollow[ -]?up\b/.test(title)) return "followup";
  return "other";
}
