import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PRODUCTS, PRODUCT_TYPES, type ProductType } from "@/lib/shop/catalog";
import { ProductCard } from "@/components/shop/product-card";

export const metadata: Metadata = {
  title: "Shop",
  description: "Unofficial All In On Musk fan merch, printed on demand.",
  alternates: { canonical: "/shop" },
};

type Props = { searchParams: Promise<{ type?: string | string[] }> };

export default async function ShopPage({ searchParams }: Props) {
  const raw = (await searchParams).type;
  const wanted = Array.isArray(raw) ? raw[0] : raw;
  const active = PRODUCT_TYPES.find((t) => t.id === wanted)?.id as ProductType | undefined;
  // Always grouped by type in PRODUCT_TYPES order (tees, hoodies, hats, stickers, patches, posters, water bottles, tumblers).
  const order = (t: ProductType) => PRODUCT_TYPES.findIndex((x) => x.id === t);
  const sorted = PRODUCTS.map((p, i) => ({ p, i }))
    .sort((a, b) => Number(!!b.p.limited) - Number(!!a.p.limited) || order(a.p.type) - order(b.p.type) || a.i - b.i)
    .map((x) => x.p);
  const shown = active ? sorted.filter((p) => p.type === active) : sorted;
  const examples = PRODUCT_TYPES.map((t) => ({ ...t, product: PRODUCTS.find((p) => p.type === t.id) })).filter((t) => t.product);
  const featured = PRODUCTS.filter((p) => p.limited);
  const activeLabel = PRODUCT_TYPES.find((t) => t.id === active)?.label;

  return (
    <>
      <p className="kicker">Supply depot {"\u00b7"} printed on demand</p>
      <h1 className="page-title">Merch for the desk</h1>
      <p className="lede">{PRODUCTS.length} items. All tested. Results: excellent data was collected.</p>

      {featured.length && !active ? (
        <section className="shop-hero" aria-labelledby="shop-hero-h">
          <div className="shop-hero-copy">
            <p><span className="shop-limited">Limited edition</span></p>
            <h2 id="shop-hero-h" className="shop-hero-title">Send It: Canyon Jump 2026</h2>
            <p className="lede">A new roadster on cold-gas thrusters, the whole fleet below, one very big canyon. Tee, sticker and poster, available now while the drop lasts.</p>
            <p className="shop-mono"><Link href="/news/canyon-jump">Read the drop notes →</Link></p>
          </div>
          <div className="shop-grid shop-hero-grid">
            {featured.map((p, i) => (
              <ProductCard key={p.slug} p={p} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="shop-types" aria-labelledby="shop-types-h">
        <h2 id="shop-types-h" className="shop-mono shop-types-h">Shop by type</h2>
        <div className="shop-types-row">
          {examples.map((t) => (
            <Link
              key={t.id}
              href={`/shop?type=${t.id}`}
              className="shop-type-tile"
              aria-current={active === t.id ? "page" : undefined}
            >
              <Image src={t.product!.image} alt="" width={240} height={240} sizes="140px" />
              <span>{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <nav className="shop-filters" aria-label="Filter by type">
        <Link href="/shop" className="shop-chip" aria-current={!active ? "page" : undefined} scroll={false}>
          All
        </Link>
        {PRODUCT_TYPES.map((t) => (
          <Link key={t.id} href={`/shop?type=${t.id}`} className="shop-chip" aria-current={active === t.id ? "page" : undefined} scroll={false}>
            {t.label}
          </Link>
        ))}
      </nav>
      <p className="shop-mono shop-count" aria-live="polite">
        {activeLabel ? `${activeLabel}: ${shown.length} item${shown.length === 1 ? "" : "s"}` : `All: ${shown.length} items`}
      </p>

      <div className="shop-grid" data-type={active ?? "all"}>
        {shown.map((p, i) => (
          <ProductCard key={p.slug} p={p} index={i} />
        ))}
      </div>
    </>
  );
}
