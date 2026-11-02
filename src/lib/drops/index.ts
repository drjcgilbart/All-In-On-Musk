// Daily Drops: data-driven. Source of truth is src/data/drops.json; an optional Redis/KV
// value at key "shop:drops" (same JSON shape, or a bare array) overrides it at runtime.
// Retired drops (now >= ends_at) are never returned.
import fileData from "@/data/drops.json";
import { redisFromEnv } from "@/lib/shop/idempotency";

export const DROPS_KV_KEY = "shop:drops";

export type DropVariant = { id: number; size: string; color: string };
export type DropItem = {
  type: "tee" | "mug" | "sticker";
  name: string;
  price: number; // cents
  printful_product_id: number;
  variants: DropVariant[];
  print_files: { type: string; path: string }[] | string[];
  mockups: string[];
};
export type Drop = {
  number: number;
  title: string;
  starts_at: string; // ISO with ET offset, e.g. 2026-11-02T09:00:00-05:00
  ends_at: string;
  description: string;
  placeholder?: boolean; // placeholder drops are never purchasable
  items: DropItem[];
};

function normalize(raw: unknown): Drop[] {
  const list = Array.isArray(raw) ? raw : (raw as { drops?: unknown })?.drops;
  if (!Array.isArray(list)) return [];
  return list.filter(
    (d): d is Drop =>
      !!d && typeof d.number === "number" && typeof d.title === "string" &&
      !Number.isNaN(Date.parse(d.starts_at)) && !Number.isNaN(Date.parse(d.ends_at)) && Array.isArray(d.items),
  );
}

export async function loadDrops(): Promise<Drop[]> {
  try {
    const redis = redisFromEnv();
    if (redis) {
      const v = await redis.get(DROPS_KV_KEY);
      if (v) {
        const parsed = normalize(typeof v === "string" ? JSON.parse(v) : v);
        if (parsed.length) return parsed;
      }
    }
  } catch {
    /* fall back to file */
  }
  return normalize(fileData);
}

export function isActive(d: Drop, now = Date.now()) {
  return Date.parse(d.starts_at) <= now && now < Date.parse(d.ends_at);
}

export async function getActiveDrop(now = Date.now()): Promise<Drop | null> {
  const active = (await loadDrops()).filter((d) => isActive(d, now));
  active.sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at));
  return active[0] ?? null;
}

export const dropLabel = (n: number) => `#${String(n).padStart(3, "0")}`;

// Drop item SKUs: "drop-<number>-<itemIndex>-<variantIndex>"
export const dropSku = (n: number, i: number, v: number) => `drop-${n}-${i}-${v}`;
export const isDropSku = (sku: unknown): sku is string => typeof sku === "string" && sku.startsWith("drop-");

/** Server-side check for drop SKUs in a cart. Returns an error message, or null if OK. */
export async function checkDropSkus(items: unknown, now = Date.now()): Promise<string | null> {
  if (!Array.isArray(items)) return null;
  const skus = items.map((r) => (r as { sku?: unknown })?.sku).filter(isDropSku);
  if (!skus.length) return null;
  const drops = await loadDrops();
  for (const sku of skus) {
    const m = /^drop-(\d+)-(\d+)-(\d+)$/.exec(sku);
    const d = m && drops.find((x) => x.number === Number(m[1]));
    const item = d && d.items[Number(m![2])];
    if (!d || !item || !item.variants[Number(m![3])]) return "That drop item isn't available.";
    if (!isActive(d, now)) return "That drop has ended.";
    if (d.placeholder) return "That drop item isn't available.";
  }
  // Drop items are not yet wired into pricing/fulfillment; refuse rather than mis-charge.
  return "Drop items can't be checked out yet.";
}
