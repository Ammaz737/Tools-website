import { NextResponse } from "next/server";

import { requireToolAccess } from "@/lib/server/tool-access";
import { getToolById } from "@/lib/tools";
import { incrementToolUsage } from "@/lib/tool-status";
import { enforceRateLimit } from "@/lib/server/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!getToolById(id)) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  const access = await requireToolAccess(id);
  if ("response" in access) return access.response;
  const status = access.status;
  return NextResponse.json({
    toolId: id,
    isActive: status?.isActive ?? true,
    usageCount: status?.usageCount ?? 0,
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const limited = enforceRateLimit(_request, "usage", 120);
  if (limited) return limited;
  const { id } = await context.params;
  if (!getToolById(id)) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  const access = await requireToolAccess(id);
  if ("response" in access) return access.response;

  try {
    const updated = await incrementToolUsage(id);
    return NextResponse.json({
      toolId: id,
      isActive: updated.isActive,
      usageCount: updated.usageCount,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to record usage",
      },
      { status: 500 },
    );
  }
}
