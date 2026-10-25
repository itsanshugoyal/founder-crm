import test from "node:test";
import assert from "node:assert/strict";
import { joinProductionInvitation } from "../src/client/api";
import { authGuidance } from "../src/shared/auth-guidance";

const input = {
  token: "fixture-invitation-only",
  email: "  INVITED@example.test ",
  name: " New Teammate ",
  password: "fixture-only-private-passphrase",
  createAccount: true,
};

test("first-time invitees create their own login, wait for email verification and do not accidentally sign in or accept access", async () => {
  const calls: string[] = [];
  const result = await joinProductionInvitation(input, {
    identity: async () => null,
    signUp: async (email, password, name) => {
      assert.equal(email, "invited@example.test");
      assert.equal(name, "New Teammate");
      assert.equal(password, input.password);
      calls.push("signup");
      return false;
    },
    signIn: async () => {
      throw Error("Must not sign in a nonexistent account");
    },
    accept: async () => {
      throw Error("Must not accept before verification");
    },
  });
  assert.equal(result, "verification_required");
  assert.deepEqual(calls, ["signup"]);
});

test("a matching verified confirmation session accepts the invitation without asking for a password again", async () => {
  const calls: string[] = [];
  const result = await joinProductionInvitation(
    { ...input, password: "" },
    {
      identity: async () => ({ email: "invited@example.test", verified: true }),
      signUp: async () => {
        throw Error("Do not repeat signup");
      },
      signIn: async () => {
        throw Error("Do not require another password login");
      },
      accept: async (token, name) => {
        assert.equal(token, input.token);
        assert.equal(name, "New Teammate");
        calls.push("accept");
      },
    },
  );
  assert.equal(result, "accepted");
  assert.deepEqual(calls, ["accept"]);
});

test("existing accounts sign in only when the human chooses that path, and acceptance failures are not reported as success", async () => {
  const calls: string[] = [];
  await assert.rejects(
    joinProductionInvitation(
      { ...input, createAccount: false },
      {
        identity: async () => null,
        signUp: async () => {
          throw Error("No automatic signup fallback");
        },
        signIn: async () => {
          calls.push("signin");
        },
        accept: async () => {
          calls.push("accept");
          throw Error("Invitation expired");
        },
      },
    ),
    /Invitation expired/,
  );
  assert.deepEqual(calls, ["signin", "accept"]);
});

test("wrong-account and unverified sessions cannot advance invitation acceptance", async () => {
  for (const identity of [
    { email: "other@example.test", verified: true },
    { email: "invited@example.test", verified: false },
  ]) {
    const services = {
      identity: async () => identity,
      signUp: async () => {
        throw Error("No signup expected");
      },
      signIn: async () => {
        throw Error("No login expected");
      },
      accept: async () => {
        throw Error("No access should be accepted");
      },
    };
    if (identity.email.startsWith("other"))
      await assert.rejects(
        joinProductionInvitation(input, services),
        /Sign out/,
      );
    else
      assert.equal(
        await joinProductionInvitation(input, services),
        "verification_required",
      );
  }
});

test("invalid credential guidance explains first-time invitation setup without exposing whether an account exists", () => {
  const message = authGuidance(
    { code: "invalid_credentials", message: "Invalid login credentials" },
    true,
  );
  assert.match(message, /Create an account/);
  assert.match(message, /does not create a password/);
  assert.match(
    authGuidance({ code: "invalid_credentials" }, false),
    /open your invitation link/i,
  );
});
