import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import type { Collection } from "mongodb";
import { consumeDailyQuota, dailyQuotaLimit, type DailyQuota, enforceProviderQuota } from "../lib/server/provider-quota";

test("Atlas helper preserves DNS configuration and original SRV URI", async () => {
  execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e",
    "import dns from 'node:dns';import assert from 'node:assert/strict';const before=dns.getServers();await import('./lib/db.ts');assert.deepEqual(dns.getServers(),before);"], { cwd: process.cwd(), stdio: "pipe" });
  const { mongoConfiguration } = await import("../lib/db");
  const uri = "mongodb+srv://name:encoded%40secret@cluster.example.net/mydb?retryWrites=true&w=majority";
  assert.equal(mongoConfiguration({ MONGODB_URI: uri })?.uri, uri);
  assert.equal(mongoConfiguration({ MONGODB_URI: "mongodb+srv://<username>:<password>@cluster.test" }), null);
  assert.equal(mongoConfiguration({ MONGODB_URI: "https://example.com" }), null);
});

test("shared daily quota enforces one atomic cap across callers and resets at UTC boundary", async () => {
  const rows = new Map<string, DailyQuota>();
  const store = { async findOneAndUpdate(filter: { _id: string; count: { $lt: number } }, update: { $inc: { count: number }; $setOnInsert: { expiresAt: Date } }, options: Record<string, unknown>) {
    assert.equal(options.upsert, true); assert.equal(options.timeoutMS, 5000);
    assert.deepEqual(options.writeConcern, { w: "majority" });
    assert.equal(update.$inc.count, 1);
    const row = rows.get(filter._id);
    if (row && row.count >= filter.count.$lt) throw { code: 11000 };
    const next = { _id: filter._id, count: (row?.count || 0) + 1, expiresAt: update.$setOnInsert.expiresAt };
    rows.set(filter._id, next); return next;
  } } as unknown as Pick<Collection<DailyQuota>, "findOneAndUpdate">;
  const decisions = await Promise.all(Array.from({ length: 60 }, () => consumeDailyQuota(store, "ai", 7, 1000)));
  assert.equal(decisions.filter(Boolean).length, 7);
  assert.equal(await consumeDailyQuota(store, "ai", 7, 86400000), true);
  assert.equal(await consumeDailyQuota(store, "plagiarism", 1, 1000), true);
  assert.equal(await consumeDailyQuota(store, "plagiarism", 1, 2000), false);
  assert.equal(rows.size, 3);
  assert.equal(rows.values().next().value?.expiresAt.getTime(), 172800000);
});

test("quota outages propagate instead of granting unaccounted provider requests", async () => {
  const store = { async findOneAndUpdate() { throw new Error("database unavailable"); } } as unknown as Pick<Collection<DailyQuota>, "findOneAndUpdate">;
  await assert.rejects(consumeDailyQuota(store, "ai", 5), /database unavailable/);
  for (const value of ["0", "-1", "NaN", "1.5", "100001"]) assert.throws(() => dailyQuotaLimit(value, 50));
  assert.equal(dailyQuotaLimit(undefined, 50), 50);
});

test("production provider gate fails closed without shared Atlas configuration", async () => {
  const previous = { NODE_ENV: process.env.NODE_ENV, MONGODB_URI: process.env.MONGODB_URI };
  try {
    Object.assign(process.env, { NODE_ENV: "production", MONGODB_URI: "" });
    const response = await enforceProviderQuota("ai");
    assert.equal(response?.status, 503);
    assert.equal(response?.headers.get("cache-control"), "no-store");
  } finally {
    for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
});
