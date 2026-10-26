# CRM schedule configuration

This is the team-editable operating configuration for Founder CRM schedules.
It controls what a run may do, what it must not do, and which limits it
honours. It does not itself create, pause, or retime a Codex schedule; make a
matching, human-authorised scheduler change and record it here when cadence or
activation changes.

## Non-negotiable guardrails

- Supabase is the source of truth. Airtable is an archive only.
- The configured scoped CRM MCP is the only CRM writer. No paid LLM API or
  n8n workflow is used.
- A human approves every message and sends it individually. Runs never approve,
  send, publish, invite, create external meetings, spend, or claim results.
- Stop every stage when `.local/operations/STOP` exists. Never alter schedules
  from a scheduled run.
- Exclude the five brand-deal experiment handles from the owned-offer campaign:
  `mrsumitreview`, `mommylilworld`, `fs_praveen_mekala`, `captain_amaira`, and
  `geekyranjitofficial`.
- Preserve unknown facts as unknown. No source-free personalization.

## Active stages

| Stage | Default cadence (India time) | Enabled | Hard limit | Required input | Output |
| --- | --- | --- | --- | --- | --- |
| Research and qualification | Daily, 09:00 | Yes | 3 contacts | Existing backlog and fresh sources | Source packet; no draft |
| Personal outreach drafts | Daily, 10:30 | Yes | 3 primary drafts | Fresh, unconsumed research receipt | One review-only primary draft per contact plus a conditional channel plan |
| Reply and follow-up review | Daily, 12:00 and 17:00 | Yes | Bounded project scope | Verified DealDock/known-contact email and calendar scope | Classification or human task |
| Weekly learning | Friday, 16:00 | Yes | 1 experiment | Stored outcomes and receipts | One reviewable learning proposal |

“Enabled: Yes” means a run may proceed when its prerequisites are met. A run
with no qualifying work records a quiet, successful receipt rather than
inventing work. All stages use Asia/Kolkata dates for receipt keys.

The existing legacy-qualified list is a research backfill queue, not permission
to generate a blanket set of messages. Each research run takes the next three
unreviewed active records, records a detailed dossier, and advances only the
ones with current owned-offer evidence. The paired drafting run creates one
primary message for each eligible packet. That cadence deliberately grows the
review queue at the same pace as founders can inspect it.

## Dependencies and repeat protection

1. Research must store primary-source facts, checked timestamps, unknowns,
   `draftEligible`, the current contact version, and a channel dossier. The dossier
   may contain an Instagram identity, a public LinkedIn URL, and a published
   business email only when each has its own source URL and observed date.
2. Drafting can consume only the latest completed research receipt less than
   seven days old. It checks suppression and contact version again. A consumed
   packet is a successful no-op on rerun.
3. Reply review reads only the approved mailbox/calendar scope, excludes
   infrastructure messages, and stops no-reply follow-ups when an actual reply
   or opt-out is recorded.
4. Weekly learning uses actual stored outcomes. Unknown meetings, pilots,
   payments, and revenue remain unknown.

Research normally does not recheck evidence less than seven days old. A real
reply or an upcoming meeting is the exception, not the desire for more copy.
Archiving stale drafts does not make old evidence fresh.

## Human queue and capacity rules

- Keep suggested manual activity at or below 10–15 Instagram touches and 25
  LinkedIn connection requests per calendar day, after verified actual sends.
- Unknown send totals mean remaining capacity is unknown. Queue rather than
  infer a safe allowance.
- Follow-ups may be proposed only after a recorded manual send: day 4 (a
  verified LinkedIn connection request, if available), day 8 (a verified public
  business email, if available), and day 12 (one final follow-up in the most
  natural existing conversation). These are conditional human tasks, not
  automatic drafts or sends. Use no more than two follow-ups total, and stop on
  any reply or opt-out.
- Stable project/contact/channel/purpose keys prevent duplicate drafts. Never
  overwrite approved or sent content.

## Channel and enrichment policy

The DealDock campaign is Instagram-first. A verified Instagram identity and a
source-led question make Instagram the default first touch. A published LinkedIn
profile or business email is useful context, not permission to blast every
channel. Research records availability and lineage; it does not guess addresses,
scrape LinkedIn, or treat a directory/list-broker result as verified.

Use the sequence below only after the previous step has a recorded manual send,
has no reply/opt-out, and capacity remains. A person with no verified secondary
channel simply stays out of that step.

| Relative day | Manual action | Preconditions |
| --- | --- | --- |
| 0 | Source-led Instagram DM | Verified Instagram identity and a human-reviewed primary draft |
| 4 | LinkedIn connection request | Day-0 send is recorded, no reply, and a public LinkedIn URL is verified |
| 8 | Cold email | No reply, a public business email is published on the creator's own site, deliverability/compliance are manually confirmed, and the email is human-reviewed |
| 12 | One final follow-up | No reply; use the most natural existing conversation; do not add another channel |
| 30+ | Re-research or park | New public signal only; never keep nudging a silent contact |

Email is therefore an experiment for a small, manually verified cohort, not a
default campaign. Keep a source URL/date, business purpose, opt-out handling,
and deliverability status before any real email is sent. The ₹0 operating mode
does not use credit-based enrichment or guessed emails.

## How a teammate changes a schedule safely

1. Edit this file for limits, an enabled state, a stage rule, or an approved
   workflow clarification. Keep guardrails intact.
2. Update the relevant skill or `docs/AUTOMATION-STAGES.md` when the procedure,
   receipt shape, or dependency logic changes.
3. If cadence, activation, or target chat changes, update the saved Codex
   schedule through the authorised scheduler tool in the same change window.
   Do not rely on a file edit alone.
4. Run the affected stage manually with a distinct `manual` receipt key; do not
   modify recurring schedules during that run.
5. Run `npm run check`, review the receipt/readback, commit using the personal
   Founder CRM identity, and push only to the verified origin.

## Current externally saved schedule names

| Stage | Saved schedule name |
| --- | --- |
| Research | `founder-crm-daily-operations` |
| Drafts | `crm-personal-outreach-drafts` |
| Replies | `crm-reply-and-follow-up-review` |
| Weekly learning | `crm-weekly-pilot-and-marketing-learning` |

The current timing above is mirrored in the saved schedules. A manual run
tests only that run and its persisted receipt; it does not prove future
timers will wake or that external provider connections are CRM-native.
