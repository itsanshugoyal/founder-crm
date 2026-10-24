const encoder = new TextEncoder();
export const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
export function randomToken() {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}
export async function digest(value: string) {
  return hex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
  );
}
export async function passwordHash(password: string, salt = randomToken()) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 310000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return { salt, hash: hex(new Uint8Array(bits)) };
}
export function constantEqual(a: string, b: string) {
  let delta = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    delta |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return delta === 0;
}
export async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
    ),
  );
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assert(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new HttpError(status, message);
}
export function cleanString(value: unknown, label: string, max = 500) {
  assert(
    typeof value === "string" && value.trim().length > 0 && value.length <= max,
    `${label} is required (maximum ${max} characters).`,
  );
  return value.trim();
}
export function emailAddress(value: unknown) {
  const email = cleanString(value, "Email", 254).toLowerCase();
  assert(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    "A valid email is required.",
  );
  return email;
}
