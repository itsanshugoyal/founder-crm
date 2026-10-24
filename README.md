# Founder CRM

A private, multi-project workspace for founder-led sales, marketing and client operations. Built for Anshu and Nahush, with individually authenticated accounts and equal owner access.

## What is implemented

- Today: replies, due work, meetings and draft review in one place.
- People and companies: source evidence, 0–10 qualification, duplicate checks, merge, saved views and CSV export.
- Pipeline: opportunities, stages, next steps and proposals.
- Inbox: drafts, conversation history, reply classification fields, exact-content approval, copy/manual-send attestation and individually confirmed supported provider sends.
- Work: tasks, meetings, onboarding milestones, campaigns, content and experiments; six practical operating playbooks.
- Money: invoices and PDFs, invoice delivery attestations, partial payments, expenses and totals separated by currency.
- Knowledge and reports: project instructions, source context and operating metrics.
- Settings: projects, invitations, membership, per-project provider connections and revocable MCP tokens.
- Automation: reviewable work queue and a real scoped MCP server for Codex. No paid LLM API or n8n dependency.
- Full pinned Small Business, Marketing Skills and Instagram Agent Skill packages, plus three Composio skills: 112 registrations. See [skill inventory](docs/SKILLS.md).

## Run locally

Requires Node 22+.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3460. Set the first owner's credentials privately in the local setup form. The API binds to loopback port 3461. Persistent local Postgres data is stored under ignored `.local/db`. The test-only QA server on port 3462 is isolated and must never be deployed.

## Verify and deploy

```sh
npm run check
npm run skills:verify
npm run build:site
```

Tests run serially to keep embedded Postgres memory use bounded. `build:site` packages the UI and Hono API as a self-contained Worker. `.openai/hosting.json` binds this checkout to its existing private Sites project; do not create a duplicate site. Supabase is the production database/auth target. Configure secrets privately using the hosting provider, never Git or chat. Production fails closed until the database, migration and authentication are configured.

Vercel is the requested hosting target at https://founder-crm-rouge.vercel.app, on the owner's existing Hobby account without a billing change. Deployment configuration and plan limitations are in [Vercel setup](docs/VERCEL.md). An earlier private deployment exists at https://founder-crm-anshu.itsanshugoyal2.chatgpt.site; it is not the requested release or proof of a completed data cutover. Current checks and external setup are recorded in [release status](docs/RELEASE-STATUS.md).

## Safety rules

Every message needs human review and an individual send. Approval and copying are not sending. MCP cannot approve, send, invite, share externally, issue invoices or record financial outcomes. Instagram and LinkedIn unsupported cold outreach remains manual. Account-wide daily ceilings, opt-out suppression, stale approval rejection and uncertain-provider reconciliation protect the workflow.

No paid LLM APIs, advertising spend or dormant n8n activation. Codex provides research and drafting through the existing subscription. Imported skills do not authorize their tools, spend or messaging instructions.

Original Airtable remains authoritative until a fully reconciled cutover. Migration scripts read Airtable and preserve raw fields without writing to it. Do not use the new local workspace for authoritative lead changes before that cutover.

Read [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN.md](DESIGN.md) and [operating instructions](docs/OPERATIONS.md).
