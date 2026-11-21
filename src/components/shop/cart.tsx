"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";

export type CartSnap = { name: string; label: string; priceCents: number; image: string };
export type CartItem = { sku: string; qty: number; snap?: CartSnap };
const KEY = "aiom-cart-v1";
const ID_KEY = "aiom-cart-id-v1"; // random id for the current cart; sent to Stripe as metadata.cart_id
const ORDERS_KEY = "aiom-orders-v1"; // simple local order history (this device only)

export type LocalOrder = { orderNumber: string; date: string; totalCents: number; items: { name: string; variant: string; quantity: number }[] };

function newId() {
  try { return crypto.randomUUID(); } catch { return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`; }
}

/** Current cart id (created on first use). Rotated whenever the cart is cleared, so a paid cart id is never reused. */
export function getCartId(): string {
  try {
    let id = window.localStorage.getItem(ID_KEY);
    if (!id) { id = newId(); window.localStorage.setItem(ID_KEY, id); }
    return id;
  } catch { return "no-storage"; }
}

/** Empty the cart and start a new cart id. */
export function clearCartStorage() {
  try { window.localStorage.setItem(ID_KEY, newId()); } catch { /* storage blocked */ }
  write([]);
}

export function readOrders(): LocalOrder[] {
  try { const v = JSON.parse(window.localStorage.getItem(ORDERS_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function saveOrder(o: LocalOrder) {
  try {
    const list = readOrders().filter((x) => x.orderNumber !== o.orderNumber);
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify([o, ...list].slice(0, 20)));
  } catch { /* storage blocked */ }
}
const MAX = 10;
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

function readSnap(raw: unknown): CartSnap | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as { name?: unknown; label?: unknown; priceCents?: unknown; image?: unknown };
  const image = typeof s.image === "string" ? s.image : "";
  const imageOk = (image.startsWith("/") && !image.includes("..") && !image.startsWith("//")) || /^https:\/\/[^\s]+$/.test(image);
  if (typeof s.name !== "string" || typeof s.label !== "string" || !Number.isInteger(s.priceCents) || !imageOk) return undefined;
  if (s.name.length > 140 || s.label.length > 80 || (s.priceCents as number) < 0 || (s.priceCents as number) > 100_000 || image.length > 400) return undefined;
  return { name: s.name, label: s.label, priceCents: s.priceCents as number, image };
}

function read(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.items;
  let items: CartItem[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      items = parsed.flatMap((i) => {
        if (!i || typeof i !== "object") return [];
        const row = i as { sku?: unknown; qty?: unknown; snap?: unknown };
        if (typeof row.sku !== "string" || !Number.isInteger(row.qty)) return [];
        const item: CartItem = { sku: row.sku, qty: Math.max(1, Math.min(MAX, row.qty as number)) };
        const snap = readSnap(row.snap);
        if (snap) item.snap = snap;
        return [item];
      });
    }
  } catch {
    items = EMPTY;
  }
  cache = { raw, items };
  return items;
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage blocked */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Cart kept in localStorage. `ready` is false during server render and hydration. */
export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);

  const add = useCallback((sku: string, qty = 1, snap?: CartSnap) => {
    const cur = read();
    const found = cur.find((i) => i.sku === sku);
    const next = { sku, qty, ...(snap ? { snap } : {}) };
    write(found ? cur.map((i) => (i.sku === sku ? { ...i, qty: Math.min(MAX, i.qty + qty), ...(snap ? { snap } : {}) } : i)) : [...cur, next]);
  }, []);
  const setQty = useCallback((sku: string, qty: number) => {
    const n = Number.isFinite(qty) ? Math.round(qty) : 1;
    write(read().map((i) => (i.sku === sku ? { ...i, qty: Math.max(1, Math.min(MAX, n)) } : i)));
  }, []);
  const remove = useCallback((sku: string) => write(read().filter((i) => i.sku !== sku)), []);
  const clear = useCallback(() => clearCartStorage(), []);
  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);

  return { items, add, setQty, remove, clear, count, ready };
}
