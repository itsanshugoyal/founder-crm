# Daily operations

Use [the focused stages](AUTOMATION-STAGES.md): research at 09:00 with 13:00/17:00/21:00 catch-up windows, personal drafting at 10:30 with 14:30/18:30/22:30 catch-up windows, reply review at 12:00/17:00 with 14:00/19:00/22:00 recovery, and Friday learning at 16:00 with Friday/Saturday 20:00 and Saturday 16:00 recovery. All times are Asia/Kolkata. The original combined daily workflow has been replaced, not left running alongside these jobs.

Each stage invokes its own project skill and reads the relevant complete downloaded package instructions. Drafting depends on verified research receipts, not just a clock offset. Work is bounded, idempotent and saved with a receipt. Human approval and sending remain separate. No automatic sends, paid model APIs, n8n or external calendar invitations.

Supabase is authoritative after the verified cutover; Airtable is a read-only archive. Keep the computer and Codex available. Create `.local/operations/STOP` or pause the jobs in Scheduled to stop processing. See pending.md for unfinished setup and release verification notes for actual dry-run outcomes.
