import type Stripe from "stripe";
import { createHash } from "crypto";
import { findVariant, variantFiles, variantPriceCents } from "./catalog";
import { siteUrl } from "./config";

/** Printful external_id is length-limited (TODO: confirm 32 vs 64); derive a stable short id from the session id. */
export function externalIdFor(sessionId: string) {
  return "aiom_" + createHash("sha256").update(sessionId).digest("hex").slice(0, 27);
}

export type PrintfulOrder = {
  external_id: string;
  shipping: string;
  recipient: { name: string; address1: string; address2?: string; city: string; state_code?: string; country_code: string; zip: string; email?: string; phone?: string };
  items: { variant_id: number; quantity: number; external_id: string; name: string; retail_price: string; files: { type: string; url: string }[] }[];
  retail_costs?: { currency: string; shipping: string };
};

/** Public URL Printful downloads a print file from. On Vercel preview deployments (behind Deployment Protection), append the automation bypass token. */
function printFileUrl(path: string): string {
  const url = siteUrl() + path;
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (process.env.VERCEL_ENV === "preview" && bypass) {
    return `${url}${url.includes("?") ? "&" : "?"}x-vercel-protection-bypass=${encodeURIComponent(bypass)}`;
  }
  return url;
}

function lineSku(li: Stripe.LineItem) {
  const product = li.price?.product as Stripe.Product | string | undefined;
  return typeof product === "object" ? product?.metadata?.sku : undefined;
}

/** Split a session's line items: self-fulfilled (pins) vs Printful. Unknown skus stay on the Printful side so they still error loudly. */
export function selfFulfilledLines(session: Stripe.Checkout.Session) {
  return (session.line_items?.data ?? []).flatMap((li) => {
    const sku = lineSku(li);
    const found = sku ? findVariant(sku) : undefined;
    return found?.product.selfFulfilled ? [{ sku: sku!, name: found.product.name, label: found.variant.label, quantity: li.quantity ?? 1 }] : [];
  });
}
export function printfulLines(session: Stripe.Checkout.Session) {
  return (session.line_items?.data ?? []).filter((li) => {
    const sku = lineSku(li);
    return !(sku && findVariant(sku)?.product.selfFulfilled);
  });
}

/** Map a completed Stripe session (with expanded line_items.data.price.product) to a Printful order body. */
export function sessionToPrintfulOrder(session: Stripe.Checkout.Session): PrintfulOrder {
  type Ship = { name?: string | null; address?: Stripe.Address | null } | null | undefined;
  const loose = session as unknown as { collected_information?: { shipping_details?: Ship }; shipping_details?: Ship };
  const details = loose.collected_information?.shipping_details ?? loose.shipping_details;
  const addr = details?.address;
  if (!addr?.line1 || !addr?.country) throw new Error("Session has no shipping address");
  const lines = printfulLines(session);
  if (!lines.length) throw new Error("Session has no Printful line items");

  const items = lines.map((li) => {
    const product = li.price?.product as Stripe.Product | string | undefined;
    const sku = typeof product === "object" ? product?.metadata?.sku : undefined;
    const found = sku ? findVariant(sku) : undefined;
    if (!found) throw new Error(`Unmapped line item sku=${sku ?? "none"}`);
    return {
      variant_id: found.variant.printfulVariantId,
      quantity: li.quantity ?? 1,
      external_id: sku!,
      name: `${found.product.name} (${found.variant.label})`,
      retail_price: (variantPriceCents(found.product, found.variant) / 100).toFixed(2),
      files: variantFiles(found.product, found.variant).map((f) => ({ type: f.type, url: printFileUrl(f.path) })),
      ...(found.product.options ? { options: found.product.options } : {}),
    };
  });

  return {
    external_id: externalIdFor(session.id),
    shipping: "STANDARD",
    recipient: {
      name: details?.name || session.customer_details?.name || "Customer",
      address1: addr.line1,
      address2: addr.line2 || undefined,
      city: addr.city || "",
      state_code: addr.state || undefined,
      country_code: addr.country,
      zip: addr.postal_code || "",
      email: session.customer_details?.email || undefined,
      phone: session.customer_details?.phone || undefined,
    },
    items,
    retail_costs: { currency: "USD", shipping: ((session.shipping_cost?.amount_total ?? 0) / 100).toFixed(2) },
  };
}

export async function createPrintfulOrder(order: PrintfulOrder, confirm: boolean, fetchImpl: typeof fetch = fetch) {
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token || token.includes("REPLACE_ME")) throw new Error("PRINTFUL_API_TOKEN is not configured");
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (process.env.PRINTFUL_STORE_ID) headers["X-PF-Store-Id"] = process.env.PRINTFUL_STORE_ID;
  const res = await fetchImpl(`https://api.printful.com/orders?confirm=${confirm ? "true" : "false"}`, {
    method: "POST", headers, body: JSON.stringify(order),
  });
  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string }; result?: unknown };
  if (!res.ok) throw new Error(`Printful ${res.status}: ${body?.error?.message ?? String(body?.result ?? "unknown")}`);
  return body.result as { id: number; status: string };
}
