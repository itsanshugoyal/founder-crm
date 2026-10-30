# Vercel hosting and the existing Supabase project

Vercel is the requested frontend/API hosting target. Supabase project `thnqkgxpeyjholkbocnc` (Team Seven) is already created and has the CRM schema. Do not create a second Supabase project or transfer billing as an incidental integration step.

## Verified account and integration state

### Current hosting: Delta

On 25 October 2026 the owner authorized deployment using Vercel account `deltaodcom-1158`. The separate authenticated login verified ownership of its **Delta** Hobby team (`delta-7460`, `team_dI5gycJwZWzwdncCqFzOBLpO`). The existing `founder-crm` project (`prj_3hTkFdsv0ePgoWXDhiy8rGC29P0E`) was transferred from goldfish4 using Vercel's project-transfer APIs. Target-team reads verified the unchanged project ID, production `CRM_EDGE_URL` configuration and verified `founder-crm-rouge.vercel.app` domain. No new database or paid feature was created.

The production URL remains **https://founder-crm-rouge.vercel.app**. Auth redirects, exact origin enforcement, provider callback URLs and the scoped MCP launcher therefore retain their existing configuration. Live public health, anonymous privacy checks and an authenticated project-scoped bootstrap passed after transfer; the latter returned one project and 77 contacts.

The transfer removed the Git repository link. Reconnecting `itsanshugoyal/founder-crm` was rejected because the new Vercel account needs a GitHub Login Connection. A fresh manual production deployment (`dpl_6q4suS7DX6Xxmy5Hrguz5wqs1473`, source `dee0a7c`) was also **BLOCKED**, with Vercel reporting that the commit author lacks team deployment permission (`TEAM_ACCESS_REQUIRED`). The transferred existing release remains live at the canonical URL. Do not claim a new build succeeded or that Git pushes trigger deployments. The owner must connect the correct personal GitHub identity and reconnect the repository, then retry and verify a new deployment. Do not rewrite authors or strip Git attribution to evade the check.

On 27 October 2026, a new manual production deployment for commit `23014b1` succeeded: `dpl_7iFQjtcYLXWkWMu82nkCytzPX2bh`. Its production candidate is `founder-7y3rlol3f-delta-7460.vercel.app` and the canonical `founder-crm-rouge.vercel.app` alias now points to it. Live checks returned: root 200, health 200 with configured database/auth, anonymous session 200 with no workspace, and anonymous workspace 401. Git remains disconnected, so this success does **not** restore automatic deployment on pushes.

On 27 October 2026, the Daybook and workspace redesign at commit `bc758fb`
was manually deployed successfully as `dpl_6uvh5uvNRHih9M72ztCyPqDxv8Sh`.
Vercel assigned the canonical `founder-crm-rouge.vercel.app` alias to that
release. The public root and health endpoint returned 200; the anonymous
workspace endpoint returned 401. This verifies the deployment and basic
privacy boundary, not a signed-in user workflow or external provider setup.

The local project link now targets Delta. Its separate CLI login is stored only in the ignored `.local/vercel-deltaodcom` directory; commands for this project need both `--scope delta-7460` and `--global-config C:/code/founder-crm/.local/vercel-deltaodcom`. Do not print credential files or pass their contents as command arguments. Personal Git authors remain `itsanshugoyal`.

### Earlier setup (historical)

On 24 October 2026 the authenticated Vercel account exposes the **goldfish** team (`goldfish4`) on **Hobby**. The official Supabase product is available in Vercel Marketplace, but the team's Supabase installation list is empty. A Codex Vercel plugin is available and was offered; connection is not confirmed. The authenticated CLI is usable independently of that optional plugin.

The owner explicitly requested deployment on the existing free plan. The dedicated project is connected to the private GitHub repository and its production alias is https://founder-crm-rouge.vercel.app. No upgrade, payment, new database resource, integration authorization or billing transfer was performed. Vercel's Hobby terms still restrict commercial use; technical deployment does not establish plan eligibility.

The first build exposed an extensionless ESM import failure. Explicit runtime import extensions and a compiled Node adapter check were added. A later deployment was blocked because the work commit identity mapped to another GitHub account. With the owner's explicit authorization, the four initial commits were rewritten to the authenticated personal account, preserving their trees, and pushed using an exact force-with-lease. Existing local recovery history remains private. Vercel then accepted the corrected commit. Production response-body and authentication readiness checks are tracked in the release status.

## Prepared deployment

`vercel.json` selects Vite, builds `dist`, directs API/share routes to `api/index.ts`, and leaves the interface behind the CRM's verified identity/membership checks. `.vercelignore` excludes local databases, snapshots, environment files and vendored skill packages from deployment uploads; all skill packages remain in GitHub.

The Node API accepts both the integration's modern `SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY` names and managed legacy names. Secret keys stay server-side. The public key is returned only as required for Supabase Auth. No `VITE_*` secret is used. Set `APP_ORIGIN` to the exact production CRM origin and configure that origin in Supabase Auth's site/redirect settings. The first owner email is already allowlisted in private database state; signup alone does not grant membership.

An optional `CRM_EDGE_URL` forwards API requests to the existing Supabase function while removing host cookies and identity headers. Leave it unset when using the Vercel Node API with the official integration's synchronized server keys. Both paths enforce the same application permissions and manual-send rules.

Deployment configuration and remaining setup:

1. The dedicated Founder CRM project is now owned by `delta-7460`. Its GitHub connection requires the owner action described above. Git author identity must resolve to `itsanshugoyal`; Optmyzr identities must not be used in this repository.
2. The current deployment uses `CRM_EDGE_URL` and the existing managed-key Supabase function. An optional future Marketplace installation should use the **external existing-project connection** for Team Seven and restrict its project access. Do not create another database merely to synchronize settings. Review OAuth scopes privately.
3. Keep production connected to the intended existing database. Do not enable paid preview database branching or preview writes to production.
4. Configure the exact production origin and server environment. Deploy, test GET and POST routing, verify anonymous access rejection and complete the initial owner's private email verification.
5. Import/reconcile Airtable only after the owner/project exist. Freeze the old write path before cutover; do not run uncontrolled dual writes.

## Sources

- [Official Supabase integration: external connection versus native product installation](https://vercel.com/integrations/supabase)
- [Supabase Marketplace setup and billing boundaries](https://supabase.com/docs/guides/integrations/vercel-marketplace)
- [Vercel terms: Hobby is personal/non-commercial](https://vercel.com/legal/terms)
- [Hono on Vercel](https://hono.dev/docs/getting-started/vercel)

The Marketplace integration is not installed. A deployment marked Ready is not accepted as functional until its API bodies, authentication boundary and browser state are verified.

## Email confirmation redirects

In Team Seven's Authentication > URL Configuration, set Site URL to `https://founder-crm-rouge.vercel.app` and allow the exact redirect `https://founder-crm-rouge.vercel.app/`. Add the narrowly scoped invitation pattern `https://founder-crm-rouge.vercel.app/?invite=*` when using email-confirmed invitations. Do not allow every Vercel preview hostname. The production client builds return URLs from `CRM_APP_ORIGIN` in `src/shared/auth-redirect.ts`; only the invitation parameter is preserved, never fragments or arbitrary return destinations. Update that constant and the Auth settings together if the production domain changes.

A confirmation that reaches localhost can still have verified the email before redirecting. Check verified state before asking the owner to register again. Once verified, they should sign in at the Vercel URL using their existing password. A pasted confirmation callback contains credentials: do not open, log or reuse it; revoke the affected sessions and have the owner sign in privately.

## Mumbai Supabase cutover — 31 October 2026

The canonical CRM domain now uses Supabase project `lkjzebcnkhucuvzspbip` in South Asia (Mumbai). Production deployment `dpl_6TBAudrSSKdkynSj4ZQaxNWm7kcG` was promoted after a final source write freeze and full table readback at revision 183. Both Auth user rows and identity rows, one project, two members, 198 CRM records and 231 activities matched; old-project `crm_commit` writes remain disabled. The prior Supabase project is preserved for recovery, but restoring it requires reconciling any newer Mumbai writes before re-enabling writes.

Mumbai Auth Site URL and the exact CRM/invitation redirects were saved and observed in Supabase. A temporary synthetic user passed password authentication and was denied CRM access without membership, then was removed; this does not verify either founder's actual password. Live root/health/session and anonymous access checks passed, as did a project-scoped MCP read. Existing Auth sessions must be re-established because the project changed. No message was sent. The target database password was shared in chat and needs rotation.
