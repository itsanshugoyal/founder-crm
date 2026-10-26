---
name: founder-crm-drafts
description: Consume a verified research packet and write up to three concise, source-led primary outreach drafts, with a human voice audit and a channel sequence plan.
---
An alreadyProcessed packet means successful no-op: zero new drafts, retain the existing output and link its receipt. Do not write a new failure note or notify for unchanged no-work. For each eligible contact, create at most one **primary** draft in a run, selected from verified channel evidence. Upsert it by stable key `draft:<projectId>:<contactId>:<channel>:<purpose>`; use an existing matching contact/channel/purpose record if one exists. Different dates are not a reason to create another copy. Never overwrite a sent or approved message; stage a revision for human review separately.

Do not create three immediate drafts for one person. That makes the review queue unreadable and implies a sequence has already happened. Store a short `outreachPlan` in the contact research packet instead:

- Use Instagram first when an official site or offer page verifies the creator's Instagram identity and an Instagram-specific question is grounded in the evidence.
- Add LinkedIn as a later **manual sequence task** only when a public LinkedIn URL is actually verified. Do not invent a profile from a name or search snippet. The task becomes eligible no earlier than day 4 and only after an actual manual first touch has been recorded with no reply.
- Add email as a later **manual sequence task** only when an email is published on the creator's own site or offer page, with its source URL and date. Do not use directory/list-broker emails, guess an address, or use an unverified email-enrichment result. `deliveryUnknown` means no email may be sent yet; a human must verify deliverability and compliance first.
- If neither secondary channel is verified, record it as unknown. Do not manufacture a LinkedIn or email draft.

Primary drafts stay in the review inbox. Later channel steps belong in the contact's sequence plan/task view and remain conditional on a recorded manual send, no reply, no opt-out, and remaining daily capacity.

Read `docs/AUTOMATION-STAGES.md`, `docs/SCHEDULES.md`, and `.agents/voice/anshu.md`. Read `vendor/marketing/skills/cold-email/SKILL.md`, `references/personalization.md`, `vendor/marketing/skills/copywriting/references/ai-tells.md` and the installed `C:/Users/anshu/.codex/skills/avoid-ai-writing/SKILL.md`. Run `node --import tsx scripts/stage-packet.ts` before drafting; it enforces completed/fresh research, project scope and current suppression. A blocked result means zero drafts. Ask one useful, personal question; remove unsupported praise, volume assumptions and unagreed free-pilot promises. Save exact evidence and predecessor references outside the message. Draft only, never approve or send. Save a receipt including the skills actually used, selected primary channel, deferred secondary channels, and the second-pass copy audit.
