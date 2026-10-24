# Owner verification and quick review — 24 October 2026

The emailed confirmation returned to localhost. The owner's screenshot confirms that Supabase Site URL was still `http://localhost:3000` and Redirect URLs was empty. This must be corrected in Team Seven's Auth URL Configuration; changing application code alone cannot update that service setting.

The production client now constructs verification return URLs from the exact Vercel CRM origin. It preserves only a required invitation parameter and strips authentication fragments, arbitrary redirect parameters and unrelated paths. Expired or failed verification callbacks show safe recovery guidance without echoing provider details. Verified owners should sign in using their existing password rather than registering again.

Database checks confirmed that the configured owner's email is verified and a CRM owner/project exists. Two existing owner sessions were revoked after a credential-bearing callback was pasted into chat; the affected refresh tokens were removed through the sessions' existing foreign-key cascade. The confirmed user and CRM data were preserved. No pasted token was opened, decoded, stored or reused. New sign-in is required after revocation. Raw access JWTs can remain valid for stateless consumers until expiry; the CRM calls Supabase `getUser` to validate production identities.

## Verification

- Production build and strict typecheck passed.
- All 52 tests passed when rerun with explicit garbage collection between tests. The initial ordinary suite failed during PGlite/WASM allocation on a Windows machine with low available commit memory; it was not recorded as green. `npm run test:low-memory` provides the same full suite with fixture collection, without skipping cases.
- The compiled Node hosting adapter check passed independently.
- Live root, health and session endpoints returned 200. Health reported configured database/Auth. Owner creation is now unavailable because the owner exists. Anonymous workspace access returned 401.
- The review did not perform outreach, activate providers, modify Airtable, import leads or test financial transactions. Provider tests remain mocked.
- The connected browser initially exposed signed-out Supabase pages even while the owner showed a signed-in settings screenshot. Until fields are saved and read back, Auth URL Configuration must not be reported as fixed.

## Configuration

Site URL: `https://founder-crm-rouge.vercel.app`

Allowed redirect: `https://founder-crm-rouge.vercel.app/`

For invited members, also allow the narrowly scoped `https://founder-crm-rouge.vercel.app/?invite=*` pattern. No broad preview-host wildcard is needed.

References: [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls), [session behavior](https://supabase.com/docs/guides/auth/sessions), [server-side identity validation](https://supabase.com/docs/guides/auth/server-side/advanced-guide).
