import { NextResponse } from "next/server";
import {
  STUDIO_COOKIE,
  passwordMatches,
  studioConfigured,
  studioCookieOptions,
  studioCookieValue,
  studioEmailMatches,
  studioToken,
  studioTokenMatches,
} from "@/lib/studio/auth";
import { clearStudioAttempts, studioAttemptAllowed } from "@/lib/studio/gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return NextResponse.json({ authenticated: await studioTokenMatches(studioCookieValue(request.headers.get("cookie"))) });
}

export async function POST(request: Request) {
  if (!(await studioConfigured())) {
    return NextResponse.json({ error: "Studio sign-in is not configured yet." }, { status: 503 });
  }
  const gate = studioAttemptAllowed(request);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
    );
  }
  const body = await request.json().catch(() => ({}));
  const email = String((body as { email?: string }).email || "");
  const password = String((body as { password?: string }).password || "");
  if (!studioEmailMatches(email) || !(await passwordMatches(password))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  clearStudioAttempts(request);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STUDIO_COOKIE, await studioToken(), studioCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STUDIO_COOKIE, "", { ...studioCookieOptions(), maxAge: 0 });
  return response;
}
