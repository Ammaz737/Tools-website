import { createHash } from "node:crypto";
import type { Collection } from "mongodb";
import { getDb, isMongoConfigured } from "../db";
export interface DailyQuota { _id: string; count: number; expiresAt: Date }
export function dailyQuotaLimit(value: string | undefined, fallback: number) {
  if (!value?.trim()) return fallback;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > 100000) throw new Error("Invalid provider quota configuration");
  return number;
}
// One atomic conditional upsert: the unique _id prevents two instances from
// creating independent counters. A duplicate key on an exhausted bucket denies.
export async function consumeDailyQuota(collection: Pick<Collection<DailyQuota>, "findOneAndUpdate">, scope: string, limit: number, now = Date.now()) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100000 || !/^[a-z-]{1,40}$/.test(scope)) throw new Error("Invalid quota");
  const day = Math.floor(now / 86400000);
  const id = createHash("sha256").update(`${scope}:${day}`).digest("hex");
  try {
    const result = await collection.findOneAndUpdate(
      { _id: id, count: { $lt: limit } },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((day + 2) * 86400000) } },
      { upsert: true, returnDocument: "after", timeoutMS: 5000, writeConcern: { w: "majority" } },
    );
    return Boolean(result && result.count <= limit);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return false;
    throw error;
  }
}
let indexReady: Promise<unknown> | undefined;
export async function enforceProviderQuota(scope: "ai" | "plagiarism") {
  const deny = (error: string, status: number, retry?: string) => Response.json({ success: false, error }, { status, headers: { "Cache-Control": "no-store", ...(retry ? { "Retry-After": retry } : {}) } });
  try {
    if (!isMongoConfigured()) {
      // Local contract tests can run without a database. Production paid calls
      // must have shared accounting; never fall back to an in-memory allowance.
      return process.env.NODE_ENV === "production" ? deny("Shared provider quota is unavailable", 503) : null;
    }
    const database = await getDb();
    const collection = database.collection<DailyQuota>("provider_daily_quotas");
    if (!indexReady) indexReady = collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, timeoutMS: 5000 }).catch(error => { indexReady = undefined; throw error; });
    await indexReady;
    const limit = scope === "ai" ? dailyQuotaLimit(process.env.AI_DAILY_REQUEST_LIMIT, 500) : dailyQuotaLimit(process.env.PLAGIARISM_DAILY_REQUEST_LIMIT, 50);
    if (await consumeDailyQuota(collection, scope, limit)) return null;
    return deny("Daily service limit reached. Please try again tomorrow.", 429, String(Math.max(1, Math.ceil((86400000 - Date.now() % 86400000) / 1000))));
  } catch { return deny("Shared provider quota is temporarily unavailable", 503); }
}
