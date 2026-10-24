# Release verification — 25 October 2026 (IST)

This is the current release evidence. Historical setup notes in other reports are superseded where this document states a completed check.

## Source and live data

Supabase is the source of truth after the owner-authorized cutover. The last read-only Airtable snapshot retained 77 contacts and all 128 imported raw originals matched. The old CRM serves a move notice and its API returns 410 Gone; local write helpers reject writes. See [the cutover report](SOURCE-CUTOVER.md) for the final snapshot hash, scope and rollback limits. No Airtable record was modified.

Current production readback: 77 contacts: 41 Qualified, 14 Nurture, 13 Not a fit, nine Researching. Three previously qualified contacts were deliberately moved to Researching because current staffing/DM need remains unknown; their legacy scores/raw originals remain preserved. Thirty-one working drafts are all Needs review, all use the revised founder voice, and zero drafts target the five excluded brand-deal experiments.

## Copy and actual skill use

The complete pinned packages remain installed both in the project and local Codex: 44 Small Business, 52 Marketing, 13 Instagram and three Composio registrations. Repository/global integrity verification covers all 112 and their source files; it is not a claim that every skill executed.

This release actually applied Cold Email and its personalization reference, the copywriting AI-tells reference and Avoid AI Writing to the working messages. The voice guide is .agents/voice/anshu.md. Thirty historical variants and the existing Meera fit-question draft were revised, preserving originals. Unsupported praise, guessed DM volume, unagreed free-pilot promises and a Nikon/Nike mismatch were removed. Three current primary-source contexts produced short questions; other legacy contexts remain held for fresh evidence. No copy was approved or sent.

## Four schedules and manual rehearsals

The old combined job was replaced with four ACTIVE local Codex heartbeats, each invoking its repository stage skill and specific downloaded skills:

| Stage | India time | Actual manual rehearsal |
|---|---|---|
| Research | Daily 09:00 | Three offer pages checked; all three remain pending full fit, three evidence packets. Receipt 80a86d9a-afdc-417d-aa2c-dfc3b794ff3e. |
| Drafts | Daily 10:30 | Three source-led fit questions; fresh completed research dependency verified. Receipt 601ffd0e-fde8-4cd7-a88f-bc7ed463da48. |
| Replies | Daily 12:00 and 17:00 | Approved Gmail/Calendar identity verified; bounded DealDock searches returned zero messages/events. Zero reply classifications or replies invented. Receipt 37eb23ec-0ee0-4ab2-a628-d917ed804037. |
| Weekly learning | Friday 16:00 | Actual receipts reviewed; pilot/payment/activation metrics left unknown. One enquiry-journey validation experiment proposed; no ad spend or offer changes. Receipt 8891324f-b45a-4444-ab04-13eacbcedbaa. |

All stages completed with explicit limits. Four research writes, 33 copy/receipt writes and nine connection/schedule/review writes were previewed and structurally read back through scoped scratch scripts. CRM automation rows are tracking records, not job triggers. The stage-packet helper blocks missing, running, stale, foreign-project or suppressed/excluded research. Times are spacing, not completion events. Future timed execution remains unobserved and requires the local computer/Codex to be available. See [automation design and sources](AUTOMATION-STAGES.md).

## Connections, tokens and invitations

MCP status now reflects valid scoped access plus actual project MCP activity. The real stdio connection receipt is 927de959-c047-47a2-9a27-aa56357a38ea. MCP still cannot approve/send, invite/manage access, publish/share, issue invoices or record payments. New human-created tokens support a fixed lifetime or Never expires, until revoked; the existing token was not silently extended.

Gmail and Google Calendar are verified through Codex for itsanshugoyal2@gmail.com. Composio's consumer MCP OAuth authentication was verified separately; that alone is not provider account authorization or CRM-native inbox access. Cards distinguish Codex from native connections, and the Inbox no longer counts MCP as a mailbox. Codex status is timestamped verification, not a continuous account-health probe.

Native Gmail/Calendar setup now opens a private project-key form instead of the old technical configuration error. Setup reads fixed tool schemas, pins their version and prepares the allowed auth configuration; no provider tool or model executes. Server-private settings never appear in records/audits/client responses. The owner chose to enter the Composio key after deployment and complete provider OAuth. Consequently live native OAuth/inbox/send checks are still pending; mocked transports do not establish them.

Invitations now offer Admin as well as Owner, Member and Viewer. Admin and Owner use individual verified accounts; no invitation was sent to Nahush. His email is still needed for a human-created invitation. The latest owner screenshot shows the correct saved production Supabase Site URL and two narrowly scoped redirects. The connected browser cannot expose that signed-in Chrome profile; no fresh verification-email round trip is claimed.

## Verification and limits

The production build, 56 meaningful local tests and the separate compiled Node HTTP adapter check pass. Tests cover Admin invitations, no-expiry token authentication/revocation, machine prohibitions, private provider configuration, stale stage gating, project boundaries, opt-outs, manual-send caps, origin/CSRF, financial/share boundaries, Supabase browser-role grants, transport isolation and real MCP stdio negotiation.

Browser checks used an isolated in-memory loopback workspace: Admin role selection, Never expires option, Gmail setup dialog, task creation/search/readback, desktop navigation and a 390px phone layout. The mobile setup fits without horizontal document overflow. No production invitation/token was created by browser testing. Public production health/auth boundaries and scoped MCP readback are checked separately from authenticated browser workflows; no private production sign-in or provider consent is simulated.

Known limits remain: the build emits a large-client-chunk warning; generic CSV import, bank sync, payment collection and full client portal are not implemented. Supabase's six no-policy RLS findings are intentional because browser roles have no CRM table grants; leaked-password protection is a paid feature and was not enabled. GitHub verification workflow presence is not proof of a remote CI run. Original upstream skill missing links/license limitations are recorded in docs/SKILLS.md.

Remaining founder actions are only in [pending.md](../pending.md). No paid LLM API, paid upgrade, n8n activation, outreach send, calendar invitation, ad spend or publication occurred.
