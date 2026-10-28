// Read-only local HTTP authentication acceptance. Secrets and cookies are never recorded.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
if (process.env.MONGODB_URI?.trim() && !/[<>]/.test(process.env.MONGODB_URI)) throw new Error("This local authentication check requires Atlas to be unconfigured; use staging persistence acceptance for a real database.");
const base = new URL(process.env.LOCAL_CHECK_BASE_URL || "http://127.0.0.1:3100");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname) || !["http:", "https:"].includes(base.protocol) || base.username || base.password) throw new Error("Local verification requires a loopback origin");
const origin = base.origin;
const results = [];
const request = (path, init = {}) => fetch(origin + path, { ...init, redirect: "error", signal: AbortSignal.timeout(15000) });
const check = async (name, operation) => { try { await operation(); results.push({ name, status: "PASS" }); } catch { results.push({ name, status: "FAIL", error: "Local authentication assertion failed; no credentials or cookies recorded" }); } };
let cookie = "";
await check("configured login rejects incorrect password", async () => {
 const response = await request("/api/admin/login", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ password: "incorrect-fixture-password" }) }); assert.equal(response.status, 401);
});
await check("configured login issues signed production cookie with security attributes", async () => {
 assert.ok(process.env.ADMIN_PASSWORD);
 const response = await request("/api/admin/login", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }) });
 assert.equal(response.status, 200); const value = response.headers.get("set-cookie") || "";
 for (const attribute of [/HttpOnly/i, /Secure/i, /SameSite=Lax/i, /Max-Age=604800/i]) assert.ok(attribute.test(value), "missing production cookie attribute");
 cookie = value.split(";")[0]; assert.ok(cookie.startsWith("qw_admin_session="));
});
await check("real cookie authenticates admin read without fabricating persistence", async () => {
 const response = await request("/api/admin/tools", { headers: { Cookie: cookie } }); assert.equal(response.status, 200);
 const body = await response.json(); assert.equal(body.tools.length, 137); assert.equal(body.mongoConfigured, false);
});
await check("tampered real cookie is rejected", async () => {
 const tampered = cookie.slice(0, -1) + (cookie.endsWith("a") ? "b" : "a");
 assert.equal((await request("/api/admin/tools", { headers: { Cookie: tampered } })).status, 401);
});
await check("logout clears browser session cookie", async () => {
 const response = await request("/api/admin/logout", { method: "POST", headers: { Origin: origin, Cookie: cookie } });
 assert.equal(response.status, 200); assert.match(response.headers.get("set-cookie") || "", /qw_admin_session=;/);
});
await writeFile("docs/local-admin-live-results.json", JSON.stringify({ checkedAt: new Date().toISOString(), scope: "Actual loopback production HTTP server and newly configured private admin credentials; no Atlas writes. Persistence is explicitly unconfigured. Stateless signed-token revocation after logout is not claimed.", results }, null, 2) + "\n");
console.log(results);
if (results.some(result => result.status !== "PASS")) process.exitCode = 1;
