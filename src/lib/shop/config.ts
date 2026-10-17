export function shipCountries(): string[] {
  const list = (process.env.SHIP_COUNTRIES || "US").split(",").map((s) => s.trim().toUpperCase()).filter((s) => /^[A-Z]{2}$/.test(s));
  return Array.from(new Set(["US", ...list]));
}
export function shippingRateCents() {
  const n = Number(process.env.SHIPPING_RATE_CENTS ?? 599);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 599;
}
export function siteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  // Preview deployments: fall back to this deployment's own URL so one deploy suffices.
  const preview = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const production = process.env.VERCEL_ENV === "production" ? "https://allinonmusk.com" : "";
  return (fromEnv || preview || production || "http://localhost:3210").replace(/\/$/, "");
}
export function autoConfirm() {
  return process.env.PRINTFUL_AUTO_CONFIRM === "true";
}
/** Master switch for taking orders. Off unless SHOP_CHECKOUT_ENABLED=true (browse-only shop). */
export function checkoutEnabled() {
  return process.env.SHOP_CHECKOUT_ENABLED === "true";
}
/** Stripe Tax. Off unless STRIPE_AUTOMATIC_TAX=true (needs Stripe Tax set up with a registration first). */
export function automaticTax() {
  return process.env.STRIPE_AUTOMATIC_TAX === "true";
}
/** Stripe tax code for shipping charges. */
export const SHIPPING_TAX_CODE = "txcd_92010001";
