import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST } from "../app/api/ai/route";

test("valid AI inputs cannot trigger provider work from a foreign or missing origin", async () => {
  for (const origin of [undefined, "https://foreign.example"]) {
    const request = new NextRequest("https://app.example/api/ai", { method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify({ task: "write", prompt: "Valid request" }) });
    const response = await POST(request);
    assert.equal(response.status, 403);
  }
});
