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

Before each push, verify the project and remote, then ask the user which
GitHub account to use. A choice explicitly given for the current push is
sufficient; do not ask twice. Founder CRM's upstream is
`https://github.com/itsanshugoyal/founder-crm.git`. Keep personal and Shubham K
Mart accounts separate. Use the selected account's verified author/committer
identity, and a personal fork plus pull request when upstream access is absent.
Never use the `itsanshu-code` identity here. Do not rewrite published history
unless the user explicitly asks. A Vercel deployment is a separate external
effect; follow `docs/VERCEL.md`, preserve the live release if a deployment is
blocked, and record the exact limitation instead of claiming a deploy.


## Current production database

As of 31 October 2026, Founder CRM uses Supabase project `lkjzebcnkhucuvzspbip` in Mumbai behind `https://founder-crm-rouge.vercel.app`. The previous project `thnqkgxpeyjholkbocnc` is a frozen rollback source; never re-enable its write path or switch traffic back without reconciling all newer Mumbai writes. The Mumbai MCP is `supabase-mumbai`. Keep connection credentials private. See `docs/VERCEL.md` and `pending.md` for verification and outstanding founder sign-in.
