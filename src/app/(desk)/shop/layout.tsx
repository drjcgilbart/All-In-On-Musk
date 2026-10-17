import Link from "next/link";
import { ShopBar } from "@/components/shop/shop-bar";
import "./shop.css";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shop">
      <ShopBar />
      {children}
      <p className="shop-fine shop-policy-links">
        <Link href="/shop/returns">Returns and refunds</Link> · <Link href="/shop/privacy">Privacy</Link> ·{" "}
        <a href="mailto:admin@allinonmusk.com">admin@allinonmusk.com</a>
      </p>
      <p className="shop-fine">
        Unofficial fan merch. Not affiliated with, endorsed by, or sponsored by Elon Musk, Tesla, SpaceX, xAI, Neuralink,
        The Boring Company or any of their companies. Printed on demand and shipped by our print partner.
      </p>
    </div>
  );
}
