# Founder CRM interface

## Product direction

The current interface is a light operational CRM with an authored ledger-like structure. It uses white working surfaces, a graphite navigation system, neutral rules, and one muted terracotta accent for primary actions and selected queues. A geometric Founder mark, dated attention header and numbered project index give the product a distinct identity without adding decoration to record tables. The product name is Founder CRM; the selected project, such as DealDock, remains visible beside the current section.

The first redesign pass followed the user's request to avoid design skills. Their subsequent explicit request to use `design-taste-frontend` superseded that instruction, and the refinement applies its typography, color discipline, asymmetric hierarchy, state handling and responsive guidance. Product usability takes precedence over the skill's marketing-style suggestions: no simulated activity, autonomous list movement, perpetual dashboard animations or large presentation cards. The operational adaptation uses low motion, ordinary data density, Geist plus Geist Mono, and real stored counts. The stylesheet replaces the prior theme; it does not layer another theme over it.

## Navigation

The desktop rail groups Today, People, Pipeline, Inbox, and Work under Workspace. Reports, Money, Knowledge, Automation and Settings follow under Operations. Project switching, project creation, search, account identity, and sign out remain directly available. The current section has a solid graphite treatment. Global search is also available from the header and Ctrl/Cmd K.

On phones the rail opens as a Base UI dialog with focus containment, Escape handling, a close control, and focus return. Each rendered project selector has a unique label target. Data tables and the opportunity board scroll within their own surfaces.

## Working screens

- Today is an attention queue. Open work, conversations needing a reply, draft reviews, and meetings are selectable queues with actual counts. Assignment and due-date filters change the rows shown. A separate project overview and upcoming meetings use real project records. Recent activity appears below the queue.
- People uses a compact table with status, segment and fit, evidence, owner, and follow-up date. Search, owner/status filters, saved views, pagination, safe CSV export, duplicate warnings, and explicit merge review remain available.
- Pipeline supports board and list views. Each opportunity exposes its actual amount, owner, due date, next action, and stage selector. Currency totals remain separate and are labeled as potential value.
- Inbox has persistent queue navigation, a searchable record list, actual owner/channel/status context, and explicit connected-account readiness. Opening a record leads to the existing review and action drawer.
- Work uses a category navigator with record counts for tasks, content, campaigns, onboarding, meetings, experiments, and promises. Playbooks create actual task checklists, onboarding plans, or Knowledge documents.
- Money, Reports, Knowledge, Automation, and Settings use the same typography, table controls, surface rules, and action hierarchy. No readiness state is inferred from appearance.

## Forms and record drawers

The record drawer retains overview, evidence, linked messages, work, and history. Labels, editable values, errors, save progress, version checks, and unsaved-change confirmation remain explicit. Forms use native controls and Base UI dialogs. Dates retain local input semantics and are serialized to an explicit timezone for calendar operations. Monetary entry uses ordinary currency amounts and stores integer minor units internally.

Draft approval, copying, opening a conversation, confirming a manual send, and sending through a configured account remain distinct controls. Invoice PDF download, issuance, manual delivery confirmation, and verified partial payments are also distinct. Merging contacts requires selecting the surviving identity and confirming the result. Onboarding milestone checkboxes persist the completion state and date.

## Access and honest state

The access screen is a single focused card for sign in, local setup, production owner signup, or invitation acceptance. Verification and missing-configuration messages remain actionable. No authenticated bypass is introduced. Production passwords go to Supabase Auth, not the CRM mutation API.

Desktop access pairs that card with a restrained introduction and indexed feature list. On phones the introduction is hidden so the form appears immediately. Product navigation takes inspiration from [Attio's sidebar and quick actions](https://attio.com/help/reference/productivity-collaborating/navigating-your-workspace); compact table/pipeline views follow the useful distinction described in [Folk's view documentation](https://help.folk.app/en/articles/4998224-create-views). Branding, layout and implementation are original.

Status badges match the complete normalized status, so Not connected cannot inherit the Connected success appearance. Connected accounts, sent state, calendar links, execution receipts, revenue, and qualification remain grounded in server responses and stored evidence.

Connections distinguish timestamped Codex checks from CRM-native account authorization. Missing native settings open a private setup dialog with the next consent step; MCP is never counted as a mailbox. Invitations expose Admin and Owner choices with their responsibilities. Token lifetime includes Never expires, until revoked and makes that choice explicit without altering existing tokens. Phone dialogs retain their complete instructions and actions within the viewport.

## Verification

Verification covers the full build, narrow and desktop layouts, keyboard navigation/dialog focus, project switching, search and filters, contact creation/edit/merge, draft approval and send boundaries, work/playbooks, onboarding checkboxes, invoices and payment actions, authentication, and missing-provider states. Results are recorded in docs/RELEASE-STATUS.md. Live provider and production-account limitations remain explicit.
