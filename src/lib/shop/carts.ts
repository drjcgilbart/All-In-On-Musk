import type { DedupeStore } from "./idempotency";
import { siteUrl } from "./config";

/** Cart ids are random client ids (uuid-ish). Anything else is ignored. */
export function validCartId(v: unknown): string | null {
  return typeof v === "string" && /^[A-Za-z0-9-]{8,64}$/.test(v) ? v : null;
}

const key = (id: string) => `cart-done:${id}`;

/** Record that a cart was paid for, so any device still holding it drops it on load. */
export async function markCartCompleted(store: DedupeStore, cartId: string) {
  await store.add(key(cartId));
}

export async function isCartCompleted(store: DedupeStore, cartId: string) {
  return store.has(key(cartId));
}

const ALLOWED_HOSTS = ["allinonmusk.com", "www.allinonmusk.com"];

/**
 * Origin Stripe should send the shopper back to. The cart lives in localStorage, which is per-origin, so the
 * success page must be on the SAME host the checkout started from (www vs apex was the Oct 21 bug).
 */
export function returnOrigin(req: Request): string {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").toLowerCase().split(",")[0].trim();
  const vercelHost = (process.env.VERCEL_URL || "").toLowerCase();
  const ok =
    ALLOWED_HOSTS.includes(host) ||
    (host && host === vercelHost) ||
    /^all-in-on-musk-[a-z0-9-]+-the-villages-artisan-guild\.vercel\.app$/.test(host) ||
    /^localhost(:\d+)?$/.test(host);
  if (!ok) return siteUrl();
  const proto = /^localhost/.test(host) ? "http" : "https";
  return `${proto}://${host}`;
}
