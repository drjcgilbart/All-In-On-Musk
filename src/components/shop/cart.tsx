"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";

export type CartItem = { sku: string; qty: number };
const KEY = "aiom-cart-v1";
const MAX = 10;
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

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
      items = parsed
        .filter((i): i is CartItem => typeof i?.sku === "string" && Number.isInteger(i?.qty))
        .map((i) => ({ sku: i.sku, qty: Math.max(1, Math.min(MAX, i.qty)) }));
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

  const add = useCallback((sku: string, qty = 1) => {
    const cur = read();
    const found = cur.find((i) => i.sku === sku);
    write(found ? cur.map((i) => (i.sku === sku ? { ...i, qty: Math.min(MAX, i.qty + qty) } : i)) : [...cur, { sku, qty }]);
  }, []);
  const setQty = useCallback((sku: string, qty: number) => {
    const n = Number.isFinite(qty) ? Math.round(qty) : 1;
    write(read().map((i) => (i.sku === sku ? { ...i, qty: Math.max(1, Math.min(MAX, n)) } : i)));
  }, []);
  const remove = useCallback((sku: string) => write(read().filter((i) => i.sku !== sku)), []);
  const clear = useCallback(() => write([]), []);
  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);

  return { items, add, setQty, remove, clear, count, ready };
}
