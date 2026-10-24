import test from "node:test";
import assert from "node:assert/strict";
import {
  verificationRedirectUrl,
  verificationCallbackError,
  CRM_APP_ORIGIN,
} from "../src/shared/auth-redirect";

test("verification returns to the canonical CRM and never copies authentication fragments or arbitrary redirects", () => {
  for (const source of [
    "https://old-host.example.invalid/dashboard?next=https://other.example.invalid#access_token=synthetic-fixture&refresh_token=synthetic-fixture",
    "http://localhost:3000/#access_token=synthetic-fixture",
    CRM_APP_ORIGIN + "/dashboard?view=tasks",
  ])
    assert.equal(verificationRedirectUrl(source), CRM_APP_ORIGIN + "/");
  const invited = new URL(
    verificationRedirectUrl(
      "https://old-host.example.invalid/?invite=fixture-invitation&next=untrusted#refresh_token=synthetic-fixture",
    ),
  );
  assert.equal(invited.origin, CRM_APP_ORIGIN);
  assert.deepEqual(
    [...invited.searchParams],
    [["invite", "fixture-invitation"]],
  );
  assert.equal(invited.hash, "");
});

test("verification errors give recovery guidance without echoing provider details or credentials", () => {
  assert.match(
    verificationCallbackError(
      "#error=access_denied&error_code=otp_expired&error_description=private-fixture-detail",
    ),
    /already used/,
  );
  const message = verificationCallbackError(
    "#error=access_denied&error_description=private-fixture-detail&refresh_token=synthetic-fixture",
  );
  assert(message.includes("signing in"));
  assert(!message.includes("private-fixture-detail"));
  assert(!message.includes("synthetic-fixture"));
  assert.equal(
    verificationCallbackError("#access_token=synthetic-fixture"),
    "",
  );
});
