# Release verification — 25 October 2026 (IST)

This is the current release evidence. Historical setup notes in other reports are superseded where this document states a completed check.

## Source and live data

Supabase is the source of truth after the owner-authorized cutover. The last read-only Airtable snapshot retained 77 contacts and all 128 imported raw originals matched. The old CRM serves a move notice and its API returns 410 Gone; local write helpers reject writes. See [the cutover report](SOURCE-CUTOVER.md) for the final snapshot hash, scope and rollback limits. No Airtable record was modified.

Latest production readback on 25 October: 77 contacts: 38 Qualified, 14 Nurture, 13 Not a fit, 12 Researching. Earlier source checks deliberately moved contacts to Researching because current staffing/DM need remains unknown; their legacy scores/raw originals remain preserved. Thirty-one working drafts are all Needs review, all carry the revised founder-voice copy version, and zero drafts target the five excluded brand-deal experiments. Legacy Qualified is not a claim of freshly verified fit.

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

The original rehearsals completed with explicit limits. Four research writes, 33 copy/receipt writes and nine connection/schedule/review writes were previewed and structurally read back through scoped scratch scripts. CRM automation rows are tracking records, not job triggers. The stage-packet helper blocks missing, running, stale, foreign-project or suppressed/excluded research, and now returns an idempotent no-op for an already-consumed receipt. Times are spacing, not completion events. The 25 October 12:00 scheduled reply slot has since completed with verified receipt `1c675617-5895-4042-ad6f-94094a6d29e8`; this does not establish timed completion of every other stage. See [schedule evaluation](SCHEDULE-EVALUATION.md) and [automation design](AUTOMATION-STAGES.md).

## Connections, tokens and invitations

MCP status now reflects valid scoped access plus actual project MCP activity. The real stdio connection receipt is 927de959-c047-47a2-9a27-aa56357a38ea. MCP still cannot approve/send, invite/manage access, publish/share, issue invoices or record payments. New human-created tokens support a fixed lifetime or Never expires, until revoked; the existing token was not silently extended.

Gmail and Google Calendar are verified through Codex for itsanshugoyal2@gmail.com. Composio's consumer MCP OAuth authentication was verified separately; that alone is not provider account authorization or CRM-native inbox access. Cards distinguish Codex from native connections, and the Inbox no longer counts MCP as a mailbox. Codex status is timestamped verification, not a continuous account-health probe.

Native Gmail/Calendar setup now opens a private project-key form instead of the old technical configuration error. Setup reads fixed tool schemas, pins their version and prepares the allowed auth configuration; no provider tool or model executes. Server-private settings never appear in records/audits/client responses. The owner chose to enter the Composio key after deployment and complete provider OAuth. Consequently live native OAuth/inbox/send checks are still pending; mocked transports do not establish them.

Invitations offer Admin, Owner, Member and Viewer. The owner has since created Nahush’s Owner invitation. A read-only check found no Auth login for him yet; the join page now defaults to account creation, explains verification and reuses a matching verified session to accept access. See [the invitation fix](INVITATION-LOGIN-FIX.md). He still needs to privately create and verify his own login. The latest owner screenshot showed the correct saved production Supabase Site URL and two narrowly scoped redirects; no new real confirmation-email round trip is claimed.

## Verification and limits

The production build, 64 local tests and the separate compiled Node HTTP adapter check pass. Tests cover invitation account creation/verification and Owner acceptance, Admin invitations, no-expiry token authentication/revocation, machine prohibitions, private provider configuration, stale/consumed stage gating, project boundaries, opt-outs, manual-send caps, origin/CSRF, financial/share boundaries, Supabase browser-role grants, transport isolation, draft purpose classification, combined private bootstrap and real MCP stdio negotiation.

Browser checks used an isolated in-memory loopback workspace: Admin role selection, Never expires option, Gmail setup dialog, task creation/search/readback, desktop navigation and a 390px phone layout. The mobile setup fits without horizontal document overflow. No production invitation/token was created by browser testing. Public production health/auth boundaries and scoped MCP readback are checked separately from authenticated browser workflows; no private production sign-in or provider consent is simulated.

Known limits remain: generic CSV import, bank sync, payment collection and full client portal are not implemented. The main client bundle is now about 412 KB (127 KB gzip), with views and Supabase Auth split into separate lazy chunks; the prior large-client-chunk warning is absent. Supabase's six no-policy RLS findings are intentional because browser roles have no CRM table grants; leaked-password protection is a paid feature and was not enabled. GitHub verification workflow presence is not proof of a remote CI run. Original upstream skill missing links/license limitations are recorded in docs/SKILLS.md.

## Considered interface redesign and loading changes

The owner rejected the pine/ivory ledger. Three directions were compared and independently reviewed before the current studio workspace implementation; [UI-REDESIGN.md](UI-REDESIGN.md) records the rationale, flows, skills and acceptance criteria. The selected system uses charcoal, near-white and citron; five main destinations plus expandable Operations; a compact real-work brief; a direct relationship directory; and one selected draft per person with collapsed alternatives. Draft preview and exact review both show purpose, recipient and hold guidance. Replies are not assumed to be introductions. A failed lazy view retains navigation and an explicit recovery action.

Browser verification used the isolated loopback workspace with a fresh public workspace snapshot, not production credentials. Desktop (1440px) and phone (390px) checks covered grouped selection, channel/purpose alternatives and acceptance condition, exact draft opening without approval/send, phone list-to-message/back, empty-search recovery, navigation/Escape, Operations expansion, and QA-only task creation plus search readback. Phone document width remained within the viewport. Representative primary/selected/focus surfaces had measured contrast above 11:1; this is not a full automated accessibility certification. Screenshot evidence is stored privately under .local/verification/studio-*.png.

Loading work removes duplicated snapshots/session requests, bundles authenticated bootstrap/workspace data, lazy-loads Auth/views, and retains useful timeout/recovery states. Vercel configuration now selects Seoul (`icn1`) and the proxy pins Supabase execution beside the existing Seoul database. Live deployment/latency verification must be distinguished from these local checks; no universal speed guarantee or native-provider verification follows from a build.

Production release `734ff9c` reached Vercel Ready as `dpl_3xCxQeE1xE6KmodBuB69AFBq7QQx` in `icn1`. Its served frontend asset matched the local build. Live health passed; anonymous bundled session included no workspace; anonymous workspace returned 401; the scoped bundled session returned the single authorized project with 77 contacts. Responses confirmed `ap-northeast-2` execution. One post-release sample measured session 824ms, authenticated session 724ms, workspace 1,026ms total, versus the earlier 4,849 / 2,958 / 3,489ms sample. A separate scoped bundled read took 725ms. These are observations, not a benchmark or guarantee. A later cosmetic tab-overflow correction preserves these server paths.

Remaining founder actions are only in [pending.md](../pending.md). No paid LLM API, paid upgrade, n8n activation, outreach send, calendar invitation, ad spend or publication occurred.
