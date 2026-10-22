import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { buildLineItems, PricingError } from "@/lib/shop/pricing";
import { findVariant } from "@/lib/shop/catalog";
import { getStripe } from "@/lib/shop/stripe";
import { automaticTax, checkoutEnabled, shipCountries, shippingRateCents, SHIPPING_TAX_CODE } from "@/lib/shop/config";
import { logError } from "@/lib/shop/log";
import { returnOrigin, validCartId } from "@/lib/shop/carts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!checkoutEnabled()) {
    return NextResponse.json({ error: "Checkout opens soon. The shop is open for browsing only right now." }, { status: 503 });
  }
  let body: { items?: unknown; cartId?: unknown };
  try {
    body = (await req.json()) as { items?: unknown; cartId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const tax = automaticTax();
    const { lineItems } = buildLineItems(body?.items, { taxBehavior: tax ? "exclusive" : undefined }); // server-side prices only
    // Pre-order pins in the cart: say so honestly on Stripe's shipping option.
    const hasPin = lineItems.some((li) => findVariant(li.price_data.product_data.metadata.sku)?.product.selfFulfilled);
    const stripe = getStripe();
    const base = returnOrigin(req); // same origin as the cart (localStorage is per-origin)
    const cartId = validCartId(body?.cartId);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      ...(tax ? { automatic_tax: { enabled: true } } : {}),
      shipping_address_collection: {
        allowed_countries: shipCountries() as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: hasPin ? "Pre-order: pins ship in about 3 weeks" : "Standard (print on demand)",
            type: "fixed_amount",
            fixed_amount: { amount: shippingRateCents(), currency: "usd" },
            // Shipping is taxable in Florida when the item is; Stripe Tax uses this code.
            tax_code: SHIPPING_TAX_CODE,
            ...(tax ? { tax_behavior: "exclusive" as const } : {}),
            delivery_estimate: {
              minimum: hasPin ? { unit: "week", value: 3 } : { unit: "business_day", value: 5 },
              maximum: hasPin ? { unit: "week", value: 4 } : { unit: "business_day", value: 12 },
            },
          },
        },
      ],
      phone_number_collection: { enabled: true },
      success_url: `${base}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/shop/cancel`,
      metadata: { source: "allinonmusk-shop", ...(cartId ? { cart_id: cartId } : {}) },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof PricingError) return NextResponse.json({ error: err.message }, { status: 400 });
    logError("checkout", err);
    return NextResponse.json({ error: "Checkout is unavailable right now. Please try again shortly." }, { status: 500 });
  }
}
