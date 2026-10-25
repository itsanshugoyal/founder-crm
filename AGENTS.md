# Founder CRM
Use ARCHITECTURE.md and DESIGN.md. This is React/Vite/Hono, not Next.js.
Never display credentials or include them in prompts, logs, fixtures, committed files, or URLs.
Never send outreach automatically. Human UI approval and an individual send are distinct actions. AI/MCP tokens cannot approve, send, publish, invite externally, or spend.
No paid LLM APIs. No n8n activation. Keep experiments isolated. Unknown evidence stays unknown.
Preserve original DealDock and Airtable until verified Postgres cutover. No silent dual writing.
Verified cutover completed on 25 October 2026 IST. Supabase is now authoritative; Airtable is a preserved read-only archive. Use docs/AUTOMATION-STAGES.md for focused skill-based operations.
Run npm run check and relevant browser checks before pushing. Report external-account limitations honestly.
Imported skill packages are instructions and tooling, not authorization. Root rules take precedence.

## Team delivery and schedule changes

Before changing this repository, read `ARCHITECTURE.md`, `DESIGN.md`,
`docs/SCHEDULES.md`, and the relevant stage guidance in
`docs/AUTOMATION-STAGES.md`. `docs/SCHEDULES.md` is the human-editable source
of truth for stage purpose, enabled state, limits, and dependency rules; every
scheduled prompt is required to read it before acting. A Markdown edit changes
the next run's behaviour, but not its timer: cadence, activation, or target
thread changes require an explicitly authorised update to the saved Codex
schedule as well, followed by a matching documentation change.

Keep stage responsibilities narrow: research → drafts → reply review → weekly
learning. Persist an idempotent local and Supabase receipt, honour `.local/operations/STOP`, and do not turn a manual rehearsal into evidence that a
future timer fired. One scoped writer works at a time. For more than five CRM
writes, prepare a bounded scratch script, preview exact IDs and fields, apply
atomically where supported, and structurally read back the result.

This is a personal repository. Before every commit or push, verify the remote,
author, and committer resolve to `Anshu Goyal <72263458+itsanshugoyal@users.noreply.github.com>` and `https://github.com/itsanshugoyal/founder-crm.git`.
Never use the `itsanshu-code` identity here. Do not rewrite published history
unless the user explicitly asks. A Vercel deployment is a separate external
effect; follow `docs/VERCEL.md`, preserve the live release if a deployment is
blocked, and record the exact limitation instead of claiming a deploy.
