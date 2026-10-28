import { NextResponse } from "next/server";

import { getToolStatusMap } from "@/lib/tool-status";

export async function GET() {
  try {
    const statusMap = await getToolStatusMap();
    return NextResponse.json({
      status: statusMap,
    });
  } catch {
    return NextResponse.json({ error: "Tool availability is temporarily unavailable" }, { status: 503 });
  }
}
