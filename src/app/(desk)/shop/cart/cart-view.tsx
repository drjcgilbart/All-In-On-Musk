"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/shop/cart";
import { findVariant, formatPrice, variantPriceCents } from "@/lib/shop/catalog";

export function CartView({ checkoutEnabled }: { checkoutEnabled: boolean }) {
  const { items, setQty, remove, ready } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lines = items.flatMap((i) => {
    const f = findVariant(i.sku);
    return f ? [{ ...i, ...f }] : [];
  });
  const subtotal = lines.reduce((n, l) => n + variantPriceCents(l.product, l.variant) * l.qty, 0);

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map(({ sku, qty }) => ({ sku, qty })) }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <>
      <p className="kicker">Cart</p>
      <h1 className="page-title">Payload bay</h1>
      {!ready ? null : lines.length === 0 ? (
        <p className="lede">
          Payload bay empty. <Link href="/shop">Load some merch →</Link>
        </p>
      ) : (
        <div className="shop-panel">
          {lines.map((l) => (
            <div className="shop-line" key={l.sku}>
              <Image src={l.product.image} alt="" width={72} height={72} />
              <div>
                <div>{l.product.name}</div>
                <div className="shop-mono">
                  {l.variant.label} · {formatPrice(variantPriceCents(l.product, l.variant))}
                </div>
              </div>
              <input aria-label={`Quantity for ${l.product.name}`} className="shop-qty" type="number" min={1} max={10} value={l.qty} onChange={(e) => setQty(l.sku, Number(e.target.value))} />
              <button type="button" className="shop-x" onClick={() => remove(l.sku)}>
                remove
              </button>
            </div>
          ))}
          <div className="shop-row shop-total">
            <div>
              <p className="shop-mono">Subtotal</p>
              <p className="shop-price shop-price-lg">{formatPrice(subtotal)}</p>
              <p className="shop-tag">Shipping is added at checkout. Sales tax is not collected yet.</p>
            </div>
            {checkoutEnabled ? (
              <button type="button" className="shop-btn" onClick={checkout} disabled={busy}>
                {busy ? "Contacting ground…" : "Checkout"}
              </button>
            ) : (
              <p className="shop-note shop-soon" role="status">
                <strong>Checkout opens soon.</strong> The shop is open for browsing while we finish setting up. Your cart is saved on this device.
              </p>
            )}
          </div>
          {error ? <p className="shop-err" role="alert">{error}</p> : null}
        </div>
      )}
    </>
  );
}
