import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/db";
import { tools } from "@/lib/tools";
import { getAllToolStatuses } from "@/lib/tool-status";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const statuses = await getAllToolStatuses();
    const byId = new Map(statuses.map((status) => [status.toolId, status]));

    const rows = tools.map((tool) => {
      const status = byId.get(tool.id);
      return {
        id: tool.id,
        name: tool.name,
        category: tool.category,
        runtime: tool.runtime,
        blurb: tool.blurb,
        isActive: status?.isActive ?? true,
        maintenance: status?.maintenance ?? false,
        maxInputChars: status?.maxInputChars,
        maxFileSizeMB: status?.maxFileSizeMB,
        timeoutMs: status?.timeoutMs,
        usageCount: status?.usageCount ?? 0,
        updatedAt: status?.updatedAt ?? null,
      };
    });

    return NextResponse.json({
      mongoConfigured: isMongoConfigured(),
      tools: rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load tool status",
      },
      { status: 500 },
    );
  }
}
