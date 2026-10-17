"use client";
import Link from "next/link";
import { useCart } from "./cart";

/** Small in-page bar for the shop section. Not a site nav item. */
export function ShopBar() {
  const { count, ready } = useCart();
  return (
    <div className="shop-bar">
      <Link href="/shop" className="shop-bar-link">Merch</Link>
      <Link href="/shop/cart" className="shop-bar-link">
        Cart{ready && count > 0 ? <span className="shop-badge">{count}</span> : null}
      </Link>
    </div>
  );
}
