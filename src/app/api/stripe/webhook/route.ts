import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/shop/stripe";
import { getDedupeStore } from "@/lib/shop/idempotency";
import { handleStripeEvent } from "@/lib/shop/fulfill";
import { logError } from "@/lib/shop/log";
import { sendAdminFormMail } from "@/lib/shop/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const raw = await req.text(); // raw body is required for signature verification
  let event: Stripe.Event;
  let stripe: Stripe;
  try {
    stripe = getStripe();
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    logError("stripe-webhook", err, { reason: "bad signature or missing key" });
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  try {
    const status = await handleStripeEvent(event, {
      store: getDedupeStore(),
      retrieveSession: (id) => stripe.checkout.sessions.retrieve(id, { expand: ["line_items.data.price.product"] }),
      sendAdminFallback: sendAdminFormMail,
    });
    // Order emails never fail the order (Printful is already done), but a missed admin/customer email must be loud:
    // logged at error level here and returned in the body Stripe shows under Developers > Webhooks > event deliveries.
    if (status.includes("mail-failed")) logError("stripe-webhook", new Error(`Order processed but email failed: ${status}`), { event: event.id, alert: "CHECK ORDER EMAIL" });
    return NextResponse.json({ received: true, status, ...(status.includes("mail-failed") ? { warning: "order email not sent; see logs" } : {}) });
  } catch {
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 }); // Stripe will retry
  }
}
