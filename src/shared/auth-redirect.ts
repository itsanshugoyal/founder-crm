/** The single production origin registered in Supabase Auth URL Configuration. */
export const CRM_APP_ORIGIN = "https://founder-crm-rouge.vercel.app";

export function verificationRedirectUrl(currentHref: string): string {
  const current = new URL(currentHref);
  const target = new URL("/", CRM_APP_ORIGIN);
  // Invitations must survive email confirmation. Never forward auth fragments,
  // arbitrary return URLs, or other page parameters into a verification link.
  const invite = current.searchParams.get("invite");
  if (invite) target.searchParams.set("invite", invite);
  return target.href;
}

export function verificationCallbackError(hash: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (!params.has("error") && !params.has("error_code")) return "";
  return params.get("error_code") === "otp_expired"
    ? "This verification link expired or was already used. If you already confirmed your email, sign in with your password."
    : "Email verification could not finish. Try signing in if your email is already confirmed, or use a fresh verification email.";
}
