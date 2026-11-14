import { NextResponse } from "next/server";
import { quoteDropSkus } from "@/lib/drops";
import { isDropSku } from "@/lib/drops/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Display prices for drop SKUs already in a cart. Checkout ignores this and prices again. */
export async function POST(req: Request) {
  let body: { skus?: unknown };
  try {
    body = (await req.json()) as { skus?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const skus = Array.isArray(body?.skus) ? body.skus.filter(isDropSku).slice(0, 20) : [];
  return NextResponse.json({ items: await quoteDropSkus(skus) });
}
