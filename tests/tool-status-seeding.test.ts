import test from "node:test";
import assert from "node:assert/strict";
import { seedToolStatusCollection, type ToolStatus, type ToolStatusSeedCollection } from "../lib/tool-status";

test("concurrent seeds establish uniqueness before atomic insertion and preserve live mutations", async () => {
  const existing: ToolStatus = { toolId: "configured", isActive: false, maintenance: true, usageCount: 41, maxInputChars: 123, timeoutMs: 4000, updatedAt: new Date(0) };
  const documents = new Map([[existing.toolId, existing]]);
  let indexed = false;
  let inserts = 0;
  let duplicateRaces = 0;
  const collection: ToolStatusSeedCollection = {
    async createIndex(keys, options) { assert.deepEqual(keys, { toolId: 1 }); assert.equal(options.unique, true); indexed = true; },
    async updateOne(filter, update, options) {
      assert.equal(indexed, true); assert.equal(options.upsert, true);
      assert.deepEqual(Object.keys(update), ["$setOnInsert"]);
      if (documents.has(filter.toolId)) return;
      // Both seeds observe the absent ID before one wins its atomic insert.
      await Promise.resolve();
      if (documents.has(filter.toolId)) { duplicateRaces++; throw { code: 11000 }; }
      documents.set(filter.toolId, { ...update.$setOnInsert }); inserts++;
    },
    async findOne(filter) { return documents.get(filter.toolId) ?? null; },
  };
  await Promise.all([
    seedToolStatusCollection(collection, ["configured", "new-tool"]),
    seedToolStatusCollection(collection, ["configured", "new-tool"]),
  ]);
  assert.equal(inserts, 1); assert.equal(duplicateRaces, 1); assert.equal(documents.size, 2);
  assert.deepEqual(documents.get("configured"), existing);
  documents.get("new-tool")!.usageCount = 9;
  documents.get("new-tool")!.maintenance = true;
  await seedToolStatusCollection(collection, ["configured", "new-tool"]);
  assert.equal(documents.get("new-tool")!.usageCount, 9);
  assert.equal(documents.get("new-tool")!.maintenance, true);
});

test("index failures prevent all writes and unexpected upsert failures propagate", async () => {
  let writes = 0;
  const indexError = new Error("Existing duplicate IDs");
  const collection: ToolStatusSeedCollection = {
    async createIndex() { throw indexError; },
    async updateOne() { writes++; },
    async findOne() { return null; },
  };
  await assert.rejects(seedToolStatusCollection(collection, ["one"]), (error) => error === indexError);
  assert.equal(writes, 0);
  collection.createIndex = async () => {};
  for (const error of [new Error("Write failed"), { code: 11000 }]) {
    collection.updateOne = async () => { throw error; };
    await assert.rejects(seedToolStatusCollection(collection, ["one"]), (actual) => actual === error);
  }
  collection.findOne = async () => ({ toolId: "one" });
  for (const error of [{ code: 11000, keyPattern: { unrelated: 1 } }, { code: 11000, keyValue: { toolId: "different" } }]) {
    collection.updateOne = async () => { throw error; };
    await assert.rejects(seedToolStatusCollection(collection, ["one"]), (actual) => actual === error);
  }
  const connectionError = new Error("Connection failed");
  collection.updateOne = async () => { throw connectionError; };
  await assert.rejects(seedToolStatusCollection(collection, ["one"]), (error) => error === connectionError);
});
