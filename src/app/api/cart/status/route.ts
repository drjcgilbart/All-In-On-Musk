import { NextResponse } from "next/server";
import { getDedupeStore } from "@/lib/shop/idempotency";
import { isCartCompleted, validCartId } from "@/lib/shop/carts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/cart/status?id=<cartId> -> { completed } . Lets the client drop a cart that was already paid for. */
export async function GET(req: Request) {
  const id = validCartId(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ completed: false });
  try {
    return NextResponse.json({ completed: await isCartCompleted(getDedupeStore(), id) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ completed: false });
  }
}
