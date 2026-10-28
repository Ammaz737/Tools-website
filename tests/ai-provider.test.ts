import test from "node:test";
import assert from "node:assert/strict";
import { processAiTask } from "../lib/server/ai";

const environmentKeys = ["AI_PROVIDER", "OPENAI_API_KEY", "OPENAI_MODEL", "GEMINI_API_KEY", "GEMINI_MODEL", "OLLAMA_BASE_URL", "OLLAMA_MODEL"] as const;

test("AI providers enforce safe failures, credentials, bounds and valid scores", async (t) => {
  const saved = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const originalError = console.error;
  const logs: unknown[][] = [];
  console.warn = (...args) => { logs.push(args); };
  console.error = (...args) => { logs.push(args); };
  const reset = () => { for (const key of environmentKeys) delete process.env[key]; };
  const reply = (text: string, extra = {}) => new Response(JSON.stringify({ choices: [{ message: { content: text } }], ...extra }));
  try {
    await t.test("missing configuration never fetches", async () => {
      reset(); globalThis.fetch = async () => { throw new Error("unexpected fetch"); };
      assert.equal((await processAiTask({ task: "write", prompt: "Topic" })).errorCode, "NOT_CONFIGURED");
    });
    await t.test("invalid keys and secret-bearing thrown errors are sanitized without logs", async () => {
      reset(); process.env.AI_PROVIDER = "openai"; process.env.OPENAI_API_KEY = "private-test-key";
      for (const fail of [async () => new Response("private-test-key", { status: 401 }), async () => { throw new Error("private-test-key"); }]) {
        globalThis.fetch = fail;
        const result = await processAiTask({ task: "write", prompt: "Topic" });
        assert.equal(result.errorCode, "PROVIDER_UNAVAILABLE");
        assert.ok(!JSON.stringify(result).includes("private-test-key"));
      }
      assert.deepEqual(logs, []);
    });
    await t.test("Gemini puts credentials in header and encodes model path", async () => {
      reset(); process.env.AI_PROVIDER = "gemini"; process.env.GEMINI_API_KEY = "private-test-key"; process.env.GEMINI_MODEL = "custom/model?extra=x";
      globalThis.fetch = async (input, init) => {
        const url = new URL(String(input));
        assert.equal(url.search, ""); assert.ok(!String(input).includes("private-test-key"));
        assert.ok(url.pathname.includes("custom%2Fmodel%3Fextra%3Dx"));
        assert.equal(new Headers(init?.headers).get("x-goog-api-key"), "private-test-key");
        assert.equal(init?.redirect, "error");
        assert.equal(JSON.parse(String(init?.body)).generationConfig.maxOutputTokens, 2048);
        return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Generated" }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 3, totalTokenCount: 13 } }));
      };
      const result = await processAiTask({ task: "write", prompt: "Topic" });
      assert.equal(result.result, "Generated"); assert.deepEqual(result.usage, { inputTokens: 10, outputTokens: 3, totalTokens: 13 });
    });
    await t.test("null, empty, boolean and absent detector scores never become zero", async () => {
      reset(); process.env.OPENAI_API_KEY = "test";
      for (const score of [null, "", false, undefined, "42", -1, 101]) {
        globalThis.fetch = async () => reply(JSON.stringify({ score, analysis: "Test" }));
        const result = await processAiTask({ task: "detect", prompt: "Text" });
        assert.equal(result.errorCode, "INVALID_RESPONSE"); assert.equal(result.score, undefined);
      }
      globalThis.fetch = async (_input, init) => {
        assert.equal(init?.redirect, "error"); assert.equal(JSON.parse(String(init?.body)).max_completion_tokens, 2048);
        return reply(JSON.stringify({ score: 42, analysis: "Patterns" }), { usage: { prompt_tokens: 8, completion_tokens: 2, total_tokens: 10 } });
      };
      const valid = await processAiTask({ task: "detect", prompt: "Text" });
      assert.equal(valid.score, 42); assert.equal(valid.result, "Patterns"); assert.equal(valid.usage?.totalTokens, 10);
    });
    await t.test("oversized and malformed provider responses fail safely", async () => {
      reset(); process.env.OPENAI_API_KEY = "test";
      for (const response of [new Response("x".repeat(1024 * 1024 + 1)), new Response("not json"), reply(" ")]) {
        globalThis.fetch = async () => response;
        assert.equal((await processAiTask({ task: "write", prompt: "Topic" })).errorCode, "INVALID_RESPONSE");
      }
    });
    await t.test("deadline covers fetch and stalled response body", async () => {
      reset(); process.env.OPENAI_API_KEY = "test";
      let signal: AbortSignal | null | undefined;
      globalThis.fetch = async (_input, init) => { signal = init?.signal; return new Promise<Response>(() => {}); };
      assert.equal((await processAiTask({ task: "write", prompt: "Topic", timeoutMs: 5 })).errorCode, "PROVIDER_UNAVAILABLE");
      assert.equal(signal?.aborted, true);
      let cancelled = false;
      globalThis.fetch = async () => new Response(new ReadableStream({ cancel() { cancelled = true; } }));
      assert.equal((await processAiTask({ task: "write", prompt: "Topic", timeoutMs: 5 })).errorCode, "PROVIDER_UNAVAILABLE");
      assert.equal(cancelled, true);
    });
    await t.test("Ollama requests bounded non-streaming output", async () => {
      reset(); process.env.AI_PROVIDER = "ollama";
      globalThis.fetch = async (_input, init) => {
        const body = JSON.parse(String(init?.body)); assert.equal(body.stream, false); assert.equal(body.options.num_predict, 2048);
        return new Response(JSON.stringify({ message: { content: "Local result" }, prompt_eval_count: 4, eval_count: 2 }));
      };
      const result = await processAiTask({ task: "write", prompt: "Topic" });
      assert.equal(result.result, "Local result"); assert.equal(result.usage?.inputTokens, 4); assert.equal(result.usage?.totalTokens, undefined);
    });
  } finally {
    reset(); for (const key of environmentKeys) if (saved[key] !== undefined) process.env[key] = saved[key];
    globalThis.fetch = originalFetch; console.warn = originalWarn; console.error = originalError;
  }
});
