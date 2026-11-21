// Strict Daily Drop record. No I/O. Shoppers never see these error strings;
// checkout uses the short messages from resolveDropPurchase.

export const DROPS_KV_KEY = "shop:drops";
export const DROP_FILES_PREFIX = "shop:drop-files:";
export const FILES_META_MAX = 450;

export const DROP_ITEM_TYPES = ["tee", "mug", "sticker"] as const;
export type DropItemType = (typeof DROP_ITEM_TYPES)[number];

export type DropPrintFile = { type: string; path?: string; url?: string };
export type DropVariant = { id: number; size: string; color: string; price?: number };
export type DropItem = {
  type: DropItemType;
  name: string;
  tagline: string;
  description: string;
  price: number;
  printful_product_id: number;
  tax_code: string;
  variants: DropVariant[];
  print_files: DropPrintFile[];
  mockups: string[];
};
export type Drop = {
  number: number;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  placeholder: boolean;
  sample: boolean;
  items: DropItem[];
};

export type ShopClock = { now: number; production: boolean; allowSamplePurchase: boolean };
export type DropPhase = "hidden" | "upcoming" | "live" | "ended" | "preview-only";

export type DropPurchase = {
  sku: string;
  dropNumber: number;
  itemIndex: number;
  name: string;
  tagline: string;
  description: string;
  label: string;
  color: string;
  priceCents: number;
  taxCode: string;
  image: string;
  printfulVariantId: number;
  printfulProductId: number;
  sample: boolean;
  files: DropPrintFile[];
};

export type PrintfulLine = {
  variant_id: number;
  quantity: number;
  external_id: string;
  name: string;
  retail_price: string;
  files: { type: string; url: string }[];
};

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const TAX = /^txcd_\d{8}$/;
const FILE_TYPE = /^[a-z0-9_]{1,40}$/;
const SITE_PATH = /^\/[A-Za-z0-9._~/-]+$/;
const HTTPS_URL = /^https:\/\/[^\s]+$/;
const DEFAULT_TAX: Record<DropItemType, string> = {
  tee: "txcd_30011000",
  mug: "txcd_99999999",
  sticker: "txcd_99999999",
};

export type ValidateResult = { ok: true; drops: Drop[] } | { ok: false; error: string };
export type PurchaseResult = { ok: true; item: DropPurchase } | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function extraKey(o: Record<string, unknown>, allowed: string[]) {
  return Object.keys(o).find((k) => !allowed.includes(k)) ?? null;
}
function text(v: unknown, min: number, max: number) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s.length < min || s.length > max) return null;
  return s;
}
function cents(v: unknown) {
  return typeof v === "number" && Number.isInteger(v) && v >= 100 && v <= 100_000 ? v : null;
}
function whole(v: unknown, min: number, max: number) {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null;
}
function sitePath(v: string) {
  return SITE_PATH.test(v) && !v.includes("..") && !v.includes("//") && v.length <= 240;
}
function httpsUrl(v: string, max = 2000) {
  return HTTPS_URL.test(v) && v.length <= max;
}
function parseIso(v: unknown) {
  if (typeof v !== "string" || !ISO.test(v)) return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}
function asset(v: unknown, label: string): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof v !== "string" || !v.trim()) return fail(`${label} is empty`);
  const s = v.trim();
  if (s.startsWith("/")) return sitePath(s) ? { ok: true, value: s } : fail(`${label} is not a safe site path`);
  if (s.startsWith("https://")) return httpsUrl(s) ? { ok: true, value: s } : fail(`${label} is not a valid https URL`);
  return fail(`${label} must be a site path or https URL`);
}

function parseFile(raw: unknown, label: string): { ok: true; file: DropPrintFile } | { ok: false; error: string } {
  if (!isObj(raw)) return fail(`${label} must be an object`);
  const bad = extraKey(raw, ["type", "path", "url"]);
  if (bad) return fail(`${label} has unexpected field "${bad}"`);
  const type = text(raw.type, 1, 40);
  if (!type || !FILE_TYPE.test(type)) return fail(`${label}.type must be a print placement like "default"`);
  const hasPath = raw.path !== undefined;
  const hasUrl = raw.url !== undefined;
  if (hasPath === hasUrl) return fail(`${label} needs a path or a url, not both`);
  if (hasPath) {
    if (typeof raw.path !== "string" || !sitePath(raw.path.trim())) return fail(`${label}.path is not a safe site path`);
    return { ok: true, file: { type, path: raw.path.trim() } };
  }
  if (typeof raw.url !== "string" || !httpsUrl(raw.url.trim())) return fail(`${label}.url must be https`);
  return { ok: true, file: { type, url: raw.url.trim() } };
}

export function validateDrops(raw: unknown): ValidateResult {
  let list: unknown;
  if (Array.isArray(raw)) list = raw;
  else if (isObj(raw)) {
    const bad = extraKey(raw, ["drops"]);
    if (bad) return fail(`unexpected field "${bad}"`);
    list = raw.drops;
  } else return fail("drop record must be an object or an array");
  if (!Array.isArray(list)) return fail("drops must be an array");
  if (list.length > 30) return fail("too many drops");

  const drops: Drop[] = [];
  const numbers = new Set<number>();
  for (let i = 0; i < list.length; i++) {
    const parsed = parseDrop(list[i], `drops[${i}]`);
    if (!parsed.ok) return parsed;
    if (numbers.has(parsed.drop.number)) return fail(`drops[${i}].number ${parsed.drop.number} is duplicated`);
    numbers.add(parsed.drop.number);
    drops.push(parsed.drop);
  }
  return { ok: true, drops };
}

function parseDrop(raw: unknown, label: string): { ok: true; drop: Drop } | { ok: false; error: string } {
  if (!isObj(raw)) return fail(`${label} must be an object`);
  const bad = extraKey(raw, ["number", "title", "description", "starts_at", "ends_at", "items", "placeholder", "sample"]);
  if (bad) return fail(`${label} has unexpected field "${bad}"`);
  const number = whole(raw.number, 0, 9999);
  if (number === null) return fail(`${label}.number must be an integer from 0 to 9999`);
  const title = text(raw.title, 1, 140);
  if (!title) return fail(`${label}.title must be 1–140 characters`);
  const description = text(raw.description, 1, 2000);
  if (!description) return fail(`${label}.description must be 1–2000 characters`);
  const starts = parseIso(raw.starts_at);
  const ends = parseIso(raw.ends_at);
  if (starts === null) return fail(`${label}.starts_at must be an ISO timestamp with a timezone`);
  if (ends === null) return fail(`${label}.ends_at must be an ISO timestamp with a timezone`);
  if (ends <= starts) return fail(`${label}.ends_at must be after starts_at`);
  if (raw.placeholder !== undefined && typeof raw.placeholder !== "boolean") return fail(`${label}.placeholder must be a boolean`);
  if (raw.sample !== undefined && typeof raw.sample !== "boolean") return fail(`${label}.sample must be a boolean`);
  const placeholder = raw.placeholder === true;
  const sample = raw.sample === true;
  if (placeholder && sample) return fail(`${label} cannot be both placeholder and sample`);
  if (!Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > 8) return fail(`${label}.items must have 1–8 items`);

  const items: DropItem[] = [];
  for (let j = 0; j < raw.items.length; j++) {
    const item = parseItem(raw.items[j], `${label}.items[${j}]`, placeholder);
    if (!item.ok) return item;
    items.push(item.item);
  }
  return { ok: true, drop: { number, title, description, starts_at: String(raw.starts_at), ends_at: String(raw.ends_at), placeholder, sample, items } };
}

function parseItem(raw: unknown, label: string, placeholder: boolean): { ok: true; item: DropItem } | { ok: false; error: string } {
  if (!isObj(raw)) return fail(`${label} must be an object`);
  const bad = extraKey(raw, ["type", "name", "tagline", "description", "price", "printful_product_id", "variants", "print_files", "mockups", "tax_code"]);
  if (bad) return fail(`${label} has unexpected field "${bad}"`);
  if (typeof raw.type !== "string" || !DROP_ITEM_TYPES.includes(raw.type as DropItemType)) return fail(`${label}.type must be tee, mug, or sticker`);
  const type = raw.type as DropItemType;
  const name = text(raw.name, 1, 140);
  if (!name) return fail(`${label}.name must be 1–140 characters`);
  const tagline = raw.tagline === undefined ? "" : text(raw.tagline, 0, 160);
  if (tagline === null) return fail(`${label}.tagline must be at most 160 characters`);
  const description = raw.description === undefined ? "" : text(raw.description, 0, 2000);
  if (description === null) return fail(`${label}.description must be at most 2000 characters`);
  const price = cents(raw.price);
  if (price === null) return fail(`${label}.price must be an integer number of cents from 100 to 100000`);
  const printfulId = whole(raw.printful_product_id, placeholder ? 0 : 1, 2_000_000_000);
  if (printfulId === null) return fail(`${label}.printful_product_id must be a positive Printful catalog product id`);
  let tax = DEFAULT_TAX[type];
  if (raw.tax_code !== undefined) {
    if (typeof raw.tax_code !== "string" || !TAX.test(raw.tax_code)) return fail(`${label}.tax_code must look like txcd_30011000`);
    tax = raw.tax_code;
  }
  if (!Array.isArray(raw.variants) || raw.variants.length < 1 || raw.variants.length > 16) return fail(`${label}.variants must have 1–16 variants`);
  const variants: DropVariant[] = [];
  const seen = new Set<number>();
  for (let k = 0; k < raw.variants.length; k++) {
    const variant = parseVariant(raw.variants[k], `${label}.variants[${k}]`, placeholder);
    if (!variant.ok) return variant;
    if (variant.variant.id !== 0 && seen.has(variant.variant.id)) return fail(`${label}.variants[${k}].id is duplicated`);
    seen.add(variant.variant.id);
    variants.push(variant.variant);
  }
  if (!Array.isArray(raw.print_files) || raw.print_files.length > 4) return fail(`${label}.print_files must be an array of at most 4 files`);
  if (!placeholder && raw.print_files.length < 1) return fail(`${label}.print_files needs at least one print file`);
  const print_files: DropPrintFile[] = [];
  for (let f = 0; f < raw.print_files.length; f++) {
    const file = parseFile(raw.print_files[f], `${label}.print_files[${f}]`);
    if (!file.ok) return file;
    print_files.push(file.file);
  }
  if (!Array.isArray(raw.mockups) || raw.mockups.length < 1 || raw.mockups.length > 4) return fail(`${label}.mockups needs 1–4 images`);
  const mockups: string[] = [];
  for (let m = 0; m < raw.mockups.length; m++) {
    const img = asset(raw.mockups[m], `${label}.mockups[${m}]`);
    if (!img.ok) return img;
    mockups.push(img.value);
  }
  return { ok: true, item: { type, name, tagline, description, price, printful_product_id: printfulId, tax_code: tax, variants, print_files, mockups } };
}

function parseVariant(raw: unknown, label: string, placeholder: boolean): { ok: true; variant: DropVariant } | { ok: false; error: string } {
  if (!isObj(raw)) return fail(`${label} must be an object`);
  const bad = extraKey(raw, ["id", "size", "color", "price"]);
  if (bad) return fail(`${label} has unexpected field "${bad}"`);
  const id = whole(raw.id, placeholder ? 0 : 1, 2_000_000_000);
  if (id === null) return fail(`${label}.id must be a positive Printful variant id`);
  const size = text(raw.size, 1, 40);
  if (!size) return fail(`${label}.size must be 1–40 characters`);
  const color = text(raw.color, 1, 40);
  if (!color) return fail(`${label}.color must be 1–40 characters`);
  if (raw.price !== undefined && cents(raw.price) === null) return fail(`${label}.price must be an integer number of cents from 100 to 100000`);
  return { ok: true, variant: { id, size, color, ...(raw.price !== undefined ? { price: raw.price as number } : {}) } };
}

export const dropSku = (n: number, item: number, variant: number) => `drop-${n}-${item}-${variant}`;
export const dropLabel = (n: number) => `#${String(n).padStart(3, "0")}`;
export const dropItemPath = (n: number, item: number) => `/shop/drop/${n}/${item}`;
export const isDropSku = (sku: unknown): sku is string => typeof sku === "string" && /^drop-\d+-\d+-\d+$/.test(sku);

export function parseDropSku(sku: string): { number: number; item: number; variant: number } | null {
  const m = /^drop-(\d+)-(\d+)-(\d+)$/.exec(sku);
  if (!m) return null;
  return { number: Number(m[1]), item: Number(m[2]), variant: Number(m[3]) };
}

export function variantLabel(v: DropVariant, siblings: DropVariant[]) {
  return siblings.filter((s) => s.size === v.size).length > 1 ? `${v.size} · ${v.color}` : v.size;
}

export function dropPhase(drop: Drop, clock: ShopClock): DropPhase {
  if (drop.sample && clock.production) return "hidden";
  const start = Date.parse(drop.starts_at);
  const end = Date.parse(drop.ends_at);
  if (clock.now < start) return "upcoming";
  if (clock.now >= end) return "ended";
  if (drop.placeholder || (drop.sample && !clock.allowSamplePurchase)) return "preview-only";
  return "live";
}

export function isActive(drop: Drop, now: number) {
  return Date.parse(drop.starts_at) <= now && now < Date.parse(drop.ends_at);
}

export function resolveDropPurchase(drops: Drop[], sku: string, clock: ShopClock): PurchaseResult {
  const parsed = parseDropSku(sku);
  if (!parsed) return fail("That drop item isn't available.");
  const drop = drops.find((d) => d.number === parsed.number);
  if (!drop) return fail("That drop item isn't available.");
  const phase = dropPhase(drop, clock);
  if (phase === "upcoming") return fail("That drop hasn't started.");
  if (phase === "ended") return fail("That drop has ended.");
  if (phase !== "live") return fail("That drop item isn't available.");
  const item = drop.items[parsed.item];
  const variant = item?.variants[parsed.variant];
  if (!item || !variant || variant.id <= 0 || item.print_files.length < 1) return fail("That drop item isn't available.");
  return {
    ok: true,
    item: {
      sku,
      dropNumber: drop.number,
      itemIndex: parsed.item,
      name: item.name,
      tagline: item.tagline,
      description: item.description,
      label: variantLabel(variant, item.variants),
      color: variant.color,
      priceCents: variant.price ?? item.price,
      taxCode: item.tax_code,
      image: item.mockups[0],
      printfulVariantId: variant.id,
      printfulProductId: item.printful_product_id,
      sample: drop.sample,
      files: item.print_files,
    },
  };
}

export type DropQuote = {
  sku: string;
  available: boolean;
  reason?: string;
  name?: string;
  label?: string;
  priceCents?: number;
  image?: string;
  href?: string;
};

export function describeDropSku(drops: Drop[], sku: string, clock: ShopClock): DropQuote {
  const parsed = parseDropSku(sku);
  if (!parsed) return { sku, available: false, reason: "That drop item isn't available." };
  const drop = drops.find((d) => d.number === parsed.number);
  const item = drop?.items[parsed.item];
  const variant = item?.variants[parsed.variant];
  if (!drop || !item || !variant || dropPhase(drop, clock) === "hidden") {
    return { sku, available: false, reason: "That drop item isn't available." };
  }
  const purchase = resolveDropPurchase(drops, sku, clock);
  return {
    sku,
    available: purchase.ok,
    ...(!purchase.ok ? { reason: purchase.error } : {}),
    name: item.name,
    label: variantLabel(variant, item.variants),
    priceCents: variant.price ?? item.price,
    image: item.mockups[0],
    href: dropItemPath(drop.number, parsed.item),
  };
}

export function filesMetadataValue(files: { type: string; url: string }[]): { mode: "inline"; files: string } | { mode: "spill" } {
  const json = JSON.stringify(files);
  return json.length <= FILES_META_MAX ? { mode: "inline", files: json } : { mode: "spill" };
}

export function decodeFilesValue(value: unknown): { type: string; url: string }[] | null {
  let raw = value;
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return null; }
  }
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 4) return null;
  const files: { type: string; url: string }[] = [];
  for (const row of raw) {
    if (!isObj(row)) return null;
    const type = row.t ?? row.type;
    const url = row.u ?? row.url;
    if (typeof type !== "string" || !FILE_TYPE.test(type)) return null;
    if (typeof url !== "string" || !httpsUrl(url)) return null;
    files.push({ type, url });
  }
  return files;
}

/** The Printful line stored from the checkout snapshot. Price is what Stripe charged. */
export function printfulLineFromSnapshot(input: {
  sku: string;
  quantity: number;
  unitAmountCents: number;
  name: string;
  label: string;
  printfulVariantId: number;
  files: { type: string; url: string }[];
}): PrintfulLine {
  const label = input.label ? ` (${input.label})` : "";
  return {
    variant_id: input.printfulVariantId,
    quantity: input.quantity,
    external_id: input.sku,
    name: `${input.name}${label}`.slice(0, 200),
    retail_price: (input.unitAmountCents / 100).toFixed(2),
    files: input.files.map((f) => ({ type: f.type, url: f.url })),
  };
}
