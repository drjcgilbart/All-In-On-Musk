import { NextResponse } from "next/server";
import { clientIp, getLetterSubscriberStore, sameOrigin, subscribeToLetter } from "@/lib/letter/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Could not subscribe. Try again." }, { status: 403, headers: noStore });
  }
  const store = getLetterSubscriberStore();
  if (!store) {
    return NextResponse.json({ error: "The list is not available right now." }, { status: 503, headers: noStore });
  }
  const body = (await request.json().catch(() => ({}))) as { email?: string; name?: string; company?: string };
  try {
    const result = await subscribeToLetter(store, body, clientIp(request));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status, headers: noStore });
    const response = NextResponse.json({ ok: true }, { headers: noStore });
    if (result.token) {
      response.cookies.set("aiom_letter", result.token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 400,
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "The list is not available right now." }, { status: 503, headers: noStore });
  }
}
