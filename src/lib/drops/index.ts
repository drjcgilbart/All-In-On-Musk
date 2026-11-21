// Daily Drops. The committed file is the fallback. A Redis value at "shop:drops"
// (the same JSON object, or a bare array) replaces it entirely at request time.
// An invalid override is ignored and logged. An empty drops array is valid and
// means "no drops", which does not fall back to the file.
import { cache } from "react";
import fileData from "@/data/drops.json";
import { redisFromEnv } from "@/lib/shop/idempotency";
import { logError } from "@/lib/shop/log";
import {
  DROPS_KV_KEY,
  DROP_FILES_PREFIX,
  decodeFilesValue,
  describeDropSku,
  dropPhase,
  filesMetadataValue,
  isActive,
  validateDrops,
  type Drop,
  type DropQuote,
  type ShopClock,
} from "./schema";

export {
  DROPS_KV_KEY,
  dropItemPath,
  dropLabel,
  dropSku,
  isDropSku,
  resolveDropPurchase,
  describeDropSku,
  dropPhase,
  variantLabel,
} from "./schema";
export type { Drop, DropItem, DropPhase, DropPurchase, ShopClock } from "./schema";

export function shopClock(now = Date.now()): ShopClock {
  const production = process.env.VERCEL_ENV === "production";
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  // A live Stripe key must not be able to sell the committed sample, on production or on a preview that shares it.
  const allowSamplePurchase = !production && !key.startsWith("sk_live");
  return { now, production, allowSamplePurchase };
}

function fileDrops(): Drop[] {
  const parsed = validateDrops(fileData);
  if (!parsed.ok) {
    logError("drops", new Error(parsed.error), { source: "file" });
    return [];
  }
  return parsed.drops;
}

export const loadDrops = cache(async (): Promise<Drop[]> => {
  const fallback = fileDrops();
  try {
    const redis = redisFromEnv();
    if (!redis) return fallback;
    const value = await redis.get(DROPS_KV_KEY);
    if (value == null || value === "") return fallback;
    const raw = typeof value === "string" ? JSON.parse(value) : value;
    const parsed = validateDrops(raw);
    if (!parsed.ok) {
      logError("drops", new Error(parsed.error), { source: "redis" });
      return fallback;
    }
    return parsed.drops;
  } catch (err) {
    logError("drops", err, { source: "redis" });
    return fallback;
  }
});

function visible(drop: Drop, clock: ShopClock) {
  return dropPhase(drop, clock) !== "hidden";
}

export async function getActiveDrop(now = Date.now()): Promise<Drop | null> {
  const clock = shopClock(now);
  const active = (await loadDrops()).filter((d) => visible(d, clock) && isActive(d, clock.now));
  active.sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at));
  return active[0] ?? null;
}

/** Most recently ended drop that this deploy is allowed to show. */
export async function getEndedDrop(now = Date.now()): Promise<Drop | null> {
  const clock = shopClock(now);
  const ended = (await loadDrops()).filter((d) => visible(d, clock) && Date.parse(d.ends_at) <= clock.now);
  ended.sort((a, b) => Date.parse(b.ends_at) - Date.parse(a.ends_at));
  return ended[0] ?? null;
}

export async function getDropItemPage(numberRaw: string, itemRaw: string, now = Date.now()) {
  if (!/^\d{1,4}$/.test(numberRaw) || !/^\d{1,2}$/.test(itemRaw)) return null;
  const number = Number(numberRaw);
  const itemIndex = Number(itemRaw);
  const clock = shopClock(now);
  const drop = (await loadDrops()).find((d) => d.number === number);
  const item = drop?.items[itemIndex];
  if (!drop || !item || !visible(drop, clock)) return null;
  return { drop, item, itemIndex, phase: dropPhase(drop, clock), clock };
}

export async function quoteDropSkus(skus: string[], now = Date.now()): Promise<DropQuote[]> {
  const clock = shopClock(now);
  const drops = await loadDrops();
  return skus.filter((s) => typeof s === "string").slice(0, 20).map((sku) => describeDropSku(drops, sku, clock));
}

/** Inline print-file URLs on the Stripe product when they fit; otherwise spill to Redis for the webhook. */
export async function filesMetadata(files: { type: string; url: string }[]): Promise<Record<string, string>> {
  const packed = filesMetadataValue(files);
  if (packed.mode === "inline") return { files: packed.files };
  const redis = redisFromEnv();
  if (!redis) throw new Error("Drop print files need the shop cache, which is not configured.");
  const { randomBytes } = await import("crypto");
  const ref = randomBytes(9).toString("base64url");
  await redis.set(`${DROP_FILES_PREFIX}${ref}`, JSON.stringify(files), { ex: 60 * 60 * 24 * 21 });
  return { files_ref: ref };
}

export async function filesFromMetadata(meta: Record<string, string | undefined> | null | undefined) {
  if (!meta) return null;
  if (meta.files) return decodeFilesValue(meta.files);
  if (meta.files_ref && /^[A-Za-z0-9_-]{8,32}$/.test(meta.files_ref)) {
    const redis = redisFromEnv();
    if (!redis) return null;
    const value = await redis.get(`${DROP_FILES_PREFIX}${meta.files_ref}`);
    return decodeFilesValue(value);
  }
  return null;
}
