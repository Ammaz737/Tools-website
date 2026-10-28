import { getToolStatus, type ToolStatus } from "@/lib/tool-status";

type AccessOptions = { inputChars?: number; fileSizeBytes?: number };
type StatusReader = (toolId: string) => Promise<ToolStatus | null>;
export async function requireToolAccess(toolId: string, options: AccessOptions = {}, readStatus: StatusReader = getToolStatus): Promise<{ status: ToolStatus } | { response: Response }> {
  const reject = (error: string, status: number) => ({ response: Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } }) });
  let status: ToolStatus | null;
  try { status = await readStatus(toolId); }
  catch { return reject("Tool availability is temporarily unavailable", 503); }
  if (!status) return reject("Tool not found", 404);
  if (!status.isActive) return reject("Tool is disabled", 403);
  if (status.maintenance) return reject("Tool is under maintenance", 503);
  if (status.maxInputChars && options.inputChars !== undefined && options.inputChars > status.maxInputChars) return reject("Input exceeds this tool's character limit", 413);
  if (status.maxFileSizeMB && options.fileSizeBytes !== undefined && options.fileSizeBytes > status.maxFileSizeMB * 1024 * 1024) return reject("File exceeds this tool's size limit", 413);
  return { status };
}
