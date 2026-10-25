/** Provider failures must explain recovery without disclosing account existence. */
export function authGuidance(error: unknown, invitation: boolean): string {
  const candidate = error as { code?: string; message?: string };
  if (
    candidate?.code === "invalid_credentials" ||
    /invalid login credentials|invalid credentials/i.test(
      candidate?.message || "",
    )
  )
    return invitation
      ? "That email and password could not sign in. If this is your first visit, choose Create an account; an invitation does not create a password. If you already registered, use the password you created."
      : "That email and password could not sign in. If you were invited and have not registered yet, open your invitation link and choose Create an account first.";
  if (candidate?.code === "email_not_confirmed")
    return "Verify your email before signing in. Open the confirmation email, then return to your invitation link. You can request another confirmation here.";
  if (candidate?.code === "user_already_exists")
    return "An account may already exist for this address. Choose Sign in to accept and use your existing password.";
  return (
    candidate?.message ||
    "Could not continue. Check your connection and try again."
  );
}
