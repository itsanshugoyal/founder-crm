import type { CrmRecord } from "../shared/types";
import { active, modules } from "./models";

export const normalizeSearch = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_-]/g, " ").trim();

export function indexSearchRecords(records: CrmRecord[], projectId: string, members: { id: string; name: string }[]) {
  const owners = new Map(members.map((member) => [member.id, member.name]));
  const scoped = records.filter((record) => record.projectId === projectId && active(record));
  const contacts = new Map(scoped.filter((record) => record.kind === "contact").map((record) => [record.id, record.title]));
  return scoped.map((record) => {
    const title = normalizeSearch(record.title);
    const detail = Object.values(record.data).filter((value) => typeof value === "string" || typeof value === "number").join(" ");
    const haystack = normalizeSearch(`${record.title} ${modules[record.kind].label} ${record.kind} ${record.status} ${detail} ${owners.get(record.ownerId || "") || ""} ${contacts.get(record.contactId || "") || ""}`);
    return { record, title, haystack, words: haystack.split(/[^\p{L}\p{N}@.]+/u).filter(Boolean) };
  });
}

function oneEditAway(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + Number(i < a.length || j < b.length) <= 1;
}

export function searchRecords(index: ReturnType<typeof indexSearchRecords>, query: string, limit = 8) {
  const normalized = normalizeSearch(query);
  if (!normalized) return [...index].sort((a, b) => b.record.updatedAt.localeCompare(a.record.updatedAt)).slice(0, limit).map((item) => item.record);
  const terms = normalized.split(/\s+/).slice(0, 10);
  return index.map((item) => {
    let score = item.title === normalized ? 100 : item.title.startsWith(normalized) ? 70 : item.title.includes(normalized) ? 50 : 0;
    for (const term of terms) {
      if (item.title.includes(term)) score += 15;
      else if (item.haystack.includes(term)) score += 5;
      else if (term.length >= 4 && item.words.some((word) => oneEditAway(word, term))) score += 1;
      else return { record: item.record, score: 0 };
    }
    return { record: item.record, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || b.record.updatedAt.localeCompare(a.record.updatedAt)).slice(0, limit).map((item) => item.record);
}
