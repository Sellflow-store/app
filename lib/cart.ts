"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: string; // "129.99" — display only; checkout recomputes from DB
  image: string | null;
  qty: number;
  stock?: number | null; // null/undefined = nieograniczony; cap ilości w koszyku
  type?: "physical" | "digital" | "service"; // undefined = physical (legacy)
}

const EMPTY: CartItem[] = [];
const PREFIX = "sf-cart-";
// Parsed-snapshot cache — useSyncExternalStore needs referentially stable
// snapshots between changes, so we can't JSON.parse on every read.
const cache = new Map<string, CartItem[]>();
const listeners = new Set<() => void>();

const storageKey = (slug: string) => `${PREFIX}${slug}`;

function read(slug: string): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  const cached = cache.get(slug);
  if (cached) return cached;
  let items: CartItem[] = EMPTY;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    // corrupted entry — treat as empty
  }
  cache.set(slug, items);
  return items;
}

function write(slug: string, items: CartItem[]) {
  cache.set(slug, items);
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(items));
  } catch {
    // storage full/blocked — cart still works in-memory for this tab
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  // Cross-tab sync: another tab wrote the cart → drop cache, re-read
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIX)) {
      cache.delete(e.key.slice(PREFIX.length));
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

export function formatPln(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} zł`;
}

export function useCart(shopSlug: string) {
  const items = useSyncExternalStore(
    subscribe,
    () => read(shopSlug),
    () => EMPTY
  );

  // Górny limit ilości: 99, a gdy produkt śledzi stan — nie więcej niż na stanie.
  const capFor = (stock: number | null | undefined) =>
    stock == null ? 99 : Math.max(0, Math.min(99, stock));

  const add = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      const current = read(shopSlug);
      const existing = current.find((i) => i.productId === item.productId);
      const cap = capFor(item.stock);
      const next = existing
        ? current.map((i) =>
            i.productId === item.productId
              ? { ...i, stock: item.stock, qty: Math.min(capFor(item.stock), i.qty + qty) }
              : i
          )
        : [...current, { ...item, qty: Math.min(cap, Math.max(1, qty)) }];
      write(shopSlug, next);
    },
    [shopSlug]
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      const current = read(shopSlug);
      const next =
        qty <= 0
          ? current.filter((i) => i.productId !== productId)
          : current.map((i) =>
              i.productId === productId ? { ...i, qty: Math.min(capFor(i.stock), qty) } : i
            );
      write(shopSlug, next);
    },
    [shopSlug]
  );

  const remove = useCallback(
    (productId: string) => {
      write(shopSlug, read(shopSlug).filter((i) => i.productId !== productId));
    },
    [shopSlug]
  );

  const clear = useCallback(() => write(shopSlug, []), [shopSlug]);

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price) * i.qty, 0);

  return { items, add, setQty, remove, clear, count, subtotal };
}
