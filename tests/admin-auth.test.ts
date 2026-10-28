import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
  createAdminSessionToken,
  isAdminAuthenticated,
  isAdminPasswordConfigured,
  isValidAdminSessionToken,
  verifyAdminPassword,
} from "../lib/admin-auth";

const PASSWORD = "test-admin-password";
const SECRET = "test-only-session-secret-at-least-32-characters";
const NOW = 1_800_000_000_000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function withConfig(
  password: string | undefined,
  secret: string | undefined,
  run: () => void,
) {
  const previousPassword = process.env.ADMIN_PASSWORD;
  const previousSecret = process.env.ADMIN_SESSION_SECRET;
  if (password === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = password;
  if (secret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = secret;
  try {
    run();
  } finally {
    if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousPassword;
    if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previousSecret;
  }
}

function signed(payload: string, secret = SECRET) {
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}

test("admin auth fails closed for absent, short, or reused credentials", () => {
  for (const [password, secret] of [
    [undefined, undefined],
    [PASSWORD, undefined],
    [undefined, SECRET],
    ["  ", SECRET],
    [PASSWORD, "  "],
    [PASSWORD, "x".repeat(31)],
    [SECRET, SECRET],
    [` ${SECRET} `, SECRET],
  ]) {
    withConfig(password, secret, () => {
      assert.equal(isAdminPasswordConfigured(), false);
      assert.equal(verifyAdminPassword(password ?? ""), false);
      assert.equal(isValidAdminSessionToken(signed(`admin:${NOW}`)), false);
      assert.throws(createAdminSessionToken, /not securely configured/);
    });
  }
});

test("previous development and password fallback signatures cannot authenticate", () => {
  for (const secret of [undefined, SECRET]) {
    withConfig(PASSWORD, secret, () => {
      for (const fallback of ["dev-insecure-secret", PASSWORD]) {
        assert.equal(
          isValidAdminSessionToken(signed(`admin:${Date.now()}`, fallback)),
          false,
        );
      }
    });
  }
});

test("password checks require complete configuration and exact string input", () => {
  withConfig(` ${PASSWORD} `, ` ${SECRET} `, () => {
    assert.equal(isAdminPasswordConfigured(), true);
    assert.equal(verifyAdminPassword(PASSWORD), true);
    for (const wrong of ["", "incorrect", ` ${PASSWORD}`, `${PASSWORD} `, "密码"]) {
      assert.equal(verifyAdminPassword(wrong), false);
    }
    assert.equal(verifyAdminPassword(123 as unknown as string), false);
    assert.equal(verifyAdminPassword(null as unknown as string), false);
  });
  withConfig(PASSWORD, "x".repeat(32), () => {
    assert.equal(isAdminPasswordConfigured(), true);
  });
});

test("valid tokens expire after seven days and cannot be issued in the future", (t) => {
  t.mock.method(Date, "now", () => NOW);
  withConfig(PASSWORD, SECRET, () => {
    assert.equal(isValidAdminSessionToken(createAdminSessionToken()), true);
    assert.equal(isValidAdminSessionToken(signed(`admin:${NOW - MAX_AGE_MS}`)), true);
    assert.equal(isValidAdminSessionToken(signed(`admin:${NOW - MAX_AGE_MS - 1}`)), false);
    assert.equal(isValidAdminSessionToken(signed(`admin:${NOW + 1}`)), false);
    assert.equal(isValidAdminSessionToken(signed("admin:0")), false);
  });
});

test("tampering, secret rotation, malformed signatures and extra segments are rejected", (t) => {
  t.mock.method(Date, "now", () => NOW);
  withConfig(PASSWORD, SECRET, () => {
    const token = createAdminSessionToken();
    const [payload, signature] = token.split(".");
    const changedSignature = `${signature[0] === "0" ? "1" : "0"}${signature.slice(1)}`;
    for (const invalid of [
      undefined, "", `${payload}.${changedSignature}`, `${payload}0.${signature}`,
      `${token}.extra`, `${token}.`, `${token}\n`, ` ${token}`, `${token} `,
      `${payload}.${signature.toUpperCase()}`, `${payload}.${signature.slice(1)}`,
      signed(payload, "a-different-session-secret-at-least-32-characters"),
      123 as unknown as string,
    ]) {
      assert.equal(isValidAdminSessionToken(invalid), false);
    }
  });
});

test("even correctly signed malformed or noncanonical payloads are rejected", (t) => {
  t.mock.method(Date, "now", () => NOW);
  withConfig(PASSWORD, SECRET, () => {
    for (const payload of [
      "admin:", "user:1800000000000", "admin:NaN", "admin:Infinity",
      "admin:1.8e12", "admin:+1800000000000", "admin:01800000000000",
      "admin:1800000000000.0", "admin: 1800000000000", "admin:1800000000000\n",
      "admin:-1800000000000", "admin:9007199254740992",
    ]) {
      assert.equal(isValidAdminSessionToken(signed(payload)), false);
    }
  });
});

test("unconfigured authentication returns false before accessing request cookies", async () => {
  let result: Promise<boolean> | undefined;
  withConfig(undefined, undefined, () => {
    result = isAdminAuthenticated();
  });
  assert.equal(await result, false);
});
