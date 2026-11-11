import { filesMetadata, loadDrops, shopClock } from "@/lib/drops";
import { isDropSku, resolveDropPurchase } from "@/lib/drops/schema";
import { absolutePrintUrl } from "./printful";
import { CURRENCY, findVariant, variantPriceCents } from "./catalog";

export type CartLine = { sku: string; qty: number };
export const MAX_QTY = 10;

export class PricingError extends Error {}

/** Turn untrusted client cart lines into Stripe line items using server prices only. */
export async function buildLineItems(input: unknown, opts: { taxBehavior?: "exclusive" | "inclusive" } = {}) {
  if (!Array.isArray(input) || input.length === 0) throw new PricingError("Cart is empty");
  if (input.length > 20) throw new PricingError("Too many lines");
  const merged = new Map<string, number>();
  for (const raw of input) {
    const r = (raw ?? {}) as { sku?: unknown; qty?: unknown };
    const sku = r.sku;
    const qty = Number(r.qty);
    if (typeof sku !== "string" || (!findVariant(sku) && !isDropSku(sku))) throw new PricingError(`Unknown item: ${String(sku).slice(0, 40)}`);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new PricingError("Invalid quantity");
    merged.set(sku, Math.min(MAX_QTY, (merged.get(sku) ?? 0) + qty));
  }
  const clock = shopClock();
  const drops = [...merged.keys()].some(isDropSku) ? await loadDrops() : [];
  let subtotal = 0;
  const lineItems = [];
  for (const [sku, qty] of merged) {
    const found = findVariant(sku);
    if (found) {
      const { product, variant } = found;
      const unit = variantPriceCents(product, variant);
      subtotal += unit * qty;
      lineItems.push({
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
      });
      continue;
    }
    const resolved = resolveDropPurchase(drops, sku, clock);
    if (!resolved.ok) throw new PricingError(resolved.error);
    const item = resolved.item;
    let urls;
    try {
      urls = item.files.map((f) => ({ type: f.type, url: absolutePrintUrl(f) }));
    } catch {
      throw new PricingError("That drop item isn't available.");
    }
    let fileMeta: Record<string, string>;
    try {
      fileMeta = await filesMetadata(urls);
    } catch {
      throw new PricingError("That drop item isn't available.");
    }
    subtotal += item.priceCents * qty;
    const name = item.tagline ? `${item.name} · ${item.tagline}` : item.name;
    lineItems.push({
      quantity: qty,
      price_data: {
        currency: CURRENCY,
        unit_amount: item.priceCents,
        ...(opts.taxBehavior ? { tax_behavior: opts.taxBehavior } : {}),
        product_data: {
          name,
          description: item.label,
          metadata: {
            sku,
            label: item.label,
            item_name: item.name,
            pf_variant: String(item.printfulVariantId),
            pf_product: String(item.printfulProductId),
            color: item.color,
            sample: item.sample ? "1" : "0",
            ...fileMeta,
          },
          tax_code: item.taxCode,
        },
      },
    });
  }
  return { lineItems, subtotal };
}
