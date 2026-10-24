# Daily operations

Use [the focused stages](AUTOMATION-STAGES.md): research at 09:00, personal drafting at 10:30, reply review at 12:00 and 17:00, and Friday learning at 16:00. All times are Asia/Kolkata. The original combined daily workflow has been replaced, not left running alongside these jobs.

Each stage invokes its own project skill and reads the relevant complete downloaded package instructions. Drafting depends on verified research receipts, not just a clock offset. Work is bounded, idempotent and saved with a receipt. Human approval and sending remain separate. No automatic sends, paid model APIs, n8n or external calendar invitations.

Supabase is authoritative after the verified cutover; Airtable is a read-only archive. Keep the computer and Codex available. Create `.local/operations/STOP` or pause the jobs in Scheduled to stop processing. See pending.md for unfinished setup and release verification notes for actual dry-run outcomes.
