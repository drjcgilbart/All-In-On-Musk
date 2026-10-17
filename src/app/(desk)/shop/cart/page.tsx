import type { Metadata } from "next";
import { CartView } from "./cart-view";
import { checkoutEnabled } from "@/lib/shop/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cart · Shop", robots: { index: false } };

export default function CartPage() {
  return <CartView checkoutEnabled={checkoutEnabled()} />;
}
