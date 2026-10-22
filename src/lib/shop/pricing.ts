import { CURRENCY, findVariant, variantPriceCents } from "./catalog";

export type CartLine = { sku: string; qty: number };
export const MAX_QTY = 10;

export class PricingError extends Error {}

/** Turn untrusted client cart lines into Stripe line items using server prices only. */
export function buildLineItems(input: unknown, opts: { taxBehavior?: "exclusive" | "inclusive" } = {}) {
  if (!Array.isArray(input) || input.length === 0) throw new PricingError("Cart is empty");
  if (input.length > 20) throw new PricingError("Too many lines");
  const merged = new Map<string, number>();
  for (const raw of input) {
    const r = (raw ?? {}) as { sku?: unknown; qty?: unknown };
    const sku = r.sku;
    const qty = Number(r.qty);
    if (typeof sku !== "string" || !findVariant(sku)) throw new PricingError(`Unknown item: ${String(sku).slice(0, 40)}`);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new PricingError("Invalid quantity");
    merged.set(sku, Math.min(MAX_QTY, (merged.get(sku) ?? 0) + qty));
  }
  let subtotal = 0;
  const lineItems = [...merged].map(([sku, qty]) => {
    const { product, variant } = findVariant(sku)!;
    const unit = variantPriceCents(product, variant);
    subtotal += unit * qty;
    return {
      quantity: qty,
      price_data: {
        currency: CURRENCY,
        unit_amount: unit,
        ...(opts.taxBehavior ? { tax_behavior: opts.taxBehavior } : {}),
        product_data: {
          name: `${product.name} · ${product.tagline}`,
          description: variant.label,
          metadata: { sku },
          tax_code: product.taxCode,
        },
      },
    };
  });
  return { lineItems, subtotal };
}
