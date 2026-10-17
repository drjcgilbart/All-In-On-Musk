import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns and refunds · Shop",
  description: "Returns, reprints and refunds for made-to-order All In On Musk merch.",
  alternates: { canonical: "/shop/returns" },
};

export default function ReturnsPage() {
  return (
    <>
      <p className="kicker">Shop · policy</p>
      <h1 className="page-title">Returns and refunds</h1>
      <p className="lede">Every item is printed or embroidered to order, just for you. That shapes what we can take back.</p>

      <section className="section shop-policy" aria-labelledby="r-defects">
        <h2 id="r-defects">Misprints, damage and defects</h2>
        <p>
          If your order arrives misprinted, damaged or defective, email{" "}
          <a href="mailto:admin@allinonmusk.com">admin@allinonmusk.com</a> within <strong>30 days of delivery</strong> with your order
          email, a short description and a clear photo of the problem. We will send a free reprint or a full refund, your choice.
          You do not need to send the item back.
        </p>
      </section>

      <section className="section shop-policy" aria-labelledby="r-remorse">
        <h2 id="r-remorse">Change of mind and wrong size</h2>
        <p>
          Because items are made to order, we cannot accept returns or exchanges for buyer&apos;s remorse or for ordering the wrong
          size. Please check the size chart on the product page before you order. Tees follow the standard unisex fit of the blank
          listed on each product page; if you are between sizes, size up.
        </p>
      </section>

      <section className="section shop-policy" aria-labelledby="r-lost">
        <h2 id="r-lost">Lost or wrong address</h2>
        <p>
          If tracking shows your parcel lost in transit, contact us and we will work with our print partner on a replacement.
          Orders shipped to an address entered incorrectly at checkout cannot be reshipped for free.
        </p>
      </section>

      <section className="section shop-policy" aria-labelledby="r-cancel">
        <h2 id="r-cancel">Cancelling</h2>
        <p>Email us as soon as possible. We can cancel for a full refund only if the order has not gone into production yet.</p>
      </section>

      <section className="section shop-policy" aria-labelledby="r-contact">
        <h2 id="r-contact">Contact</h2>
        <p>
          <a href="mailto:admin@allinonmusk.com">admin@allinonmusk.com</a>. Refunds go back to the original payment method and
          usually appear within 5 to 10 business days.
        </p>
        <p className="shop-tag">General policy text, not legal advice. Last updated October 2026.</p>
        <p><Link href="/shop">Back to the shop</Link> · <Link href="/shop/privacy">Privacy</Link></p>
      </section>
    </>
  );
}
