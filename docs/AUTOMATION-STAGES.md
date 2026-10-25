# Focused Codex operations

Supabase is the live source of truth following the verified 25 October cutover. Airtable is an archive; scheduled work must not read or write it. All jobs use the existing Codex subscription, not a paid model API or n8n. Keep the computer and Codex available. Pause jobs in Scheduled or create `.local/operations/STOP` to stop all stages.

## Schedules and real dependencies

| Stage | India time | Actual work | Required installed skill |
|---|---|---|---|
| Research and qualification | Daily 09:00 | Check at most three existing contacts; new sourcing only when the verified backlog is empty. Save primary-source facts and unknowns. | composio-lead-research-assistant, marketing-prospecting |
| Outreach drafts | Daily 10:30 | Read the completed research packet; write at most three short, personal drafts and audit the wording. | marketing-cold-email, avoid-ai-writing |
| Replies and follow-ups | Daily 12:00 and 17:00 | Read only DealDock/known-contact threads and upcoming meetings. Classify actual replies; propose responses and manual follow-up tasks. | marketing-cold-email reply-handling, marketing-revops |
| Weekly learning | Friday 16:00 | Review held conversations, activated pilots, objections, pricing evidence and onboarding friction; stage one useful experiment. | marketing-loops, marketing-revops, smb-onboard |

The times provide separation, not guaranteed completion triggers. Desktop schedules do not provide a verified stage-completed event chain here. Every consumer must check a persisted predecessor receipt before acting. If research is late or fails, drafting waits for the next eligible run; it does not substitute guessed facts. Do not add Windows Task Scheduler, paid APIs or another orchestrator as a workaround.

## Shared run contract

Read AGENTS.md, this file, `.agents/product-marketing.md`, `.agents/voice/anshu.md`, and the stage's `.agents/skills/founder-crm-<stage>/SKILL.md`. Then actually read the relevant canonical upstream SKILL.md and references. Each receipt lists which skill files were used and what they contributed; an installed package alone is not a run.

Use only the configured project-scoped MCP. The private launcher is `scripts/mcp-launch.mjs`; it loads credentials without printing them. The CLI/SDK helper may be used when a server is not loaded in the current chat. Supabase operations are live; do not create pretend contacts or pretend replies to make a run look successful.

Each stage uses `stage:<projectId>:<Asia/Kolkata date>:<stage>` as its external key. Reply-stage keys also include the 12:00 or 17:00 slot. Save status `running`, `completed`, `completed_with_limits` or `blocked`, start/end, actual checked/written counts, exact changed record IDs, predecessor receipt IDs, source URLs, source freshness, skills used, limitations and zero/unknown outcomes separately. Save a local receipt under ignored `.local/operations/stages/` and a CRM knowledge receipt. Use structural readback comparison, stable record keys and optimistic versions. More than five writes require a scoped scratch script and a preview of intended IDs/fields. On uncertain outcomes, reconcile before retrying. Never duplicate a draft or increment a send counter because a job reran.

Research receipts carry a packet per contact: contactId, verified facts with URLs/observed text/checkedAt, unknowns, a justified fit decision, and `draftEligible`. Broad fit and numeric score are separate from evidence of an actual need. Keep the 7+/5–6/<5 rubric, but unknown owned-offer/DM/staffing facts prevent treating a legacy score as current qualification. `draftEligible` requires a real current offer/context and a useful question, not assumed missed revenue. `sendReady` remains false until a human reviews. Exclude the five brand-deal experiments and institutions. Normalize handles/URLs before dedupe within Supabase.

Drafting consumes the latest completed research packet within seven days, validates record versions and suppression again, and records its predecessor receipt ID. If no packet exists, save a truthful blocked receipt and make no drafts. Ask about missing fit information instead of asserting it. Read `.agents/voice/anshu.md`; the attached evidence stays outside the message body. Human approval remains separate from sending. Editorial cleanup of historical drafts preserves the original in legacyRaw and does not revalidate facts or approve the result.

Reply review first verifies the approved mailbox/calendar identity, `itsanshugoyal2@gmail.com`. Query only DealDock or actual known contacts with bounded dates, and exclude infrastructure notices and bulk mail from lead replies. Any reply stops no-reply follow-ups; opt-outs suppress further outreach. Draft the next response without sending or creating an external event/invitation. Native CRM provider connections are distinct from Codex connectors. Update the existing Codex integration verification record rather than creating duplicate status cards.

Across both founders and all projects, suggest at most 10–15 manual Instagram touches and 25 LinkedIn requests per day after subtracting verified actual sends. Queue overflow; copying and approving never count as sending. Unknown send counts mean capacity is unknown. Follow-ups around days 4 and 10 are human tasks, with a maximum of two and an immediate stop on replies or opt-outs.

Weekly review uses actual evidence and does not send, publish, spend, invite, issue invoices, invent payments or change offers. Track qualified conversations, held meetings, first useful pilot session, weekly active use, willingness to pay, paid continuation and verified revenue by currency. Leave metrics unknown where records do not establish them. Stage content/SEO ideas with sources; ads remain a later human budget decision after a message and pilot activation work.

## Repeat protection and manual triggers

A completed drafting receipt consumes its predecessor research packet. The executable gate returns `alreadyProcessed: true` and zero packets on repeat; this is a successful no-op, not a failure or a reason to notify again. Packets must include a matching contactVersion and an owned-offer contact that is not dead, opted out or suppressed. Draft records use a stable project/contact/channel/purpose key and update existing unapproved work rather than creating another dated copy. Sent or approved content must not be overwritten by scheduled edits.

Research advances the existing backlog and normally skips evidence checked within seven days. A real new reply or upcoming meeting can justify refreshing a recently checked contact. Unknown Instagram/team/DM facts are not cleared merely because the offer page was re-read.

When the human requests an extra run, keep recurring times unchanged and give the execution a distinct manual-trigger slot. Read the actual saved stage prompt and canonical skills, record trigger=manual, actual start/end, exact changed IDs and structural readback, and preserve existing receipts. A manually triggered stage tests its work and output; it is not proof that a future timer fired. Process research before drafting and only let one writer apply a scoped batch at a time.

The [official scheduling guide](https://learn.chatgpt.com/docs/automations?surface=app) distinguishes scheduled prompts, skills and local execution; local file work requires the machine/app to be available. Its current event-trigger support is not a desktop stage-completion chain. The [installed loop orchestration reference](../vendor/marketing/skills/marketing-loops/references/loop-orchestration.md) separates sensing, action and learning and recommends limiting loops to what a human can review. A [community issue about local task visibility](https://github.com/openai/codex/issues/46789) is user-reported, not a guarantee about this installation; it supports checking actual run receipts rather than treating a visible ACTIVE schedule as proof of execution. We therefore use a small set of focused schedules, explicit receipt gates and a dry run of each stage.
