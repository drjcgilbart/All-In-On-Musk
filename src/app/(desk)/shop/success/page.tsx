import type { Metadata } from "next";
import Link from "next/link";
import type Stripe from "stripe";
import { ClearCart } from "./clear-cart";
import { getStripe } from "@/lib/shop/stripe";
import { orderSummary } from "@/lib/shop/order-mail";
import { formatPrice } from "@/lib/shop/catalog";
import { logError } from "@/lib/shop/log";

export const metadata: Metadata = { title: "Order received · Shop", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ session_id?: string | string[] }> };

async function loadPaidSession(id: string | undefined): Promise<Stripe.Checkout.Session | null> {
  if (!id || !/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(id)) return null;
  try {
    const s = await getStripe().checkout.sessions.retrieve(id, { expand: ["line_items.data.price.product"] });
    return s.payment_status === "paid" || s.payment_status === "no_payment_required" ? s : null;
  } catch (err) {
    logError("success-page", err, { session: id.slice(0, 16) });
    return null;
  }
}

export default async function SuccessPage({ searchParams }: Props) {
  const raw = (await searchParams).session_id;
  const session = await loadPaidSession(Array.isArray(raw) ? raw[0] : raw);
  if (!session) {
    return (
      <>
        <p className="kicker">Status · checking</p>
        <h1 className="page-title">We could not confirm this order yet</h1>
        <p className="lede">
          We could not verify a paid order for this link, so your cart was left as it is. If you just paid, your receipt email is the
          confirmation. Questions: <a href="mailto:admin@allinonmusk.com">admin@allinonmusk.com</a>.
        </p>
        <Link className="shop-btn" href="/shop/cart">Back to the cart</Link>
      </>
    );
  }
  const o = orderSummary(session);
  const order = {
    orderNumber: o.orderNumber,
    date: new Date(session.created * 1000).toISOString(),
    totalCents: o.totalCents,
    items: o.lines.map((l) => ({ name: l.name, variant: l.variant, quantity: l.quantity })),
  };
  return (
    <>
      <ClearCart order={order} cartId={typeof session.metadata?.cart_id === "string" ? session.metadata.cart_id : undefined} />
      <p className="kicker">Status · nominal</p>
      <h1 className="page-title">Order received</h1>
      <p className="lede">Payment confirmed. Thanks{o.customerName && o.customerName !== "Customer" ? `, ${o.customerName.split(" ")[0]}` : ""}! Your order goes to the print shop shortly, and tracking follows when it ships.</p>
      <div className="shop-panel" data-testid="order-confirmation">
        <p className="shop-mono">Order number</p>
        <p className="shop-price">{o.orderNumber}</p>
        {o.lines.map((l) => (
          <div className="shop-row shop-line-confirm" key={l.sku}>
            <span>{l.quantity} × {l.name}{l.variant ? ` (${l.variant})` : ""}</span>
            <span className="shop-mono">{formatPrice(l.amountCents)}</span>
          </div>
        ))}
        <div className="shop-row"><span>Shipping</span><span className="shop-mono">{formatPrice(o.shippingCents)}</span></div>
        {o.taxCents ? <div className="shop-row"><span>Tax</span><span className="shop-mono">{formatPrice(o.taxCents)}</span></div> : null}
        <div className="shop-row shop-total"><strong>Total paid</strong><span className="shop-price shop-price-lg">{formatPrice(o.totalCents)}</span></div>
      </div>
      <p className="shop-tag">Keep the order number for any questions: <a href="mailto:admin@allinonmusk.com">admin@allinonmusk.com</a>.</p>
      <Link className="shop-btn" href="/shop">Back to the shop</Link>
    </>
  );
}
