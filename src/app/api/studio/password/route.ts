import { NextResponse } from "next/server";
import {
  STUDIO_COOKIE,
  passwordMatches,
  studioConfigured,
  studioCookieOptions,
  studioRequestAuthenticated,
  tokenFor,
} from "@/lib/studio/auth";
import { clearStudioAttempts, studioAttemptAllowed } from "@/lib/studio/gate";
import { hashStudioPassword, writePasswordRecord } from "@/lib/studio/secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await studioRequestAuthenticated(request))) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!(await studioConfigured())) {
    return NextResponse.json({ error: "Studio sign-in is not configured yet." }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const currentPassword = String(body && typeof body === "object" ? (body as { currentPassword?: string }).currentPassword || "" : "");
  const newPassword = String(body && typeof body === "object" ? (body as { newPassword?: string }).newPassword || "" : "");
  const confirm = String(body && typeof body === "object" ? (body as { confirm?: string }).confirm || "" : "");
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }
  if (newPassword !== confirm) {
    return NextResponse.json({ error: "New password and confirmation do not match." }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "Choose a different password." }, { status: 400 });
  }
  const gate = studioAttemptAllowed(request);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
    );
  }
  if (!(await passwordMatches(currentPassword))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }
  const record = hashStudioPassword(newPassword);
  try {
    await writePasswordRecord(record);
  } catch {
    return NextResponse.json({ error: "Could not save the new password." }, { status: 503 });
  }
  clearStudioAttempts(request);
  const response = NextResponse.json({ ok: true, message: "Password updated." });
  response.cookies.set(STUDIO_COOKIE, tokenFor(record), studioCookieOptions());
  return response;
}
