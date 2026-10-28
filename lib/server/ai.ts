export const allowedAiTasks = ["write", "email", "summarize", "paraphrase", "rewrite", "humanize", "grammar", "translate", "detect", "plagiarism"] as const;
export type AiTaskType = (typeof allowedAiTasks)[number];

export interface AiTaskRequest {
  task: AiTaskType;
  timeoutMs?: number;
  prompt: string;
  targetLanguage?: string;
  tone?: string;
  length?: string;
}

export interface AiTaskResponse {
  success: boolean;
  result?: string;
  score?: number;
  providerUsed?: string;
  modelUsed?: string;
  details?: Record<string, unknown>;
  mode: "api" | "local_fallback";
  error?: string;
  errorCode?: "NOT_CONFIGURED" | "PROVIDER_UNAVAILABLE" | "INVALID_RESPONSE";
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

const MAX_RESPONSE_BYTES = 1024 * 1024;

function failure(errorCode: NonNullable<AiTaskResponse["errorCode"]>): AiTaskResponse {
  const errors = {
    NOT_CONFIGURED: "This tool needs a configured AI provider.",
    PROVIDER_UNAVAILABLE: "The AI provider is temporarily unavailable. Try again later.",
    INVALID_RESPONSE: "The AI provider returned an invalid response. Try again later.",
  };
  return { success: false, mode: errorCode === "NOT_CONFIGURED" ? "local_fallback" : "api", errorCode, error: errors[errorCode] };
}

async function readProviderResponse(response: Response, signal: AbortSignal): Promise<Record<string, unknown>> {
  if (!response.body) throw new Error("Invalid response");
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) throw new Error("Response too large");
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid response");
    return parsed as Record<string, unknown>;
  } finally {
    signal.removeEventListener("abort", cancel);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function first(value: unknown): unknown { return Array.isArray(value) ? value[0] : undefined; }
function tokens(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

export async function processAiTask(req: AiTaskRequest): Promise<AiTaskResponse> {
  if (req.task === "plagiarism") return { ...failure("NOT_CONFIGURED"), error: "Web plagiarism checking needs a dedicated search/similarity API. An LLM cannot verify originality against the web." };
  const configured = (process.env.AI_PROVIDER || "auto").toLowerCase();
  const provider = configured === "auto"
    ? process.env.OPENAI_API_KEY?.trim() ? "openai" : process.env.OLLAMA_BASE_URL?.trim() && process.env.OLLAMA_MODEL?.trim() ? "ollama" : process.env.GEMINI_API_KEY?.trim() ? "gemini" : ""
    : configured;
  const instruction = getTaskInstruction(req);
  const messages = [{ role: "system", content: instruction }, { role: "user", content: req.prompt }];
  let url: string;
  let model: string;
  let providerUsed: string;
  let body: Record<string, unknown>;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (provider === "openai" && process.env.OPENAI_API_KEY?.trim()) {
    url = "https://api.openai.com/v1/chat/completions";
    model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    providerUsed = "OpenAI";
    headers.Authorization = `Bearer ${process.env.OPENAI_API_KEY.trim()}`;
    body = { model, messages, max_completion_tokens: 2048, stream: false };
  } else if (provider === "gemini" && process.env.GEMINI_API_KEY?.trim()) {
    model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    providerUsed = "Google Gemini";
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    headers["x-goog-api-key"] = process.env.GEMINI_API_KEY.trim();
    body = { contents: [{ parts: [{ text: `${instruction}\n\nInput Text:\n${req.prompt}` }] }], generationConfig: { maxOutputTokens: 2048 } };
  } else if (provider === "ollama") {
    url = `${(process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "")}/api/chat`;
    model = process.env.OLLAMA_MODEL || "llama3";
    providerUsed = "Ollama (Local)";
    body = { model, messages, stream: false, options: { num_predict: 2048 } };
  } else return failure("NOT_CONFIGURED");

  const controller = new AbortController();
  const timeoutMs = typeof req.timeoutMs === "number" && Number.isFinite(req.timeoutMs) ? Math.max(1, Math.min(30_000, req.timeoutMs)) : 30_000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<AiTaskResponse>((resolve) => {
    timer = setTimeout(() => { controller.abort(); resolve(failure("PROVIDER_UNAVAILABLE")); }, timeoutMs);
  });
  const call = async (): Promise<AiTaskResponse> => {
    let response: Response;
    try {
      response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal, redirect: "error" });
    } catch { return failure("PROVIDER_UNAVAILABLE"); }
    if (!response.ok) { void response.body?.cancel().catch(() => {}); return failure("PROVIDER_UNAVAILABLE"); }
    let json: Record<string, unknown>;
    try { json = await readProviderResponse(response, controller.signal); }
    catch { return failure(controller.signal.aborted ? "PROVIDER_UNAVAILABLE" : "INVALID_RESPONSE"); }
    const text = provider === "openai" ? object(object(first(json.choices)).message).content
      : provider === "ollama" ? object(json.message).content
      : object(first(object(object(first(json.candidates)).content).parts)).text;
    if (typeof text !== "string" || !text.trim()) return failure("INVALID_RESPONSE");
    const result = finalizeApiResult(req.task, text, providerUsed, model);
    const rawUsage = object(provider === "gemini" ? json.usageMetadata : json.usage);
    const usage = {
      inputTokens: tokens(provider === "ollama" ? json.prompt_eval_count : provider === "gemini" ? rawUsage.promptTokenCount : rawUsage.prompt_tokens),
      outputTokens: tokens(provider === "ollama" ? json.eval_count : provider === "gemini" ? rawUsage.candidatesTokenCount : rawUsage.completion_tokens),
      totalTokens: tokens(provider === "gemini" ? rawUsage.totalTokenCount : rawUsage.total_tokens),
    };
    if (Object.values(usage).some((value) => value !== undefined)) result.usage = usage;
    return result;
  };
  try { return await Promise.race([call(), timeout]); }
  finally { clearTimeout(timer); }
}

function finalizeApiResult(
  task: AiTaskType,
  text: string,
  providerUsed: string,
  modelUsed: string,
): AiTaskResponse {
  if (task === "plagiarism") {
    return {
      success: false,
      mode: "api",
      providerUsed,
      modelUsed,
      error:
        "Web plagiarism checking needs a dedicated search/similarity API. An LLM alone cannot verify originality — this tool will not invent uniqueness scores.",
    };
  }

  if (task === "detect") {
    const parsed = parseDetectorPayload(text);
    if (!parsed) {
      return {
        success: false,
        mode: "api",
        providerUsed,
        modelUsed,
        errorCode: "INVALID_RESPONSE",
        error:
          "Detector response did not include a numeric score. Try again or switch AI provider.",
      };
    }
    return {
      success: true,
      result: parsed.analysis,
      score: parsed.score,
      mode: "api",
      providerUsed,
      modelUsed,
    };
  }

  return {
    success: true,
    result: text,
    mode: "api",
    providerUsed,
    modelUsed,
  };
}

/** Expect JSON `{ "score": 0-100, "analysis": "..." }` from the model. */
function parseDetectorPayload(
  text: string,
): { score: number; analysis: string } | null {
  const fenced = text.match(/\{[\s\S]*\}/);
  if (!fenced) return null;
  try {
    const json = JSON.parse(fenced[0]) as { score?: unknown; analysis?: unknown };
    const score = json.score;
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100) return null;
    const clamped = Math.round(score);
    const analysis =
      typeof json.analysis === "string" && json.analysis.trim()
        ? json.analysis.trim()
        : text.trim();
    return { score: clamped, analysis };
  } catch {
    return null;
  }
}

function getTaskInstruction(req: AiTaskRequest): string {
  switch (req.task) {
    case "write":
      return `Write a clear, engaging article on the given topic using a ${req.tone || "professional"} tone.`;
    case "email":
      return `Compose a clear, polished email based on the prompt. Tone: ${req.tone || "professional"}.`;
    case "summarize":
      return `Summarize the input text into key concise bullet points and a brief executive summary.`;
    case "paraphrase":
      return `Paraphrase and rewrite the text with improved vocabulary and flow while retaining meaning.`;
    case "rewrite":
      return `Rewrite the article to make it more engaging and original.`;
    case "humanize":
      return `Rewrite the text to sound completely natural, conversational, and human-written.`;
    case "grammar":
      return `Correct all grammar, spelling, punctuation, and phrasing errors in the text. Highlight corrections.`;
    case "translate":
      return `Translate the input text accurately into ${req.targetLanguage || "Spanish"}.`;
    case "detect":
      return `Analyze the input text for AI-writing patterns. Reply with ONLY valid JSON (no markdown fences): {"score": <integer 0-100 where 100 means almost certainly AI-generated>, "analysis": "<2-4 sentence explanation>"}.`;
    case "plagiarism":
      return `Do not invent plagiarism scores.`;
    default:
      return `Process the input text.`;
  }
}
