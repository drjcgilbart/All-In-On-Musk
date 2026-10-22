import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PRODUCTS, LIMITED_LABEL } from "@/lib/shop/catalog";
import { ProductCard } from "@/components/shop/product-card";
import "../../shop/shop.css";

export const metadata: Metadata = {
  title: "Send It: Canyon Jump 2026 · Limited edition merch",
  description: "Limited edition Canyon Jump tee, sticker and poster are available now in the All In On Musk shop.",
  alternates: { canonical: "/news/canyon-jump" },
  openGraph: { images: ["/shop/canyon-jump-art.webp"] },
};

export default function CanyonJumpPost() {
  const items = PRODUCTS.filter((p) => p.limited);
  return (
    <article className="shop cj-post">
      <p className="kicker">News {"\u00b7"} Merch drop {"\u00b7"} 22 Oct 2026</p>
      <h1 className="page-title">Send It: Canyon Jump 2026 is live.</h1>
      <p><span className="shop-limited">{LIMITED_LABEL}</span></p>
      <p className="lede">
        A brand-new roadster lights its cold-gas thrusters and clears the whole fleet, parked on the rim of a red-rock canyon. It is
        the most send-it thing we could draw, so we put it on a tee, a sticker and a poster. Limited edition, available now.
      </p>

      <div className="shop-product">
        <Image className="shop-pimg" src="/shop/canyon-jump-art.webp" alt="Send It: Canyon Jump 2026 artwork: a roadster jumping a line of vehicles over a canyon at sunset" width={864} height={1152} sizes="(max-width: 760px) 100vw, 50vw" style={{ aspectRatio: "3 / 4" }} priority />
        <div>
          <h2>What is in the drop</h2>
          <ul className="lede">
            <li><Link href="/shop/canyon-jump-tee">Canyon Jump Tee</Link>: big front print on a soft black Bella+Canvas tee, S to 3XL.</li>
            <li><Link href="/shop/canyon-jump-sticker">Canyon Jump Sticker</Link>: 4 in kiss-cut vinyl for the laptop lid.</li>
            <li><Link href="/shop/canyon-jump-poster">Canyon Jump Poster</Link>: enhanced matte, 18x24 or 12x16 in.</li>
          </ul>
          <p className="lede">Everything is printed on demand and ships in about 3 to 7 business days. When the drop is done, it is done.</p>
          <p><Link className="shop-btn" href="/shop">Shop the drop →</Link></p>
          <p className="shop-tag">Unofficial fan merch. Not affiliated with any carmaker or rocket company.</p>
        </div>
      </div>

      <div className="shop-grid">
        {items.map((p, i) => (
          <ProductCard key={p.slug} p={p} index={i} />
        ))}
      </div>
    </article>
  );
}
