import { MongoClient, type Db } from "mongodb";

export function mongoConfiguration(env: Record<string, string | undefined> = process.env) {
  const uri = env.MONGODB_URI?.trim() || "";
  if (!uri || /[<>]/.test(uri) || !/^mongodb(?:\+srv)?:\/\//.test(uri)) return null;
  if (/^mongodb:\/\/(?:127\.0\.0\.1|localhost):27017\/?$/.test(uri)) return null;
  return { uri, database: env.MONGODB_DB?.trim() || "quiet-workshop" };
}
const cache = globalThis as typeof globalThis & { _workshopMongo?: { uri: string; promise: Promise<MongoClient> } };
export function isMongoConfigured() { return Boolean(mongoConfiguration()); }

export async function getDb(): Promise<Db> {
  const config = mongoConfiguration();
  if (!config) throw new Error("MongoDB is not configured");
  if (!cache._workshopMongo || cache._workshopMongo.uri !== config.uri) {
    const previous = cache._workshopMongo;
    // Preserve SRV/TXT discovery, TLS defaults and host validation in the driver.
    // Never mutate process-wide DNS or rewrite Atlas host lists manually.
    let client: MongoClient;
    try { client = new MongoClient(config.uri, {
      maxPoolSize: 10, minPoolSize: 0, maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000,
      waitQueueTimeoutMS: 5000, appName: "quiet-workshop",
    }); } catch { throw new Error("MongoDB configuration is invalid"); }
    const entry = { uri: config.uri, promise: client.connect() };
    cache._workshopMongo = entry;
    if (previous) void previous.promise.then(old => old.close()).catch(() => {});
    entry.promise = entry.promise.catch(async () => {
      if (cache._workshopMongo === entry) cache._workshopMongo = undefined;
      await client.close().catch(() => {});
      throw new Error("MongoDB connection unavailable. Check Atlas credentials, network access and host DNS.");
    });
  }
  return (await cache._workshopMongo.promise).db(config.database);
}
