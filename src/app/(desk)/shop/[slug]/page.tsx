import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PRODUCTS, getProduct, formatPrice } from "@/lib/shop/catalog";
import { AddToCart } from "@/components/shop/add-to-cart";
import { SideSwitcher } from "@/components/shop/side-switcher";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  return p
    ? { title: `${p.name} · Shop`, description: p.description, alternates: { canonical: `/shop/${p.slug}` } }
    : { title: "Not found" };
}

export default async function ProductPage({ params }: Props) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  return (
    <div className="shop-product">
      {p.sides && p.sides.length > 1 ? (
        <SideSwitcher name={p.name} sides={p.sides} initial={Math.max(0, p.sides.findIndex((s) => s.image === p.image))} />
      ) : (
        <Image className="shop-pimg" src={p.image} alt={p.selfFulfilled ? `${p.name} preview` : `${p.name} mockup`} width={1000} height={1000} sizes="(max-width: 760px) 100vw, 50vw" priority />
      )}
      <div>
        <Link href="/shop" className="shop-mono">← All merch</Link>
        <h1 className="page-title shop-ptitle">{p.name}</h1>
        <p className="shop-tag shop-tag-lg">{p.tagline}</p>
        <p className="shop-price shop-price-lg">{formatPrice(p.priceCents)}</p>
        {p.preorder ? <p className="shop-mono shop-preorder shop-preorder-lg">{p.preorder}</p> : null}
        <p className="lede">{p.description}</p>
        <AddToCart variants={p.variants} />
        {p.variants.length > 1 ? (
          <details className="shop-sizechart">
            <summary className="shop-mono">Size chart (inches, approx.)</summary>
            <table>
              <thead><tr><th>Size</th><th>Chest width</th><th>Length</th></tr></thead>
              <tbody>
                {[["S", 18, 28], ["M", 20, 29], ["L", 22, 30], ["XL", 24, 31], ["2XL", 26, 32], ["3XL", 28, 33]].map(([s, w, l]) => (
                  <tr key={s}><td>{s}</td><td>{w}</td><td>{l}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="shop-tag">Unisex fit, measured flat. Made to order, so wrong-size returns are not accepted. <Link href="/shop/returns">Returns policy</Link></p>
          </details>
        ) : null}
        <p className="shop-mono shop-note">{p.selfFulfilled ? "Pre-order · made in a small batch and mailed by All In On Musk" : "Printed on demand · ships in about 3–7 business days"}</p>
      </div>
    </div>
  );
}
