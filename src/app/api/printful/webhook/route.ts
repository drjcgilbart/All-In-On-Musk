import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { logError, logInfo } from "@/lib/shop/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Register in Printful (Settings > Webhooks or POST /webhooks) for package_shipped, order_failed, order_canceled,
// with the URL https://allinonmusk.com/api/printful/webhook?key=<PRINTFUL_WEBHOOK_SECRET>.
// Printful v1 webhooks are unsigned, so the secret query key is the only gate. Requests without it are rejected.
// TODO: email the customer tracking (or rely on Printful's own shipping emails, which can be white-labelled).
function keyOk(given: string | null, expected: string | undefined) {
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  if (!keyOk(new URL(req.url).searchParams.get("key"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const evt = await req.json();
    const type = evt?.type;
    const order = evt?.data?.order;
    if (type === "package_shipped") {
      logInfo("printful-webhook", "shipped", { order: order?.external_id, carrier: evt?.data?.shipment?.carrier, tracking: evt?.data?.shipment?.tracking_number });
    } else if (type === "order_failed" || type === "order_canceled") {
      logError("printful-webhook", type, { order: order?.external_id, reason: evt?.data?.reason });
    } else {
      logInfo("printful-webhook", "event", { type });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("printful-webhook", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
