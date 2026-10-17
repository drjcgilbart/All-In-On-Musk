"use client";
import { useState } from "react";
import Link from "next/link";
import type { Variant } from "@/lib/shop/catalog";
import { useCart } from "./cart";

export function AddToCart({ variants }: { variants: Variant[] }) {
  const single = variants.length === 1;
  const [sku, setSku] = useState<string | null>(single ? variants[0].sku : null);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  return (
    <div className="shop-buy">
      {single ? (
        <p className="shop-mono">{variants[0].label}</p>
      ) : (
        <>
          <p className="shop-mono">Size</p>
          <div className="shop-sizes">
            {variants.map((v) => (
              <button key={v.sku} type="button" className="shop-size" aria-pressed={sku === v.sku} onClick={() => setSku(v.sku)}>
                {v.label}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="shop-actions">
        <button
          type="button"
          className="shop-btn"
          disabled={!sku}
          onClick={() => {
            if (sku) {
              add(sku);
              setAdded(true);
            }
          }}
        >
          {sku ? "Add to cart" : "Pick a size"}
        </button>
        {added ? (
          <Link className="shop-btn ghost" href="/shop/cart">View cart</Link>
        ) : null}
      </div>
      {added ? <p className="shop-mono shop-ok" role="status">Added. Payload loaded.</p> : null}
    </div>
  );
}
