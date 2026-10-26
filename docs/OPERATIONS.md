# Operating Founder CRM

## Hosting and access

Production is https://founder-crm-rouge.vercel.app on Vercel, backed by Team Seven Supabase. Vercel forwards API calls to the authenticated Edge Function and stores only its public endpoint; managed server keys stay in Supabase. Public signup does not grant CRM membership. The verified initial owner signs in with the existing account.

Settings → People & access supports Member, Admin, Owner and Viewer invitations. Admin can manage project people/settings/records; Owner is the full cofounder choice. Each member uses an individual verified account. Creating a private invitation link does not send an email. Share it directly with the intended person. Invitations expire after seven days.

Local development: npm ci, npm run dev, then http://127.0.0.1:3460. Embedded Postgres data stays in ignored .local/db. The isolated QA server is loopback-only and in memory, never the production adapter.

## Source of truth

The [verified cutover](SOURCE-CUTOVER.md) makes Supabase authoritative. Airtable is a retained archive; scheduled work must not query or write it. The old CRM shows a move notice and its API returns 410. Do not resume the old app without reconciling newer writes. No dual writes or n8n flows are enabled.

Historical fields, IDs and copy remain in legacyRaw. Imported scores do not establish current fit. Editorial cleanup keeps working drafts unapproved and flags missing fresh evidence. Owned-offer and brand-deal segments remain separate; the five excluded experimental handles must not enter the owned-offer campaign.

## Connections

The Connections screen distinguishes **Codex** access from the **CRM-native inbox/calendar**. Codex Gmail/Calendar checks verified the approved itsanshugoyal2@gmail.com identity. Composio MCP OAuth authentication is separately verified; it does not provide a developer API key or prove individual provider accounts are connected.

To finish native setup, choose a provider and open Connection setup. An owner/admin enters the existing Composio project API key privately. The server reads fixed tool schemas, pins a dated version and prepares a restricted auth configuration; this does not connect an account or execute a messaging tool. The key stays in server-private project settings and is never returned to browsers, records or audits. Then Connect account opens the provider's consent screen; return and verify the real account. Setup errors must not mark it connected.

No paid tool, Sandbox model execution, automatic upgrade or LLM API is authorized. Unsupported Instagram/LinkedIn cold outreach stays copy/open/manual. Provider tests are mocked until the owner supplies the key and completes OAuth. See [Composio authentication](https://docs.composio.dev/docs/authentication/programmatic-auth-configs).

## Codex and schedules

Settings → Codex & MCP supports 7/30/90-day or **Never expires, until revoked** tokens. Every token remains project-scoped and revocable. Existing expiry is unchanged unless a human creates a replacement. MCP cannot approve/send, manage access, invite, share, publish, issue invoices or record payments.

The local founder-crm registration uses scripts/mcp-launch.mjs. It reads ignored owner-restricted files .local/credentials/crm-config.json and crm-token.txt, pins the production origin and requires a valid project ID. No credential appears in command arguments. The mcp-check helper verifies production stdio/read/write/readback and deduplicates the connection receipt.

Four focused local Codex schedules replace the combined daily run: research 09:00 with 13:00/17:00/21:00 catch-up windows, drafting 10:30 with 14:30/18:30/22:30 windows, replies 12:00/17:00 with 14:00/19:00/22:00 recovery, and weekly learning Friday 16:00 with Friday/Saturday 20:00 and Saturday 16:00 recovery (India time). Each invokes its repository stage skill and canonical downloaded skills. See [the full contract](AUTOMATION-STAGES.md). Times are not completion triggers: drafting requires a completed, fresh, same-project research receipt and rechecks suppression. The stage-packet helper enforces that gate. The computer and Codex must be available at a window; a local task cannot run instantly while the laptop/app was offline. Saved ACTIVE status is not proof of a future run.

CRM automation records track schedules and receipts; they do not launch jobs themselves. Pause jobs in Codex or create .local/operations/STOP. Bulk writes over five records use a scoped scratch script, preview, optimistic versions, stable keys and structural readback. Reconcile uncertain outcomes before retry.

## Human review and finance

Every message requires individual review and send. Approval binds exact recipient/content/account/channel/version; edits revoke it. Copying and approving do not count as sending. Replies stop no-reply follow-ups, and opt-outs suppress further outreach. Account-wide daily operating ceilings remain 15 Instagram touches and 25 LinkedIn requests shared across projects/cofounders; unknown send counts mean capacity is unknown. Queue overflow.

Money uses integer minor units with separate currencies. Issuing, sharing, sending and payment are distinct. Only record real payments. Shared client documents are expiring, reviewed snapshots with explicit public fields. No bank sync, ad purchasing or automatic social publishing is enabled.

## Verification

The check script runs the production build, domain/HTTP security regressions and compiled Node adapter check. Both repository/global skill verifiers check pinned package contents/registrations, not execution of every skill. Live auth/provider/scheduler claims require their own receipts beyond local tests. [pending.md](../pending.md) contains outstanding founder actions only.
