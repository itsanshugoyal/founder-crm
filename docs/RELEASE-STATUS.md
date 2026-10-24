# Release verification — 24 October 2026

## Implemented and checked locally

The full source is in the separate private Founder CRM repository. Production build and 46 tests passed, covering HTTP/domain security regressions, mocked provider/Auth adapters, owner bootstrap, database browser-role permissions, the hosting proxy and real MCP stdio negotiation. Migration reconciliation passed separately. Browser testing confirmed contact/invoice creation, search, invoice issue versus send separation, project switching and the phone layout in an isolated in-memory workspace; it never changes Airtable or sends outreach. The final review added sticky suppression for status-only opt-outs, retained identity history after edits/merges and bounded PDF wrapping work.

The migration rehearsal preserved 76 contacts, 21 operation records and 30 unapproved draft variants, including every original raw field. Repeating the import added zero records and persistence was checked after reopening the embedded database. Original Airtable received zero writes.

## External setup still required

Vercel is now the requested host. The connected goldfish team is Hobby; commercial deployment is pending an eligible plan/team. The official Supabase external connection is available but not installed. See [Vercel setup](VERCEL.md). No paid plan was activated.

1. **Team Seven** (`thnqkgxpeyjholkbocnc`) is now the selected active project under the connected infinity organization, whose plan is free. The existing paused project was untouched. The CRM migration was applied to the previously empty project and live SQL permission checks confirm browser roles cannot call the state RPCs or read CRM tables. The deployed Supabase backend uses managed server keys; no database password was installed.
2. Create the initial owner account privately in the CRM, verify the email, then sign in. Only the privately configured verified owner identity can bootstrap membership. Configure the production site/redirect URL in Supabase Auth. The private bootstrap email is not returned to clients.
3. Invite Nahush as an equal owner using his verified individual account. Hosting-level private access and CRM membership are separate boundaries.
4. Reconcile the final Airtable delta, freeze the old write path and verify the production import before declaring a cutover. Until then Airtable remains authoritative.
5. Connect only the desired provider accounts through a reviewed free Composio configuration. Gmail, Google Calendar and Instagram adapters are implemented and mock-tested; live OAuth, scopes, current provider eligibility and a real read/sandbox test are still pending. LinkedIn cold messaging remains manual.
6. Create a private scoped MCP token and configure Codex's runtime. Scheduled daily/weekly execution is not active merely because an automation row exists. Verify one receipt-producing run before enabling recurring work.

The database and backend are configured, but verified owner sign-in, production import/cutover and external connections remain separate acceptance steps. Do not describe the local migration rehearsal as a completed live migration or the mocked provider tests as live OAuth verification.

## Known limits

- Provider tests use mocked transports; no live messages or calendar invitations were sent.
- CSV export is available. Generic CSV import is not implemented; the reviewed Airtable importer and atomic MCP changeset previews cover the current migration/batch workflow.
- Shared client views are limited, expiring reviewed document snapshots. They are not a full client login portal or private file-storage service.
- No bank sync, payment collection, tax filing, ad purchasing or automatic social publishing is enabled.
- Browser security/access testing and hosted readiness must be repeated after production credentials are configured. Local tests cannot establish live Supabase/RLS configuration, OAuth eligibility or email deliverability.
- Supabase security advisors report six informational `RLS Enabled No Policy` findings. This is intentional: browser roles have no CRM table grants or policies; all access passes through the authenticated server. See the [advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
