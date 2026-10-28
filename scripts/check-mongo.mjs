// Read-only Atlas connectivity diagnostic. Never prints credentials or raw driver errors.
import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI?.trim() || "";
if (!uri.startsWith("mongodb+srv://") || /[<>]/.test(uri)) {
  console.error("FAIL: configure a real Atlas MONGODB_URI in private environment settings.");
  process.exitCode = 1;
} else {
  let client;
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, appName: "quiet-workshop-check" });
    await client.connect();
    await client.db(process.env.MONGODB_DB?.trim() || "quiet-workshop").command({ ping: 1 }, { timeoutMS: 5000 });
    console.log("PASS: Atlas connectivity and ping. Writes, indexes and recovery require separate acceptance.");
  } catch {
    console.error("FAIL: Atlas unavailable. Check credentials, restricted network access and host SRV DNS.");
    process.exitCode = 1;
  } finally { await client?.close(); }
}
