import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy · Shop",
  description: "What the All In On Musk shop collects, why, and who it is shared with.",
  alternates: { canonical: "/shop/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <p className="kicker">Shop · policy</p>
      <h1 className="page-title">Privacy</h1>
      <p className="lede">The short version: we collect only what it takes to make and ship your order, and we never sell it.</p>

      <section className="section shop-policy" aria-labelledby="p-collect">
        <h2 id="p-collect">What we collect</h2>
        <ul>
          <li>
            <strong>At checkout:</strong> your name, email, phone number, shipping address and payment details are collected by
            Stripe, our payment processor. We never see or store your full card number.
          </li>
          <li>
            <strong>For fulfilment:</strong> your name, shipping address, phone and the items ordered are passed to Printful, our
            print-on-demand partner, so it can make and ship your order.
          </li>
          <li>
            <strong>Your cart:</strong> stored only in your own browser (local storage) until you check out or clear it.
          </li>
          <li>
            <strong>Analytics:</strong> Google Analytics runs only on the fleet page, not on the shop.
          </li>
        </ul>
      </section>

      <section className="section shop-policy" aria-labelledby="p-use">
        <h2 id="p-use">How it is used</h2>
        <p>
          To take payment, make and ship your order, handle returns and answer your questions. We do not sell, rent or trade your
          personal information, and we do not send marketing email unless you ask us to.
        </p>
      </section>

      <section className="section shop-policy" aria-labelledby="p-partners">
        <h2 id="p-partners">Partners</h2>
        <p>
          Stripe and Printful handle your data under their own privacy policies:{" "}
          <a href="https://stripe.com/privacy">stripe.com/privacy</a> and{" "}
          <a href="https://www.printful.com/policies/privacy">printful.com/policies/privacy</a>.
        </p>
      </section>

      <section className="section shop-policy" aria-labelledby="p-contact">
        <h2 id="p-contact">Questions or deletion requests</h2>
        <p>
          Email <a href="mailto:admin@allinonmusk.com">admin@allinonmusk.com</a>. We keep order records only as long as needed for
          fulfilment, returns, tax and accounting.
        </p>
        <p className="shop-tag">General policy text, not legal advice. Last updated October 2026.</p>
        <p><Link href="/shop">Back to the shop</Link> · <Link href="/shop/returns">Returns and refunds</Link></p>
      </section>
    </>
  );
}
