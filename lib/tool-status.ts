import { tools } from "@/lib/tools";
import { getDb, isMongoConfigured } from "@/lib/db";

export interface ToolStatus {
  toolId: string;
  isActive: boolean;
  maintenance: boolean;
  maxInputChars?: number;
  maxFileSizeMB?: number;
  timeoutMs?: number;
  usageCount: number;
  updatedAt: Date;
}

const COLLECTION = "tool_status";

function defaultStatus(toolId: string): ToolStatus {
  return {
    toolId,
    isActive: true,
    maintenance: false,
    usageCount: 0,
    updatedAt: new Date(),
  };
}

export interface ToolStatusSeedCollection {
  createIndex(keys: { toolId: 1 }, options: { unique: true }): Promise<unknown>;
  updateOne(filter: { toolId: string }, update: { $setOnInsert: ToolStatus }, options: { upsert: true }): Promise<unknown>;
  findOne(filter: { toolId: string }): Promise<unknown>;
}

/** Only defaults for absent IDs are inserted; existing configuration and usage stay intact. */
export async function seedToolStatusCollection(collection: ToolStatusSeedCollection, toolIds: readonly string[]) {
  // Establish uniqueness before any competing request can insert defaults.
  // Pre-existing duplicates intentionally fail here and require operator repair.
  await collection.createIndex({ toolId: 1 }, { unique: true });
  await Promise.all(toolIds.map(async (toolId) => {
    try {
      await collection.updateOne({ toolId }, { $setOnInsert: defaultStatus(toolId) }, { upsert: true });
    } catch (error) {
      const details = error && typeof error === "object" ? error as { code?: unknown; keyPattern?: unknown; keyValue?: unknown } : {};
      const pattern = details.keyPattern;
      const value = details.keyValue;
      const expectedIndex = pattern === undefined || (pattern !== null && typeof pattern === "object" && Object.keys(pattern).length === 1 && "toolId" in pattern);
      const expectedValue = value === undefined || (value !== null && typeof value === "object" && "toolId" in value && value.toolId === toolId);
      const duplicate = details.code === 11000 && expectedIndex && expectedValue;
      // MongoDB can reject a simultaneous upsert after the competing insert wins.
      // Suppress only that race after confirming the expected record now exists.
      if (!duplicate || !(await collection.findOne({ toolId }))) throw error;
    }
  }));
}

export async function ensureToolStatusesSeeded() {
  if (!isMongoConfigured()) return;
  const db = await getDb();
  await seedToolStatusCollection(db.collection<ToolStatus>(COLLECTION), tools.map((tool) => tool.id));
}

export async function getAllToolStatuses(): Promise<ToolStatus[]> {
  if (!isMongoConfigured()) {
    return tools.map((tool) => defaultStatus(tool.id));
  }

  await ensureToolStatusesSeeded();
  const db = await getDb();
  const docs = await db.collection<ToolStatus>(COLLECTION).find({}).toArray();
  const byId = new Map(docs.map((doc) => [doc.toolId, doc]));

  return tools.map((tool) => byId.get(tool.id) ?? defaultStatus(tool.id));
}

export async function getToolStatusMap(): Promise<
  Record<string, { isActive: boolean; maintenance: boolean; usageCount: number }>
> {
  const statuses = await getAllToolStatuses();
  return Object.fromEntries(
    statuses.map((status) => [
      status.toolId,
      { isActive: status.isActive, maintenance: status.maintenance ?? false, usageCount: status.usageCount },
    ]),
  );
}

export async function getToolStatus(toolId: string): Promise<ToolStatus | null> {
  if (!tools.some((tool) => tool.id === toolId)) {
    return null;
  }

  if (!isMongoConfigured()) {
    return defaultStatus(toolId);
  }

  await ensureToolStatusesSeeded();
  const db = await getDb();
  const doc = await db.collection<ToolStatus>(COLLECTION).findOne({ toolId });
  return doc ?? defaultStatus(toolId);
}

export type ToolConfigPatch = Partial<Pick<ToolStatus, "isActive" | "maintenance" | "maxInputChars" | "maxFileSizeMB" | "timeoutMs">>;

export function validateToolConfig(value: unknown): ToolConfigPatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Configuration must be an object");
  const data = value as Record<string, unknown>;
  const bounds: Record<string, [number, number]> = { maxInputChars: [1, 1000000], maxFileSizeMB: [1, 100], timeoutMs: [1000, 120000] };
  if (!Object.keys(data).length) throw new Error("Provide at least one setting");
  for (const [key, value] of Object.entries(data)) {
    if (key === "isActive" || key === "maintenance") {
      if (typeof value !== "boolean") throw new Error(`${key} must be a boolean`);
    } else if (bounds[key]) {
      const [min, max] = bounds[key];
      if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${key} must be an integer between ${min} and ${max}`);
    } else throw new Error(`Unsupported setting: ${key}`);
  }
  return data as ToolConfigPatch;
}

export async function setToolConfig(toolId: string, value: unknown) {
  const patch = validateToolConfig(value);
  if (!tools.some((tool) => tool.id === toolId)) throw new Error("Unknown tool");
  if (!isMongoConfigured()) throw new Error("MongoDB is not configured");
  await ensureToolStatusesSeeded();
  const db = await getDb();
  // Persist the audit intent before applying changes. Failed audit writes prevent mutation.
  await db.collection("tool_config_audit").insertOne({ toolId, actor: "admin", changes: patch, createdAt: new Date() });
  return db.collection<ToolStatus>(COLLECTION).findOneAndUpdate(
    { toolId }, { $set: { ...patch, updatedAt: new Date() } }, { returnDocument: "after" },
  );
}

export async function setToolActive(toolId: string, isActive: boolean) {
  return setToolConfig(toolId, { isActive });
}

export async function incrementToolUsage(toolId: string) {
  if (!tools.some((tool) => tool.id === toolId)) {
    throw new Error("Unknown tool");
  }

  if (!isMongoConfigured()) {
    return defaultStatus(toolId);
  }

  await ensureToolStatusesSeeded();
  const db = await getDb();
  const result = await db.collection<ToolStatus>(COLLECTION).findOneAndUpdate(
    { toolId },
    {
      $inc: { usageCount: 1 },
      $set: { updatedAt: new Date() },
      $setOnInsert: { isActive: true },
    },
    { upsert: true, returnDocument: "after" },
  );

  return result ?? defaultStatus(toolId);
}

export async function getActiveToolIds(): Promise<Set<string>> {
  const statuses = await getAllToolStatuses();
  return new Set(
    statuses.filter((status) => status.isActive && !status.maintenance).map((status) => status.toolId),
  );
}
