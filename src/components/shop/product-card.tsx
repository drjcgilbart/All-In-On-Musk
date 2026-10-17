import Link from "next/link";
import Image from "next/image";
import { type Product, formatPrice } from "@/lib/shop/catalog";

export function ProductCard({ p, index }: { p: Product; index: number }) {
  return (
    <Link href={`/shop/${p.slug}`} className="shop-card">
      <Image src={p.image} alt={`${p.name} mockup`} width={800} height={800} sizes="(max-width: 760px) 100vw, 33vw" priority={index === 0} />
      <div className="shop-card-body">
        <p className="shop-mono">
          {String(index + 1).padStart(2, "0")} · {p.variants.length > 1 ? "S–3XL" : p.variants[0].label}
        </p>
        <h2>{p.name}</h2>
        <div className="shop-row">
          <span className="shop-tag">{p.tagline}</span>
          <span className="shop-price">{formatPrice(p.priceCents)}</span>
        </div>
      </div>
    </Link>
  );
}
