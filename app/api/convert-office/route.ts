import { isSameOriginRequest } from "@/lib/server/same-origin";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireToolAccess } from "@/lib/server/tool-access";
import { convertNativeOffice, officeConverterConfiguration, OFFICE_TOOL_FORMATS, MAX_OFFICE_UPLOAD_BYTES, OfficeConversionError, readOfficeUpload } from "@/lib/server/office-conversion";

export const runtime = "nodejs";
let activeUploads = 0;
export function GET() {
  return Response.json({ available: !!officeConverterConfiguration() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Same-origin request required" }, { status: 403 });
  const limited = enforceRateLimit(request, "office:conversion", 10);
  if (limited) return limited;
  const query = new URL(request.url).searchParams;
  const toolId = query.get("toolId") || "";
  const format = query.get("format");
  if (!Object.hasOwn(OFFICE_TOOL_FORMATS, toolId) || OFFICE_TOOL_FORMATS[toolId as keyof typeof OFFICE_TOOL_FORMATS] !== format) return Response.json({ error: "Unsupported document conversion" }, { status: 400 });
  if (!officeConverterConfiguration()) return Response.json({ error: "Server document conversion is unavailable" }, { status: 503 });
  const access = await requireToolAccess(toolId);
  if ("response" in access) return access.response;
  if (activeUploads >= 2) return Response.json({ error: "Document converter is busy; try again shortly" }, { status: 429 });
  activeUploads++;
  try {
    const maxBytes = access.status.maxFileSizeMB ? Math.min(MAX_OFFICE_UPLOAD_BYTES, access.status.maxFileSizeMB * 1024 * 1024) : MAX_OFFICE_UPLOAD_BYTES;
    const bytes = await readOfficeUpload(request, maxBytes);
    if (access.status.maxFileSizeMB && bytes.byteLength > access.status.maxFileSizeMB * 1024 * 1024) return Response.json({ error: "File exceeds this tool's size limit" }, { status: 413 });
    const pdf = await convertNativeOffice(bytes, format as typeof OFFICE_TOOL_FORMATS[keyof typeof OFFICE_TOOL_FORMATS], { timeoutMs: access.status.timeoutMs, signal: request.signal });
    return new Response(pdf as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="converted.pdf"', "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    return Response.json({ error: error instanceof OfficeConversionError ? error.message : "Document conversion failed" }, { status: error instanceof OfficeConversionError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
  } finally { activeUploads--; }
}
