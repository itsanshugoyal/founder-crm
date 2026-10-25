# Invitation account setup fix

25 October 2026. Read-only production diagnosis confirmed a pending Owner membership with no Supabase Auth user, verified email or password. Creating a CRM invitation does not create a login; the old invitation page incorrectly selected password sign-in first.

The join page now validates the private invitation, prefills its assigned name/email/role/project context and defaults to Create an account. The invitee privately chooses a password through Supabase Auth, verifies the email and returns to the preserved invitation link. A matching verified confirmation session can accept access without another password entry. Existing accounts retain a separate Sign in to accept option. Wrong-account and unverified sessions cannot accept. Owner role, project scope and one-use acceptance remain server enforced.

Invalid-credential guidance explains first-time setup without exposing account existence on the public sign-in form. Resending confirmation is an explicit human action. Invitation context uses a POST body and returns only a limited allowlist after validating the private capability.

64 tests and the compiled Node adapter check passed. Regressions cover signup before acceptance, verification waiting, confirmed-session continuation, existing-account sign-in, wrong/unverified identities, failure propagation, Owner-role preservation, metadata disclosure and used-token rejection. Auth is mocked; this is not proof that the invitee completed registration.

Browser checks use a read-only loopback fixture with no Auth credentials or mutations: default account creation, assigned email read-only, separate existing-account mode, correct password autofill and a 390px layout within the viewport. No real password was entered, account created, confirmation email triggered or invitation accepted by the agent.

Backend founder-crm version 7 is ACTIVE. A live invalid-invitation probe returns 403 with clear recovery guidance. Frontend release is pushed separately and checked for matching assets and anonymous access rejection. The invitee still needs to register and verify their own login through the original valid invitation link.

Frontend commit `b084a18` reached Vercel Ready as `dpl_9Pr6CfjfUNr5R5jArBHVuuKwdUXx`. Its served asset matched the local build. Live health and the scoped authenticated bootstrap passed; anonymous workspace access was rejected and anonymous session included no workspace. This does not claim that Nahush has completed his private signup/verification.
