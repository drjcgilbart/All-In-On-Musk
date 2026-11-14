"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart, getCartId, clearCartStorage, readOrders, type LocalOrder } from "@/components/shop/cart";
import { DropImage } from "@/components/shop/drop-image";
import { findVariant, formatPrice, variantPriceCents } from "@/lib/shop/catalog";
import { isDropSku } from "@/lib/drops/schema";

type Quote = { sku: string; available?: boolean; reason?: string; name?: string; label?: string; priceCents?: number; image?: string };

export function CartView({ checkoutEnabled }: { checkoutEnabled: boolean }) {
  const { items, setQty, remove, ready } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  // Backup: if the webhook marked this cart as paid (e.g. the success page never loaded), drop it so it can't be re-billed.
  useEffect(() => {
    if (!ready) return;
    const id = getCartId();
    fetch(`/api/cart/status?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { completed?: boolean }) => { if (d.completed && getCartId() === id) clearCartStorage(); })
      .catch(() => {})
      .finally(() => setOrders(readOrders()));
  }, [ready]);
  const dropSkus = items.map((i) => i.sku).filter(isDropSku).join(",");
  useEffect(() => {
    if (!dropSkus) return;
    const skus = dropSkus.split(",");
    fetch("/api/drops/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus }),
    })
      .then((r) => r.json())
      .then((d: { items?: Quote[] }) => {
        const next: Record<string, Quote> = {};
        for (const row of d.items ?? []) if (row?.sku) next[row.sku] = row;
        setQuotes(next);
      })
      .catch(() => {});
  }, [dropSkus]);
  const lines = items.flatMap((i) => {
    const f = findVariant(i.sku);
    if (f) {
      return [{
        sku: i.sku,
        qty: i.qty,
        name: f.product.name,
        label: f.variant.label,
        price: variantPriceCents(f.product, f.variant),
        image: f.product.image,
        available: true,
        reason: undefined as string | undefined,
      }];
    }
    const q = quotes[i.sku];
    const name = q?.name || i.snap?.name;
    const price = q?.priceCents ?? i.snap?.priceCents;
    const image = q?.image || i.snap?.image;
    if (!name || price == null || !image) return [];
    return [{
      sku: i.sku,
      qty: i.qty,
      name,
      label: q?.label || i.snap?.label || "",
      price,
      image,
      available: q ? q.available !== false : true,
      reason: q?.available === false ? q.reason : undefined,
    }];
  });
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map(({ sku, qty }) => ({ sku, qty })), cartId: getCartId() }),
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
              <DropImage src={l.image} alt="" width={72} height={72} />
              <div>
                <div>{l.name}</div>
                <div className="shop-mono">
                  {l.label} · {formatPrice(l.price)}
                </div>
                {l.reason ? <div className="shop-err">{l.reason}</div> : null}
              </div>
              <input aria-label={`Quantity for ${l.name}`} className="shop-qty" type="number" min={1} max={10} value={l.qty} onChange={(e) => setQty(l.sku, Number(e.target.value))} />
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
              <button type="button" className="shop-btn" onClick={checkout} disabled={busy || lines.some((l) => !l.available)}>
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
      {orders.length ? (
        <section className="shop-panel" aria-labelledby="past-orders-h" style={{ marginTop: 24 }}>
          <h2 id="past-orders-h" className="shop-mono">Your orders on this device</h2>
          {orders.map((o) => (
            <div className="shop-row" key={o.orderNumber}>
              <span>{new Date(o.date).toLocaleDateString()} · {o.items.map((i) => `${i.quantity}× ${i.name}${i.variant ? ` (${i.variant})` : ""}`).join(", ")}</span>
              <span className="shop-mono">{formatPrice(o.totalCents)} · {o.orderNumber}</span>
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}
