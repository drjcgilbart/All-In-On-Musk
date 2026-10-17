import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Checkout scrubbed · Shop", robots: { index: false } };

export default function CancelPage() {
  return (
    <>
      <p className="kicker">Status · scrubbed</p>
      <h1 className="page-title">Checkout scrubbed</h1>
      <p className="lede">No charge was made. Your cart is still on the pad whenever you are ready.</p>
      <Link className="shop-btn" href="/shop/cart">Return to cart</Link>
    </>
  );
}
