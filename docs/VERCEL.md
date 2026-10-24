# Vercel hosting and the existing Supabase project

Vercel is the requested frontend/API hosting target. Supabase project `thnqkgxpeyjholkbocnc` (Team Seven) is already created and has the CRM schema. Do not create a second Supabase project or transfer billing as an incidental integration step.

## Verified account and integration state

On 24 October 2026 the authenticated Vercel account exposes the **goldfish** team (`goldfish4`) on **Hobby**. The official Supabase product is available in Vercel Marketplace, but the team's Supabase installation list is empty. A Codex Vercel plugin is available and was offered; connection is not confirmed. The authenticated CLI is usable independently of that optional plugin.

Vercel restricts Hobby to personal/non-commercial use. This CRM supports a business, so commercial deployment is held pending an eligible existing team or an owner-managed plan upgrade. No upgrade, payment, new database resource, integration authorization or billing transfer was performed.

## Prepared deployment

`vercel.json` selects Vite, builds `dist`, directs API/share routes to `api/index.ts`, and leaves the interface behind the CRM's verified identity/membership checks. `.vercelignore` excludes local databases, snapshots, environment files and vendored skill packages from deployment uploads; all skill packages remain in GitHub.

The Node API accepts both the integration's modern `SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY` names and managed legacy names. Secret keys stay server-side. The public key is returned only as required for Supabase Auth. No `VITE_*` secret is used. Set `APP_ORIGIN` to the exact production CRM origin and configure that origin in Supabase Auth's site/redirect settings. The first owner email is already allowlisted in private database state; signup alone does not grant membership.

An optional `CRM_EDGE_URL` forwards API requests to the existing Supabase function while removing host cookies and identity headers. Leave it unset when using the Vercel Node API with the official integration's synchronized server keys. Both paths enforce the same application permissions and manual-send rules.

After the correct Vercel team is selected:

1. Link/create a dedicated Founder CRM project from this repository.
2. Use the Supabase **external existing-project connection** for Team Seven and restrict its project access. Do not choose the native product-creation path merely to synchronize settings. Review OAuth scopes privately.
3. Keep production connected to the intended existing database. Do not enable paid preview database branching or preview writes to production.
4. Configure the exact production origin and server environment. Deploy, test GET and POST routing, verify anonymous access rejection and complete the initial owner's private email verification.
5. Import/reconcile Airtable only after the owner/project exist. Freeze the old write path before cutover; do not run uncontrolled dual writes.

## Sources

- [Official Supabase integration: external connection versus native product installation](https://vercel.com/integrations/supabase)
- [Supabase Marketplace setup and billing boundaries](https://supabase.com/docs/guides/integrations/vercel-marketplace)
- [Vercel terms: Hobby is personal/non-commercial](https://vercel.com/legal/terms)
- [Hono on Vercel](https://hono.dev/docs/getting-started/vercel)

No Vercel production deployment or live integration connection is claimed until the account/plan requirement is resolved and those checks pass.
