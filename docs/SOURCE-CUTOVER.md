# Source cutover — 25 October 2026

The owner authorized a single source of truth. Supabase is now authoritative; Airtable is a retained archive. There is no dual-write job.

## Evidence and freeze

The final read-only source export contains 77 leads (44 legacy qualified, 14 hold, 13 dead, six pending), 21 operations, zero calls and zero counters. Thirty historical draft variants and 19 tasks/two campaigns derive from these originals. All 128 imported CRM records retained matching raw source fields. A fresh export matched the prepared export with zero differences. The extra pending `fff` record remains unverified.

Final private snapshot SHA-256: `f7d6d0d3752e1cba239806c5ffe0ebf28fc3eee0de955d2fb2670c076530a3f7`. Snapshots and credentials remain ignored locally.

The former `dealdock-crm` Vercel project was replaced with a static move notice. Its stable `/dashboard` returns 200 with the new CRM link and `/api/crm` returns 410 Gone. Retirement deployment: `dpl_6R7DFKYEEfkdiYSZMvf7nDJdwojc`. DealDock's public marketing deployment was not changed. The old local repository has a `.crm-retired.json` marker and narrowly scoped guards in `scripts/at.js` and `src/lib/crm/server.ts`; non-GET Airtable operations reject before a network call. These three old-repository edits are not a commit of that repository's unrelated working changes.

The Supabase cutover marker was committed transactionally after verifying count and raw originals. It records the snapshot hash, verification time and frozen legacy paths. Subsequent qualification/copy changes preserve `legacyRaw` and legacy scores separately.

## Limits and rollback

Known production/local write paths are retired. This does not revoke the Airtable account/PAT or prove no unrelated external client can write Airtable. Old immutable deployments remain for recovery; do not use them for operations. No Airtable record was changed or deleted.

Rollback requires pausing Codex stages, exporting/reconciling newer Supabase writes, and deliberately restoring one authoritative system. Simply reopening the old CRM loses newer research, copy revisions and receipts. Do not reinstall background sync.
