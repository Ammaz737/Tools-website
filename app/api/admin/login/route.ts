import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { readJsonBody, RequestBodyError } from "@/lib/server/request-body";
import { isSameOriginRequest } from "@/lib/server/same-origin";

import {
  isAdminPasswordConfigured,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "admin-login", 5);
  if (limited) return limited;
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { error: "Admin login requires ADMIN_PASSWORD and a distinct ADMIN_SESSION_SECRET of at least 32 characters" },
      { status: 501 },
    );
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Same-origin request required" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try { body = await readJsonBody(request, 4096); }
  catch (error) { return NextResponse.json({ error: error instanceof RequestBodyError ? error.message : "Invalid request" }, { status: error instanceof RequestBodyError ? error.status : 400 }); }

  if (typeof body.password !== "string" || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await setAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
