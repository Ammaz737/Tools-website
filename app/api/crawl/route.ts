import { requireToolAccess } from "@/lib/server/tool-access";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { isSafeTarget } from "@/lib/server/ssrf";
import { safeRequest } from "@/lib/server/safe-request";
import { extractPublicHtmlLinks } from "@/lib/server/html-links";

export const runtime = "nodejs";

async function checkLink(url: string, timeoutMs: number) {
  const started = Date.now();
  try {
    const head = await safeRequest(url, {
      method: "HEAD", timeoutMs,
      headers: { "User-Agent": "ToolsPlatform-LinkChecker/1.0" },
    });

    // Some hosts reject HEAD; fall back to GET.
    if (head.status === 405 || head.status === 501) {
      const get = await safeRequest(url, {
        method: "GET", timeoutMs,
          headers: { "User-Agent": "ToolsPlatform-LinkChecker/1.0" },
      });
      return {
        url,
        statusCode: get.status,
        statusText: get.statusText,
        ok: get.ok,
        responseTimeMs: Date.now() - started,
      };
    }

    return {
      url,
      statusCode: head.status,
      statusText: head.statusText,
      ok: head.ok,
      responseTimeMs: Date.now() - started,
    };
  } catch (err: unknown) {
    return {
      url,
      statusCode: 0,
      statusText: err instanceof Error ? err.message : "Request failed",
      ok: false,
      responseTimeMs: Date.now() - started,
    };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url") || "";
  const mode = searchParams.get("mode") || "probe";

  const toolId = mode === "links" ? "broken-link-checker" : "website-speed-test";
  const limited = enforceRateLimit(req, `network:${toolId}`, 30);
  if (limited) return limited;
  const access = await requireToolAccess(toolId, { inputChars: target.length });
  if ("response" in access) return access.response;
  const timeoutMs = Math.min(access.status.timeoutMs ?? 8000, 30000);
  const check = isSafeTarget(target);
  if (!check.safe || !check.url) {
    return NextResponse.json(
      { success: false, error: check.reason || "Invalid URL target" },
      { status: 400 },
    );
  }

  const startTime = Date.now();

  try {
    const response = await safeRequest(check.url.toString(), {
      method: "GET", timeoutMs,
      headers: {
        "User-Agent": "ToolsPlatform-SpeedChecker/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const responseTime = Date.now() - startTime;
    const bodyText = response.body.toString("utf8");

    const extractedLinks = extractPublicHtmlLinks(bodyText, response.url);

    const headers: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      headers[key] = val;
    });

    let linkResults:
      | Array<{
          url: string;
          statusCode: number;
          statusText: string;
          ok: boolean;
          responseTimeMs: number;
        }>
      | undefined;

    if (mode === "links") {
      const batch = extractedLinks.slice(0, 12);
      linkResults = [];
      for (let i = 0; i < batch.length; i += 4) {
        linkResults.push(...await Promise.all(batch.slice(i, i + 4).map((link) => checkLink(link, timeoutMs))));
      }
    }

    return NextResponse.json({
      success: true,
      url: check.url.toString(),
      statusCode: response.status,
      statusText: response.statusText,
      responseTimeMs: responseTime,
      pageSizeBytes: Buffer.byteLength(bodyText, "utf8"),
      contentType: response.headers.get("content-type") || "unknown",
      server: response.headers.get("server") || "hidden",
      note:
        mode === "probe"
          ? "Server-side latency probe (not full Lighthouse / Core Web Vitals)."
          : "Checked discovered links with HEAD/GET.",
      headers,
      sampleLinks: extractedLinks,
      linkResults,
      brokenCount: linkResults?.filter((item) => !item.ok).length ?? 0,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Crawl request failed",
        responseTimeMs: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}
