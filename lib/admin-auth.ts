import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "qw_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getAdminConfig() {
  const password = process.env.ADMIN_PASSWORD?.trim();
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!password || !secret || secret.length < 32 || secret === password) {
    return null;
  }
  return { password, secret };
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isAdminPasswordConfigured() {
  return getAdminConfig() !== null;
}

export function verifyAdminPassword(password: string) {
  const config = getAdminConfig();
  if (!config || typeof password !== "string") return false;
  return safeEqual(password, config.password);
}

export function createAdminSessionToken() {
  const config = getAdminConfig();
  if (!config) throw new Error("Admin authentication is not securely configured");
  const payload = `admin:${Date.now()}`;
  return `${payload}.${sign(payload, config.secret)}`;
}

export function isValidAdminSessionToken(token: string | undefined) {
  const config = getAdminConfig();
  if (!config || typeof token !== "string") return false;
  const match = /^admin:(0|[1-9]\d{0,15})\.([a-f0-9]{64})$/.exec(token);
  if (!match || match[0] !== token) return false;

  const issuedAt = Number(match[1]);
  if (!Number.isSafeInteger(issuedAt)) return false;
  const expected = sign(`admin:${match[1]}`, config.secret);
  if (!safeEqual(match[2], expected)) return false;

  const ageMs = Date.now() - issuedAt;
  return ageMs >= 0 && ageMs <= MAX_AGE_SECONDS * 1000;
}

export async function setAdminSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  if (!getAdminConfig()) return false;
  const store = await cookies();
  return isValidAdminSessionToken(store.get(COOKIE_NAME)?.value);
}

export { COOKIE_NAME };
