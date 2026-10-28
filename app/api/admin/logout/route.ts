import { NextResponse } from "next/server";

import { clearAdminSessionCookie } from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/server/same-origin";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Same-origin request required" }, { status: 403 });
  }
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
