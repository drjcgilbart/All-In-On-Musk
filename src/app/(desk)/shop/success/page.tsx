import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "./clear-cart";

export const metadata: Metadata = { title: "Order received · Shop", robots: { index: false } };

export default function SuccessPage() {
  return (
    <>
      <ClearCart />
      <p className="kicker">Status · nominal</p>
      <h1 className="page-title">Order received</h1>
      <p className="lede">
        Payment confirmed. Your receipt is on its way by email, and your order goes to the print shop shortly. Tracking
        follows when it ships.
      </p>
      <Link className="shop-btn" href="/shop">Back to the shop</Link>
    </>
  );
}
