import { NextResponse } from "next/server";
import { clientIp, getLetterSubscriberStore, sameOrigin, unsubscribeFromLetter } from "@/lib/letter/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Could not unsubscribe. Try again." }, { status: 403, headers: noStore });
  }
  const store = getLetterSubscriberStore();
  if (!store) {
    return NextResponse.json({ error: "The list is not available right now." }, { status: 503, headers: noStore });
  }
  const body = (await request.json().catch(() => ({}))) as { token?: string; email?: string };
  try {
    const result = await unsubscribeFromLetter(store, body, clientIp(request));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status, headers: noStore });
    return NextResponse.json({ ok: true, message: result.message }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "The list is not available right now." }, { status: 503, headers: noStore });
  }
}
