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
| Personal outreach drafts | Daily, 10:30 | Yes | 3 drafts | Fresh, unconsumed research receipt | Review-only drafts |
| Reply and follow-up review | Daily, 12:00 and 17:00 | Yes | Bounded project scope | Verified DealDock/known-contact email and calendar scope | Classification or human task |
| Weekly learning | Friday, 16:00 | Yes | 1 experiment | Stored outcomes and receipts | One reviewable learning proposal |

“Enabled: Yes” means a run may proceed when its prerequisites are met. A run
with no qualifying work records a quiet, successful receipt rather than
inventing work. All stages use Asia/Kolkata dates for receipt keys.

## Dependencies and repeat protection

1. Research must store primary-source facts, checked timestamps, unknowns,
   `draftEligible`, and the current contact version.
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
- Follow-ups may be proposed around days 4 and 10, maximum two, and stop on
  any reply or opt-out.
- Stable project/contact/channel/purpose keys prevent duplicate drafts. Never
  overwrite approved or sent content.

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
