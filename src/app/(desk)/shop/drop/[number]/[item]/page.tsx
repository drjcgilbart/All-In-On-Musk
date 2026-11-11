import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { dropLabel, dropSku, getDropItemPage, variantLabel } from "@/lib/drops";
import { formatPrice, type Variant } from "@/lib/shop/catalog";
import { AddToCart } from "@/components/shop/add-to-cart";
import type { CartSnap } from "@/components/shop/cart";
import { DropCountdown } from "@/components/shop/drop-countdown";
import { DropImage } from "@/components/shop/drop-image";

type Props = {
  params: Promise<{ number: string; item: string }>;
  searchParams: Promise<{ asOf?: string | string[] }>;
};

export const dynamic = "force-dynamic";

function previewNow(asOf: string | string[] | undefined) {
  const raw = Array.isArray(asOf) ? asOf[0] : asOf;
  if (process.env.VERCEL_ENV === "production" || !raw || Number.isNaN(Date.parse(raw))) return { now: Date.now(), asOf: undefined as string | undefined };
  return { now: Date.parse(raw), asOf: raw };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { number, item } = await params;
  const { now } = previewNow((await searchParams).asOf);
  const view = await getDropItemPage(number, item, now);
  if (!view || view.phase === "upcoming") return { title: "Not found", robots: { index: false } };
  return {
    title: `${view.item.name} · Daily Drop ${dropLabel(view.drop.number)} · Shop`,
    description: view.item.description || view.drop.description,
    robots: { index: false },
  };
}

export default async function DropProductPage({ params, searchParams }: Props) {
  await connection();
  const { number, item: itemRaw } = await params;
  const { now, asOf } = previewNow((await searchParams).asOf);
  const view = await getDropItemPage(number, itemRaw, now);
  if (!view || view.phase === "upcoming") notFound();
  const { drop, item, itemIndex, phase } = view;
  const prices = item.variants.map((v) => v.price ?? item.price);
  const varied = new Set(prices).size > 1;
  const base = item.price;
  const variants: Variant[] = item.variants.map((v, vi) => {
    const size = variantLabel(v, item.variants);
    const price = v.price ?? item.price;
    return {
      sku: dropSku(drop.number, itemIndex, vi),
      label: varied ? `${size} · ${formatPrice(price)}` : size,
      printfulVariantId: v.id,
      priceCents: price,
    };
  });
  const snaps: Record<string, CartSnap> = Object.fromEntries(item.variants.map((v, vi) => {
    const price = v.price ?? item.price;
    return [dropSku(drop.number, itemIndex, vi), { name: item.name, label: variantLabel(v, item.variants), priceCents: price, image: item.mockups[0] }];
  }));
  const upcharges = item.variants.filter((v) => (v.price ?? item.price) !== base);

  return (
    <div className="shop-product" data-drop={dropLabel(drop.number)} data-state={phase}>
      {item.mockups[0] ? (
        <DropImage className="shop-pimg" src={item.mockups[0]} alt={`${item.name} mockup`} width={1000} height={1000} priority />
      ) : null}
      <div>
        <Link href={asOf ? `/shop?asOf=${encodeURIComponent(asOf)}` : "/shop"} className="shop-mono">← All merch</Link>
        <p className="drop-kicker">
          <span className="shop-limited">Daily Drop {dropLabel(drop.number)}</span>
          {drop.sample ? <span className="drop-sample-flag">Sample · not for sale on the live shop</span> : null}
        </p>
        <h1 className="page-title shop-ptitle">{item.name}</h1>
        {item.tagline ? <p className="shop-tag shop-tag-lg">{item.tagline}</p> : null}
        <p className="shop-price shop-price-lg">
          {varied && item.type === "tee" ? (
            <>
              {formatPrice(base)}{" "}
              <span className="shop-tag">{upcharges.map((v) => `${v.size} +${formatPrice((v.price ?? base) - base)}`).join(", ")}</span>
            </>
          ) : varied ? (
            `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}`
          ) : (
            formatPrice(base)
          )}
        </p>
        {phase === "live" ? <DropCountdown endsAt={drop.ends_at} /> : null}
        {phase === "ended" ? <p className="lede">This drop has ended. Retired drops are not for sale.</p> : null}
        {phase === "preview-only" ? <p className="lede">Sample drop. Not for sale on this shop.</p> : null}
        <p className="lede">{item.description || drop.description}</p>
        {phase === "live" ? <AddToCart variants={variants} snaps={snaps} /> : null}
        {item.type === "tee" && item.variants.length > 1 ? (
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
        <p className="shop-mono shop-note">Printed on demand · ships in about 3–7 business days</p>
        {asOf ? <p className="shop-mono drop-clock-note">Showing this drop as of {new Date(now).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" })} ET.</p> : null}
      </div>
    </div>
  );
}
