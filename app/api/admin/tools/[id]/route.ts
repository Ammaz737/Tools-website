import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { setToolConfig, validateToolConfig } from "@/lib/tool-status";

import { getToolById } from "@/lib/tools";
import { readJsonBody, RequestBodyError } from "@/lib/server/request-body";
import { isSameOriginRequest } from "@/lib/server/same-origin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Same-origin request required" }, { status: 403 });
  const { id } = await context.params;
  if (!getToolById(id)) return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  let patch;
  try { patch = validateToolConfig(await readJsonBody(request, 4096)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status: error instanceof RequestBodyError ? error.status : 400 }); }
  try {
    const updated = await setToolConfig(id, patch);
    return NextResponse.json(updated, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Tool configuration could not be saved" }, { status: 503 });
  }
}
