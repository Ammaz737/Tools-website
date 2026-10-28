import { isSameOriginRequest } from "@/lib/server/same-origin";
import { enforceProviderQuota } from "@/lib/server/provider-quota";
import { NextRequest, NextResponse } from "next/server";
import { processAiTask, AiTaskType } from "@/lib/server/ai";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireToolAccess } from "@/lib/server/tool-access";
import { readJsonBody, RequestBodyError } from "@/lib/server/request-body";

const taskTools: Record<string, string[]> = {
  write: ["ai-writer"], email: ["ai-email-writer"], summarize: ["ai-summarizer"],
  paraphrase: ["paraphrasing-tool"], rewrite: ["article-rewriter"], humanize: ["ai-humanizer"],
  grammar: ["grammar-checker", "spell-checker"], translate: ["ai-translator"],
  detect: ["ai-detector"], plagiarism: ["plagiarism-checker"],
};

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "ai", 10);
  if (limited) return limited;
  try {
    const body = await readJsonBody(req);
    const { prompt, targetLanguage, tone, length } = body;
    const task = body.task ?? "write";
    if (typeof task !== "string" || !Object.hasOwn(taskTools, task)) {
      return NextResponse.json({ success: false, error: "Unsupported AI task" }, { status: 400 });
    }
    const toolId = body.toolId ?? taskTools[task][0];
    if (typeof toolId !== "string" || !taskTools[task].includes(toolId)) {
      return NextResponse.json({ success: false, error: "Tool does not support this task" }, { status: 400 });
    }
    for (const option of [targetLanguage, tone, length]) {
      if (option !== undefined && (typeof option !== "string" || option.length > 100)) {
        return NextResponse.json({ success: false, error: "Invalid AI options" }, { status: 400 });
      }
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ success: false, error: "Prompt text is required" }, { status: 400 });
    }

    if (prompt.length > 20000) {
      return NextResponse.json({ success: false, error: "Prompt exceeds maximum allowed character limit (20,000)" }, { status: 400 });
    }

    if (!isSameOriginRequest(req)) return NextResponse.json({ success: false, error: "Same-origin request required" }, { status: 403 });
    const access = await requireToolAccess(toolId, { inputChars: prompt.length });
    if ("response" in access) return access.response;
    const quota = await enforceProviderQuota("ai");
    if (quota) return quota;
    const response = await processAiTask({
      task: (task || "write") as AiTaskType,
      prompt,
      targetLanguage: targetLanguage as string | undefined,
      tone: tone as string | undefined,
      length: length as string | undefined,
      timeoutMs: access.status.timeoutMs,
    });

    return NextResponse.json({ success: response.success, result: response.result, score: response.score, error: response.error }, {
      status: response.success ? 200 : response.errorCode === "NOT_CONFIGURED" ? 501 : 502,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof RequestBodyError ? err.message : "AI request failed" },
      { status: err instanceof RequestBodyError ? err.status : 500 }
    );
  }
}
