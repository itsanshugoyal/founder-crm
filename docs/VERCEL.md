# Vercel hosting and the existing Supabase project

Vercel is the requested frontend/API hosting target. Supabase project `thnqkgxpeyjholkbocnc` (Team Seven) is already created and has the CRM schema. Do not create a second Supabase project or transfer billing as an incidental integration step.

## Verified account and integration state

On 24 October 2026 the authenticated Vercel account exposes the **goldfish** team (`goldfish4`) on **Hobby**. The official Supabase product is available in Vercel Marketplace, but the team's Supabase installation list is empty. A Codex Vercel plugin is available and was offered; connection is not confirmed. The authenticated CLI is usable independently of that optional plugin.

The owner explicitly requested deployment on the existing free plan. The dedicated project is connected to the private GitHub repository and its production alias is https://founder-crm-rouge.vercel.app. No upgrade, payment, new database resource, integration authorization or billing transfer was performed. Vercel's Hobby terms still restrict commercial use; technical deployment does not establish plan eligibility.

The first build exposed an extensionless ESM import failure. Explicit runtime import extensions and a compiled Node adapter check were added. A later deployment was blocked because the work commit identity mapped to another GitHub account. With the owner's explicit authorization, the four initial commits were rewritten to the authenticated personal account, preserving their trees, and pushed using an exact force-with-lease. Existing local recovery history remains private. Vercel then accepted the corrected commit. Production response-body and authentication readiness checks are tracked in the release status.

## Prepared deployment

`vercel.json` selects Vite, builds `dist`, directs API/share routes to `api/index.ts`, and leaves the interface behind the CRM's verified identity/membership checks. `.vercelignore` excludes local databases, snapshots, environment files and vendored skill packages from deployment uploads; all skill packages remain in GitHub.

The Node API accepts both the integration's modern `SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY` names and managed legacy names. Secret keys stay server-side. The public key is returned only as required for Supabase Auth. No `VITE_*` secret is used. Set `APP_ORIGIN` to the exact production CRM origin and configure that origin in Supabase Auth's site/redirect settings. The first owner email is already allowlisted in private database state; signup alone does not grant membership.

An optional `CRM_EDGE_URL` forwards API requests to the existing Supabase function while removing host cookies and identity headers. Leave it unset when using the Vercel Node API with the official integration's synchronized server keys. Both paths enforce the same application permissions and manual-send rules.

Deployment configuration and remaining setup:

1. The dedicated Founder CRM project is linked to `goldfish4` and the GitHub repository. Git author identity must resolve to `itsanshugoyal`; Optmyzr identities must not be used in this repository.
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
